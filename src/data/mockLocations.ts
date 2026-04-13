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
  forceHigh?: boolean;
}

// Operating hours per location type (for logical best time calculation)
const operatingHours: Record<Location['type'], { open: number; close: number }> = {
  mall: { open: 10, close: 22 },        // 10am - 10pm
  foodcourt: { open: 10, close: 22 },   // 10am - 10pm
  park: { open: 5, close: 19 },         // 5am - 7pm
  transit: { open: 4, close: 23 },      // 4am - 11pm
  market: { open: 6, close: 21 },       // 6am - 9pm
  museum: { open: 9, close: 17 },       // 9am - 5pm
  toll: { open: 0, close: 24 },         // 24 hours
};

// Seeded pseudo-random number generator
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

// Time-based crowd patterns per type
function getTimeMultiplier(hour: number, type: Location['type'], locationId: string): number {
  const basePatterns: Record<Location['type'], Record<number, number>> = {
    mall: {
      0: 0.0, 1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0,
      6: 0.0, 7: 0.0, 8: 0.0, 9: 0.05, 10: 0.15, 11: 0.35,
      12: 0.55, 13: 0.6, 14: 0.5, 15: 0.45, 16: 0.55, 17: 0.7,
      18: 0.85, 19: 0.9, 20: 0.75, 21: 0.5, 22: 0.2, 23: 0.0
    },
    foodcourt: {
      0: 0.0, 1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0,
      6: 0.0, 7: 0.0, 8: 0.0, 9: 0.1, 10: 0.2, 11: 0.5,
      12: 0.95, 13: 0.85, 14: 0.6, 15: 0.4, 16: 0.35, 17: 0.5,
      18: 0.75, 19: 0.9, 20: 0.8, 21: 0.5, 22: 0.15, 23: 0.0
    },
    market: {
      0: 0.0, 1: 0.0, 2: 0.0, 3: 0.05, 4: 0.15, 5: 0.4,
      6: 0.7, 7: 0.85, 8: 0.75, 9: 0.6, 10: 0.5, 11: 0.45,
      12: 0.4, 13: 0.4, 14: 0.45, 15: 0.55, 16: 0.7, 17: 0.85,
      18: 0.75, 19: 0.55, 20: 0.35, 21: 0.15, 22: 0.0, 23: 0.0
    },
    transit: {
      0: 0.05, 1: 0.02, 2: 0.02, 3: 0.05, 4: 0.15, 5: 0.4,
      6: 0.7, 7: 0.9, 8: 0.95, 9: 0.75, 10: 0.5, 11: 0.4,
      12: 0.45, 13: 0.45, 14: 0.5, 15: 0.6, 16: 0.75, 17: 0.95,
      18: 0.9, 19: 0.7, 20: 0.5, 21: 0.35, 22: 0.2, 23: 0.1
    },
    park: {
      0: 0.0, 1: 0.0, 2: 0.0, 3: 0.0, 4: 0.05, 5: 0.35,
      6: 0.75, 7: 0.85, 8: 0.6, 9: 0.35, 10: 0.25, 11: 0.2,
      12: 0.15, 13: 0.15, 14: 0.2, 15: 0.3, 16: 0.55, 17: 0.8,
      18: 0.7, 19: 0.4, 20: 0.0, 21: 0.0, 22: 0.0, 23: 0.0
    },
    museum: {
      0: 0.0, 1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0,
      6: 0.0, 7: 0.0, 8: 0.0, 9: 0.15, 10: 0.35, 11: 0.6,
      12: 0.7, 13: 0.75, 14: 0.65, 15: 0.5, 16: 0.35, 17: 0.1,
      18: 0.0, 19: 0.0, 20: 0.0, 21: 0.0, 22: 0.0, 23: 0.0
    },
    toll: {
      0: 0.15, 1: 0.1, 2: 0.08, 3: 0.1, 4: 0.25, 5: 0.5,
      6: 0.75, 7: 0.9, 8: 0.85, 9: 0.7, 10: 0.55, 11: 0.5,
      12: 0.5, 13: 0.5, 14: 0.55, 15: 0.65, 16: 0.8, 17: 0.95,
      18: 0.85, 19: 0.65, 20: 0.45, 21: 0.35, 22: 0.25, 23: 0.2
    }
  };

  const pattern = basePatterns[type];
  const baseValue = pattern[hour] || 0;

  const idNum = parseInt(locationId) || locationId.charCodeAt(0);
  // Add day of week sensitivity
  const dayOfWeek = new Date().getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Seed varies by day to make sure patterns change daily
  const seed = idNum * 9973 + hour * 7919 + dayOfWeek * 1337;
  const rand = seededRandom(seed);

  // Malls/Parks are busier on weekends
  let dayMultiplier = 1.0;
  if (isWeekend) {
    if (type === 'mall' || type === 'park' || type === 'foodcourt') dayMultiplier = 1.4;
    else if (type === 'transit') dayMultiplier = 0.7; // Less work commute
  } else {
    // Weekday rush hours for transit/toll
    if ((type === 'transit' || type === 'toll') && ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20))) {
      dayMultiplier = 1.3;
    }
  }

  // Create a more realistic curve - if base value is 0 (closed/empty), ensure result is 0
  if (baseValue === 0) return 0;

  const amplitudeVariation = 0.7 + rand() * 0.6; // Increased variation
  const noise = (rand() - 0.5) * 0.35; // Increased noise significantly

  const finalValue = (baseValue * dayMultiplier * amplitudeVariation) + noise;
  return Math.max(0.00, Math.min(1.0, finalValue)); // Ensure 0-1 range
}

// Generate crowd count based on time with dynamic fluctuations
function generateCrowdCount(capacity: number, type: Location['type'], locationId: string): number {
  const now = new Date();
  const hour = now.getHours();
  const timeMultiplier = getTimeMultiplier(hour, type, locationId);

  // Dynamic real-time fluctuation (simulating live data)
  const minuteVariation = Math.sin(now.getMinutes() / 15 * Math.PI) * 0.05; // Slower wave
  const secondNoise = (Math.random() - 0.5) * 0.02;

  const idNum = parseInt(locationId) || 1;
  // Unique characteristic per location (some are consistently more popular than others of same type)
  const popularityBias = 0.8 + ((idNum * 37) % 40) / 100; // 0.8 to 1.2

  let count = Math.floor(capacity * (timeMultiplier + minuteVariation + secondNoise) * popularityBias);
  return Math.max(0, Math.min(capacity, count));
}

// Get crowd level from percentage
export function getCrowdLevel(count: number, capacity: number): { level: CrowdLevel; color: string } {
  const percentage = (count / capacity) * 100;
  if (percentage <= 30) return { level: 'low', color: '#10B981' };
  if (percentage <= 60) return { level: 'medium', color: '#F59E0B' };
  return { level: 'high', color: '#EF4444' };
}

// Generate popular times data (24 hours)
function generatePopularTimes(type: Location['type'], locationId: string) {
  return Array.from({ length: 24 }, (_, hour) => {
    const val = getTimeMultiplier(hour, type, locationId);
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      crowdLevel: Math.floor(val * 100),
      label: hour === new Date().getHours() ? "Now" : null
    };
  });
}

// Get best time to visit within operating hours
function getBestTimeToVisit(popularTimes: { hour: string; crowdLevel: number }[], type: Location['type']): string {
  const hours = operatingHours[type];
  let minLevel = 101;
  let bestHour = hours.open;

  // Find quietest hour within operating hours (leaving 1 hour buffer before close)
  for (let i = hours.open; i < hours.close - 1; i++) {
    const avg = (popularTimes[i].crowdLevel + popularTimes[i + 1].crowdLevel) / 2;
    if (avg < minLevel) {
      minLevel = avg;
      bestHour = i;
    }
  }

  const formatHour = (h: number) => {
    if (h === 0 || h === 24) return '12am';
    if (h === 12) return '12pm';
    if (h > 12) return `${h - 12}pm`;
    return `${h}am`;
  };

  const endHour = Math.min(bestHour + 2, hours.close);
  return `${formatHour(bestHour)} - ${formatHour(endHour)}`;
}

const baseLocations = [
  // ============ MALLS (12) ============
  { id: '1', name: 'Express Avenue Mall', address: 'Anna Salai, Royapettah', lat: 13.0569, lng: 80.2633, type: 'mall', capacity: 5000, distance: '2.3 km' },
  { id: '2', name: 'Phoenix MarketCity', address: 'Velachery Main Road', lat: 12.9941, lng: 80.2187, type: 'mall', capacity: 8000, distance: '5.1 km', forceHigh: true },
  { id: '3', name: 'VR Metropolis', address: 'Anna Nagar, 2nd Avenue', lat: 13.0878, lng: 80.2089, type: 'mall', capacity: 6000, distance: '4.7 km' },
  { id: '4', name: 'Spencer Plaza', address: 'Anna Salai', lat: 13.0619, lng: 80.2662, type: 'mall', capacity: 5000, distance: '1.5 km' },
  { id: '5', name: 'Palladium Mall', address: 'Velachery', lat: 12.9785, lng: 80.2201, type: 'mall', capacity: 4000, distance: '6.0 km' },
  { id: '6', name: 'Grand Square Mall', address: 'Perambur', lat: 13.1067, lng: 80.2476, type: 'mall', capacity: 3500, distance: '3.2 km' },
  { id: '7', name: 'Forum Vijaya Mall', address: 'Vadapalani', lat: 13.0501, lng: 80.2124, type: 'mall', capacity: 4500, distance: '4.5 km' },
  { id: '8', name: 'Ampa Skywalk Mall', address: 'Aminjikarai', lat: 13.0698, lng: 80.2256, type: 'mall', capacity: 3000, distance: '3.8 km' },
  { id: '9', name: 'Seasons Mall', address: 'Magrath Road', lat: 13.0456, lng: 80.2543, type: 'mall', capacity: 2500, distance: '2.1 km' },
  { id: '10', name: 'Metropolis Citi Centre', address: 'Dr. Radhakrishnan Salai', lat: 13.0537, lng: 80.2574, type: 'mall', capacity: 3500, distance: '1.8 km' },
  { id: '11', name: 'Spectrum Mall', address: 'Perungudi', lat: 12.9621, lng: 80.2463, type: 'mall', capacity: 2800, distance: '8.5 km' },
  { id: '12', name: 'EA Mall', address: 'Anna Nagar East', lat: 13.0912, lng: 80.2198, type: 'mall', capacity: 2200, distance: '5.2 km' },

  // ============ FOOD COURTS (8) ============
  { id: '13', name: 'Phoenix Mall Food Court', address: 'Velachery', lat: 12.9928, lng: 80.2173, type: 'foodcourt', capacity: 500, distance: '5.2 km' },
  { id: '14', name: 'Forum Vijaya Food Court', address: 'Vadapalani', lat: 13.0498, lng: 80.2092, type: 'foodcourt', capacity: 400, distance: '4.2 km' },
  { id: '15', name: 'Express Avenue Food Court', address: 'Royapettah', lat: 13.0572, lng: 80.2635, type: 'foodcourt', capacity: 600, distance: '2.4 km' },
  { id: '16', name: 'Saravana Stores Food Court', address: 'T. Nagar', lat: 13.0425, lng: 80.2348, type: 'foodcourt', capacity: 800, distance: '2.8 km' },
  { id: '17', name: 'VR Metropolis Food Court', address: 'Anna Nagar', lat: 13.0881, lng: 80.2091, type: 'foodcourt', capacity: 450, distance: '4.8 km' },
  { id: '18', name: 'Ampa Skywalk Food Court', address: 'Aminjikarai', lat: 13.0701, lng: 80.2258, type: 'foodcourt', capacity: 350, distance: '3.9 km' },
  { id: '19', name: 'Hot Chips Anna Nagar', address: 'Anna Nagar', lat: 13.0856, lng: 80.2102, type: 'foodcourt', capacity: 200, distance: '4.6 km' },
  { id: '20', name: 'Murugan Idli Shop', address: 'T. Nagar', lat: 13.0412, lng: 80.2356, type: 'foodcourt', capacity: 150, distance: '2.9 km' },

  // ============ PARKS (10) ============
  { id: '21', name: 'Guindy National Park', address: 'Guindy', lat: 13.0067, lng: 80.2206, type: 'park', capacity: 3000, distance: '3.4 km' },
  { id: '22', name: 'Semmozhi Poonga', address: 'Cathedral Road', lat: 13.0573, lng: 80.2583, type: 'park', capacity: 2000, distance: '1.9 km' },
  { id: '23', name: 'Tholkappia Poonga', address: 'Adyar Estuary', lat: 13.0145, lng: 80.2568, type: 'park', capacity: 2500, distance: '4.5 km' },
  { id: '24', name: 'Anna Nagar Tower Park', address: 'Anna Nagar', lat: 13.0865, lng: 80.2098, type: 'park', capacity: 1500, distance: '4.9 km' },
  { id: '25', name: 'Natesan Park', address: 'T. Nagar', lat: 13.0398, lng: 80.2412, type: 'park', capacity: 800, distance: '2.6 km' },
  { id: '26', name: 'Panagal Park', address: 'T. Nagar', lat: 13.0432, lng: 80.2328, type: 'park', capacity: 600, distance: '3.0 km' },
  { id: '27', name: 'Nungambakkam Tank Park', address: 'Nungambakkam', lat: 13.0612, lng: 80.2398, type: 'park', capacity: 1000, distance: '2.2 km' },
  { id: '28', name: 'Kotturpuram Tree Park', address: 'Kotturpuram', lat: 13.0178, lng: 80.2432, type: 'park', capacity: 1200, distance: '3.8 km' },
  { id: '29', name: 'Besant Nagar Beach Park', address: 'Besant Nagar', lat: 13.0002, lng: 80.2671, type: 'park', capacity: 5000, distance: '5.8 km' },
  { id: '30', name: 'Chetpet Eco Park', address: 'Chetpet', lat: 13.0721, lng: 80.2398, type: 'park', capacity: 900, distance: '2.0 km' },

  // ============ TRANSIT (12) ============
  { id: '31', name: 'Metropolis Central Station', address: 'Park Town', lat: 13.0827, lng: 80.2707, type: 'transit', capacity: 15000, distance: '0.9 km' },
  { id: '32', name: 'Metropolis Egmore Station', address: 'Egmore', lat: 13.0732, lng: 80.2609, type: 'transit', capacity: 10000, distance: '1.2 km' },
  { id: '33', name: 'CMBT Bus Terminus', address: 'Koyambedu', lat: 13.0694, lng: 80.1948, type: 'transit', capacity: 20000, distance: '7.8 km' },
  { id: '34', name: 'Tambaram Railway Station', address: 'Tambaram', lat: 12.9229, lng: 80.1275, type: 'transit', capacity: 8000, distance: '18.5 km' },
  { id: '35', name: 'Mambalam Railway Station', address: 'West Mambalam', lat: 13.0374, lng: 80.2198, type: 'transit', capacity: 5000, distance: '3.8 km' },
  { id: '36', name: 'Guindy Metro Station', address: 'Guindy', lat: 13.0097, lng: 80.2134, type: 'transit', capacity: 4000, distance: '3.5 km' },
  { id: '37', name: 'Alandur Metro Station', address: 'Alandur', lat: 13.0028, lng: 80.2012, type: 'transit', capacity: 3500, distance: '4.2 km' },
  { id: '38', name: 'Airport Metro Station', address: 'Meenambakkam', lat: 12.9854, lng: 80.1698, type: 'transit', capacity: 6000, distance: '10.2 km' },
  { id: '39', name: 'Vadapalani Metro', address: 'Vadapalani', lat: 13.0512, lng: 80.2123, type: 'transit', capacity: 4500, distance: '4.4 km' },
  { id: '40', name: 'Nungambakkam Metro', address: 'Nungambakkam', lat: 13.0589, lng: 80.2432, type: 'transit', capacity: 3000, distance: '2.3 km' },
  { id: '41', name: 'Teynampet Metro', address: 'Teynampet', lat: 13.0456, lng: 80.2512, type: 'transit', capacity: 3200, distance: '2.0 km' },
  { id: '42', name: 'Saidapet Metro', address: 'Saidapet', lat: 13.0234, lng: 80.2256, type: 'transit', capacity: 3800, distance: '3.2 km' },

  // ============ MARKETS (12) ============
  { id: '43', name: 'T. Nagar Ranganathan Street', address: 'T. Nagar', lat: 13.0418, lng: 80.2341, type: 'market', capacity: 25000, distance: '2.9 km' },
  { id: '44', name: 'Pondy Bazaar', address: 'T. Nagar', lat: 13.0452, lng: 80.2424, type: 'market', capacity: 15000, distance: '2.5 km' },
  { id: '45', name: 'Koyambedu Market', address: 'Koyambedu', lat: 13.0679, lng: 80.1936, type: 'market', capacity: 30000, distance: '8.0 km' },
  { id: '46', name: 'George Town Market', address: 'George Town', lat: 13.0881, lng: 80.2810, type: 'market', capacity: 20000, distance: '1.5 km' },
  { id: '47', name: 'Mylapore Tank Bazaar', address: 'Mylapore', lat: 13.0337, lng: 80.2679, type: 'market', capacity: 10000, distance: '3.6 km' },
  { id: '48', name: 'Parry Corner Market', address: 'Parry Corner', lat: 13.0867, lng: 80.2856, type: 'market', capacity: 18000, distance: '1.8 km' },
  { id: '49', name: 'Ritchie Street Electronics', address: 'Mount Road', lat: 13.0578, lng: 80.2623, type: 'market', capacity: 8000, distance: '2.1 km' },
  { id: '50', name: 'Burma Bazaar', address: 'Parrys', lat: 13.0912, lng: 80.2867, type: 'market', capacity: 12000, distance: '2.0 km' },
  { id: '51', name: 'Sowcarpet Market', address: 'Sowcarpet', lat: 13.0923, lng: 80.2798, type: 'market', capacity: 15000, distance: '1.6 km' },
  { id: '52', name: 'Thiruvanmiyur Market', address: 'Thiruvanmiyur', lat: 12.9834, lng: 80.2634, type: 'market', capacity: 6000, distance: '7.2 km' },
  { id: '53', name: 'Chromepet Market', address: 'Chromepet', lat: 12.9512, lng: 80.1423, type: 'market', capacity: 8000, distance: '14.5 km' },
  { id: '54', name: 'Ambattur Market', address: 'Ambattur', lat: 13.1145, lng: 80.1567, type: 'market', capacity: 9000, distance: '12.0 km' },

  // ============ MUSEUMS (8) ============
  { id: '55', name: 'Government Museum', address: 'Pantheon Road, Egmore', lat: 13.0695, lng: 80.2547, type: 'museum', capacity: 5000, distance: '1.3 km' },
  { id: '56', name: 'Fort St. George Museum', address: 'Fort St. George', lat: 13.0797, lng: 80.2868, type: 'museum', capacity: 3000, distance: '2.1 km' },
  { id: '57', name: 'Vivekananda House', address: 'Triplicane', lat: 13.0495, lng: 80.2798, type: 'museum', capacity: 1500, distance: '2.8 km' },
  { id: '58', name: 'Rail Museum', address: 'ICF Colony', lat: 13.0812, lng: 80.1934, type: 'museum', capacity: 2000, distance: '6.5 km' },
  { id: '59', name: 'DakshinaChitra Museum', address: 'Muttukadu', lat: 12.8234, lng: 80.2412, type: 'museum', capacity: 2500, distance: '28.0 km' },
  { id: '60', name: 'Birla Planetarium', address: 'Kotturpuram', lat: 13.0165, lng: 80.2398, type: 'museum', capacity: 800, distance: '3.9 km' },
  { id: '61', name: 'Natural History Museum', address: 'Egmore', lat: 13.0698, lng: 80.2551, type: 'museum', capacity: 1200, distance: '1.4 km' },
  { id: '62', name: 'Children Museum', address: 'Guindy', lat: 13.0089, lng: 80.2189, type: 'museum', capacity: 1000, distance: '3.6 km' },

  // ============ TOLL PLAZAS (8) ============
  { id: '63', name: 'Akkarai Toll Plaza', address: 'ECR, Akkarai', lat: 12.9038, lng: 80.2472, type: 'toll', capacity: 500, distance: '15.2 km' },
  { id: '64', name: 'Navlur Toll Plaza', address: 'OMR, Navlur', lat: 12.8364, lng: 80.2255, type: 'toll', capacity: 700, distance: '22.0 km' },
  { id: '65', name: 'Vandalur Toll Gate', address: 'GST Road', lat: 12.8857, lng: 80.0811, type: 'toll', capacity: 600, distance: '25.0 km' },
  { id: '66', name: 'Maduravoyal Toll', address: 'NH4', lat: 13.0623, lng: 80.1534, type: 'toll', capacity: 800, distance: '9.5 km' },
  { id: '67', name: 'Paranur Toll Plaza', address: 'GST Road', lat: 12.7956, lng: 80.0234, type: 'toll', capacity: 650, distance: '35.0 km' },
  { id: '68', name: 'Sriperumbudur Toll', address: 'NH4', lat: 12.9678, lng: 79.9412, type: 'toll', capacity: 750, distance: '40.0 km' },
  { id: '69', name: 'Oragadam Toll', address: 'Oragadam', lat: 12.8345, lng: 79.9867, type: 'toll', capacity: 550, distance: '45.0 km' },
  { id: '70', name: 'Perungalathur Toll', address: 'GST Road', lat: 12.9056, lng: 80.0978, type: 'toll', capacity: 480, distance: '20.0 km' },
] as const;

export const MetropolisLocations: Location[] = baseLocations.map(loc => {
  let currentCount = generateCrowdCount(loc.capacity, loc.type, loc.id);

  // Force high crowd for specific demo locations
  if ((loc as any).forceHigh) {
    currentCount = Math.floor(loc.capacity * 0.95); // 95% full
  }

  const crowdData = getCrowdLevel(currentCount, loc.capacity);
  const popularTimes = generatePopularTimes(loc.type, loc.id);

  const idNum = parseInt(loc.id);
  const trendVal = (idNum * 7) % 10;
  const trend = trendVal > 6 ? 'rising' : trendVal > 3 ? 'falling' : 'stable';

  return {
    ...loc,
    currentCount,
    crowdLevel: crowdData.level,
    trend: trend as 'rising' | 'falling' | 'stable',
    bestTime: getBestTimeToVisit(popularTimes, loc.type),
    popularTimes,
  };
});

export const getLocationTypeIcon = (type: Location['type']): string => {
  const icons: Record<Location['type'], string> = {
    mall: '🏬',
    foodcourt: '🍕',
    park: '🌳',
    transit: '🚉',
    market: '🛒',
    museum: '🏛️',
    toll: '🛣️',
  };
  return icons[type];
};

export const getCrowdLevelColor = (level: CrowdLevel) => {
  const colors = {
    low: 'hsl(160, 84%, 39%)',
    medium: 'hsl(38, 92%, 50%)',
    high: 'hsl(0, 84%, 60%)',
  };
  return colors[level];
};

export const getTrendIcon = (trend: Location['trend']): string => {
  const icons = {
    rising: '↗️',
    falling: '↘️',
    stable: '→',
  };
  return icons[trend];
};
