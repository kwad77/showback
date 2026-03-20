"""Persona CRUD endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.database import CostObject, Persona
from app.models.schemas import PersonaCreate, PersonaRead, PersonaUpdate

router = APIRouter()


def _get_or_404(persona_id: int, db: Session) -> Persona:
    p = db.query(Persona).filter(Persona.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    return p


def _resolve_cost_objects(ids: list[int], db: Session) -> list[CostObject]:
    objs = db.query(CostObject).filter(CostObject.id.in_(ids)).all()
    if len(objs) != len(ids):
        found = {o.id for o in objs}
        missing = [i for i in ids if i not in found]
        raise HTTPException(
            status_code=422,
            detail=f"CostObject IDs not found: {missing}",
        )
    return objs


@router.get("/", response_model=list[PersonaRead])
def list_personas(db: Session = Depends(get_db)):
    return db.query(Persona).all()


@router.post("/", response_model=PersonaRead, status_code=status.HTTP_201_CREATED)
def create_persona(payload: PersonaCreate, db: Session = Depends(get_db)):
    existing = db.query(Persona).filter(Persona.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="A persona with that name already exists")

    cost_objects = _resolve_cost_objects(payload.cost_object_ids, db)
    persona = Persona(
        name=payload.name,
        description=payload.description,
        color=payload.color,
        icon=payload.icon,
        cost_objects=cost_objects,
    )
    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona


@router.get("/{persona_id}", response_model=PersonaRead)
def get_persona(persona_id: int, db: Session = Depends(get_db)):
    return _get_or_404(persona_id, db)


@router.patch("/{persona_id}", response_model=PersonaRead)
def update_persona(persona_id: int, payload: PersonaUpdate, db: Session = Depends(get_db)):
    persona = _get_or_404(persona_id, db)

    if payload.name is not None:
        conflict = (
            db.query(Persona)
            .filter(Persona.name == payload.name, Persona.id != persona_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=409, detail="Name already taken by another persona")
        persona.name = payload.name

    if payload.description is not None:
        persona.description = payload.description
    if payload.color is not None:
        persona.color = payload.color
    if payload.icon is not None:
        persona.icon = payload.icon
    if payload.cost_object_ids is not None:
        persona.cost_objects = _resolve_cost_objects(payload.cost_object_ids, db)

    db.commit()
    db.refresh(persona)
    return persona


@router.delete("/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_persona(persona_id: int, db: Session = Depends(get_db)):
    persona = _get_or_404(persona_id, db)
    db.delete(persona)
    db.commit()


# ── Cost objects sub-resource ─────────────────────────────────────────────────

@router.post("/{persona_id}/cost-objects/{cost_object_id}", response_model=PersonaRead)
def add_cost_object(persona_id: int, cost_object_id: int, db: Session = Depends(get_db)):
    persona = _get_or_404(persona_id, db)
    co = db.query(CostObject).filter(CostObject.id == cost_object_id).first()
    if not co:
        raise HTTPException(status_code=404, detail="CostObject not found")
    if co not in persona.cost_objects:
        persona.cost_objects.append(co)
        db.commit()
        db.refresh(persona)
    return persona


@router.delete("/{persona_id}/cost-objects/{cost_object_id}", response_model=PersonaRead)
def remove_cost_object(persona_id: int, cost_object_id: int, db: Session = Depends(get_db)):
    persona = _get_or_404(persona_id, db)
    persona.cost_objects = [co for co in persona.cost_objects if co.id != cost_object_id]
    db.commit()
    db.refresh(persona)
    return persona
