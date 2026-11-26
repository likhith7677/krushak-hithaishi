from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Literal

class UserRegister(BaseModel):
    name: str = Field(min_length=2,max_length=120)
    phone: str = Field(pattern=r'^\+?[0-9]{10,13}$')
    email: str | None = Field(default=None,max_length=255)
    password: str = Field(min_length=10,max_length=128)
    language: Literal['kn','en','hi','te'] = 'kn'
    role: Literal['owner','farmer'] = 'owner'

class Login(BaseModel):
    phone: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    phone: str
    role: str
    preferred_language: str

def validate_upload_url(value: str) -> str:
    if value and not (value.startswith('/uploads/') and value.endswith('.webp')
                      and len(value) == len('/uploads/') + 32 + len('.webp')
                      and all(c in '0123456789abcdef' for c in value[len('/uploads/'):-len('.webp')])):
        raise ValueError('Upload a valid image using the site photo uploader')
    return value

class ShopInput(BaseModel):
    name: str = Field(min_length=2,max_length=150)
    village: str = Field(min_length=2,max_length=100)
    town: str = Field(default='',max_length=100)
    district: str = Field(min_length=2,max_length=100)
    state: str = Field(default='Karnataka',min_length=2,max_length=100)
    pincode: str = Field(default='',pattern=r'^$|^[1-9][0-9]{5}$')
    phone: str = Field(pattern=r'^\+?[0-9]{10,13}$')
    hours: str = Field(default='',max_length=80)
    description: str = Field(default='',max_length=1000)
    image_url: str = Field(default='',max_length=300)
    latitude: float = Field(ge=-90,le=90)
    longitude: float = Field(ge=-180,le=180)

    @field_validator('image_url')
    @classmethod
    def restrict_image(cls, value):
        return validate_upload_url(value)

class LocationUpdate(BaseModel):
    latitude: float = Field(ge=-90,le=90)
    longitude: float = Field(ge=-180,le=180)

class ShopOut(ShopInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    distance_km: float | None = None

class ProductInput(BaseModel):
    name: str = Field(min_length=2,max_length=150)
    category: Literal['Fertilizer','Seeds','Biofertilizer','Biopesticide','Fungicide','Insecticide','Equipment','Plant nutrients','Other']
    brand: str = Field(default='',max_length=100)
    description: str = Field(default='',max_length=1000)
    image_url: str = Field(default='',max_length=300)
    package_size: str = Field(default='',max_length=80)
    price: float | None = Field(default=None,ge=0,le=10000000)
    in_stock: bool = True

    @field_validator('image_url')
    @classmethod
    def restrict_image(cls, value):
        return validate_upload_url(value)

class ProductOut(ProductInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    shop_id: int
    updated_at: datetime
    moderation_status: str

class StockUpdate(BaseModel):
    in_stock: bool

class VerificationInput(BaseModel):
    approve: bool
    reason: str = Field(default='',max_length=500)
