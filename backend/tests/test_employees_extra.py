"""Additional employee router tests targeting uncovered lines."""

from tests.conftest import make_cost_object, make_employee, make_persona


class TestEmployeesRouterExtra:
    def test_filter_by_department(self, client, db):
        make_employee(db, name="Alice", department="Eng")
        make_employee(db, name="Bob", email="bob@example.com", department="Finance")

        r = client.get("/api/employees/?department=Eng")
        assert r.status_code == 200
        assert all(e["department"] == "Eng" for e in r.json())
        assert len(r.json()) == 1

    def test_filter_by_persona_id(self, client, db):
        p = make_persona(db, name="Dev")
        make_employee(db, name="Alice", persona=p)
        make_employee(db, name="Bob", email="bob@example.com", persona=None)

        r = client.get(f"/api/employees/?persona_id={p.id}")
        assert r.status_code == 200
        assert len(r.json()) == 1
        assert r.json()[0]["persona_id"] == p.id

    def test_create_employee_persona_not_found(self, client):
        r = client.post("/api/employees/", json={"name": "Ghost", "persona_id": 9999})
        assert r.status_code == 404

    def test_update_employee_persona_not_found(self, client, db):
        emp = make_employee(db)
        r = client.patch(f"/api/employees/{emp.id}", json={"persona_id": 9999})
        assert r.status_code == 404

    def test_update_employee_assign_valid_persona(self, client, db):
        p = make_persona(db, name="PM")
        emp = make_employee(db)

        r = client.patch(f"/api/employees/{emp.id}", json={"persona_id": p.id})
        assert r.status_code == 200
        assert r.json()["persona_id"] == p.id


class TestPersonasDescriptionUpdate:
    def test_update_persona_description(self, client, db):
        p = make_persona(db, name="Analyst")
        r = client.patch(f"/api/personas/{p.id}", json={"description": "Data analysts"})
        assert r.status_code == 200
        assert r.json()["description"] == "Data analysts"
