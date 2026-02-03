export const STORAGE_KEYS = {
  USER_ID: 'giftwise_user_id',
  PROFILES: 'giftwise_profiles',
  GIFT_HISTORY: 'giftwise_gift_history',
  SETTINGS: 'giftwise_settings',
  LAST_BACKUP: 'giftwise_last_backup',
  VERSION: 'giftwise_version',
  FIRST_VISIT: 'giftwise_first_visit'
};

export const APP_VERSION = '1.0.0';
export const MAX_LOCAL_STORAGE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_API_KEY = "AIzaSyBZa4CImRPMJ3gVWFUtW94F5t1CdzbU8QY"; // Replace with your actual key if you want to hardcode it

export const OCCASIONS = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'anniversary', label: 'Work Anniversary' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'holiday', label: 'Holiday' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'baby', label: 'Baby Shower' },
  { id: 'retirement', label: 'Retirement' },
  { id: 'thank_you', label: 'Thank You' },
  { id: 'corporate', label: 'Corporate Gift' },
  { id: 'general', label: 'General' }
];

export const RELATIONSHIPS = [
  { id: 'colleague', label: 'Colleague' },
  { id: 'manager', label: 'Manager' },
  { id: 'client', label: 'Client' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'friend', label: 'Friend' },
  { id: 'family', label: 'Family' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'business_partner', label: 'Business Partner' }
];

export const BUDGET_RANGES = [
  { id: 'low', label: '₹500 - ₹2,000', min: 500, max: 2000 },
  { id: 'medium', label: '₹2,000 - ₹10,000', min: 2000, max: 10000 },
  { id: 'high', label: '₹10,000 - ₹50,000', min: 10000, max: 50000 },
  { id: 'premium', label: '₹50,000+', min: 50000, max: 1000000 }
];

export const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Legal',
  'Marketing',
  'Consulting',
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Hospitality',
  'Other'
];

export const GIFT_CATEGORIES = [
  'Electronics',
  'Books & Learning',
  'Food & Beverage',
  'Fashion & Accessories',
  'Home & Office',
  'Experiences',
  'Wellness',
  'Subscription',
  'Personalized',
  'Luxury'
];