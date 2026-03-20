"""TCO calculation engine.

Formula:
    Total Annual Cost = Birthright + Persona_Base + Outliers

All costs are normalised to annual values before summing.
"""

from collections import defaultdict
from typing import Optional

from sqlalchemy.orm import Session

from app.models.database import BirthrightCost, Employee, Frequency, OutlierAdjustment
from app.models.schemas import (
    CategoryBreakdown,
    DomainBreakdown,
    EmployeeTCO,
    PersonaBreakdown,
    TCOSummary,
)


def _to_annual(cost: float, frequency: Frequency) -> float:
    if frequency == Frequency.Monthly:
        return cost * 12
    return cost  # Annual or One-time


def _birthright_annual(db: Session) -> float:
    entries: list[BirthrightCost] = (
        db.query(BirthrightCost).filter(BirthrightCost.is_active == True).all()  # noqa: E712
    )
    return sum(_to_annual(e.cost_object.cost, e.cost_object.frequency) for e in entries)


def _persona_annual(employee: Employee) -> float:
    if not employee.persona:
        return 0.0
    return sum(
        _to_annual(co.cost, co.frequency)
        for co in employee.persona.cost_objects
    )


def _outlier_annual(employee: Employee) -> float:
    return sum(
        _to_annual(o.cost_object.cost, o.cost_object.frequency)
        for o in employee.outliers
        if o.is_active
    )


def calculate_employee_tco(employee: Employee, birthright_amt: float) -> EmployeeTCO:
    p_cost = _persona_annual(employee)
    o_cost = _outlier_annual(employee)
    return EmployeeTCO(
        employee_id=employee.id,
        employee_name=employee.name,
        department=employee.department,
        persona_name=employee.persona.name if employee.persona else "Unassigned",
        birthright_annual=round(birthright_amt, 2),
        persona_annual=round(p_cost, 2),
        outlier_annual=round(o_cost, 2),
        total_annual=round(birthright_amt + p_cost + o_cost, 2),
    )


def build_tco_summary(db: Session) -> TCOSummary:
    employees: list[Employee] = db.query(Employee).all()
    birthright_amt = _birthright_annual(db)

    details: list[EmployeeTCO] = [
        calculate_employee_tco(emp, birthright_amt) for emp in employees
    ]

    total_tco = sum(d.total_annual for d in details)
    total_employees = len(details)

    # ── By Domain ─────────────────────────────────────────────────────────────
    domain_map: dict[str, list[EmployeeTCO]] = defaultdict(list)
    for d in details:
        domain_map[d.department or "Unknown"].append(d)

    by_domain = [
        DomainBreakdown(
            department=dept,
            employee_count=len(emps),
            total_annual=round(sum(e.total_annual for e in emps), 2),
            avg_per_employee=round(sum(e.total_annual for e in emps) / len(emps), 2),
        )
        for dept, emps in sorted(domain_map.items())
    ]

    # ── By Persona ────────────────────────────────────────────────────────────
    persona_map: dict[str, list[EmployeeTCO]] = defaultdict(list)
    persona_ids: dict[str, Optional[int]] = {}
    for emp, d in zip(employees, details):
        key = d.persona_name or "Unassigned"
        persona_map[key].append(d)
        persona_ids[key] = emp.persona_id

    by_persona = [
        PersonaBreakdown(
            persona_id=persona_ids[pname],
            persona_name=pname,
            employee_count=len(emps),
            total_annual=round(sum(e.total_annual for e in emps), 2),
            avg_per_employee=round(sum(e.total_annual for e in emps) / len(emps), 2),
        )
        for pname, emps in sorted(persona_map.items())
    ]

    # ── By Category ───────────────────────────────────────────────────────────
    from app.models.database import BirthrightCost as BC, Persona  # noqa: F811

    category_totals: dict[str, float] = defaultdict(float)

    # Birthright costs (applied × employee count)
    for bc in db.query(BC).filter(BC.is_active == True).all():  # noqa: E712
        cat = bc.cost_object.category.value
        category_totals[cat] += _to_annual(bc.cost_object.cost, bc.cost_object.frequency) * total_employees

    # Persona costs
    for emp, d in zip(employees, details):
        if emp.persona:
            for co in emp.persona.cost_objects:
                category_totals[co.category.value] += _to_annual(co.cost, co.frequency)

    # Outlier costs
    for emp in employees:
        for o in emp.outliers:
            if o.is_active:
                category_totals[o.cost_object.category.value] += _to_annual(
                    o.cost_object.cost, o.cost_object.frequency
                )

    grand = sum(category_totals.values()) or 1  # avoid /0
    by_category = [
        CategoryBreakdown(
            category=cat,
            total_annual=round(amt, 2),
            percentage=round(amt / grand * 100, 1),
        )
        for cat, amt in sorted(category_totals.items(), key=lambda x: -x[1])
    ]

    return TCOSummary(
        total_employees=total_employees,
        total_annual_tco=round(total_tco, 2),
        avg_tco_per_employee=round(total_tco / total_employees, 2) if total_employees else 0,
        birthright_total=round(birthright_amt * total_employees, 2),
        persona_total=round(sum(d.persona_annual for d in details), 2),
        outlier_total=round(sum(d.outlier_annual for d in details), 2),
        by_domain=by_domain,
        by_persona=by_persona,
        by_category=by_category,
        employee_details=details,
    )
