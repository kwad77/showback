"""Abstract data connector interface.

This decoupled design allows the CSV uploader to be swapped out for a
ServiceNow API connector (or any other source) without changing the router
or business logic layers.
"""

from abc import ABC, abstractmethod
from typing import Any


class DataConnector(ABC):
    """Base interface for all data ingestion sources."""

    @abstractmethod
    async def fetch_cost_objects(self, **kwargs) -> list[dict[str, Any]]:
        """Return a list of raw cost-object dicts with normalised keys:
        asset_name, category, cost, frequency, vendor, description.
        """
        ...

    @abstractmethod
    async def fetch_employees(self, **kwargs) -> list[dict[str, Any]]:
        """Return a list of raw employee dicts with normalised keys:
        name, email, department, location, persona_name.
        """
        ...

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Human-readable name for this connector (e.g. 'CSV', 'ServiceNow')."""
        ...


# ── Future connector stub (ServiceNow) ───────────────────────────────────────

class ServiceNowConnector(DataConnector):
    """Placeholder for the ServiceNow ITAM API connector.

    Replace the NotImplementedError bodies with real HTTP calls to the
    ServiceNow Table API once credentials and instance URL are available.
    """

    def __init__(self, instance_url: str, username: str, password: str):
        self.instance_url = instance_url
        self.username = username
        self.password = password

    @property
    def source_name(self) -> str:
        return "ServiceNow"

    async def fetch_cost_objects(self, **kwargs) -> list[dict[str, Any]]:
        raise NotImplementedError(
            "ServiceNow connector not yet implemented. "
            "Implement by calling: GET {instance}/api/now/table/alm_hardware"
        )

    async def fetch_employees(self, **kwargs) -> list[dict[str, Any]]:
        raise NotImplementedError(
            "ServiceNow connector not yet implemented. "
            "Implement by calling: GET {instance}/api/now/table/sys_user"
        )
