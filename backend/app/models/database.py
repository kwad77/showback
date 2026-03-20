"""SQLAlchemy ORM models for the Employee TCO Analyzer."""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship

from app.db import Base


# ── Enumerations ──────────────────────────────────────────────────────────────

class Category(str, PyEnum):
    HW = "HW"
    SW = "SW"
    Network = "Network"
    Mobile = "Mobile"


class Frequency(str, PyEnum):
    Monthly = "Monthly"
    Annual = "Annual"
    OneTime = "One-time"


# ── Association table: Persona ↔ CostObject ──────────────────────────────────

persona_cost_objects = Table(
    "persona_cost_objects",
    Base.metadata,
    Column("persona_id", Integer, ForeignKey("personas.id", ondelete="CASCADE"), primary_key=True),
    Column("cost_object_id", Integer, ForeignKey("cost_objects.id", ondelete="CASCADE"), primary_key=True),
)


# ── Core Models ───────────────────────────────────────────────────────────────

class CostObject(Base):
    """A discrete technology cost item (license, hardware, subscription, etc.)."""

    __tablename__ = "cost_objects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    vendor = Column(String(255))
    category = Column(Enum(Category), nullable=False)
    cost = Column(Float, nullable=False)
    frequency = Column(Enum(Frequency), nullable=False, default=Frequency.Annual)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    personas = relationship("Persona", secondary=persona_cost_objects, back_populates="cost_objects")
    birthright_entries = relationship("BirthrightCost", back_populates="cost_object", cascade="all, delete-orphan")
    outlier_entries = relationship("OutlierAdjustment", back_populates="cost_object", cascade="all, delete-orphan")

    @property
    def annual_cost(self) -> float:
        if self.frequency == Frequency.Monthly:
            return self.cost * 12
        return self.cost  # Annual or One-time


class Persona(Base):
    """A named technology profile applied to a group of employees."""

    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    color = Column(String(7), default="#6366f1")   # hex colour for UI
    icon = Column(String(50), default="user")       # heroicon name
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cost_objects = relationship("CostObject", secondary=persona_cost_objects, back_populates="personas")
    employees = relationship("Employee", back_populates="persona")


class BirthrightCost(Base):
    """A cost that is automatically applied to every employee (e.g. SSO, email)."""

    __tablename__ = "birthright_costs"

    id = Column(Integer, primary_key=True, index=True)
    cost_object_id = Column(Integer, ForeignKey("cost_objects.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    cost_object = relationship("CostObject", back_populates="birthright_entries")


class Employee(Base):
    """An individual employee record with a persona assignment."""

    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)
    department = Column(String(255))          # Domain / org unit
    location = Column(String(255))
    persona_id = Column(Integer, ForeignKey("personas.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    persona = relationship("Persona", back_populates="employees")
    outliers = relationship("OutlierAdjustment", back_populates="employee", cascade="all, delete-orphan")


class OutlierAdjustment(Base):
    """An individual cost add-on that falls outside a standard persona."""

    __tablename__ = "outlier_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    cost_object_id = Column(Integer, ForeignKey("cost_objects.id", ondelete="CASCADE"), nullable=False)
    reason = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="outliers")
    cost_object = relationship("CostObject", back_populates="outlier_entries")
