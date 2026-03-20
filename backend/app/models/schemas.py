"""Pydantic v2 schemas — request/response contracts for the TCO Analyzer API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.database import Category, Frequency


# ── Shared config ─────────────────────────────────────────────────────────────

class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ── CostObject ────────────────────────────────────────────────────────────────

class CostObjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    vendor: Optional[str] = None
    category: Category
    cost: float = Field(..., ge=0)
    frequency: Frequency = Frequency.Annual
    description: Optional[str] = None


class CostObjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    vendor: Optional[str] = None
    category: Optional[Category] = None
    cost: Optional[float] = Field(None, ge=0)
    frequency: Optional[Frequency] = None
    description: Optional[str] = None


class CostObjectRead(ORMBase):
    id: int
    name: str
    vendor: Optional[str]
    category: Category
    cost: float
    frequency: Frequency
    description: Optional[str]
    annual_cost: float
    created_at: datetime


# ── Persona ───────────────────────────────────────────────────────────────────

class PersonaCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    color: str = Field("#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str = Field("user", max_length=50)
    cost_object_ids: list[int] = Field(default_factory=list)


class PersonaUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: Optional[str] = Field(None, max_length=50)
    cost_object_ids: Optional[list[int]] = None


class PersonaRead(ORMBase):
    id: int
    name: str
    description: Optional[str]
    color: str
    icon: str
    cost_objects: list[CostObjectRead]
    created_at: datetime

    @property
    def annual_base_cost(self) -> float:
        return sum(co.annual_cost for co in self.cost_objects)


class PersonaSummary(ORMBase):
    """Lightweight persona read without full cost_objects list."""
    id: int
    name: str
    description: Optional[str]
    color: str
    icon: str
    employee_count: int = 0
    annual_base_cost: float = 0.0


# ── Birthright ────────────────────────────────────────────────────────────────

class BirthrightCreate(BaseModel):
    cost_object_id: int
    is_active: bool = True


class BirthrightUpdate(BaseModel):
    is_active: bool


class BirthrightRead(ORMBase):
    id: int
    cost_object_id: int
    is_active: bool
    cost_object: CostObjectRead
    created_at: datetime


# ── Employee ──────────────────────────────────────────────────────────────────

class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    persona_id: Optional[int] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    persona_id: Optional[int] = None


class OutlierRead(ORMBase):
    id: int
    employee_id: int
    cost_object_id: int
    reason: Optional[str]
    is_active: bool
    cost_object: CostObjectRead


class EmployeeRead(ORMBase):
    id: int
    name: str
    email: Optional[str]
    department: Optional[str]
    location: Optional[str]
    persona_id: Optional[int]
    persona: Optional[PersonaRead]
    outliers: list[OutlierRead]
    created_at: datetime


# ── Outlier Adjustment ────────────────────────────────────────────────────────

class OutlierCreate(BaseModel):
    employee_id: int
    cost_object_id: int
    reason: Optional[str] = None
    is_active: bool = True


class OutlierUpdate(BaseModel):
    reason: Optional[str] = None
    is_active: Optional[bool] = None


# ── TCO Calculation ───────────────────────────────────────────────────────────

class EmployeeTCO(BaseModel):
    employee_id: int
    employee_name: str
    department: Optional[str]
    persona_name: Optional[str]
    birthright_annual: float
    persona_annual: float
    outlier_annual: float
    total_annual: float


class DomainBreakdown(BaseModel):
    department: str
    employee_count: int
    total_annual: float
    avg_per_employee: float


class PersonaBreakdown(BaseModel):
    persona_id: Optional[int]
    persona_name: str
    employee_count: int
    total_annual: float
    avg_per_employee: float


class CategoryBreakdown(BaseModel):
    category: str
    total_annual: float
    percentage: float


class TCOSummary(BaseModel):
    total_employees: int
    total_annual_tco: float
    avg_tco_per_employee: float
    birthright_total: float
    persona_total: float
    outlier_total: float
    by_domain: list[DomainBreakdown]
    by_persona: list[PersonaBreakdown]
    by_category: list[CategoryBreakdown]
    employee_details: list[EmployeeTCO]


# ── Upload / Column Mapping ───────────────────────────────────────────────────

class ColumnMapping(BaseModel):
    asset_name: str
    category: str
    cost: str
    frequency: str
    vendor: Optional[str] = None
    description: Optional[str] = None


class UploadResult(BaseModel):
    imported: int
    skipped: int
    errors: list[str]
