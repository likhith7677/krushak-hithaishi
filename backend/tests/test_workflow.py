"""Run from backend/: python -m pytest -q
Test DB is always an isolated temporary SQLite database.
"""
import os, tempfile, uuid
from pathlib import Path
from fastapi.testclient import TestClient

TEST_DB=Path(tempfile.gettempdir()) / f'krushak-test-{uuid.uuid4().hex}.db'
os.environ.setdefault('DATABASE_URL','sqlite:///'+str(TEST_DB))
os.environ['SECRET_KEY']='test-secret-please-change-this-at-least-32-bytes-long'
os.environ['ADMIN_EMAIL']='moderator@example.org'
os.environ['ADMIN_PHONE']='+919999999998'
os.environ['ADMIN_PASSWORD']='very-strong-admin-password'
from app.main import app

def post(client,path,payload):
    return client.post(path,json=payload,headers={'X-KH-Request':'web'})

def patch(client,path,payload):
    return client.patch(path,json=payload,headers={'X-KH-Request':'web'})

def login(client,phone,password):
    response=post(client,'/api/auth/login',{'phone':phone,'password':password})
    assert response.status_code==200, response.text

def test_real_shop_product_approval_and_ownership():
    with TestClient(app) as owner:
        register=post(owner,'/api/auth/register',{'name':'Test Shopkeeper','phone':'9876543210','password':'owner-secure-test-password','role':'owner'})
        assert register.status_code==201,register.text
        shop_data={'name':'Sri Lakshmi Agri Shop','village':'Gudibande','town':'Gudibande','district':'Chikkaballapur','state':'Karnataka','pincode':'561209','phone':'9876543210','latitude':13.67,'longitude':77.7,'hours':'9-6','image_url':'','description':''}
        created=post(owner,'/api/owner/shops',shop_data)
        assert created.status_code==201,created.text
        sid=created.json()['id']
        product_data={'name':'Organic compost pack','category':'Fertilizer','brand':'Village Compost','description':'Sample listing only','image_url':'','package_size':'1 kg','price':100,'in_stock':True}
        p=post(owner,f'/api/owner/shops/{sid}/products',product_data)
        assert p.status_code==201,p.text
        pid=p.json()['id']
        assert p.json()['moderation_status']=='pending'
        assert owner.get('/api/shops/nearby').json()==[]
        assert owner.post(f'/api/owner/shops/{sid}/submit',headers={'X-KH-Request':'web'}).status_code==200

        with TestClient(app) as other:
            r=post(other,'/api/auth/register',{'name':'Second Shopkeeper','phone':'9876543211','password':'owner-two-secure-password','role':'owner'})
            assert r.status_code==201
            assert patch(other,f'/api/owner/products/{pid}/stock',{'in_stock':False}).status_code==404
            assert patch(other,f'/api/owner/shops/{sid}/location',{'latitude':13.7,'longitude':77.9}).status_code==404

        with TestClient(app) as admin:
            login(admin,'+919999999998','very-strong-admin-password')
            assert len(admin.get('/api/admin/shops/pending').json())==1
            approval=patch(admin,f'/api/admin/shops/{sid}/verification',{'approve':True,'reason':'Verified in test'})
            assert approval.status_code==200,approval.text
            assert approval.json()['status']=='approved'
            assert len(owner.get('/api/shops/nearby?lat=13.67&lng=77.7').json())==1
            assert owner.get(f'/api/shops/{sid}/products').json()==[]
            moderation=patch(admin,f'/api/admin/products/{pid}/moderation',{'approve':True,'reason':'Verified in test'})
            assert moderation.status_code==200,moderation.text
            assert len(owner.get(f'/api/shops/{sid}/products').json())==1
            # A significant location change invalidates verified shop status.
            changed=patch(owner,f'/api/owner/shops/{sid}/location',{'latitude':13.8,'longitude':77.9})
            assert changed.status_code==200,changed.text
            assert changed.json()['status']=='pending'
            assert owner.get('/api/shops/nearby').json()==[]


def test_ai_has_no_fake_prediction():
    import io
    from PIL import Image
    image=Image.new('RGB',(224,224),'green')
    for x in range(0,224,5):
        for y in range(0,224,5):
            image.putpixel((x,y),(90,25,20))
    stream=io.BytesIO();image.save(stream,'PNG');stream.seek(0)
    with TestClient(app) as client:
        response=client.post('/api/detect?crop=tomato',files={'file':('leaf.png',stream,'image/png')},headers={'X-KH-Request':'web'})
        assert response.status_code==200,response.text
        result=response.json()
        assert result['status']=='model_unavailable'
        assert result['prediction'] is None and result['confidence'] is None


def test_advisory_is_source_linked_and_never_invents_treatment():
    with TestClient(app) as client:
        response=client.get('/api/advisory?label=Tomato_Early_blight')
        assert response.status_code==200
        payload=response.json()
        assert 'Early blight' in payload['summary'] or 'early blight' in payload['summary'].lower()
        assert payload['sources'] and payload['sources'][0]['url'].startswith('https://extension.umn.edu/')
        assert 'prescription' in payload['disclaimer'].lower()
        assert client.get('/api/advisory?label=made_up_plant_problem').status_code==404
        assert not client.get('/api/advisory').json()['sources']


def test_owner_identity_edit_requires_new_shop_verification():
    with TestClient(app) as owner:
        assert post(owner,'/api/auth/register',{'name':'Third Shopkeeper','phone':'9876543244','password':'owner-three-test-password','role':'owner'}).status_code==201
        original={'name':'Village Seed Centre','village':'Gudibande','town':'Gudibande','district':'Chikkaballapur','state':'Karnataka','pincode':'561209','phone':'9876543244','latitude':13.67,'longitude':77.7,'hours':'9-6','image_url':'','description':''}
        created=post(owner,'/api/owner/shops',original)
        assert created.status_code==201
        sid=created.json()['id']
        assert owner.post(f'/api/owner/shops/{sid}/submit',headers={'X-KH-Request':'web'}).status_code==200
        with TestClient(app) as admin:
            login(admin,'+919999999998','very-strong-admin-password')
            assert patch(admin,f'/api/admin/shops/{sid}/verification',{'approve':True}).json()['status']=='approved'
        changed={**original,'phone':'9876543299'}
        assert patch(owner,f'/api/owner/shops/{sid}',changed).json()['status']=='pending'
        assert owner.get(f'/api/shops/{sid}').status_code==404
        invalid={**original,'image_url':'https://random-website.example/claim.jpg'}
        assert patch(owner,f'/api/owner/shops/{sid}',invalid).status_code==422


def test_invalid_or_unpermitted_upload_and_unauthenticated_moderation():
    with TestClient(app) as client:
        assert client.get('/api/readiness').json()['database']=='connected'
        assert client.get('/api/admin/shops/pending').status_code==401
        assert client.post('/api/uploads',files={'file':('random.txt',b'not a photo','text/plain')},headers={'X-KH-Request':'web'}).status_code==401
        assert client.post('/api/detect?crop=rice',headers={'X-KH-Request':'web'}).status_code==422
        assert client.post('/api/detect?crop=tomato',files={'file':('bad.png',b'not an image','image/png')},headers={'X-KH-Request':'web'}).status_code==415
