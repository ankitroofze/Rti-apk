// Change Language picker ke liye list (code AppHeader ke LanguageSelector wale codes ke same hain)
export const INDIAN_LANGUAGES = [
  { code: 'as',  label: 'Assamese',  native: 'অসমীয়া'   },
  { code: 'bn',  label: 'Bengali',   native: 'বাংলা'      },
  { code: 'bo',  label: 'Bodo',      native: 'बड़ो'        },
  { code: 'do',  label: 'Dogri',     native: 'डोगरी'      },
  { code: 'en',  label: 'English',   native: 'English'    },
  { code: 'gu',  label: 'Gujarati',  native: 'ગુજરાતી'    },
  { code: 'hi',  label: 'Hindi',     native: 'हिन्दी'     },
  { code: 'kn',  label: 'Kannada',   native: 'ಕನ್ನಡ'      },
  { code: 'ks',  label: 'Kashmiri',  native: 'کٲشُر'      },
  { code: 'kok', label: 'Konkani',   native: 'कोंकणी'     },
  { code: 'mai', label: 'Maithili',  native: 'मैथिली'     },
  { code: 'ml',  label: 'Malayalam', native: 'മലയാളം'     },
  { code: 'mni', label: 'Manipuri',  native: 'মৈতৈলোন্'   },
  { code: 'mr',  label: 'Marathi',   native: 'मराठी'      },
  { code: 'ne',  label: 'Nepali',    native: 'नेपाली'     },
  { code: 'or',  label: 'Odia',      native: 'ଓଡ଼ିଆ'      },
  { code: 'pa',  label: 'Punjabi',   native: 'ਪੰਜਾਬੀ'     },
  { code: 'sa',  label: 'Sanskrit',  native: 'संस्कृतम्'  },
  { code: 'sat', label: 'Santali',   native: 'ᱥᱟᱱᱛᱟᱲᱤ'   },
  { code: 'sd',  label: 'Sindhi',    native: 'سنڌي'       },
  { code: 'ta',  label: 'Tamil',     native: 'தமிழ்'      },
  { code: 'te',  label: 'Telugu',    native: 'తెలుగు'     },
  { code: 'ur',  label: 'Urdu',      native: 'اردو'       },
];

// DropdownModal string items use karta hai, isliye "Hindi — हिन्दी" jaisa display text
export const languageDisplay = (l) => (l.label === l.native ? l.label : `${l.label} — ${l.native}`);

// contexts/LanguageContext.js ke `translations` me jo languages hain, sirf wahi changeLanguage() accept karta hai.
// Nayi language add karni ho to pehle wahan translations add karo, phir yahan code daalo.
export const SUPPORTED_LANGUAGE_CODES = ['hi', 'en', 'mr', 'bn', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'or', 'as', 'ur'];
export const SUPPORTED_LANGUAGES = INDIAN_LANGUAGES.filter((l) => SUPPORTED_LANGUAGE_CODES.includes(l.code));