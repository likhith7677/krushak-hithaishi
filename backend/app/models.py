from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime, Float, Integer, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(12), default="owner")
    preferred_language: Mapped[str] = mapped_column(String(5), default="kn")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    shops: Mapped[list["Shop"]] = relationship(back_populates="owner")

class Shop(Base):
    __tablename__ = "shops"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    village: Mapped[str] = mapped_column(String(100))
    town: Mapped[str] = mapped_column(String(100), default="")
    district: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100), default="Karnataka")
    pincode: Mapped[str] = mapped_column(String(6), default="")
    phone: Mapped[str] = mapped_column(String(20))
    hours: Mapped[str] = mapped_column(String(80), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(String(300), default="")
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    owner: Mapped[User] = relationship(back_populates="shops")
    products: Mapped[list["Product"]] = relationship(back_populates="shop", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(primary_key=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id"), index=True)
    name: Mapped[str] = mapped_column(String(150))
    category: Mapped[str] = mapped_column(String(60))
    brand: Mapped[str] = mapped_column(String(100), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(String(300), default="")
    package_size: Mapped[str] = mapped_column(String(80), default="")
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True)
    moderation_status: Mapped[str] = mapped_column(String(20), default='pending', index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    shop: Mapped[Shop] = relationship(back_populates="products")

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id"))
    action: Mapped[str] = mapped_column(String(60))
    details: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
