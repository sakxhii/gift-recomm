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
  { id: 'low', label: '$25 - $50', min: 25, max: 50 },
  { id: 'medium', label: '$50 - $150', min: 50, max: 150 },
  { id: 'high', label: '$150 - $500', min: 150, max: 500 },
  { id: 'premium', label: '$500+', min: 500, max: 10000 }
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