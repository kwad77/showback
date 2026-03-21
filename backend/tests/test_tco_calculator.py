"""Tests for the TCO calculation engine."""

import pytest

from app.models.database import Category, Frequency
from app.services.tco_calculator import (
    _outlier_annual,
    _persona_annual,
    _to_annual,
    build_tco_summary,
    calculate_employee_tco,
)
from tests.conftest import (
    make_birthright,
    make_cost_object,
    make_employee,
    make_outlier,
    make_persona,
)


# ── _to_annual ────────────────────────────────────────────────────────────────

class TestToAnnual:
    def test_monthly_multiplies_by_12(self):
        assert _to_annual(100.0, Frequency.Monthly) == 1200.0

    def test_annual_unchanged(self):
        assert _to_annual(500.0, Frequency.Annual) == 500.0

    def test_one_time_unchanged(self):
        assert _to_annual(999.0, Frequency.OneTime) == 999.0

    def test_zero_cost(self):
        assert _to_annual(0.0, Frequency.Monthly) == 0.0


# ── _persona_annual ───────────────────────────────────────────────────────────

class TestPersonaAnnual:
    def test_no_persona_returns_zero(self, db):
        emp = make_employee(db, persona=None)
        # reload with relationships
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        assert _persona_annual(emp) == 0.0

    def test_single_annual_cost_object(self, db):
        co = make_cost_object(db, cost=300.0, frequency=Frequency.Annual)
        persona = make_persona(db, cost_objects=[co])
        emp = make_employee(db, persona=persona)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        assert _persona_annual(emp) == 300.0

    def test_monthly_cost_object_annualised(self, db):
        co = make_cost_object(db, cost=50.0, frequency=Frequency.Monthly)
        persona = make_persona(db, cost_objects=[co])
        emp = make_employee(db, persona=persona)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        assert _persona_annual(emp) == 600.0

    def test_multiple_cost_objects_summed(self, db):
        co1 = make_cost_object(db, name="A", cost=100.0, frequency=Frequency.Annual)
        co2 = make_cost_object(db, name="B", cost=10.0, frequency=Frequency.Monthly)
        persona = make_persona(db, cost_objects=[co1, co2])
        emp = make_employee(db, persona=persona)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        assert _persona_annual(emp) == 100.0 + 120.0


# ── _outlier_annual ───────────────────────────────────────────────────────────

class TestOutlierAnnual:
    def test_no_outliers_returns_zero(self, db):
        emp = make_employee(db)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        assert _outlier_annual(emp) == 0.0

    def test_active_outlier_counted(self, db):
        co = make_cost_object(db, cost=200.0, frequency=Frequency.Annual)
        emp = make_employee(db)
        make_outlier(db, emp, co, is_active=True)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        assert _outlier_annual(emp) == 200.0

    def test_inactive_outlier_excluded(self, db):
        co = make_cost_object(db, cost=200.0, frequency=Frequency.Annual)
        emp = make_employee(db)
        make_outlier(db, emp, co, is_active=False)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        assert _outlier_annual(emp) == 0.0

    def test_mixed_active_inactive(self, db):
        co_active = make_cost_object(db, name="Active", cost=100.0, frequency=Frequency.Annual)
        co_inactive = make_cost_object(db, name="Inactive", cost=999.0, frequency=Frequency.Annual)
        emp = make_employee(db)
        make_outlier(db, emp, co_active, is_active=True)
        make_outlier(db, emp, co_inactive, is_active=False)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        assert _outlier_annual(emp) == 100.0

    def test_monthly_outlier_annualised(self, db):
        co = make_cost_object(db, cost=25.0, frequency=Frequency.Monthly)
        emp = make_employee(db)
        make_outlier(db, emp, co)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        assert _outlier_annual(emp) == 300.0


# ── calculate_employee_tco ────────────────────────────────────────────────────

class TestCalculateEmployeeTCO:
    def test_unassigned_persona_name(self, db):
        emp = make_employee(db, persona=None)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        result = calculate_employee_tco(emp, birthright_amt=0.0)
        assert result.persona_name == "Unassigned"

    def test_persona_name_set(self, db):
        persona = make_persona(db, name="DevOps")
        emp = make_employee(db, persona=persona)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        result = calculate_employee_tco(emp, birthright_amt=0.0)
        assert result.persona_name == "DevOps"

    def test_total_is_sum_of_three_layers(self, db):
        co_persona = make_cost_object(db, name="Persona SW", cost=400.0, frequency=Frequency.Annual)
        co_outlier = make_cost_object(db, name="Outlier HW", cost=100.0, frequency=Frequency.Annual)
        persona = make_persona(db, cost_objects=[co_persona])
        emp = make_employee(db, persona=persona)
        make_outlier(db, emp, co_outlier)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()

        birthright = 200.0
        result = calculate_employee_tco(emp, birthright_amt=birthright)

        assert result.birthright_annual == 200.0
        assert result.persona_annual == 400.0
        assert result.outlier_annual == 100.0
        assert result.total_annual == 700.0

    def test_rounding_to_two_decimal_places(self, db):
        emp = make_employee(db, persona=None)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        result = calculate_employee_tco(emp, birthright_amt=1.005)
        assert result.birthright_annual == round(1.005, 2)

    def test_zero_birthright(self, db):
        emp = make_employee(db, persona=None)
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        result = calculate_employee_tco(emp, birthright_amt=0.0)
        assert result.total_annual == 0.0

    def test_department_propagated(self, db):
        emp = make_employee(db, department="Finance")
        from app.models.database import Employee
        emp = db.query(Employee).filter(Employee.id == emp.id).first()
        result = calculate_employee_tco(emp, birthright_amt=0.0)
        assert result.department == "Finance"


# ── build_tco_summary ─────────────────────────────────────────────────────────

class TestBuildTCOSummary:
    def test_empty_db_returns_zero_totals(self, db):
        summary = build_tco_summary(db)
        assert summary.total_employees == 0
        assert summary.total_annual_tco == 0.0
        assert summary.avg_tco_per_employee == 0
        assert summary.by_domain == []
        assert summary.by_persona == []

    def test_single_employee_no_persona(self, db):
        co = make_cost_object(db, cost=120.0, frequency=Frequency.Monthly)
        make_birthright(db, co)
        make_employee(db, name="Bob", persona=None)

        summary = build_tco_summary(db)

        assert summary.total_employees == 1
        assert summary.birthright_total == 1440.0  # 120 × 12
        assert summary.total_annual_tco == 1440.0

    def test_birthright_applied_to_all_employees(self, db):
        co = make_cost_object(db, cost=100.0, frequency=Frequency.Annual)
        make_birthright(db, co)
        make_employee(db, name="Alice")
        make_employee(db, name="Bob", email="bob@example.com")

        summary = build_tco_summary(db)

        assert summary.total_employees == 2
        assert summary.birthright_total == 200.0

    def test_inactive_birthright_excluded(self, db):
        co = make_cost_object(db, cost=500.0, frequency=Frequency.Annual)
        make_birthright(db, co, is_active=False)
        make_employee(db)

        summary = build_tco_summary(db)

        assert summary.birthright_total == 0.0

    def test_persona_total_across_employees(self, db):
        co = make_cost_object(db, cost=200.0, frequency=Frequency.Annual, category=Category.SW)
        persona = make_persona(db, cost_objects=[co])
        make_employee(db, name="Alice", persona=persona)
        make_employee(db, name="Bob", email="bob@example.com", persona=persona)

        summary = build_tco_summary(db)

        assert summary.persona_total == 400.0

    def test_outlier_total(self, db):
        co = make_cost_object(db, cost=150.0, frequency=Frequency.Annual)
        emp = make_employee(db)
        make_outlier(db, emp, co)

        summary = build_tco_summary(db)

        assert summary.outlier_total == 150.0

    def test_by_domain_groups_employees(self, db):
        make_employee(db, name="A", department="Eng")
        make_employee(db, name="B", email="b@example.com", department="Eng")
        make_employee(db, name="C", email="c@example.com", department="Finance")

        summary = build_tco_summary(db)

        domains = {d.department: d for d in summary.by_domain}
        assert domains["Eng"].employee_count == 2
        assert domains["Finance"].employee_count == 1

    def test_by_domain_avg_per_employee(self, db):
        co = make_cost_object(db, cost=100.0, frequency=Frequency.Annual)
        make_birthright(db, co)
        make_employee(db, name="A", department="X")
        make_employee(db, name="B", email="b@example.com", department="X")

        summary = build_tco_summary(db)

        dept = summary.by_domain[0]
        assert dept.avg_per_employee == 100.0

    def test_by_persona_unassigned_bucket(self, db):
        make_employee(db, persona=None)

        summary = build_tco_summary(db)

        personas = {p.persona_name: p for p in summary.by_persona}
        assert "Unassigned" in personas

    def test_by_category_percentages_sum_to_100(self, db):
        co_sw = make_cost_object(db, name="SW", cost=300.0, frequency=Frequency.Annual, category=Category.SW)
        co_hw = make_cost_object(db, name="HW", cost=100.0, frequency=Frequency.Annual, category=Category.HW)
        make_birthright(db, co_sw)
        make_birthright(db, co_hw)
        make_employee(db)

        summary = build_tco_summary(db)

        total_pct = sum(c.percentage for c in summary.by_category)
        assert abs(total_pct - 100.0) < 0.2  # allow rounding slop

    def test_employee_without_department_falls_into_unknown(self, db):
        make_employee(db, department=None)

        summary = build_tco_summary(db)

        domains = {d.department for d in summary.by_domain}
        assert "Unknown" in domains

    def test_avg_tco_per_employee_calculated(self, db):
        co = make_cost_object(db, cost=600.0, frequency=Frequency.Annual)
        make_birthright(db, co)
        make_employee(db, name="A")
        make_employee(db, name="B", email="b@example.com")

        summary = build_tco_summary(db)

        assert summary.avg_tco_per_employee == 600.0
