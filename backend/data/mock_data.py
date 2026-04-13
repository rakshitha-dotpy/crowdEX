from datetime import datetime, timedelta
import random
from typing import List, Dict, Any, Optional

# Metropolis Locations
LOCATIONS = [
    # MALLS
    {
        "id": "loc_001",
        "name": "Express Avenue Mall",
        "type": "mall",
        "address": "Whites Road, Royapettah, Metropolis",
        "lat": 13.0604,
        "lng": 80.2627,
        "capacity": 5000
    },
    {
        "id": "loc_002",
        "name": "Phoenix MarketCity",
        "type": "mall",
        "address": "Velachery Main Road, Velachery",
        "lat": 12.9941,
        "lng": 80.2189,
        "capacity": 8000
    },
    {
        "id": "loc_003",
        "name": "VR Metropolis",
        "type": "mall",
        "address": "Jawaharlal Nehru Road, Anna Nagar",
        "lat": 13.0878,
        "lng": 80.2069,
        "capacity": 6000
    },
    {
        "id": "loc_004",
        "name": "Forum Vijaya Mall",
        "type": "mall",
        "address": "Arcot Road, Vadapalani",
        "lat": 13.0500,
        "lng": 80.2121,
        "capacity": 4000
    },
    
    # BEACHES
    {
        "id": "loc_005",
        "name": "Marina Beach",
        "type": "beach",
        "address": "Marina Beach Road, Triplicane",
        "lat": 13.0500,
        "lng": 80.2824,
        "capacity": 50000
    },
    {
        "id": "loc_006",
        "name": "Besant Nagar Beach",
        "type": "beach",
        "address": "Elliot's Beach, Besant Nagar",
        "lat": 12.9988,
        "lng": 80.2717,
        "capacity": 10000
    },
    
    # PARKS
    {
        "id": "loc_007",
        "name": "Guindy National Park",
        "type": "park",
        "address": "Guindy, Metropolis",
        "lat": 13.0067,
        "lng": 80.2206,
        "capacity": 3000
    },
    {
        "id": "loc_008",
        "name": "Semmozhi Poonga",
        "type": "park",
        "address": "Cathedral Road, Gopalapuram",
        "lat": 13.0371,
        "lng": 80.2565,
        "capacity": 2000
    },
    
    # TRANSIT
    {
        "id": "loc_009",
        "name": "Metropolis Central Station",
        "type": "transit",
        "address": "Periyamet, Metropolis",
        "lat": 13.0827,
        "lng": 80.2707,
        "capacity": 15000
    },
    {
        "id": "loc_010",
        "name": "Metropolis Egmore Station",
        "type": "transit",
        "address": "Egmore, Metropolis",
        "lat": 13.0732,
        "lng": 80.2609,
        "capacity": 10000
    },
    {
        "id": "loc_011",
        "name": "CMBT Bus Terminus",
        "type": "transit",
        "address": "Koyambedu, Metropolis",
        "lat": 13.0694,
        "lng": 80.1948,
        "capacity": 20000
    },
    
    # MARKETS
    {
        "id": "loc_012",
        "name": "T. Nagar Ranganathan Street",
        "type": "market",
        "address": "T. Nagar, Metropolis",
        "lat": 13.0418,
        "lng": 80.2341,
        "capacity": 25000
    },
    {
        "id": "loc_013",
        "name": "Pondy Bazaar",
        "type": "market",
        "address": "Thyagaraya Road, T. Nagar",
        "lat": 13.0458,
        "lng": 80.2399,
        "capacity": 15000
    },
    
    # ATTRACTIONS
    {
        "id": "loc_014",
        "name": "Government Museum",
        "type": "attraction",
        "address": "Pantheon Road, Egmore",
        "lat": 13.0694,
        "lng": 80.2566,
        "capacity": 5000
    },
    {
        "id": "loc_015",
        "name": "Valluvar Kottam",
        "type": "attraction",
        "address": "Valluvar Kottam High Road, Nungambakkam",
        "lat": 13.0499,
        "lng": 80.2422,
        "capacity": 3000
    }
]

# Crowd patterns by location type (percentage of capacity by hour)
CROWD_PATTERNS = {
    "mall": {
        "weekday": [
            0.05, 0.02, 0.02, 0.02, 0.02, 0.03,  # 00:00 - 05:00
            0.05, 0.08, 0.12, 0.20, 0.35, 0.55,  # 06:00 - 11:00
            0.70, 0.75, 0.65, 0.55, 0.50, 0.60,  # 12:00 - 17:00
            0.75, 0.85, 0.80, 0.65, 0.45, 0.20   # 18:00 - 23:00
        ],
        "weekend": [
            0.05, 0.03, 0.02, 0.02, 0.02, 0.03,
            0.05, 0.08, 0.15, 0.30, 0.50, 0.70,
            0.85, 0.90, 0.85, 0.80, 0.75, 0.80,
            0.90, 0.95, 0.85, 0.70, 0.50, 0.25
        ]
    },
    "beach": {
        "weekday": [
            0.02, 0.01, 0.01, 0.01, 0.02, 0.15,
            0.35, 0.40, 0.30, 0.20, 0.15, 0.10,
            0.08, 0.06, 0.08, 0.12, 0.25, 0.50,
            0.75, 0.85, 0.70, 0.45, 0.25, 0.10
        ],
        "weekend": [
            0.03, 0.02, 0.01, 0.02, 0.05, 0.20,
            0.45, 0.55, 0.45, 0.30, 0.20, 0.15,
            0.12, 0.10, 0.15, 0.25, 0.45, 0.70,
            0.90, 0.95, 0.80, 0.55, 0.30, 0.15
        ]
    },
    "park": {
        "weekday": [
            0.02, 0.01, 0.01, 0.01, 0.05, 0.25,
            0.45, 0.50, 0.35, 0.20, 0.15, 0.10,
            0.08, 0.06, 0.08, 0.15, 0.30, 0.45,
            0.55, 0.50, 0.35, 0.20, 0.10, 0.05
        ],
        "weekend": [
            0.02, 0.01, 0.01, 0.02, 0.08, 0.35,
            0.60, 0.65, 0.55, 0.40, 0.30, 0.25,
            0.20, 0.18, 0.20, 0.30, 0.45, 0.60,
            0.65, 0.55, 0.40, 0.25, 0.12, 0.05
        ]
    },
    "transit": {
        "weekday": [
            0.15, 0.10, 0.08, 0.08, 0.12, 0.25,
            0.50, 0.75, 0.85, 0.70, 0.50, 0.45,
            0.40, 0.35, 0.30, 0.35, 0.50, 0.70,
            0.85, 0.80, 0.65, 0.50, 0.35, 0.20
        ],
        "weekend": [
            0.12, 0.08, 0.06, 0.06, 0.10, 0.20,
            0.35, 0.50, 0.55, 0.50, 0.45, 0.40,
            0.40, 0.38, 0.35, 0.40, 0.50, 0.60,
            0.65, 0.60, 0.50, 0.40, 0.30, 0.18
        ]
    },
    "market": {
        "weekday": [
            0.02, 0.01, 0.01, 0.01, 0.02, 0.05,
            0.10, 0.20, 0.35, 0.55, 0.75, 0.85,
            0.80, 0.70, 0.60, 0.55, 0.60, 0.75,
            0.85, 0.80, 0.60, 0.40, 0.20, 0.08
        ],
        "weekend": [
            0.02, 0.01, 0.01, 0.01, 0.02, 0.05,
            0.12, 0.25, 0.45, 0.65, 0.85, 0.95,
            0.90, 0.80, 0.70, 0.65, 0.70, 0.80,
            0.85, 0.75, 0.55, 0.35, 0.18, 0.08
        ]
    },
    "attraction": {
        "weekday": [
            0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
            0.00, 0.00, 0.05, 0.20, 0.40, 0.60,
            0.70, 0.65, 0.55, 0.50, 0.55, 0.45,
            0.30, 0.15, 0.00, 0.00, 0.00, 0.00
        ],
        "weekend": [
            0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
            0.00, 0.00, 0.08, 0.30, 0.55, 0.75,
            0.85, 0.80, 0.70, 0.65, 0.60, 0.50,
            0.35, 0.18, 0.00, 0.00, 0.00, 0.00
        ]
    }
}

# In-memory storage for current state
_current_counts = {}
_trend_history = {}
_last_update_time = datetime.now()

def _get_time_multiplier(location_type: str = "mall") -> float:
    """Get crowd multiplier based on time of day and location type."""
    hour = datetime.now().hour
    is_weekend = datetime.now().weekday() >= 5
    
    pattern_key = "weekend" if is_weekend else "weekday"
    patterns = CROWD_PATTERNS.get(location_type, CROWD_PATTERNS["mall"])
    pattern = patterns.get(pattern_key, patterns["weekday"])
    
    return pattern[hour] if 0 <= hour < 24 else 0.5

def _update_counts():
    """Simulate live updates to counts."""
    global _last_update_time
    now = datetime.now()
    
    # Only update every few seconds to simulate real-time variation
    if (now - _last_update_time).total_seconds() < 5:
        return
        
    _last_update_time = now
    
    for loc in LOCATIONS:
        loc_id = loc["id"]
        capacity = loc["capacity"]
        loc_type = loc.get("type", "mall")
        
        # Base count on time pattern
        multiplier = _get_time_multiplier(loc_type)
        target_count = int(capacity * multiplier)
        
        # Add random variation (+/- 5%)
        variation = random.uniform(0.95, 1.05)
        current = _current_counts.get(loc_id, target_count)
        
        # Smooth transition to new target
        new_count = int(current * 0.9 + (target_count * variation) * 0.1)
        new_count = max(0, min(capacity, new_count))
        
        _current_counts[loc_id] = new_count
        
        # Update history
        if loc_id not in _trend_history:
            _trend_history[loc_id] = []
        _trend_history[loc_id].append(new_count)
        if len(_trend_history[loc_id]) > 20:
            _trend_history[loc_id].pop(0)

def get_crowd_level(count: int, capacity: int) -> str:
    percentage = (count / capacity) * 100
    if percentage < 30:
        return "low"
    elif percentage < 70:
        return "moderate"
    else:
        return "high"

def generate_popular_times(location_id: str) -> List[Dict]:
    """Generate popular times data (6 AM to 11 PM) for a location."""
    loc = next((l for l in LOCATIONS if l["id"] == location_id), None)
    if not loc:
        return []
    
    location_type = loc.get("type", "mall")
    is_weekend = datetime.now().weekday() >= 5
    pattern_key = "weekend" if is_weekend else "weekday"
    patterns = CROWD_PATTERNS.get(location_type, CROWD_PATTERNS["mall"])
    pattern = patterns.get(pattern_key)
    
    current_hour = datetime.now().hour
    
    times = []
    for hour in range(6, 24):  # 6 AM to 11 PM
        crowd_level = int(pattern[hour] * 100)
        times.append({
            "hour": f"{hour:02d}:00",
            "crowd_level": crowd_level,
            "label": "Now" if hour == current_hour else None
        })
    
    return times

def get_best_times(location_id: str) -> Dict:
    """Get best time to visit recommendation."""
    popular_times = generate_popular_times(location_id)
    
    # Find hours with crowd_level < 40
    quiet_hours = [t for t in popular_times if t["crowd_level"] < 40]
    peak_hours = [t for t in popular_times if t["crowd_level"] >= 70]
    
    best = {
        "recommended_window": "Early morning (6-8 AM)",
        "description": "Generally the quietest time",
        "hours": ["06:00", "07:00", "08:00"]
    }
    
    if quiet_hours:
        # Find contiguous quiet windows
        # Simplified: just use first quiet window range
        best["recommended_window"] = "Late evenings or Early mornings"
        best["hours"] = [t["hour"] for t in quiet_hours]

        if len(quiet_hours) >= 2:
             best["recommended_window"] = f"{quiet_hours[0]['hour']} - {quiet_hours[-1]['hour']}"
        elif len(quiet_hours) == 1:
             best["recommended_window"] = f"Around {quiet_hours[0]['hour']}"
    
    avoid = {
        "peak_window": "12:00 PM - 1:00 PM",
        "description": "Usually most crowded"
    }
    
    if peak_hours:
        avoid = {
            "peak_window": f"{peak_hours[0]['hour']} - {peak_hours[-1]['hour']}",
            "description": "Usually most crowded"
        }
    
    return {
        "best_times": best,
        "avoid_times": avoid
    }

def generate_hourly_data(location_id: str) -> List[Dict]:
    """Generate hourly counts for the current day."""
    loc = next((l for l in LOCATIONS if l["id"] == location_id), None)
    if not loc:
        return []
    
    location_type = loc.get("type", "mall")
    is_weekend = datetime.now().weekday() >= 5
    pattern_key = "weekend" if is_weekend else "weekday"
    patterns = CROWD_PATTERNS.get(location_type, CROWD_PATTERNS["mall"])
    pattern = patterns.get(pattern_key)
    capacity = loc["capacity"]
    
    data = []
    for hour in range(24):
        data.append({
            "hour": f"{hour:02d}:00",
            "count": int(capacity * pattern[hour])
        })
    return data

def get_all_locations() -> List[Dict[str, Any]]:
    """Get all locations with current crowd status."""
    _update_counts()
    
    locations = []
    for loc in LOCATIONS:
        loc_id = loc["id"]
        count = _current_counts.get(loc_id, int(loc["capacity"] * 0.5))
        capacity = loc["capacity"]
        
        # Calculate trend
        history = _trend_history.get(loc_id, [count])
        trend_direction = "stable"
        trend_change = 0
        if len(history) >= 2:
            try:
                change_percent = ((history[-1] - history[0]) / max(history[0], 1)) * 100
                if change_percent > 3:
                    trend_direction = "rising"
                    trend_change = int(change_percent)
                elif change_percent < -3:
                    trend_direction = "falling"
                    trend_change = int(change_percent)
            except:
                pass
        
        locations.append({
            "id": loc_id,
            "name": loc["name"],
            "type": loc.get("type", "other"),
            "address": loc.get("address", ""),
            "lat": loc.get("lat", 0),
            "lng": loc.get("lng", 0),
            "current_count": count,
            "capacity": capacity,
            "crowd_level": get_crowd_level(count, capacity),
            "crowd_percentage": int((count / capacity) * 100),
            "trend": trend_direction,
            "trend_change": trend_change,
            "last_updated": datetime.now().isoformat() + "Z",
            "recent_counts": _trend_history.get(loc_id, [count])[-5:]
        })
    
    return locations

def get_location_by_id(location_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific location with detailed stats."""
    _update_counts()
    
    loc = next((l for l in LOCATIONS if l["id"] == location_id), None)
    if not loc:
        return None
    
    count = _current_counts.get(location_id, int(loc["capacity"] * 0.5))
    capacity = loc["capacity"]
    
    # Generate hourly data
    hourly_data = generate_hourly_data(location_id)
    counts_today = [h["count"] for h in hourly_data if h["count"] > 0]
    peak_count = max(counts_today) if counts_today else 0
    # simplified peak/low hour calc
    peak_hour = 12
    low_count = 0 
    low_hour = 6
    
    if counts_today:
        peak_idx = counts_today.index(peak_count)
        # assuming counts_today starts from 00:00? No, generate_hourly_data returns 24 items
        # generate_hourly_data returns objects.
        # counts_today is just numbers.
        # But we need to know WHICH hour it was.
        # Re-calc manually
        counts_vals = [h["count"] for h in hourly_data]
        peak_count = max(counts_vals)
        peak_hour = counts_vals.index(peak_count)
        
        low_count = min(counts_vals)
        low_hour = counts_vals.index(low_count)

    
    # Get popular times and best times
    popular_times = generate_popular_times(location_id)
    times_info = get_best_times(location_id)
    
    return {
        "id": location_id,
        "name": loc["name"],
        "type": loc.get("type", "other"),
        "address": loc.get("address", ""),
        "lat": loc.get("lat", 0),
        "lng": loc.get("lng", 0),
        "current_count": count,
        "capacity": capacity,
        "crowd_level": get_crowd_level(count, capacity),
        "crowd_percentage": int((count / capacity) * 100),
        "last_updated": datetime.now().isoformat() + "Z",
        "trend": _trend_history.get(location_id, [count])[-5:],
        "today_stats": {
            "peak_count": peak_count,
            "peak_time": f"{peak_hour:02d}:30",
            "low_count": low_count,
            "low_time": f"{low_hour:02d}:00",
            "average": int(sum(counts_today) / len(counts_today)) if counts_today else 0
        },
        "popular_times": popular_times,
        "best_times": times_info["best_times"],
        "avoid_times": times_info["avoid_times"],
        "hourly_data": hourly_data
    }
