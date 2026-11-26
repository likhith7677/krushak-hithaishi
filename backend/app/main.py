import io, math, os, uuid, time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path
import httpx
from fastapi import FastAPI, Depends, HTTPException, Response, Request, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session
from PIL import Image, ImageOps, ImageStat, UnidentifiedImageError
from .inference import MODEL_SERVICE, CROP_NAMES
from .tomato_inference import TOMATO_MODEL_SERVICE
from .advice import get_guidance
from .label_metadata import annotate_result
from .voice_ai import router as voice_ai_router
from .database import engine, Base, get_db, SessionLocal
from .models import User, Shop, Product, AuditEvent
from .schemas import UserRegister, Login, UserOut, ShopInput, ShopOut, ProductInput, ProductOut, StockUpdate, LocationUpdate, VerificationInput
from .security import hash_password, verify_password, token_for, current_user, owner_user, admin_user, COOKIE_SECURE

UPLOAD_DIR=Path(os.getenv('UPLOAD_DIR','./uploads'))
UPLOAD_DIR.mkdir(parents=True,exist_ok=True)
ALLOWED_ORIGINS=os.getenv('FRONTEND_ORIGIN','http://localhost:3000').split(',')
rate_buckets=defaultdict(deque)
weather_cache: dict[tuple[float, float], tuple[float, dict]] = {}
WEATHER_CACHE_TTL = 600  # 10 minutes

WMO_WEATHER_CODES = {
    0: ("Clear sky", "ಸ್ಪಷ್ಟ ಆಕಾಶ"),
    1: ("Mainly clear", "ಮುಖ್ಯವಾಗಿ ಸ್ಪಷ್ಟ"),
    2: ("Partly cloudy", "ಭಾಗಶಃ ಮೋಡ ಕವಿದ ವಾತಾವರಣ"),
    3: ("Overcast", "ದಟ್ಟ ಮೋಡ"),
    45: ("Fog", "ಮಂಜು"),
    48: ("Depositing rime fog", "ದಟ್ಟ ಮಂಜು"),
    51: ("Light drizzle", "ತುಂತುರು ಮಳೆ"),
    53: ("Moderate drizzle", "ಸಾಧಾರಣ ತುಂತುರು ಮಳೆ"),
    55: ("Dense drizzle", "ಹೆಚ್ಚಿನ ತುಂತುರು ಮಳೆ"),
    61: ("Slight rain", "ಸಣ್ಣ ಮಳೆ"),
    63: ("Moderate rain", "ಸಾಧಾರಣ ಮಳೆ"),
    65: ("Heavy rain", "ಭಾರಿ ಮಳೆ"),
    71: ("Slight snow", "ಸಣ್ಣ ಹಿಮಪಾತ"),
    73: ("Moderate snow", "ಸಾಧಾರಣ ಹಿಮಪಾತ"),
    75: ("Heavy snow", "ಭಾರಿ ಹಿಮಪಾತ"),
    80: ("Slight rain showers", "ಸಣ್ಣ ಮಳೆ ಹನಿಗಳು"),
    81: ("Moderate rain showers", "ಸಾಧಾರಣ ಮಳೆ"),
    82: ("Violent rain showers", "ತೀವ್ರ ಮಳೆ"),
    95: ("Thunderstorm", "ಗುಡುಗು ಸಹಿತ ಮಳೆ"),
    96: ("Thunderstorm with slight hail", "ಆಲಿಕಲ್ಲು ಸಹಿತ ಗುಡುಗು ಮಳೆ"),
    99: ("Thunderstorm with heavy hail", "ಭಾರಿ ಆಲಿಕಲ್ಲು ಸಹಿತ ಗುಡುಗು ಮಳೆ"),
}

@asynccontextmanager
async def lifespan(app:FastAPI):
    # Development-friendly schema creation; run Alembic migrations before production upgrades.
    Base.metadata.create_all(bind=engine)
    email=os.getenv('ADMIN_EMAIL','').strip().lower()
    passwd=os.getenv('ADMIN_PASSWORD','')
    if os.getenv('KH_PUBLIC_DEPLOYMENT', '').lower() == 'true' and (not email or len(passwd) < 12):
        raise RuntimeError('Public deployment requires ADMIN_EMAIL and a strong ADMIN_PASSWORD.')
    if email and len(passwd)>=12:
        with SessionLocal() as db:
            if not db.scalar(select(User).where(User.email==email)):
                db.add(User(name='Administrator',phone=os.getenv('ADMIN_PHONE','+919999999999'),email=email,password_hash=hash_password(passwd),role='admin'))
                db.commit()
    yield

app=FastAPI(title='Krushak Hithaishi API',version='0.1.0',lifespan=lifespan)
app.include_router(voice_ai_router)
app.add_middleware(CORSMiddleware,allow_origins=ALLOWED_ORIGINS,allow_credentials=True,allow_methods=['GET','POST','PATCH','DELETE'],allow_headers=['Content-Type','X-KH-Request'])
app.mount('/uploads',StaticFiles(directory=str(UPLOAD_DIR)),name='uploads')

@app.middleware('http')
async def security_middleware(request:Request,call_next):
    if request.method in ('POST','PATCH','PUT','DELETE') and request.url.path.startswith('/api/'):
        if request.headers.get('X-KH-Request') != 'web':
            return Response('Missing request header',status_code=403)
        origin=request.headers.get('origin')
        if origin and origin not in ALLOWED_ORIGINS:
            return Response('Origin not allowed',status_code=403)
    if request.url.path in ('/api/auth/login','/api/auth/register','/api/uploads','/api/detect','/api/assistant/ask','/api/voice/synthesize','/api/voice/transcribe'):
        bucket=rate_buckets[(request.client.host if request.client else 'unknown',request.url.path)]
        now=time.monotonic()
        while bucket and now-bucket[0]>60: bucket.popleft()
        limit=8 if request.url.path in ('/api/detect','/api/assistant/ask',) else 15
        if len(bucket)>=limit:return Response('Rate limit exceeded',status_code=429)
        bucket.append(now)
    response = await call_next(request)
    response.headers.setdefault('X-Content-Type-Options', 'nosniff')
    response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.setdefault('X-Frame-Options', 'DENY')
    if os.getenv('KH_PUBLIC_DEPLOYMENT', '').lower() == 'true':
        response.headers.setdefault('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    return response

def shop_for_owner(db:Session,shop_id:int,user:User)->Shop:
    shop=db.get(Shop,shop_id)
    if not shop or (shop.owner_id!=user.id and user.role!='admin'):
        raise HTTPException(404,'Shop not found')
    return shop

def product_for_owner(db:Session,product_id:int,user:User)->Product:
    product=db.get(Product,product_id)
    if not product: raise HTTPException(404,'Product not found')
    shop_for_owner(db,product.shop_id,user)
    return product

def audit(db:Session,actor:User,shop:Shop,action:str,details:str=''):
    db.add(AuditEvent(actor_id=actor.id,shop_id=shop.id,action=action,details=details))

def haversine(lat1,lon1,lat2,lon2):
    r=6371.0
    dlat=math.radians(lat2-lat1);dlon=math.radians(lon2-lon1)
    a=math.sin(dlat/2)**2+math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return round(2*r*math.asin(math.sqrt(a)),1)

@app.get('/api/health')
def health():return {'status':'ok','service':'Krushak Hithaishi'}

@app.get('/api/readiness')
def readiness(db:Session=Depends(get_db)):
    try:
        db.execute(text('SELECT 1'))
    except Exception:
        raise HTTPException(503,'Database not ready')
    return {'status':'ready','database':'connected','model':'check /api/model/status separately'}

@app.post('/api/auth/register',response_model=UserOut,status_code=201)
def register(payload:UserRegister,response:Response,db:Session=Depends(get_db)):
    if db.scalar(select(User).where(User.phone==payload.phone)):
        raise HTTPException(409,'Mobile number already registered')
    if payload.email and db.scalar(select(User).where(User.email==payload.email.lower())):
        raise HTTPException(409,'Email already registered')
    user=User(name=payload.name.strip(),phone=payload.phone,email=payload.email.lower() if payload.email else None,password_hash=hash_password(payload.password),role=payload.role,preferred_language=payload.language)
    db.add(user);db.commit();db.refresh(user)
    response.set_cookie('kh_session',token_for(user),max_age=86400,httponly=True,secure=COOKIE_SECURE,samesite='lax',path='/')
    return user

@app.post('/api/auth/login',response_model=UserOut)
def login(payload:Login,response:Response,db:Session=Depends(get_db)):
    user=db.scalar(select(User).where(User.phone==payload.phone))
    if not user or not verify_password(payload.password,user.password_hash):
        raise HTTPException(401,'Incorrect phone or password')
    response.set_cookie('kh_session',token_for(user),max_age=86400,httponly=True,secure=COOKIE_SECURE,samesite='lax',path='/')
    return user

@app.post('/api/auth/logout')
def logout(response:Response):
    response.delete_cookie('kh_session',path='/')
    return {'ok':True}

@app.get('/api/auth/me',response_model=UserOut)
def me(user:User=Depends(current_user)):return user

@app.post('/api/uploads',status_code=201)
async def upload_photo(file:UploadFile=File(...),user:User=Depends(owner_user)):
    if file.content_type not in ('image/jpeg','image/png','image/webp'):
        raise HTTPException(415,'Only JPEG, PNG and WEBP images allowed')
    data=await file.read(5*1024*1024+1)
    if len(data)>5*1024*1024:raise HTTPException(413,'Maximum image size is 5 MB')
    try:
        with Image.open(io.BytesIO(data)) as img:
            img.verify()
        with Image.open(io.BytesIO(data)) as img:
            if img.width*img.height>24000000:raise HTTPException(413,'Image dimensions are too large')
            img.thumbnail((1600,1600))
            if img.mode not in ('RGB','RGBA'):img=img.convert('RGB')
            filename=uuid.uuid4().hex+'.webp'
            img.save(UPLOAD_DIR/filename,format='WEBP',quality=83)
    except (UnidentifiedImageError,OSError,ValueError,Image.DecompressionBombError):
        raise HTTPException(415,'Invalid image file')
    return {'url':'/uploads/'+filename}

@app.post('/api/owner/shops',response_model=ShopOut,status_code=201)
def create_shop(data:ShopInput,db:Session=Depends(get_db),user:User=Depends(owner_user)):
    shop=Shop(**data.model_dump(),owner_id=user.id,status='draft')
    db.add(shop);db.flush();audit(db,user,shop,'shop_created');db.commit();db.refresh(shop)
    return shop

@app.get('/api/owner/shops',response_model=list[ShopOut])
def my_shops(db:Session=Depends(get_db),user:User=Depends(owner_user)):
    return db.scalars(select(Shop).where(Shop.owner_id==user.id).order_by(Shop.created_at.desc())).all()

@app.get('/api/owner/shops/{shop_id}',response_model=ShopOut)
def owner_shop(shop_id:int,db:Session=Depends(get_db),user:User=Depends(owner_user)):
    return shop_for_owner(db,shop_id,user)

@app.patch('/api/owner/shops/{shop_id}',response_model=ShopOut)
def edit_shop(shop_id:int,data:ShopInput,db:Session=Depends(get_db),user:User=Depends(owner_user)):
    shop=shop_for_owner(db,shop_id,user)
    old_location=(shop.latitude,shop.longitude)
    old_identity=(shop.name,shop.village,shop.town,shop.district,shop.state,shop.pincode,shop.phone,shop.image_url)
    for k,v in data.model_dump().items():setattr(shop,k,v)
    new_identity=(shop.name,shop.village,shop.town,shop.district,shop.state,shop.pincode,shop.phone,shop.image_url)
    if old_location!=(shop.latitude,shop.longitude):
        audit(db,user,shop,'location_changed',f'{old_location} -> {(shop.latitude,shop.longitude)}')
    if shop.status=='approved' and (old_location!=(shop.latitude,shop.longitude) or old_identity!=new_identity):
        shop.status='pending'
        audit(db,user,shop,'reverification_required')
    audit(db,user,shop,'shop_updated');db.commit();db.refresh(shop)
    return shop

@app.patch('/api/owner/shops/{shop_id}/location',response_model=ShopOut)
def edit_location(shop_id:int,data:LocationUpdate,db:Session=Depends(get_db),user:User=Depends(owner_user)):
    shop=shop_for_owner(db,shop_id,user)
    audit(db,user,shop,'location_changed',f'{shop.latitude},{shop.longitude} -> {data.latitude},{data.longitude}')
    shop.latitude,shop.longitude=data.latitude,data.longitude
    if shop.status=='approved':shop.status='pending'
    db.commit();db.refresh(shop)
    return shop

@app.post('/api/owner/shops/{shop_id}/submit',response_model=ShopOut)
def submit_shop(shop_id:int,db:Session=Depends(get_db),user:User=Depends(owner_user)):
    shop=shop_for_owner(db,shop_id,user)
    if shop.status not in ('draft','rejected'):raise HTTPException(400,'Shop cannot be submitted in this status')
    shop.status='pending';audit(db,user,shop,'submitted');db.commit();db.refresh(shop)
    return shop

@app.post('/api/owner/shops/{shop_id}/products',response_model=ProductOut,status_code=201)
def add_product(shop_id:int,data:ProductInput,db:Session=Depends(get_db),user:User=Depends(owner_user)):
    shop=shop_for_owner(db,shop_id,user)
    product=Product(**data.model_dump(),shop_id=shop.id)
    db.add(product);audit(db,user,shop,'product_added',data.name);db.commit();db.refresh(product)
    return product

@app.get('/api/owner/shops/{shop_id}/products',response_model=list[ProductOut])
def owner_products(shop_id:int,db:Session=Depends(get_db),user:User=Depends(owner_user)):
    shop_for_owner(db,shop_id,user)
    return db.scalars(select(Product).where(Product.shop_id==shop_id).order_by(Product.updated_at.desc())).all()

@app.patch('/api/owner/products/{product_id}',response_model=ProductOut)
def edit_product(product_id:int,data:ProductInput,db:Session=Depends(get_db),user:User=Depends(owner_user)):
    p=product_for_owner(db,product_id,user)
    for k,v in data.model_dump().items():setattr(p,k,v)
    p.moderation_status='pending'
    db.commit();db.refresh(p);return p

@app.patch('/api/owner/products/{product_id}/stock',response_model=ProductOut)
def edit_stock(product_id:int,data:StockUpdate,db:Session=Depends(get_db),user:User=Depends(owner_user)):
    p=product_for_owner(db,product_id,user);p.in_stock=data.in_stock
    db.commit();db.refresh(p);return p

@app.delete('/api/owner/products/{product_id}')
def delete_product(product_id:int,db:Session=Depends(get_db),user:User=Depends(owner_user)):
    p=product_for_owner(db,product_id,user);db.delete(p);db.commit();return {'ok':True}

@app.get('/api/shops/nearby',response_model=list[ShopOut])
def nearby_shops(lat:float | None=Query(None,ge=-90,le=90),lng:float | None=Query(None,ge=-180,le=180),q:str='',category:str='',radius_km:float=Query(50,ge=1,le=500),db:Session=Depends(get_db)):
    shops=db.scalars(select(Shop).where(Shop.status=='approved').order_by(Shop.created_at.desc()).limit(500)).all()
    out=[]
    for shop in shops:
        if q and q.lower() not in f'{shop.name} {shop.village} {shop.town} {shop.district}'.lower():continue
        if category and not any(p.category.lower()==category.lower() and p.moderation_status=='approved' for p in shop.products):continue
        distance=haversine(lat,lng,shop.latitude,shop.longitude) if lat is not None and lng is not None else None
        if distance is not None and distance>radius_km:continue
        item=ShopOut.model_validate(shop)
        item.distance_km=distance
        out.append(item)
    out.sort(key=lambda s:s.distance_km if s.distance_km is not None else float('inf'))
    return out[:100]

@app.get('/api/shops/{shop_id}',response_model=ShopOut)
def public_shop(shop_id:int,db:Session=Depends(get_db)):
    shop=db.get(Shop,shop_id)
    if not shop or shop.status!='approved':raise HTTPException(404,'Shop not found')
    return shop

@app.get('/api/shops/{shop_id}/products',response_model=list[ProductOut])
def public_products(shop_id:int,db:Session=Depends(get_db)):
    public_shop(shop_id,db)
    return db.scalars(select(Product).where(Product.shop_id==shop_id,Product.moderation_status=='approved')).all()

@app.get('/api/products/search',response_model=list[ProductOut])
def search_products(q:str='',category:str='',db:Session=Depends(get_db)):
    stmt=select(Product).join(Shop).where(Shop.status=='approved',Product.moderation_status=='approved')
    if q:stmt=stmt.where(Product.name.ilike(f'%{q}%'))
    if category:stmt=stmt.where(Product.category==category)
    return db.scalars(stmt.limit(100)).all()

@app.get('/api/admin/shops/pending',response_model=list[ShopOut])
def pending_shops(db:Session=Depends(get_db),user:User=Depends(admin_user)):
    return db.scalars(select(Shop).where(Shop.status=='pending').order_by(Shop.created_at)).all()

@app.patch('/api/admin/shops/{shop_id}/verification',response_model=ShopOut)
def verify_shop(shop_id:int,data:VerificationInput,db:Session=Depends(get_db),user:User=Depends(admin_user)):
    shop=db.get(Shop,shop_id)
    if not shop or shop.status!='pending':raise HTTPException(404,'Pending shop not found')
    shop.status='approved' if data.approve else 'rejected'
    audit(db,user,shop,'verified' if data.approve else 'rejected',data.reason)
    db.commit();db.refresh(shop);return shop

@app.get('/api/admin/system-health')
def system_health(db:Session=Depends(get_db),user:User=Depends(admin_user)):
    return {'users':db.scalar(select(func.count(User.id))),'shops':db.scalar(select(func.count(Shop.id))),'products':db.scalar(select(func.count(Product.id))),'pending':db.scalar(select(func.count(Shop.id)).where(Shop.status=='pending'))}


@app.get('/api/admin/products/pending',response_model=list[ProductOut])
def pending_products(db:Session=Depends(get_db),user:User=Depends(admin_user)):
    return db.scalars(select(Product).where(Product.moderation_status=='pending').order_by(Product.updated_at).limit(200)).all()

@app.patch('/api/admin/products/{product_id}/moderation',response_model=ProductOut)
def moderate_product(product_id:int,data:VerificationInput,db:Session=Depends(get_db),user:User=Depends(admin_user)):
    product=db.get(Product,product_id)
    if not product or product.moderation_status!='pending':raise HTTPException(404,'Pending product not found')
    product.moderation_status='approved' if data.approve else 'rejected'
    shop=db.get(Shop,product.shop_id)
    audit(db,user,shop,'product_moderation',f'{product.name}: {product.moderation_status}; {data.reason}')
    db.commit();db.refresh(product);return product

@app.get('/api/crops')
def crops():
    return [
        {'id':'tomato','name':'Tomato','kn':'ಟೊಮೇಟೊ'},
        {'id':'potato','name':'Potato','kn':'ಆಲೂಗಡ್ಡೆ'},
        {'id':'bell_pepper','name':'Bell pepper (capsicum)','kn':'ದೊಣ್ಣೆ ಮೆಣಸಿನಕಾಯಿ'},
    ]

@app.get('/api/model/status')
def model_status():
    general = MODEL_SERVICE.status()
    general['tomato_specialist'] = TOMATO_MODEL_SERVICE.status()
    return general

@app.post('/api/detect')
async def detect(file: UploadFile=File(...), crop: str='tomato', stage: str | None=None, model: str='auto'):
    if crop not in CROP_NAMES:
        raise HTTPException(422, 'This trained model supports only tomato, potato and bell pepper (capsicum)')
    if model not in ('auto', 'general', 'tomato_specialist'):
        raise HTTPException(422, 'Choose auto, general or tomato_specialist')
    if model == 'tomato_specialist' and crop != 'tomato':
        raise HTTPException(422, 'The EfficientNetB0 specialist is for tomato only')
    if file.content_type not in ('image/png','image/jpeg','image/webp'):
        raise HTTPException(415,'Please upload a JPEG, PNG or WEBP image')
    data=await file.read(5*1024*1024+1)
    if not data: raise HTTPException(415,'Empty image')
    if len(data)>5*1024*1024: raise HTTPException(413,'Image exceeds 5 MB')
    try:
        with Image.open(io.BytesIO(data)) as im:
            im.verify()
        with Image.open(io.BytesIO(data)) as im:
            if im.width*im.height>24000000:
                raise HTTPException(413, 'Image dimensions exceed the permitted limit')
            image=ImageOps.exif_transpose(im).convert('RGB')
            if min(image.size) < 96:
                return {'status':'image_quality_issue','prediction':None,'confidence':None,'heatmap':None,
                        'message':'Image is too small. Capture a clear, well-lit leaf photo at least 96 pixels wide and tall.',
                        'multimodal':False, **annotate_result({'status':'image_quality_issue'})}
            thumb=image.copy();thumb.thumbnail((256,256))
            if max(ImageStat.Stat(thumb).stddev) < 4:
                return {'status':'image_quality_issue','prediction':None,'confidence':None,'heatmap':None,
                        'message':'The photo looks nearly blank or uniform. Photograph one clearly visible leaf in natural light.',
                        'multimodal':False, **annotate_result({'status':'image_quality_issue'})}
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(415,'Invalid or damaged image')
    # Deprecated 'stage' query parameter is ignored for old clients.
    # The trained classifiers use leaf pixels, not growth-stage/weather fields.
    # The tomato specialist is available, but choose it explicitly: real-farm
    # validation is outstanding, and it cannot independently verify crop type.
    use_specialist = crop == 'tomato' and model == 'tomato_specialist'
    if use_specialist:
        result = TOMATO_MODEL_SERVICE.predict(image)
        result['model_version'] = 'Uploaded Keras EfficientNetB0 (10 tomato classes)' if result['status']!='model_unavailable' else None
        result['model_selection_note'] = 'Specialist model assumes a tomato leaf. It does not confirm crop identity or provide field-validated diagnosis.'
    else:
        result = MODEL_SERVICE.predict(image, crop)
        result['model_version'] = 'Uploaded Keras MobileNetV2 (15 classes)' if result['status']!='model_unavailable' else None
        if crop == 'tomato' and model == 'auto':
            result['model_selection_note'] = 'MobileNetV2 is the default for crop mismatch detection. The verified-label EfficientNetB0 tomato model is available as an optional specialist, but still needs independent field validation.'
    result['multimodal']=False
    return annotate_result(result)

@app.get('/api/advisory')
def advisory(label: str = Query('',max_length=120)):
    return get_guidance(label)


@app.get('/api/weather')
async def weather(
    lat: float = Query(12.9716, ge=-90, le=90),
    lng: float = Query(77.5946, ge=-180, le=180)
):
    cache_key = (round(lat, 2), round(lng, 2))
    now = time.monotonic()
    cached = weather_cache.get(cache_key)
    if cached and (now - cached[0]) < WEATHER_CACHE_TTL:
        return cached[1]

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "timezone": "Asia/Kolkata",
        "forecast_days": 3
    }

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Unable to fetch live weather from upstream provider")

    current = data.get("current", {})
    daily = data.get("daily", {})
    curr_code = current.get("weather_code", 0)
    curr_en, curr_kn = WMO_WEATHER_CODES.get(curr_code, ("Unknown", "ತಿಳಿದಿಲ್ಲ"))

    result = {
        "status": "ok",
        "location": {
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
        },
        "current": {
            "temperature_c": current.get("temperature_2m"),
            "humidity_percent": current.get("relative_humidity_2m"),
            "precipitation_mm": current.get("precipitation"),
            "wind_speed_kmh": current.get("wind_speed_10m"),
            "weather_code": curr_code,
            "condition": {"en": curr_en, "kn": curr_kn},
            "time": current.get("time"),
        },
        "forecast_3d": [
            {
                "date": daily["time"][i],
                "temp_max_c": daily["temperature_2m_max"][i],
                "temp_min_c": daily["temperature_2m_min"][i],
                "rain_probability_percent": daily["precipitation_probability_max"][i],
                "weather_code": daily["weather_code"][i],
                "condition": {
                    "en": WMO_WEATHER_CODES.get(daily["weather_code"][i], ("Unknown", "ತಿಳಿದಿಲ್ಲ"))[0],
                    "kn": WMO_WEATHER_CODES.get(daily["weather_code"][i], ("Unknown", "ತಿಳಿದಿಲ್ಲ"))[1],
                },
            }
            for i in range(len(daily.get("time", [])))
        ],
    }

    weather_cache[cache_key] = (now, result)
    return result

@app.post('/api/explain')
def explain():return {'status':'not_implemented','heatmap':None,'message':'Saliency explanations are not implemented for this model; no heatmap is fabricated.'}