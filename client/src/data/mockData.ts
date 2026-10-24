import { RestaurantProfile, MenuItem } from '../types/index.js';

export const DEMO_RESTAURANT: RestaurantProfile = {
  id: 'rest-demo-001',
  name: 'Osteria Della Spina',
  slug: 'osteria-della-spina',
  tagline: 'Artisanal Italian Trattoria & Wood-Fired Kitchen',
  description:
    'Dedicated to transparent culinary craft, fresh daily pasta, and verifiable temperature logs at every stage of preparation.',
  address: '42 Corso Venezia, Central District, Branch 01',
  phone: '+1 (555) 019-4820',
  rating: 4.8,
  hygieneScore: 'Grade A (5/5) Clean Kitchen',
  lastInspectionDate: 'Demo Verification - Oct 2026',
  officialLicense: 'DEMO-REG-2026-904',
  logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
  bannerUrl:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  openingHours: 'Tue – Sun: 12:00 PM – 10:30 PM (Mon Closed)',
  activeIncidentsCount: 0,
  resolvedComplaintsRate: '100% within 24h',
};

export const MENU_CATEGORIES = [
  'All Dishes',
  'Chef Specials',
  'Handmade Pasta',
  'Wood-Fired Mains',
  'Antipasti',
  'Desserts & Wine',
];

export const DEMO_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-01',
    name: 'Truffle Tagliolini al Burro',
    description:
      'Hand-rolled egg pasta with black winter truffle butter, 30-month aged Parmigiano Reggiano, and cold-pressed olive oil.',
    price: 24.5,
    category: 'Handmade Pasta',
    imageUrl:
      'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=800&q=80',
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    dietaryTags: ['Vegetarian'],
    prepTemperature: 'Cooked to 85°C (Safety Min: 75°C)',
    temperatureLoggedAt: '35 mins ago',
    isPopular: true,
  },
  {
    id: 'item-02',
    name: 'Slow-Braised Osso Buco',
    description:
      'Cross-cut veal shank braised with San Marzano tomatoes, white wine, and aromatic herbs, served over saffron risotto.',
    price: 34.0,
    category: 'Wood-Fired Mains',
    imageUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    allergens: ['Celery', 'Sulphites'],
    dietaryTags: ['Gluten-Free'],
    prepTemperature: 'Simmered at 92°C (Safety Min: 75°C)',
    temperatureLoggedAt: '12 mins ago',
    isPopular: true,
  },
  {
    id: 'item-03',
    name: 'Burrata Pugliese & Heirloom Tomato',
    description:
      'Creamy hand-tied burrata pugliese with multi-coloured heirloom tomatoes, wild arugula, and aged balsamic glaze.',
    price: 18.0,
    category: 'Antipasti',
    imageUrl:
      'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=800&q=80',
    allergens: ['Dairy'],
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    prepTemperature: 'Chilled display 3.2°C (Max: 4.0°C)',
    temperatureLoggedAt: '18 mins ago',
    isPopular: false,
  },
  {
    id: 'item-04',
    name: 'Wood-Fired Margherita D.O.P.',
    description:
      'Naturally leavened 48-hour sourdough, San Marzano D.O.P. tomato sauce, buffalo mozzarella, fresh basil, and extra virgin olive oil.',
    price: 19.5,
    category: 'Chef Specials',
    imageUrl:
      'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
    allergens: ['Gluten', 'Dairy'],
    dietaryTags: ['Vegetarian'],
    prepTemperature: 'Wood-oven fired at 430°C',
    temperatureLoggedAt: '5 mins ago',
    isPopular: true,
  },
  {
    id: 'item-05',
    name: 'Classic Espresso Tiramisù',
    description:
      'Savoiardi ladyfingers soaked in dark roast espresso and Marsala wine, layered with whipped mascarpone cream and Valrhona cocoa.',
    price: 12.0,
    category: 'Desserts & Wine',
    imageUrl:
      'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    dietaryTags: ['Vegetarian'],
    prepTemperature: 'Refrigerated cold storage at 2.8°C',
    temperatureLoggedAt: '42 mins ago',
    isPopular: false,
  },
];

export const DEMO_CCP_LOGS = [
  {
    id: 'ccp-101',
    equipment: 'Main Walk-In Refrigerator',
    target: '0.0°C – 4.0°C',
    currentTemp: '2.4°C',
    status: 'pass' as const,
    timestamp: '15 mins ago',
    loggedBy: 'Chef Marco S.',
  },
  {
    id: 'ccp-102',
    equipment: 'Seafood Blast Chiller',
    target: '-20.0°C – -18.0°C',
    currentTemp: '-19.2°C',
    status: 'pass' as const,
    timestamp: '32 mins ago',
    loggedBy: 'Sous Chef Elena R.',
  },
  {
    id: 'ccp-103',
    equipment: 'Hot Holding Station (Sauces)',
    target: 'Min 63.0°C',
    currentTemp: '68.5°C',
    status: 'pass' as const,
    timestamp: '8 mins ago',
    loggedBy: 'Line Cook Leo D.',
  },
  {
    id: 'ccp-104',
    equipment: 'Prep Line Cold Bar',
    target: '0.0°C – 5.0°C',
    currentTemp: '4.6°C',
    status: 'warning' as const,
    timestamp: '2 mins ago',
    loggedBy: 'Auto-Sensor Hub',
  },
];
