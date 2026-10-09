// Images
export const RTI_VOICE_LOGO = require('../assets/images/logo.jpg');
export const MIC_ICON = require('../assets/images/mic_icon.png');
// export const QR_CODE = require('../assets/images/QR.png');
export const CERT_LOGO = require('../assets/images/certificate_logo.jpg');
export const ID_LOGO = require('../assets/images/id-logo.png');
export const IDENTITY_BANNER_IMAGE = require('../assets/images/id-identity.png');
export const RIBBON_IMAGE = require('../assets/images/ribon.png');
export const GREEN_BANNER = require('../assets/images/green_banner.jpeg');
export const BACK_ID_CARD_IMAGE = require('../assets/images/id-back.jpeg');

// Document Types
export const GENERATED_ID_CARD = 'generated:id-card';
export const GENERATED_APPOINTMENT_LETTER = 'generated:appointment-letter';

// Role Seat Colors — 6 purchased roles ke liye alag theme, profile pill / ID card accents ke liye
export const ROLE_SEAT_COLORS = {
  chief_editor_published:   { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' }, // Gold
  executive_editor:         { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8' }, // Blue
  deputy_editor_national:   { bg: '#F3E8FF', border: '#A855F7', text: '#7E22CE' }, // Purple
  public_relations_officer: { bg: '#FFEDD5', border: '#F97316', text: '#C2410C' }, // Orange
  national_bureau_chief:    { bg: '#FBE7EA', border: '#800020', text: '#800020' }, // Burgundy
  // pratinidhi ka apna alag color hata diya — ab ye normal user jaisa hi dikhega
};
export const COMMON_USER_COLOR = { bg: '#FFFFFF', border: '#E2E8F0', text: '#64748B' }; // Simple/Neutral white

// ── Role Based Profile Look (6-tier design) ──────────────────────────────────
// Common(grey) -> Premium(green) -> Verified Blue Tick(blue) -> Authorised
// Representative(orange) -> Executive(purple) -> Chief(red). Har tier ka apna
// background card image (assets/images me pehle se maujood) + accent color.
export const PROFILE_BG_GREY   = require('../assets/images/profile-grey.png');
export const PROFILE_BG_GREEN  = require('../assets/images/profile-green.png');
export const PROFILE_BG_YELLOW = require('../assets/images/profile-yellow.png');
export const PROFILE_BG_BLUE   = require('../assets/images/profile-blue.png');
export const PROFILE_BG_ORANGE = require('../assets/images/profile-orange.png');
export const PROFILE_BG_PURPLE = require('../assets/images/profile-purple.png');
export const PROFILE_BG_RED    = require('../assets/images/profile-red.png');

// Har tier ke liye 2 gradients:
//  - gradient: avatar camera badge + "Premium/Verified/..." pill ke liye
//  - gradientDark: "Edit Profile" button ke liye (thoda darker shade)
// Common (no subscription) tier ka gradient purposely grey hai — jaise he user
// koi bhi subscription/seat/blue-tick le leta hai, dono gradients automatically
// us tier ke color me badal jaate hain (yahi single source of truth hai).
export const PROFILE_TIERS = {
  common: {
    key: 'common', order: 0, label: 'Common User',
    bgImage: PROFILE_BG_GREY, accent: '#6B7280',
    gradient: ['#4B5563', '#9CA3AF', '#6B7280'],
    gradientDark: ['#374151', '#6B7280', '#374151'],
    badgeBg: 'rgba(255,255,255,0.22)', badgeText: '#FFFFFF',
  },
  premium: {
    key: 'premium', order: 1, label: 'Premium User',
    // Premium membership card uses the dedicated yellow artwork.
    bgImage: PROFILE_BG_YELLOW, accent: '#D97706',
    gradient: ['#FDE047', '#FBBF24', '#D97706'],
    gradientDark: ['#FACC15', '#F59E0B', '#D97706'],
    badgeBg: 'rgba(255,255,255,0.22)', badgeText: '#FFFFFF',
  },
  verified: {
    key: 'verified', order: 2, label: 'Verified User',
    // The Premium Plan / verified profile uses the requested yellow artwork;
    // its badge and accents remain blue so the verified state is unmistakable.
    bgImage: PROFILE_BG_YELLOW, accent: '#3B82F6',
    gradient: ['#FDE047', '#FBBF24', '#D97706'],
    gradientDark: ['#FACC15', '#F59E0B', '#D97706'],
    badgeBg: 'rgba(255,255,255,0.22)', badgeText: '#FFFFFF',
  },
  representative: {
    key: 'representative', order: 3, label: 'Authorised Representative',
    bgImage: PROFILE_BG_ORANGE, accent: '#F97316',
    gradient: ['#9A3412', '#FB923C', '#C2410C'],
    gradientDark: ['#7C2D12', '#F97316', '#9A3412'],
    badgeBg: 'rgba(255,255,255,0.22)', badgeText: '#FFFFFF',
  },
  executive: {
    key: 'executive', order: 4, label: 'Executive Editor',
    bgImage: PROFILE_BG_PURPLE, accent: '#7C3AED',
    gradient: ['#4C1D95', '#A855F7', '#6D28D9'],
    gradientDark: ['#3B0764', '#7C3AED', '#4C1D95'],
    badgeBg: 'rgba(255,255,255,0.22)', badgeText: '#FFFFFF',
  },
  chief: {
    key: 'chief', order: 5, label: 'Chief Role',
    bgImage: PROFILE_BG_RED, accent: '#B91C1C',
    gradient: ['#7F1D1D', '#EF4444', '#991B1B'],
    gradientDark: ['#450A0A', '#B91C1C', '#7F1D1D'],
    badgeBg: 'rgba(255,255,255,0.24)', badgeText: '#FFFFFF',
  },
};

// State-seat id -> tier key. Seat naam ke hisaab se group kiya hai (chief/bureau
// chief = Chief tier, editor seats = Executive tier, PRO/pratinidhi = Representative tier).
export const SEAT_ID_TO_TIER = {
  chief_editor_published:   'chief',
  national_bureau_chief:    'chief',
  executive_editor:         'executive',
  deputy_editor_national:   'executive',
  public_relations_officer: 'representative',
  state_chief_editor:             'representative',
  state_bureau_chief:             'representative',
  state_coordinator:              'representative',
  senior_state_correspondent:     'representative',
  special_state_reporter:         'representative',
  district_head:                  'representative',
  district_bureau_chief:          'representative',
  district_correspondent:         'representative',
  senior_district_reporter:       'representative',
  district_coordinator:           'representative',
  taluka_head:                    'representative',
  taluka_correspondent:           'representative',
  sub_reporter:                   'representative',
  taluka_representative:          'representative',
  regional_reporter:              'representative',
  village_correspondent:          'representative',
  village_representative:         'representative',
  village_reporter:               'representative',
  public_communication_associate: 'representative',
   rural_reporter:                 'representative',
  '1': 'chief', '2': 'executive', '3': 'executive', '4': 'representative', '5': 'chief',
  '6': 'representative', '7': 'representative', '8': 'representative', '9': 'representative', '10': 'representative',
  '11': 'representative', '12': 'representative', '13': 'representative', '14': 'representative', '15': 'representative',
  '16': 'representative', '17': 'representative', '18': 'representative', '19': 'representative', '20': 'representative',
  '21': 'representative', '22': 'representative', '23': 'representative', '24': 'representative', '25': 'representative',
};
// Ranks Configuration
export const RANKS = [
  { id: 'platinum', minReferrals: 500, title: 'Platinum', icon: '👑', color: '#e5e7eb', bgColor: '#f3f4f6', badgeColor: '#d1d5db' },
  { id: 'gold', minReferrals: 100, title: 'Gold', icon: '🏆', color: '#fbbf24', bgColor: '#fef3c7', badgeColor: '#f59e0b' },
  { id: 'silver', minReferrals: 50, title: 'Silver', icon: '⭐', color: '#c4b5fd', bgColor: '#ede9fe', badgeColor: '#a78bfa' },
  { id: 'bronze', minReferrals: 10, title: 'Bronze', icon: '🥉', color: '#fed7aa', bgColor: '#ffedd5', badgeColor: '#fb923c' },
  { id: 'member', minReferrals: 0, title: 'Member', icon: '👤', color: '#d1d5db', bgColor: '#f3f4f6', badgeColor: '#9ca3af' },
];

// Initial Form State
export const initialForm = {
   name: '',
  email: '',
  village: '',
  state: '',
  bio: '',
  contact_number: '',
  phone_number: '',
  mobile_number: '',
  subscription_type: '',
  state_seat: null,
  profile_image: '',
  role_label: '',
  is_subscribed: false,
  id_card_image: '',
  appointment_letter_image: '',
  id_card_status: '',
  appointment_letter_status: '',
  referral_count: 0,
  referral_code: '',
};

// PDF Generation Constants
export const A4_DIMENSIONS = { width: 595, height: 842 };
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const IMAGE_COMPRESS_SIZE = { width: 200, height: 200 };
export const PROFILE_IMAGE_QUALITY = 0.8;

// Default Avatar
export const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRTVFN0VCIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjcwIiByPSI0MCIgZmlsbD0iI0Q5RDkyQiIvPgo8cGF0aCBkPSJNIDUwIDE0MCBDIDUwIDEyMCA3MCAxMjAgMTAwIDEyMCBDIDEzMCAxMjAgMTUwIDEyMCAxNTAgMTQwIEwgMTUwIDE4MCBMIDUwIDE4MCBaIiBmaWxsPSIjRDlEOTJCIi8+Cjwvc3ZnPgo=';
