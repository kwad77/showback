"""Integration tests for the file upload endpoints."""

import io
import json

import pytest

from tests.conftest import make_cost_object, make_employee, make_persona
from app.models.database import Category


def _csv_bytes(content: str) -> bytes:
    return content.encode()


VALID_MAPPING = json.dumps({
    "asset_name": "name",
    "category": "category",
    "cost": "cost",
    "frequency": "frequency",
})


class TestUploadCostObjects:
    def test_get_template(self, client):
        r = client.get("/api/upload/template/cost-objects")
        assert r.status_code == 200
        data = r.json()
        assert "required_columns" in data
        assert "asset_name" in data["required_columns"]

    def test_upload_valid_csv(self, client):
        csv = _csv_bytes("name,category,cost,frequency\nSlack,SW,10.0,monthly\nLaptop,HW,1200,annual")
        r = client.post(
            "/api/upload/cost-objects",
            files={"file": ("data.csv", io.BytesIO(csv), "text/csv")},
            data={"mapping": VALID_MAPPING},
        )
        assert r.status_code == 200
        result = r.json()
        assert result["imported"] == 2
        assert result["skipped"] == 0
        assert result["errors"] == []

    def test_upload_skips_duplicates(self, client, db):
        make_cost_object(db, name="Slack", category=Category.SW)

        csv = _csv_bytes("name,category,cost,frequency\nSlack,SW,10.0,monthly")
        r = client.post(
            "/api/upload/cost-objects",
            files={"file": ("data.csv", io.BytesIO(csv), "text/csv")},
            data={"mapping": VALID_MAPPING},
        )
        assert r.status_code == 200
        result = r.json()
        assert result["imported"] == 0
        assert result["skipped"] == 1

    def test_upload_bad_mapping_json(self, client):
        csv = _csv_bytes("name,category,cost,frequency\nSlack,SW,10.0,monthly")
        r = client.post(
            "/api/upload/cost-objects",
            files={"file": ("data.csv", io.BytesIO(csv), "text/csv")},
            data={"mapping": "{not valid json"},
        )
        assert r.status_code == 422

    def test_upload_invalid_content_type(self, client):
        r = client.post(
            "/api/upload/cost-objects",
            files={"file": ("data.txt", io.BytesIO(b"hello"), "text/plain")},
            data={"mapping": VALID_MAPPING},
        )
        assert r.status_code == 415

    def test_upload_row_errors_returned(self, client):
        csv = _csv_bytes("name,category,cost,frequency\nSlack,CLOUD,10.0,monthly")
        r = client.post(
            "/api/upload/cost-objects",
            files={"file": ("data.csv", io.BytesIO(csv), "text/csv")},
            data={"mapping": VALID_MAPPING},
        )
        assert r.status_code == 200
        result = r.json()
        assert result["imported"] == 0
        assert len(result["errors"]) == 1

    def test_upload_with_vendor_and_description(self, client):
        csv = _csv_bytes("name,category,cost,frequency,vendor,notes\nZoom,SW,15.0,monthly,Zoom Inc,Video")
        mapping = json.dumps({
            "asset_name": "name",
            "category": "category",
            "cost": "cost",
            "frequency": "frequency",
            "vendor": "vendor",
            "description": "notes",
        })
        r = client.post(
            "/api/upload/cost-objects",
            files={"file": ("data.csv", io.BytesIO(csv), "text/csv")},
            data={"mapping": mapping},
        )
        assert r.status_code == 200
        assert r.json()["imported"] == 1


class TestUploadEmployees:
    def test_upload_valid_employee_csv(self, client):
        csv = _csv_bytes("name,email,department,location\nAlice,alice@x.com,Eng,NYC\nBob,bob@x.com,Finance,LA")
        r = client.post(
            "/api/upload/employees",
            files={"file": ("employees.csv", io.BytesIO(csv), "text/csv")},
        )
        assert r.status_code == 200
        result = r.json()
        assert result["imported"] == 2
        assert result["skipped"] == 0
        assert result["errors"] == []

    def test_upload_employee_missing_name(self, client):
        # space-only name strips to "" and triggers the missing-name error
        csv = _csv_bytes("name,email\n ,alice@x.com")
        r = client.post(
            "/api/upload/employees",
            files={"file": ("employees.csv", io.BytesIO(csv), "text/csv")},
        )
        assert r.status_code == 200
        result = r.json()
        assert result["imported"] == 0
        assert any("missing name" in e for e in result["errors"])

    def test_upload_employee_skips_duplicate_email(self, client, db):
        make_employee(db, name="Alice", email="alice@x.com")

        csv = _csv_bytes("name,email\nAlice,alice@x.com")
        r = client.post(
            "/api/upload/employees",
            files={"file": ("employees.csv", io.BytesIO(csv), "text/csv")},
        )
        assert r.status_code == 200
        result = r.json()
        assert result["skipped"] == 1
        assert result["imported"] == 0

    def test_upload_employee_with_persona(self, client, db):
        make_persona(db, name="Engineer")

        csv = _csv_bytes("name,email,persona\nAlice,alice2@x.com,Engineer")
        r = client.post(
            "/api/upload/employees",
            files={"file": ("employees.csv", io.BytesIO(csv), "text/csv")},
        )
        assert r.status_code == 200
        assert r.json()["imported"] == 1

    def test_upload_employee_with_unknown_persona(self, client):
        csv = _csv_bytes("name,email,persona\nAlice,alice3@x.com,GhostPersona")
        r = client.post(
            "/api/upload/employees",
            files={"file": ("employees.csv", io.BytesIO(csv), "text/csv")},
        )
        assert r.status_code == 200
        # Should import with no persona assigned
        assert r.json()["imported"] == 1

    def test_upload_employee_bad_file(self, client):
        r = client.post(
            "/api/upload/employees",
            files={"file": ("junk.csv", io.BytesIO(b"\x00\x01\x02\x03"), "text/csv")},
        )
        # Either parses (treating bytes as data) or returns 422 — must not 500
        assert r.status_code in (200, 422)
