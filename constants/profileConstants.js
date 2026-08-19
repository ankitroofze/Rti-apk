// Images
export const RTI_VOICE_LOGO = require('../assets/images/logo.jpg');
export const MIC_ICON = require('../assets/images/mic_icon.png');
export const QR_CODE = require('../assets/images/QR.png');
export const CERT_LOGO = require('../assets/images/certificate_logo.jpg');
export const RIBBON_IMAGE = require('../assets/images/ribon.png');
export const GREEN_BANNER = require('../assets/images/green_banner.jpeg');

// Document Types
export const GENERATED_ID_CARD = 'generated:id-card';
export const GENERATED_APPOINTMENT_LETTER = 'generated:appointment-letter';

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
