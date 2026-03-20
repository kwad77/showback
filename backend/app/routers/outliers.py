"""Outlier (individual cost adjustment) endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.database import CostObject, Employee, OutlierAdjustment
from app.models.schemas import OutlierCreate, OutlierRead, OutlierUpdate

router = APIRouter()


@router.get("/", response_model=list[OutlierRead])
def list_outliers(employee_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(OutlierAdjustment)
    if employee_id is not None:
        q = q.filter(OutlierAdjustment.employee_id == employee_id)
    return q.all()


@router.post("/", response_model=OutlierRead, status_code=status.HTTP_201_CREATED)
def create_outlier(payload: OutlierCreate, db: Session = Depends(get_db)):
    if not db.query(Employee).filter(Employee.id == payload.employee_id).first():
        raise HTTPException(status_code=404, detail="Employee not found")
    if not db.query(CostObject).filter(CostObject.id == payload.cost_object_id).first():
        raise HTTPException(status_code=404, detail="CostObject not found")

    adj = OutlierAdjustment(
        employee_id=payload.employee_id,
        cost_object_id=payload.cost_object_id,
        reason=payload.reason,
        is_active=payload.is_active,
    )
    db.add(adj)
    db.commit()
    db.refresh(adj)
    return adj


@router.patch("/{outlier_id}", response_model=OutlierRead)
def update_outlier(outlier_id: int, payload: OutlierUpdate, db: Session = Depends(get_db)):
    adj = db.query(OutlierAdjustment).filter(OutlierAdjustment.id == outlier_id).first()
    if not adj:
        raise HTTPException(status_code=404, detail="Outlier adjustment not found")
    if payload.reason is not None:
        adj.reason = payload.reason
    if payload.is_active is not None:
        adj.is_active = payload.is_active
    db.commit()
    db.refresh(adj)
    return adj


@router.delete("/{outlier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_outlier(outlier_id: int, db: Session = Depends(get_db)):
    adj = db.query(OutlierAdjustment).filter(OutlierAdjustment.id == outlier_id).first()
    if not adj:
        raise HTTPException(status_code=404, detail="Outlier adjustment not found")
    db.delete(adj)
    db.commit()
