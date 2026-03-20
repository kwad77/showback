"""CSV / Excel data connector.

Handles file parsing and column-mapping so that the ingestion layer is
completely decoupled from the router.  The column_mapping dict translates
user-supplied column names into the normalised internal schema.
"""

import io
from typing import Any

import pandas as pd

from app.models.database import Category, Frequency
from app.models.schemas import ColumnMapping
from app.services.data_connector import DataConnector


CATEGORY_ALIASES: dict[str, Category] = {
    "hw": Category.HW,
    "hardware": Category.HW,
    "sw": Category.SW,
    "software": Category.SW,
    "net": Category.Network,
    "network": Category.Network,
    "networking": Category.Network,
    "mobile": Category.Mobile,
}

FREQUENCY_ALIASES: dict[str, Frequency] = {
    "monthly": Frequency.Monthly,
    "month": Frequency.Monthly,
    "mo": Frequency.Monthly,
    "annual": Frequency.Annual,
    "annually": Frequency.Annual,
    "yearly": Frequency.Annual,
    "year": Frequency.Annual,
    "one-time": Frequency.OneTime,
    "onetime": Frequency.OneTime,
    "one time": Frequency.OneTime,
    "once": Frequency.OneTime,
}


def _parse_dataframe(content: bytes, filename: str) -> pd.DataFrame:
    """Return a DataFrame from CSV or Excel bytes."""
    if filename.lower().endswith((".xlsx", ".xls")):
        return pd.read_excel(io.BytesIO(content))
    return pd.read_csv(io.BytesIO(content))


def _normalise_category(raw: str) -> Category:
    key = str(raw).strip().lower()
    if key in CATEGORY_ALIASES:
        return CATEGORY_ALIASES[key]
    raise ValueError(f"Unknown category value: '{raw}'")


def _normalise_frequency(raw: str) -> Frequency:
    key = str(raw).strip().lower()
    if key in FREQUENCY_ALIASES:
        return FREQUENCY_ALIASES[key]
    raise ValueError(f"Unknown frequency value: '{raw}'")


class CSVConnector(DataConnector):
    """Ingests cost objects and employees from an uploaded CSV/Excel file."""

    def __init__(self, content: bytes, filename: str, column_mapping: ColumnMapping):
        self._content = content
        self._filename = filename
        self._mapping = column_mapping

    @property
    def source_name(self) -> str:
        return "CSV/Excel"

    async def fetch_cost_objects(self, **kwargs) -> list[dict[str, Any]]:
        df = _parse_dataframe(self._content, self._filename)
        m = self._mapping
        records: list[dict[str, Any]] = []

        for _, row in df.iterrows():
            try:
                record: dict[str, Any] = {
                    "asset_name": str(row[m.asset_name]).strip(),
                    "category": _normalise_category(row[m.category]),
                    "cost": float(row[m.cost]),
                    "frequency": _normalise_frequency(row[m.frequency]),
                    "vendor": str(row[m.vendor]).strip() if m.vendor and m.vendor in df.columns else None,
                    "description": str(row[m.description]).strip() if m.description and m.description in df.columns else None,
                }
                records.append(record)
            except (KeyError, ValueError):
                # Caller collects errors separately
                raise

        return records

    async def fetch_employees(self, **kwargs) -> list[dict[str, Any]]:
        # Employee upload uses a separate simpler format
        df = _parse_dataframe(self._content, self._filename)
        records: list[dict[str, Any]] = []
        for _, row in df.iterrows():
            records.append({
                "name": str(row.get("name", "")).strip(),
                "email": str(row.get("email", "")).strip() or None,
                "department": str(row.get("department", "")).strip() or None,
                "location": str(row.get("location", "")).strip() or None,
                "persona_name": str(row.get("persona", "")).strip() or None,
            })
        return records


def parse_and_map(
    content: bytes,
    filename: str,
    mapping: ColumnMapping,
) -> tuple[list[dict[str, Any]], list[str]]:
    """Top-level helper used by the upload router.

    Returns (records, errors) where errors contains row-level failure messages.
    """
    df = _parse_dataframe(content, filename)
    m = mapping
    records: list[dict[str, Any]] = []
    errors: list[str] = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2  # 1-indexed, +1 for header
        try:
            records.append({
                "asset_name": str(row[m.asset_name]).strip(),
                "category": _normalise_category(row[m.category]),
                "cost": float(row[m.cost]),
                "frequency": _normalise_frequency(row[m.frequency]),
                "vendor": str(row[m.vendor]).strip() if m.vendor and m.vendor in df.columns else None,
                "description": str(row[m.description]).strip() if m.description and m.description in df.columns else None,
            })
        except KeyError as e:
            errors.append(f"Row {row_num}: missing column {e}")
        except ValueError as e:
            errors.append(f"Row {row_num}: {e}")

    return records, errors
