"""File upload endpoint with column-mapping support.

Accepts CSV or Excel files and maps user-defined column names to internal
schema fields.  The connector is fully swappable via the DataConnector ABC.
"""

import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.database import CostObject, Employee, Persona
from app.models.schemas import ColumnMapping, UploadResult
from app.services.csv_connector import parse_and_map

router = APIRouter()

ALLOWED_TYPES = {
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
MAX_SIZE_MB = 10


@router.post("/cost-objects", response_model=UploadResult)
async def upload_cost_objects(
    file: UploadFile = File(...),
    mapping: str = Form(...),   # JSON-encoded ColumnMapping
    db: Session = Depends(get_db),
):
    """Parse an uploaded file and bulk-insert CostObjects."""
    if file.content_type not in ALLOWED_TYPES and not file.filename.lower().endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=415, detail="Only CSV and Excel files are supported")

    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_SIZE_MB} MB limit")

    try:
        col_map = ColumnMapping(**json.loads(mapping))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid column mapping: {exc}")

    records, errors = parse_and_map(content, file.filename, col_map)

    imported = 0
    skipped = 0
    for rec in records:
        # Skip exact duplicates (same name + category)
        existing = (
            db.query(CostObject)
            .filter(CostObject.name == rec["asset_name"], CostObject.category == rec["category"])
            .first()
        )
        if existing:
            skipped += 1
            continue

        db.add(
            CostObject(
                name=rec["asset_name"],
                category=rec["category"],
                cost=rec["cost"],
                frequency=rec["frequency"],
                vendor=rec.get("vendor"),
                description=rec.get("description"),
            )
        )
        imported += 1

    db.commit()
    return UploadResult(imported=imported, skipped=skipped, errors=errors)


@router.post("/employees", response_model=UploadResult)
async def upload_employees(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Parse an uploaded employee roster CSV/Excel and bulk-insert Employee records.

    Expected columns: name, email, department, location, persona (optional).
    """
    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_SIZE_MB} limit")

    # Minimal mapping — employee files use fixed column names
    dummy_mapping = ColumnMapping(
        asset_name="name",
        category="department",
        cost="0",
        frequency="Annual",
    )
    # Re-use parse_and_map in a simplified way; employee rows are handled below
    import io
    import pandas as pd

    try:
        if file.filename.lower().endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse file: {exc}")

    imported = 0
    skipped = 0
    errors: list[str] = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        try:
            name = str(row.get("name", "")).strip()
            if not name:
                errors.append(f"Row {row_num}: missing name")
                continue

            email = str(row.get("email", "")).strip() or None
            if email and db.query(Employee).filter(Employee.email == email).first():
                skipped += 1
                continue

            persona_name = str(row.get("persona", "")).strip() or None
            persona = None
            if persona_name:
                persona = db.query(Persona).filter(Persona.name == persona_name).first()

            db.add(
                Employee(
                    name=name,
                    email=email,
                    department=str(row.get("department", "")).strip() or None,
                    location=str(row.get("location", "")).strip() or None,
                    persona_id=persona.id if persona else None,
                )
            )
            imported += 1
        except Exception as exc:
            errors.append(f"Row {row_num}: {exc}")

    db.commit()
    return UploadResult(imported=imported, skipped=skipped, errors=errors)


@router.get("/template/cost-objects")
def get_cost_object_template():
    """Return the expected column names for a cost-object upload file."""
    return {
        "required_columns": ["asset_name", "category", "cost", "frequency"],
        "optional_columns": ["vendor", "description"],
        "category_values": ["HW", "SW", "Network", "Mobile"],
        "frequency_values": ["Monthly", "Annual", "One-time"],
        "example_row": {
            "asset_name": "Adobe Creative Cloud",
            "category": "SW",
            "cost": 54.99,
            "frequency": "Monthly",
            "vendor": "Adobe",
            "description": "Creative Suite license",
        },
    }
