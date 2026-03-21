"""Tests targeting the last uncovered lines."""

import io
import json

import pytest
from openpyxl import Workbook

from app.models.database import Category, Frequency
from app.models.schemas import CostObjectRead, PersonaRead
from app.services.csv_connector import _parse_dataframe
from tests.conftest import make_cost_object, make_persona


# ── Helpers ───────────────────────────────────────────────────────────────────

def _xlsx_bytes(rows: list[list]) -> bytes:
    wb = Workbook()
    ws = wb.active
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


VALID_MAPPING = json.dumps({
    "asset_name": "name",
    "category": "category",
    "cost": "cost",
    "frequency": "frequency",
})


# ── upload.py: file size limits (lines 39, 88) ───────────────────────────────

class TestUploadSizeLimits:
    def test_cost_objects_file_too_large(self, client):
        big = b"x" * (10 * 1024 * 1024 + 1)
        r = client.post(
            "/api/upload/cost-objects",
            files={"file": ("big.csv", io.BytesIO(big), "text/csv")},
            data={"mapping": VALID_MAPPING},
        )
        assert r.status_code == 413

    def test_employees_file_too_large(self, client):
        big = b"x" * (10 * 1024 * 1024 + 1)
        r = client.post(
            "/api/upload/employees",
            files={"file": ("big.csv", io.BytesIO(big), "text/csv")},
        )
        assert r.status_code == 413


# ── upload.py: Excel branch for employees (line 103) ─────────────────────────

class TestUploadEmployeesExcel:
    def test_upload_employees_xlsx(self, client):
        xlsx = _xlsx_bytes([
            ["name", "email", "department"],
            ["Alice", "alice_xl@x.com", "Eng"],
        ])
        r = client.post(
            "/api/upload/employees",
            files={"file": ("employees.xlsx", io.BytesIO(xlsx),
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
        assert r.status_code == 200
        assert r.json()["imported"] == 1

    def test_upload_employees_bad_xlsx_returns_422(self, client):
        # valid xlsx extension, corrupt bytes → parse error
        r = client.post(
            "/api/upload/employees",
            files={"file": ("bad.xlsx", io.BytesIO(b"PK\x03\x04corrupted"),
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
        assert r.status_code == 422


# ── csv_connector.py: Excel branch in _parse_dataframe (line 47) ─────────────

class TestParseDataframeExcel:
    def test_xlsx_parsing(self):
        xlsx = _xlsx_bytes([["item", "price"], ["Laptop", 1200]])
        df = _parse_dataframe(xlsx, "data.xlsx")
        assert list(df.columns) == ["item", "price"]
        assert len(df) == 1

    def test_xls_extension_detected(self):
        # openpyxl can write modern xlsx; .xls extension triggers same branch
        xlsx = _xlsx_bytes([["a"], [1]])
        df = _parse_dataframe(xlsx, "legacy.XLS")
        assert len(df) == 1


# ── schemas.py: PersonaRead.annual_base_cost property (line 78) ──────────────

class TestPersonaReadAnnualBaseCost:
    def test_annual_base_cost_sums_cost_objects(self, db):
        co1 = make_cost_object(db, name="A", cost=100.0, frequency=Frequency.Annual)
        co2 = make_cost_object(db, name="B", cost=50.0, frequency=Frequency.Monthly)

        from app.models.database import Employee
        from datetime import datetime

        # Build a PersonaRead directly from ORM objects
        co1_read = CostObjectRead(
            id=co1.id, name=co1.name, vendor=co1.vendor, category=co1.category,
            cost=co1.cost, frequency=co1.frequency, description=co1.description,
            annual_cost=co1.annual_cost, created_at=co1.created_at or datetime.utcnow(),
        )
        co2_read = CostObjectRead(
            id=co2.id, name=co2.name, vendor=co2.vendor, category=co2.category,
            cost=co2.cost, frequency=co2.frequency, description=co2.description,
            annual_cost=co2.annual_cost, created_at=co2.created_at or datetime.utcnow(),
        )

        from datetime import datetime as dt
        persona_read = PersonaRead(
            id=1, name="Test", description=None, color="#000000", icon="user",
            cost_objects=[co1_read, co2_read], created_at=dt.utcnow(),
        )

        # annual: 100 + monthly*12: 50*12=600 → total 700
        assert persona_read.annual_base_cost == 700.0
