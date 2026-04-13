# 🎨 NovaWatch FRONTEND PROMPT: Build NovaWatch Analytics Premium UI

## Your Mission

Build a **stunning, premium frontend** for **"NovaWatch"** – a Real-Time Public Crowd Awareness System for Metropolis, India. This is a full-stack project with a **Python FastAPI backend** (built separately) that provides YOLOv8 person detection. Use mock data for normal map views an real API calls for camera/video analysis.

**Tagline:** *"Know Before You Go"*

**Core Concept:** Users can check real-time crowd levels at popular Metropolis locations (malls, parks, transit stations, markets, museums, toll plazas) on an interactive map before visiting, saving time and avoiding crowds.

---

## 🔄 TWO-MODE ARCHITECTURE

### The Auth-Based Toggle System
The app has **TWO MODES** based on user authentication:

| Mode | Who Uses It | What They See |
|------|-------------|---------------|
| **Public View** | All users (authenticated or not) | Interactive map, crowd levels, best times, transport data |
| **Admin Panel** | Authenticated admins only | Full dashboard, cameras, video upload, analytics, user management |

**Authentication Implementation:**
- **Firebase Authentication** with Google Sign-In
- Admin access requires `role: "admin"` in Firestore `users` collection
- Non-admins see Public View only
- Navbar shows login/logout button with avatar dropdown for authenticated users
- Admin toggle in navbar only visible to admin users

---

## 🎨 DESIGN SYSTEM

### Color Palette (LIGHT THEME ONLY - No Dark Mode)

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| **Primary Background** | Pure White | `#FFFFFF` | Page backgrounds |
| **Secondary/Accents** | Rich Black | `#0A0A0A` | Text, icons, toggle active state |
| **Card Background** | Frosted Glass White | `rgba(255, 255, 255, 0.7)` | All cards, modals |
| **Card Border** | Subtle White | `rgba(255, 255, 255, 0.3)` | Glassmorphism borders |
| **Low Crowd** | Emerald Green | `#10B981` | LOW status badges, map markers |
| **Medium Crowd** | Amber | `#F59E0B` | MEDIUM status badges, map markers |
| **High Crowd** | Rose Red | `#EF4444` | HIGH status badges, map markers |
| **Subtle Gray BG** | Soft Gray | `#F3F4F6` | Section backgrounds |
| **Text Primary** | Near Black | `#111827` | Headings, important text |
| **Text Secondary** | Slate Gray | `#6B7280` | Body text, descriptions |
| **Border/Dividers** | Light Gray | `#E5E7EB` | Separators, borders |
| **Map Base** | Carto Positron | - | Use Carto Positron tile layer (no API key needed) |

### Typography
- **Primary Font:** Inter (Google Fonts) - Clean, modern, highly readable
- **Font Weights:** 400 (body), 500 (medium), 600 (semibold), 700 (bold)
- **Headings:** Bold, tight letter-spacing
- **Body:** Regular weight, 1.5 line-height
- **Numbers/Stats:** Tabular figures for alignment, slightly larger

### Glassmorphism Specifications (CRITICAL!)

Every card and floating element MUST have:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}
```

### Animation Requirements (MAKE IT ALIVE!)

1. **Hover Effects:**
   - All buttons: scale(1.02), shadow lift
   - All cards: translateY(-2px), deeper shadow
   - All icons: subtle color shift or scale

2. **Loading States:**
   - Skeleton loading with shimmer animation
   - Smooth fade-in when content loads
   - Pulsing effect on live indicators

3. **Transitions:**
   - Page transitions: fade + slide (200ms)
   - Mode toggle: smooth morph (300ms)
   - Charts: animated drawing effect
   - Numbers: count-up animation when data changes

4. **Live Indicators:**
   - Pulsing dot animation for real-time data
   - Heartbeat effect on active cameras
   - Ripple effect on map markers

5. **Micro-interactions:**
   - Button press feedback
   - Input focus glow
   - Toggle switch sliding
   - Tab switching smooth scroll

---

## 📍 Metropolis LOCATION DATA (70 Locations)

### Location Types & Counts
| Type | Count | Icon |
|------|-------|------|
| **mall** | 12 | 🏬 |
| **foodcourt** | 8 | 🍕 |
| **park** | 10 | 🌳 |
| **transit** | 12 | 🚉 |
| **market** | 12 | 🛒 |
| **museum** | 8 | 🏛️ |
| **toll** | 8 | 🛣️ |

### Location Interface
```typescript
export type CrowdLevel = 'low' | 'medium' | 'high';

export interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'mall' | 'foodcourt' | 'park' | 'transit' | 'market' | 'museum' | 'toll';
  crowdLevel: CrowdLevel;
  currentCount: number;
  capacity: number;
  trend: 'rising' | 'falling' | 'stable';
  bestTime: string;
  popularTimes: { hour: string; crowdLevel: number; label: string | null }[];
  distance?: string;
  forceHigh?: boolean;  // For demo purposes - force high crowd for specific locations
}
```

### Operating Hours per Type
```typescript
const operatingHours: Record<Location['type'], { open: number; close: number }> = {
  mall: { open: 10, close: 22 },        // 10am - 10pm
  foodcourt: { open: 10, close: 22 },   // 10am - 10pm
  park: { open: 5, close: 19 },         // 5am - 7pm
  transit: { open: 4, close: 23 },      // 4am - 11pm
  market: { open: 6, close: 21 },       // 6am - 9pm
  museum: { open: 9, close: 17 },       // 9am - 5pm
  toll: { open: 0, close: 24 },         // 24 hours
};
```

### Time-Based Crowd Patterns
Each location type has unique hourly patterns that:
- Return 0 when location is closed
- Account for weekend vs weekday differences
- Include rush hour multipliers for transit/toll
- Use seeded pseudo-random for consistent variation

---

## 🚌 TRANSPORT DATA (Buses & Trains)

### Transport Page Features
Dedicated Transport page showing real-time crowd data for:

**Buses (12 routes):**
- 21G: Broadway–Tambaram
- 102: Broadway–Kelambakkam  
- 5C: Broadway–Taramani
- 29C: Perambur–Besant Nagar
- 27C: CMBT–Thiruvanmiyur
- 18: Parry Corner–Vadapalani
- 11C: T. Nagar–Adyar
- 47A: Anna Nagar–Mylapore
- 23C: Guindy–Central
- 54: Koyambedu–OMR
- 15B: Egmore–Velachery
- 70: Tambaram–T. Nagar

**Trains (6 routes):**
- MRTS: Velachery–Beach
- Metro-B: Wimco Nagar–Airport
- Suburban: Central–Arakkonam
- Metro-G: Central–Poonamallee
- EMU: Beach–Tambaram
- Express: Egmore–Trichy

### Transport Data Interface
```typescript
interface BusRoute {
  id: string;
  from: string;
  to: string;
  occupation: number;  // 0-100%
  status: 'Very High' | 'Crowded' | 'Moderate' | 'Low';
  nextBus: number;     // minutes
  trend: 'rising' | 'falling' | 'stable';
}

interface TrainRoute {
  id: string;
  route: string;
  occupation: number;
  status: string;
  nextTrain: number;
  trend: 'rising' | 'falling' | 'stable';
}
```

---

## 📱 MODE 1: PUBLIC VIEW

### Navigation Structure
- **Top Navbar (Sticky):**
  - Left: NovaWatch Logo (click to go home)
  - Center: Search bar with autocomplete
  - Right: Login/Avatar dropdown, Admin toggle (admins only)

- **Mobile Bottom Tab Bar (public routes only):**
  - 🗺️ Map (Home)
  - 🚌 Transport
  - ⏰ Best Times

### Public Routes
```typescript
<Route path="/" element={<PublicHome />} />
<Route path="/transport" element={<Transport />} />
<Route path="/best-times" element={<BestTimes />} />
<Route path="/location/:id" element={<LocationDetail />} />
```

---

### PAGE 1: Map Dashboard (HOME)

**This is the MAIN screen. Make it SPECTACULAR!**

#### Components
- **CrowdMap:** Interactive Leaflet map with custom markers
- **LocationCard:** Compact location info cards
- **FilterPills:** Horizontal scrollable type filters
- **BottomSheet/SidePanel:** Location list

#### Map Features
- Use **React-Leaflet** with Carto Positron tiles (free, no API key)
- Center on Metropolis: `[13.0827, 80.2707]`
- Default zoom: 12
- Custom animated markers that pulse based on crowd level
- Popup on marker click with quick stats
- Safety alerts overlay for high-crowd areas with warning message

#### Safety Alert System
When any location reaches HIGH crowd level:
- Red pulsing badge with warning icon
- Message: "⚠️ Safety Alert: Avoid crowded areas - Stampede risk in dense crowds"
- Quick navigation to affected locations

#### Side Panel / Bottom Sheet
- **Desktop:** Right side panel (320px width)
- **Mobile:** Draggable bottom sheet
- Filter pills for location types (horizontal scrollable)
- Location cards sorted by distance or crowd level

---

### PAGE 2: Location Detail View

**Accessed via `/location/:id`**

#### Sections
1. **Hero:** Location name, address, current crowd badge
2. **Popular Times Chart:** Bar chart like Google Maps (24 hours)
3. **Best Time to Visit:** Recommended quiet hours
4. **Quick Stats Grid:** Peak count, average, wait time estimate
5. **Actions:** Get Directions (Google Maps link), Share

---

### PAGE 3: Best Times Overview

**Planning page for all locations**

- Filter by location type
- Each card shows:
  - Popular times mini chart
  - Best time recommendation
  - Current status

---

### PAGE 4: Transport

**Real-time public transport occupancy**

- Tabs for Buses / Trains
- Each route shows: occupation %, status, next arrival, trend
- Auto-refresh every 30 seconds
- Color-coded status badges

---

## ⚙️ MODE 2: ADMIN PANEL

### Navigation Structure
**Collapsible Sidebar (Left side):**
```
┌──────────────────┐
│ NovaWatch          │
│ Admin Panel      │
├──────────────────┤
│ 📊 Dashboard     │
│ 📍 Locations     │
│ 📹 Local Camera  │
│ 🌐 Live CCTV     │
│ 📤 Video Upload  │
│ 📈 Analytics     │
│ 👥 Users         │
│ ⚙️ Settings      │
├──────────────────┤
│ ◀ Collapse       │
└──────────────────┘
```

### Admin Page Type
```typescript
type AdminPage = 'dashboard' | 'locations' | 'cameras' | 'live-cctv' | 'upload' | 'analytics' | 'users' | 'settings';
```

---

### ADMIN PAGE 1: Dashboard

**System overview at a glance**

#### Stats Cards Row (4 cards)
- Total Locations monitored
- Active Cameras online
- Average Crowd Level
- Alerts today

#### Live Activity Feed
- Real-time events (location status changes, camera events)
- Timestamped entries with status icons

#### Quick Actions Grid (Functional buttons!)
- "+ Add Location" → Navigate to Locations page
- "📤 Upload Video" → Navigate to Video Upload page
- "📹 View Cameras" → Navigate to Live CCTV page
- "📊 Generate Report" → Download analytics report

---

### ADMIN PAGE 2: Location Management

**CRUD operations for locations**

- Data table with: ID, Name, Type, Status, Capacity, Actions
- Filter and search functionality
- Add/Edit Location modal
- Delete confirmation

---

### ADMIN PAGE 3: Local Camera (Webcam)

**Local webcam integration for testing**

- Access device webcam
- Live preview with YOLO detection overlay
- Person count display
- Start/Stop controls

#### API Integration
```typescript
// WebSocket for live camera streaming
const wsUrl = `${WS_BASE_URL}/camera/stream`;
// Sends: JPEG frames + JSON detection data
```

---

### ADMIN PAGE 4: Live CCTV (RTSP/HLS Streaming)

**Connect to public cameras or custom URLs**

#### Features
- Camera grid view (2x2 or fullscreen single)
- Add custom camera via URL (RTSP, HLS, YouTube Live)
- Save/Edit/Delete custom cameras
- Real-time YOLO person detection
- Live count display with stats (avg, max, current)

#### Camera Management
```typescript
interface PublicCamera {
  id: string;
  name: string;
  location: string;
  url: string;
  type: string;  // 'crowd' | 'local' | 'custom'
  description: string;
  is_active: boolean;
  uptime: number;
}
```

#### API Endpoints
```typescript
GET  /api/rtsp/cameras           // List all cameras
POST /api/rtsp/saved             // Save new camera
PUT  /api/rtsp/saved/{id}        // Update camera
DELETE /api/rtsp/saved/{id}      // Delete camera
WS   /ws/rtsp/stream/{camera_id} // Live stream with detection
```

---

### ADMIN PAGE 5: Video Upload & Analysis

**Upload videos for crowd analysis**

#### Upload Zone
- Drag-and-drop or click to browse
- Supported formats: MP4, AVI, MOV
- Max size: 500MB

#### Processing Speed Control
- Frame skip slider (1-60)
- Speed labels: Detailed (1-5), Normal (10-20), Fast (30-50), Quick Scan (60)

#### Progress Display
- Progress bar with percentage
- Live preview of current frame being analyzed
- Real-time person count
- Stats: avg, peak, min counts

#### Results
- Final statistics display
- Download JSON report button
- Timeline per second data

#### API Integration
```typescript
// Upload video with frame skip parameter
POST /api/upload/video?frame_skip={n}

// WebSocket for processing progress
WS /ws/upload/{file_id}/progress
// Receives: status, progress, preview_frame (base64), counts, etc.
```

---

### ADMIN PAGE 6: Analytics Dashboard

**Historical data and insights**

#### Features
- Date range picker (Today, Yesterday, 7 Days, 30 Days, Custom)
- Line chart: Crowd trends over time
- Bar chart: Daily averages comparison
- Heatmap: Weekly patterns (days × hours)
- Insights cards (busiest location, quietest time)

---

### ADMIN PAGE 7: Users

**User management (Firestore-based)**

- List all users from Firestore `users` collection
- Display: email, displayName, role, createdAt
- Role toggle: user/admin
- Search and filter

---

### ADMIN PAGE 8: Settings

**System configuration**

#### Sections
1. **Crowd Thresholds** - LOW/MEDIUM/HIGH percentage cutoffs
2. **Notifications** - Alert settings
3. **API Configuration** - Backend URL display
4. **Data Management** - Clear cache, export data

---

## 📐 RESPONSIVE LAYOUT STRUCTURE

### Desktop Layout (≥1024px)
```
PUBLIC VIEW:
┌─────────────────────────────────────────────────────────────┐
│ NAVBAR: Logo | Search | Login/Avatar                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┬───────────────────┐   │
│  │                                 │                   │   │
│  │      INTERACTIVE MAP            │   LOCATION LIST   │   │
│  │        (70% width)              │    SIDE PANEL     │   │
│  │                                 │    (30% width)    │   │
│  └─────────────────────────────────┴───────────────────┘   │
└─────────────────────────────────────────────────────────────┘

ADMIN VIEW:
┌─────────────────────────────────────────────────────────────┐
│ NAVBAR: Logo | Search | Avatar                               │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ SIDEBAR  │           MAIN CONTENT AREA                      │
│  NAV     │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Mobile Layout (<768px)
- Public: Full-screen map with draggable bottom sheet, bottom tab bar
- Admin: Full-width content, hidden sidebar (hamburger menu)

---

## 🧩 COMPONENT LIBRARY

### Core Components Built
1. **CrowdBadge** - Status badge (LOW/MEDIUM/HIGH with colors)
2. **CrowdMap** - Interactive Leaflet map with markers
3. **MapDashboard** - Full map dashboard with filters
4. **LocationCard** - Card for location list
5. **LocationTypeIcon** - Icon + label for each type
6. **PopularTimesChart** - Bar chart like Google Maps
7. **ModeToggle** - Admin mode switch
8. **Navbar** - Top navigation with auth
9. **NavLink** - Active-aware navigation links

### UI Components (shadcn/ui based)
- Avatar, Badge, Button, Card, Dialog, Dropdown, Input
- Progress, ScrollArea, Select, Slider, Switch, Tabs, Toast
- Tooltip, Sheet, Skeleton, etc.

---

## 🔧 TECHNICAL STACK

### Framework & Libraries
- **React 18+** with TypeScript
- **Vite** for build tooling
- **React Router v6** for navigation
- **React-Leaflet** for maps (Carto Positron tiles - free)
- **Recharts** for charts
- **Framer Motion** for animations
- **Lucide React** for icons
- **TanStack Query** for data fetching
- **Firebase** for authentication
- **Tailwind CSS** with shadcn/ui components

### Authentication
- Firebase Authentication with Google provider
- Firestore for user profiles and roles
- Protected admin routes

### State Management
- React Context for Auth
- React Query for server state
- Component state for UI

### API Configuration
```typescript
// Environment-based API URL
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const API_BASE_URL = `${BASE_URL}/api`;
export const WS_BASE_URL = `${BASE_URL.replace(/^http/, "ws")}/ws`;
```

---

## ✅ QUALITY CHECKLIST

- [x] Glassmorphism applied to all cards and floating elements
- [x] All interactive elements have smooth hover states
- [x] Numbers animate when they change (CountUp)
- [x] Loading states have skeleton/shimmer effects
- [x] Page transitions are smooth (Framer Motion)
- [x] Admin access is role-protected
- [x] Map markers pulse based on crowd status
- [x] Charts are interactive with tooltips
- [x] Mobile experience is polished (bottom sheets, gestures)
- [x] All icons are consistent (Lucide)
- [x] Typography hierarchy is clear
- [x] Colors match design system
- [x] Popular Times chart resembles Google Maps
- [x] Firebase auth with Google sign-in working
- [x] Real YOLO detection in camera/video features

---

## 🎯 KEY DIFFERENTIATORS

1. **70 Metropolis Locations** across 7 categories (not just 15)
2. **Transport Page** with bus & train real-time data
3. **Firebase Authentication** with role-based access
4. **Real YOLO Detection** via Python backend
5. **Live CCTV Integration** supporting RTSP, HLS, YouTube Live
6. **Safety Alerts** for high-crowd areas
7. **Frame Skip Control** for video processing speed
8. **User Management** in admin panel

---

**BUILD THIS. Make it stunning. Make it premium. Make it WOW.** 🚀

---

*Document updated: January 31, 2026*
*Reflects current production codebase*
