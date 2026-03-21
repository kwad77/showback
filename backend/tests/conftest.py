"""Shared fixtures — in-memory SQLite DB + FastAPI test client."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models.database import (
    BirthrightCost,
    Category,
    CostObject,
    Employee,
    Frequency,
    OutlierAdjustment,
    Persona,
    persona_cost_objects,
)


# ── DB session ────────────────────────────────────────────────────────────────

@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


# ── FastAPI client (overrides DB dependency) ──────────────────────────────────

@pytest.fixture()
def client(db):
    def _override():
        yield db

    app.dependency_overrides[get_db] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Builder helpers ───────────────────────────────────────────────────────────

def make_cost_object(
    db,
    name: str = "Item",
    cost: float = 100.0,
    frequency: Frequency = Frequency.Annual,
    category: Category = Category.SW,
    vendor: str | None = None,
) -> CostObject:
    co = CostObject(name=name, cost=cost, frequency=frequency, category=category, vendor=vendor)
    db.add(co)
    db.commit()
    db.refresh(co)
    return co


def make_persona(db, name: str = "Engineer", cost_objects: list[CostObject] | None = None) -> Persona:
    p = Persona(name=name)
    db.add(p)
    db.commit()
    db.refresh(p)
    if cost_objects:
        for co in cost_objects:
            db.execute(
                persona_cost_objects.insert().values(persona_id=p.id, cost_object_id=co.id)
            )
        db.commit()
        db.refresh(p)
    return p


def make_employee(
    db,
    name: str = "Alice",
    department: str | None = "Engineering",
    persona: Persona | None = None,
    email: str | None = None,
    location: str | None = None,
) -> Employee:
    emp = Employee(
        name=name,
        email=email or f"{name.lower().replace(' ', '.')}@example.com",
        department=department,
        location=location,
        persona_id=persona.id if persona else None,
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


def make_birthright(db, cost_object: CostObject, is_active: bool = True) -> BirthrightCost:
    bc = BirthrightCost(cost_object_id=cost_object.id, is_active=is_active)
    db.add(bc)
    db.commit()
    db.refresh(bc)
    return bc


def make_outlier(
    db,
    employee: Employee,
    cost_object: CostObject,
    is_active: bool = True,
    reason: str | None = None,
) -> OutlierAdjustment:
    o = OutlierAdjustment(
        employee_id=employee.id,
        cost_object_id=cost_object.id,
        is_active=is_active,
        reason=reason,
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    return o
