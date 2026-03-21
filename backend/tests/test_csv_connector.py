"""Unit tests for csv_connector.py — no DB required."""

import asyncio
import io
import pytest

from app.models.database import Category, Frequency
from app.models.schemas import ColumnMapping
from app.services.csv_connector import (
    CSVConnector,
    _normalise_category,
    _normalise_frequency,
    _parse_dataframe,
    parse_and_map,
)


def _run(coro):
    """Run an async coroutine synchronously (no trio required)."""
    return asyncio.get_event_loop().run_until_complete(coro)


# ── _parse_dataframe ──────────────────────────────────────────────────────────

def _csv_bytes(content: str) -> bytes:
    return content.encode()


class TestParseDataframe:
    def test_csv_parsing(self):
        data = _csv_bytes("name,cost\nAlpha,100\nBeta,200")
        df = _parse_dataframe(data, "data.csv")
        assert list(df.columns) == ["name", "cost"]
        assert len(df) == 2

    def test_csv_extension_case_insensitive(self):
        data = _csv_bytes("a,b\n1,2")
        df = _parse_dataframe(data, "DATA.CSV")
        assert len(df) == 1


# ── _normalise_category ───────────────────────────────────────────────────────

class TestNormaliseCategory:
    @pytest.mark.parametrize("raw,expected", [
        ("HW", Category.HW),
        ("hardware", Category.HW),
        ("SW", Category.SW),
        ("software", Category.SW),
        ("net", Category.Network),
        ("network", Category.Network),
        ("networking", Category.Network),
        ("mobile", Category.Mobile),
        ("  SW  ", Category.SW),   # strips whitespace
    ])
    def test_aliases(self, raw, expected):
        assert _normalise_category(raw) == expected

    def test_unknown_raises(self):
        with pytest.raises(ValueError, match="Unknown category"):
            _normalise_category("cloud")


# ── _normalise_frequency ──────────────────────────────────────────────────────

class TestNormaliseFrequency:
    @pytest.mark.parametrize("raw,expected", [
        ("monthly", Frequency.Monthly),
        ("month", Frequency.Monthly),
        ("mo", Frequency.Monthly),
        ("annual", Frequency.Annual),
        ("annually", Frequency.Annual),
        ("yearly", Frequency.Annual),
        ("year", Frequency.Annual),
        ("one-time", Frequency.OneTime),
        ("onetime", Frequency.OneTime),
        ("one time", Frequency.OneTime),
        ("once", Frequency.OneTime),
        ("  Annual  ", Frequency.Annual),
    ])
    def test_aliases(self, raw, expected):
        assert _normalise_frequency(raw) == expected

    def test_unknown_raises(self):
        with pytest.raises(ValueError, match="Unknown frequency"):
            _normalise_frequency("quarterly")


# ── CSVConnector ──────────────────────────────────────────────────────────────

def _make_mapping(**overrides) -> ColumnMapping:
    defaults = dict(
        asset_name="name",
        category="category",
        cost="cost",
        frequency="frequency",
    )
    defaults.update(overrides)
    return ColumnMapping(**defaults)


class TestCSVConnector:
    def test_source_name(self):
        connector = CSVConnector(b"", "test.csv", _make_mapping())
        assert connector.source_name == "CSV/Excel"

    def test_fetch_cost_objects_basic(self):
        csv = _csv_bytes("name,category,cost,frequency\nSlack,SW,10.0,monthly")
        connector = CSVConnector(csv, "test.csv", _make_mapping())
        records = _run(connector.fetch_cost_objects())
        assert len(records) == 1
        assert records[0]["asset_name"] == "Slack"
        assert records[0]["category"] == Category.SW
        assert records[0]["cost"] == 10.0
        assert records[0]["frequency"] == Frequency.Monthly

    def test_fetch_cost_objects_with_vendor_and_description(self):
        csv = _csv_bytes("name,category,cost,frequency,vendor,notes\nZoom,SW,15.0,monthly,Zoom Inc,Video")
        mapping = _make_mapping(vendor="vendor", description="notes")
        connector = CSVConnector(csv, "test.csv", mapping)
        records = _run(connector.fetch_cost_objects())
        assert records[0]["vendor"] == "Zoom Inc"
        assert records[0]["description"] == "Video"

    def test_fetch_cost_objects_bad_category_raises(self):
        csv = _csv_bytes("name,category,cost,frequency\nThing,CLOUD,10.0,monthly")
        connector = CSVConnector(csv, "test.csv", _make_mapping())
        with pytest.raises(ValueError):
            _run(connector.fetch_cost_objects())

    def test_fetch_employees_basic(self):
        csv = _csv_bytes("name,email,department,location,persona\nAlice,alice@x.com,Eng,NYC,Developer")
        connector = CSVConnector(csv, "test.csv", _make_mapping())
        records = _run(connector.fetch_employees())
        assert len(records) == 1
        assert records[0]["name"] == "Alice"
        assert records[0]["email"] == "alice@x.com"
        assert records[0]["department"] == "Eng"
        assert records[0]["location"] == "NYC"
        assert records[0]["persona_name"] == "Developer"

    def test_fetch_employees_missing_optional_cols(self):
        csv = _csv_bytes("name\nBob")
        connector = CSVConnector(csv, "test.csv", _make_mapping())
        records = _run(connector.fetch_employees())
        assert records[0]["name"] == "Bob"
        assert records[0]["email"] is None
        assert records[0]["persona_name"] is None


# ── parse_and_map ─────────────────────────────────────────────────────────────

class TestParseAndMap:
    def test_valid_csv(self):
        csv = _csv_bytes("name,category,cost,frequency\nSlack,SW,10.0,monthly\nLaptop,HW,1200,annual")
        mapping = _make_mapping()
        records, errors = parse_and_map(csv, "data.csv", mapping)
        assert len(records) == 2
        assert errors == []

    def test_bad_category_produces_error(self):
        csv = _csv_bytes("name,category,cost,frequency\nThing,CLOUD,10.0,monthly")
        mapping = _make_mapping()
        records, errors = parse_and_map(csv, "data.csv", mapping)
        assert records == []
        assert len(errors) == 1
        assert "Row 2" in errors[0]

    def test_bad_frequency_produces_error(self):
        csv = _csv_bytes("name,category,cost,frequency\nThing,SW,10.0,quarterly")
        mapping = _make_mapping()
        records, errors = parse_and_map(csv, "data.csv", mapping)
        assert len(errors) == 1

    def test_missing_column_produces_error(self):
        csv = _csv_bytes("name,cost,frequency\nThing,10.0,monthly")
        mapping = _make_mapping()  # expects "category" column
        records, errors = parse_and_map(csv, "data.csv", mapping)
        assert len(errors) == 1
        assert "missing column" in errors[0]

    def test_optional_vendor_description(self):
        csv = _csv_bytes("name,category,cost,frequency,vendor,notes\nZoom,SW,15.0,monthly,Zoom,Video")
        mapping = _make_mapping(vendor="vendor", description="notes")
        records, errors = parse_and_map(csv, "data.csv", mapping)
        assert records[0]["vendor"] == "Zoom"
        assert records[0]["description"] == "Video"
        assert errors == []

    def test_mixed_valid_and_invalid_rows(self):
        csv = _csv_bytes(
            "name,category,cost,frequency\n"
            "Good,SW,10.0,monthly\n"
            "Bad,CLOUD,10.0,monthly"
        )
        mapping = _make_mapping()
        records, errors = parse_and_map(csv, "data.csv", mapping)
        assert len(records) == 1
        assert len(errors) == 1
