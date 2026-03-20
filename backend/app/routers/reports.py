"""Reporting endpoints — TCO summary and cost-object CRUD."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.database import CostObject
from app.models.schemas import CostObjectCreate, CostObjectRead, CostObjectUpdate, TCOSummary
from app.services.tco_calculator import build_tco_summary

router = APIRouter()


# ── TCO Summary ───────────────────────────────────────────────────────────────

@router.get("/tco-summary", response_model=TCOSummary)
def get_tco_summary(db: Session = Depends(get_db)):
    """Calculate and return the full TCO breakdown for all employees."""
    return build_tco_summary(db)


# ── CostObject CRUD (lives here so reports can reference cost objects) ─────────

@router.get("/cost-objects", response_model=list[CostObjectRead])
def list_cost_objects(db: Session = Depends(get_db)):
    return db.query(CostObject).order_by(CostObject.category, CostObject.name).all()


@router.post("/cost-objects", response_model=CostObjectRead, status_code=status.HTTP_201_CREATED)
def create_cost_object(payload: CostObjectCreate, db: Session = Depends(get_db)):
    co = CostObject(**payload.model_dump())
    db.add(co)
    db.commit()
    db.refresh(co)
    return co


@router.get("/cost-objects/{cost_object_id}", response_model=CostObjectRead)
def get_cost_object(cost_object_id: int, db: Session = Depends(get_db)):
    co = db.query(CostObject).filter(CostObject.id == cost_object_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="CostObject not found")
    return co


@router.patch("/cost-objects/{cost_object_id}", response_model=CostObjectRead)
def update_cost_object(cost_object_id: int, payload: CostObjectUpdate, db: Session = Depends(get_db)):
    co = db.query(CostObject).filter(CostObject.id == cost_object_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="CostObject not found")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(co, field, val)
    db.commit()
    db.refresh(co)
    return co


@router.delete("/cost-objects/{cost_object_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cost_object(cost_object_id: int, db: Session = Depends(get_db)):
    co = db.query(CostObject).filter(CostObject.id == cost_object_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="CostObject not found")
    db.delete(co)
    db.commit()
