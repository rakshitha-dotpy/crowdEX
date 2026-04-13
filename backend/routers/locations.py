from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from data.mock_data import get_all_locations, get_location_by_id

router = APIRouter(prefix="/api/locations", tags=["locations"])

@router.get("")
async def list_locations(type: Optional[str] = None):
    """
    Get list of all monitored locations with current crowd status.
    Args:
        type: Optional filter by location type
    """
    locations = get_all_locations()
    
    if type and type != "all":
        locations = [loc for loc in locations if loc.get("type").lower() == type.lower()]
    
    return {
        "locations": locations,
        "total": len(locations)
    }

@router.get("/{location_id}")
async def get_location(location_id: str):
    """Get a specific location with detailed stats."""
    location = get_location_by_id(location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@router.get("/{location_id}/history")
async def get_history(location_id: str):
    # Mock history endpoint
    location = get_location_by_id(location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"history": location["hourly_data"]}
