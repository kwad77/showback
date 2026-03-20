"""Birthright cost endpoints — costs applied to every employee automatically."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.database import BirthrightCost, CostObject
from app.models.schemas import BirthrightCreate, BirthrightRead, BirthrightUpdate

router = APIRouter()


@router.get("/", response_model=list[BirthrightRead])
def list_birthright(db: Session = Depends(get_db)):
    return db.query(BirthrightCost).all()


@router.post("/", response_model=BirthrightRead, status_code=status.HTTP_201_CREATED)
def add_birthright(payload: BirthrightCreate, db: Session = Depends(get_db)):
    co = db.query(CostObject).filter(CostObject.id == payload.cost_object_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="CostObject not found")

    existing = (
        db.query(BirthrightCost)
        .filter(BirthrightCost.cost_object_id == payload.cost_object_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="That cost object is already a birthright item")

    bc = BirthrightCost(cost_object_id=payload.cost_object_id, is_active=payload.is_active)
    db.add(bc)
    db.commit()
    db.refresh(bc)
    return bc


@router.patch("/{birthright_id}", response_model=BirthrightRead)
def toggle_birthright(birthright_id: int, payload: BirthrightUpdate, db: Session = Depends(get_db)):
    bc = db.query(BirthrightCost).filter(BirthrightCost.id == birthright_id).first()
    if not bc:
        raise HTTPException(status_code=404, detail="Birthright entry not found")
    bc.is_active = payload.is_active
    db.commit()
    db.refresh(bc)
    return bc


@router.delete("/{birthright_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_birthright(birthright_id: int, db: Session = Depends(get_db)):
    bc = db.query(BirthrightCost).filter(BirthrightCost.id == birthright_id).first()
    if not bc:
        raise HTTPException(status_code=404, detail="Birthright entry not found")
    db.delete(bc)
    db.commit()
