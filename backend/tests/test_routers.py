"""Router-level CRUD tests targeting the low-coverage endpoints."""

import pytest

from app.models.database import Category, Frequency
from tests.conftest import (
    make_birthright,
    make_cost_object,
    make_employee,
    make_outlier,
    make_persona,
)


# ── Outliers ──────────────────────────────────────────────────────────────────

class TestOutliersRouter:
    def test_list_outliers_empty(self, client):
        r = client.get("/api/outliers/")
        assert r.status_code == 200
        assert r.json() == []

    def test_list_outliers_filtered_by_employee(self, client, db):
        co = make_cost_object(db)
        emp1 = make_employee(db, name="Alice")
        emp2 = make_employee(db, name="Bob", email="bob@example.com")
        make_outlier(db, emp1, co)
        make_outlier(db, emp2, co)

        r = client.get(f"/api/outliers/?employee_id={emp1.id}")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1
        assert data[0]["employee_id"] == emp1.id

    def test_create_outlier_success(self, client, db):
        co = make_cost_object(db)
        emp = make_employee(db)

        r = client.post("/api/outliers/", json={
            "employee_id": emp.id,
            "cost_object_id": co.id,
            "reason": "Special license",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["reason"] == "Special license"
        assert data["is_active"] is True

    def test_create_outlier_employee_not_found(self, client, db):
        co = make_cost_object(db)
        r = client.post("/api/outliers/", json={"employee_id": 9999, "cost_object_id": co.id})
        assert r.status_code == 404

    def test_create_outlier_cost_object_not_found(self, client, db):
        emp = make_employee(db)
        r = client.post("/api/outliers/", json={"employee_id": emp.id, "cost_object_id": 9999})
        assert r.status_code == 404

    def test_update_outlier_toggle_active(self, client, db):
        co = make_cost_object(db)
        emp = make_employee(db)
        o = make_outlier(db, emp, co, is_active=True)

        r = client.patch(f"/api/outliers/{o.id}", json={"is_active": False})
        assert r.status_code == 200
        assert r.json()["is_active"] is False

    def test_update_outlier_reason(self, client, db):
        co = make_cost_object(db)
        emp = make_employee(db)
        o = make_outlier(db, emp, co, reason="Old reason")

        r = client.patch(f"/api/outliers/{o.id}", json={"reason": "New reason"})
        assert r.status_code == 200
        assert r.json()["reason"] == "New reason"

    def test_update_outlier_not_found(self, client):
        r = client.patch("/api/outliers/9999", json={"is_active": False})
        assert r.status_code == 404

    def test_delete_outlier_success(self, client, db):
        co = make_cost_object(db)
        emp = make_employee(db)
        o = make_outlier(db, emp, co)

        r = client.delete(f"/api/outliers/{o.id}")
        assert r.status_code == 204

        r2 = client.get("/api/outliers/")
        assert all(item["id"] != o.id for item in r2.json())

    def test_delete_outlier_not_found(self, client):
        r = client.delete("/api/outliers/9999")
        assert r.status_code == 404


# ── Personas ──────────────────────────────────────────────────────────────────

class TestPersonasRouter:
    def test_get_persona_success(self, client, db):
        p = make_persona(db, name="DevOps")
        r = client.get(f"/api/personas/{p.id}")
        assert r.status_code == 200
        assert r.json()["name"] == "DevOps"

    def test_get_persona_not_found(self, client):
        r = client.get("/api/personas/9999")
        assert r.status_code == 404

    def test_create_persona_duplicate_name(self, client, db):
        make_persona(db, name="Engineer")
        r = client.post("/api/personas/", json={"name": "Engineer", "cost_object_ids": []})
        assert r.status_code == 409

    def test_create_persona_missing_cost_object(self, client):
        r = client.post("/api/personas/", json={"name": "Ghost", "cost_object_ids": [9999]})
        assert r.status_code == 422

    def test_create_persona_with_cost_objects(self, client, db):
        co = make_cost_object(db, name="Slack")
        r = client.post("/api/personas/", json={"name": "Sales", "cost_object_ids": [co.id]})
        assert r.status_code == 201
        data = r.json()
        assert len(data["cost_objects"]) == 1
        assert data["cost_objects"][0]["name"] == "Slack"

    def test_update_persona_rename(self, client, db):
        p = make_persona(db, name="Old Name")
        r = client.patch(f"/api/personas/{p.id}", json={"name": "New Name"})
        assert r.status_code == 200
        assert r.json()["name"] == "New Name"

    def test_update_persona_name_conflict(self, client, db):
        make_persona(db, name="Taken")
        p2 = make_persona(db, name="Mine")
        r = client.patch(f"/api/personas/{p2.id}", json={"name": "Taken"})
        assert r.status_code == 409

    def test_update_persona_color_and_icon(self, client, db):
        p = make_persona(db)
        r = client.patch(f"/api/personas/{p.id}", json={"color": "#ff0000", "icon": "star"})
        assert r.status_code == 200
        data = r.json()
        assert data["color"] == "#ff0000"
        assert data["icon"] == "star"

    def test_update_persona_cost_objects(self, client, db):
        co1 = make_cost_object(db, name="A")
        co2 = make_cost_object(db, name="B")
        p = make_persona(db, cost_objects=[co1])

        r = client.patch(f"/api/personas/{p.id}", json={"cost_object_ids": [co2.id]})
        assert r.status_code == 200
        assert len(r.json()["cost_objects"]) == 1
        assert r.json()["cost_objects"][0]["name"] == "B"

    def test_update_persona_not_found(self, client):
        r = client.patch("/api/personas/9999", json={"name": "X"})
        assert r.status_code == 404

    def test_delete_persona_success(self, client, db):
        p = make_persona(db, name="ToDelete")
        r = client.delete(f"/api/personas/{p.id}")
        assert r.status_code == 204

        r2 = client.get(f"/api/personas/{p.id}")
        assert r2.status_code == 404

    def test_delete_persona_not_found(self, client):
        r = client.delete("/api/personas/9999")
        assert r.status_code == 404

    def test_add_cost_object_to_persona(self, client, db):
        co = make_cost_object(db)
        p = make_persona(db)

        r = client.post(f"/api/personas/{p.id}/cost-objects/{co.id}")
        assert r.status_code == 200
        assert any(c["id"] == co.id for c in r.json()["cost_objects"])

    def test_add_cost_object_idempotent(self, client, db):
        co = make_cost_object(db)
        p = make_persona(db, cost_objects=[co])

        r = client.post(f"/api/personas/{p.id}/cost-objects/{co.id}")
        assert r.status_code == 200
        assert len(r.json()["cost_objects"]) == 1  # not duplicated

    def test_add_cost_object_persona_not_found(self, client, db):
        co = make_cost_object(db)
        r = client.post(f"/api/personas/9999/cost-objects/{co.id}")
        assert r.status_code == 404

    def test_add_cost_object_not_found(self, client, db):
        p = make_persona(db)
        r = client.post(f"/api/personas/{p.id}/cost-objects/9999")
        assert r.status_code == 404

    def test_remove_cost_object_from_persona(self, client, db):
        co = make_cost_object(db)
        p = make_persona(db, cost_objects=[co])

        r = client.delete(f"/api/personas/{p.id}/cost-objects/{co.id}")
        assert r.status_code == 200
        assert len(r.json()["cost_objects"]) == 0

    def test_remove_cost_object_persona_not_found(self, client):
        r = client.delete("/api/personas/9999/cost-objects/1")
        assert r.status_code == 404


# ── Birthright ────────────────────────────────────────────────────────────────

class TestBirthrightRouter:
    def test_add_birthright_cost_object_not_found(self, client):
        r = client.post("/api/birthright/", json={"cost_object_id": 9999})
        assert r.status_code == 404

    def test_add_birthright_duplicate(self, client, db):
        co = make_cost_object(db)
        make_birthright(db, co)

        r = client.post("/api/birthright/", json={"cost_object_id": co.id})
        assert r.status_code == 409

    def test_toggle_birthright_deactivate(self, client, db):
        co = make_cost_object(db)
        bc = make_birthright(db, co, is_active=True)

        r = client.patch(f"/api/birthright/{bc.id}", json={"is_active": False})
        assert r.status_code == 200
        assert r.json()["is_active"] is False

    def test_toggle_birthright_not_found(self, client):
        r = client.patch("/api/birthright/9999", json={"is_active": False})
        assert r.status_code == 404

    def test_delete_birthright_success(self, client, db):
        co = make_cost_object(db)
        bc = make_birthright(db, co)

        r = client.delete(f"/api/birthright/{bc.id}")
        assert r.status_code == 204

    def test_delete_birthright_not_found(self, client):
        r = client.delete("/api/birthright/9999")
        assert r.status_code == 404


# ── Reports — CostObject CRUD ─────────────────────────────────────────────────

class TestReportsCostObjects:
    def test_list_cost_objects(self, client, db):
        make_cost_object(db, name="Zoom", category=Category.SW)
        r = client.get("/api/reports/cost-objects")
        assert r.status_code == 200
        names = [co["name"] for co in r.json()]
        assert "Zoom" in names

    def test_create_cost_object(self, client):
        r = client.post("/api/reports/cost-objects", json={
            "name": "Laptop",
            "category": "HW",
            "cost": 1200.0,
            "frequency": "Annual",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "Laptop"
        assert data["annual_cost"] == 1200.0

    def test_create_cost_object_monthly_annual_cost(self, client):
        r = client.post("/api/reports/cost-objects", json={
            "name": "MDM",
            "category": "Mobile",
            "cost": 10.0,
            "frequency": "Monthly",
        })
        assert r.status_code == 201
        assert r.json()["annual_cost"] == 120.0

    def test_get_cost_object(self, client, db):
        co = make_cost_object(db, name="Teams")
        r = client.get(f"/api/reports/cost-objects/{co.id}")
        assert r.status_code == 200
        assert r.json()["name"] == "Teams"

    def test_get_cost_object_not_found(self, client):
        r = client.get("/api/reports/cost-objects/9999")
        assert r.status_code == 404

    def test_update_cost_object(self, client, db):
        co = make_cost_object(db, cost=100.0)
        r = client.patch(f"/api/reports/cost-objects/{co.id}", json={"cost": 150.0})
        assert r.status_code == 200
        assert r.json()["cost"] == 150.0

    def test_update_cost_object_not_found(self, client):
        r = client.patch("/api/reports/cost-objects/9999", json={"cost": 50.0})
        assert r.status_code == 404

    def test_delete_cost_object(self, client, db):
        co = make_cost_object(db, name="Old Item")
        r = client.delete(f"/api/reports/cost-objects/{co.id}")
        assert r.status_code == 204

        r2 = client.get(f"/api/reports/cost-objects/{co.id}")
        assert r2.status_code == 404

    def test_delete_cost_object_not_found(self, client):
        r = client.delete("/api/reports/cost-objects/9999")
        assert r.status_code == 404
