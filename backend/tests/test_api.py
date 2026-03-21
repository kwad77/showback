"""Integration tests for the FastAPI endpoints."""

import pytest

from tests.conftest import (
    make_birthright,
    make_cost_object,
    make_employee,
    make_outlier,
    make_persona,
)
from app.models.database import Category, Frequency


# ── Health ────────────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ── Employees ─────────────────────────────────────────────────────────────────

def test_list_employees_empty(client):
    r = client.get("/api/employees/")
    assert r.status_code == 200
    assert r.json() == []


def test_create_and_get_employee(client):
    r = client.post("/api/employees/", json={"name": "Alice", "department": "Eng"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Alice"

    r2 = client.get(f"/api/employees/{data['id']}")
    assert r2.status_code == 200
    assert r2.json()["name"] == "Alice"


def test_get_employee_not_found(client):
    r = client.get("/api/employees/9999")
    assert r.status_code == 404


def test_update_employee(client):
    r = client.post("/api/employees/", json={"name": "Bob"})
    emp_id = r.json()["id"]

    r2 = client.patch(f"/api/employees/{emp_id}", json={"department": "Finance"})
    assert r2.status_code == 200
    assert r2.json()["department"] == "Finance"


def test_delete_employee(client):
    r = client.post("/api/employees/", json={"name": "Carol"})
    emp_id = r.json()["id"]

    r2 = client.delete(f"/api/employees/{emp_id}")
    assert r2.status_code == 204

    r3 = client.get(f"/api/employees/{emp_id}")
    assert r3.status_code == 404


def test_list_departments(client, db):
    make_employee(db, name="A", department="Eng")
    make_employee(db, name="B", email="b@example.com", department="Finance")

    r = client.get("/api/employees/departments/list")
    assert r.status_code == 200
    assert "Eng" in r.json()
    assert "Finance" in r.json()


# ── Personas ──────────────────────────────────────────────────────────────────

def test_create_persona(client):
    r = client.post("/api/personas/", json={"name": "Developer", "cost_object_ids": []})
    assert r.status_code == 201
    assert r.json()["name"] == "Developer"


def test_list_personas(client, db):
    make_persona(db, name="Analyst")
    r = client.get("/api/personas/")
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    assert "Analyst" in names


# ── Birthright ────────────────────────────────────────────────────────────────

def test_list_birthright_empty(client):
    r = client.get("/api/birthright/")
    assert r.status_code == 200
    assert r.json() == []


def test_create_birthright(client, db):
    co = make_cost_object(db, cost=50.0)
    r = client.post("/api/birthright/", json={"cost_object_id": co.id})
    assert r.status_code == 201
    assert r.json()["is_active"] is True


# ── TCO Report ────────────────────────────────────────────────────────────────

def test_tco_summary_empty(client):
    r = client.get("/api/reports/tco-summary")
    assert r.status_code == 200
    data = r.json()
    assert data["total_employees"] == 0
    assert data["total_annual_tco"] == 0.0


def test_tco_summary_with_data(client, db):
    co = make_cost_object(db, cost=100.0, frequency=Frequency.Annual, category=Category.SW)
    make_birthright(db, co)
    make_employee(db, name="Alice", department="Eng")

    r = client.get("/api/reports/tco-summary")
    assert r.status_code == 200
    data = r.json()
    assert data["total_employees"] == 1
    assert data["birthright_total"] == 100.0
    assert data["total_annual_tco"] == 100.0
    assert len(data["by_domain"]) == 1
    assert data["by_domain"][0]["department"] == "Eng"
