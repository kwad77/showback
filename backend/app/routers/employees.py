"""Employee CRUD endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.database import Employee, Persona
from app.models.schemas import EmployeeCreate, EmployeeRead, EmployeeUpdate

router = APIRouter()


def _get_or_404(employee_id: int, db: Session) -> Employee:
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.get("/", response_model=list[EmployeeRead])
def list_employees(
    department: str | None = Query(None),
    persona_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Employee)
    if department:
        q = q.filter(Employee.department == department)
    if persona_id is not None:
        q = q.filter(Employee.persona_id == persona_id)
    return q.all()


@router.post("/", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    if payload.persona_id:
        if not db.query(Persona).filter(Persona.id == payload.persona_id).first():
            raise HTTPException(status_code=404, detail="Persona not found")

    emp = Employee(
        name=payload.name,
        email=payload.email,
        department=payload.department,
        location=payload.location,
        persona_id=payload.persona_id,
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    return _get_or_404(employee_id, db)


@router.patch("/{employee_id}", response_model=EmployeeRead)
def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    emp = _get_or_404(employee_id, db)

    if payload.persona_id is not None:
        if not db.query(Persona).filter(Persona.id == payload.persona_id).first():
            raise HTTPException(status_code=404, detail="Persona not found")
        emp.persona_id = payload.persona_id

    for field in ("name", "email", "department", "location"):
        val = getattr(payload, field)
        if val is not None:
            setattr(emp, field, val)

    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = _get_or_404(employee_id, db)
    db.delete(emp)
    db.commit()


@router.get("/departments/list", response_model=list[str])
def list_departments(db: Session = Depends(get_db)):
    rows = db.query(Employee.department).distinct().all()
    return sorted({r[0] for r in rows if r[0]})
