"""Tests for the DataConnector abstract base and ServiceNowConnector stub."""

import asyncio
import pytest

from app.services.data_connector import ServiceNowConnector


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


class TestServiceNowConnector:
    def _make(self) -> ServiceNowConnector:
        return ServiceNowConnector(
            instance_url="https://example.service-now.com",
            username="admin",
            password="secret",
        )

    def test_init_stores_credentials(self):
        c = self._make()
        assert c.instance_url == "https://example.service-now.com"
        assert c.username == "admin"
        assert c.password == "secret"

    def test_source_name(self):
        assert self._make().source_name == "ServiceNow"

    def test_fetch_cost_objects_raises(self):
        with pytest.raises(NotImplementedError):
            _run(self._make().fetch_cost_objects())

    def test_fetch_employees_raises(self):
        with pytest.raises(NotImplementedError):
            _run(self._make().fetch_employees())
