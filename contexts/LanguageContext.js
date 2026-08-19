// contexts/LanguageContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// सभी 22 भाषाओं के लिए translations
const translations = {
  'hi': { // Hindi
    'app.title': 'भारतीय माहिती अधिकार',
    'sign.up': 'साइन अप',
    'sign.in': 'साइन इन',
    'search': 'खोजें...',
    'no.results': 'कोई परिणाम नहीं मिला',
    'welcome': 'स्वागत है',
    'home': 'होम',
    'dashboard': 'डैशबोर्ड',
  },
  'en': { // English
    'app.title': 'Bhartiya Mahiti Adhikar',
    'sign.up': 'Sign Up',
    'sign.in': 'Sign In',
    'search': 'Search...',
    'no.results': 'No results found',
    'welcome': 'Welcome',
    'home': 'Home',
    'dashboard': 'Dashboard',
  },
  'mr': { // Marathi
    'app.title': 'भारतीय माहिती अधिकार',
    'sign.up': 'साइन अप',
    'sign.in': 'साइन इन',
    'search': 'शोधा...',
    'no.results': 'कोणतेही परिणाम सापडले नाहीत',
    'welcome': 'स्वागत आहे',
    'home': 'मुख्यपृष्ठ',
    'dashboard': 'डॅशबोर्ड',
  },
  'bn': { // Bengali
    'app.title': 'ভারতীয় মাহিতি অধিকার',
    'sign.up': 'সাইন আপ',
    'sign.in': 'সাইন ইন',
    'search': 'অনুসন্ধান...',
    'no.results': 'কোন ফলাফল পাওয়া যায়নি',
    'welcome': 'স্বাগতম',
    'home': 'হোম',
    'dashboard': 'ড্যাশবোर्ड',
  },
  'ta': { // Tamil
    'app.title': 'பாரதிய மாஹிதி அதிகார',
    'sign.up': 'பதிவு செய்க',
    'sign.in': 'உள்நுழைக',
    'search': 'தேடுக...',
    'no.results': 'முடிவுகள் எதுவும் இல்லை',
    'welcome': 'வரவேற்கிறோம்',
    'home': 'முகப்பு',
    'dashboard': 'டாஷ்போர்டு',
  },
  'te': { // Telugu
    'app.title': 'భారతీయ మాహితి అధికార',
    'sign.up': 'సైన్ అప్',
    'sign.in': 'సైన్ ఇన్',
    'search': 'వెతకండి...',
    'no.results': 'ఫలితాలు లేవు',
    'welcome': 'స్వాగతం',
    'home': 'హోమ్',
    'dashboard': 'డాష్బోర్డ్',
  },
  'ml': { // Malayalam
    'app.title': 'ഭാരതീയ മാഹിതി അധികാര',
    'sign.up': 'സൈൻ അപ്പ്',
    'sign.in': 'സൈൻ ഇൻ',
    'search': 'തിരയുക...',
    'no.results': 'ഫലങ്ങളൊന്നുമില്ല',
    'welcome': 'സ്വാഗതം',
    'home': 'ഹോം',
    'dashboard': 'ഡാഷ്ബോർഡ്',
  },
  'kn': { // Kannada
    'app.title': 'ಭಾರತೀಯ ಮಾಹಿತಿ ಅಧಿಕಾರ',
    'sign.up': 'ಸೈನ್ ಅಪ್',
    'sign.in': 'ಸೈನ್ ಇನ್',
    'search': 'ಹುಡುಕು...',
    'no.results': 'ಫಲಿತಾಂಶಗಳಿಲ್ಲ',
    'welcome': 'ಸ್ವಾಗತ',
    'home': 'ಮುಖಪುಟ',
    'dashboard': 'ಡ್ಯಾಶ್ಬೋರ್ಡ್',
  },
  'gu': { // Gujarati
    'app.title': 'ભારતીય માહિતી અધિકાર',
    'sign.up': 'સાઇન અપ',
    'sign.in': 'સાઇન ઇન',
    'search': 'શોધો...',
    'no.results': 'કોઈ પરિણામ નથી',
    'welcome': 'સ્વાગત છે',
    'home': 'હોમ',
    'dashboard': 'ડેશબોર્ડ',
  },
  'pa': { // Punjabi
    'app.title': 'ਭਾਰਤੀ ਮਾਹਿਤੀ ਅਧਿਕਾਰ',
    'sign.up': 'ਸਾਈਨ ਅੱਪ',
    'sign.in': 'ਸਾਈਨ ਇਨ',
    'search': 'ਖੋਜੋ...',
    'no.results': 'ਕੋਈ ਨਤੀਜਾ ਨਹੀਂ',
    'welcome': 'ਜੀ ਆਇਆਂ ਨੂੰ',
    'home': 'ਹੋਮ',
    'dashboard': 'ਡੈਸ਼ਬੋਰਡ',
  },
  'or': { // Odia
    'app.title': 'ଭାରତୀୟ ମାହିତି ଅଧିକାର',
    'sign.up': 'ସାଇନ୍ ଅପ୍',
    'sign.in': 'ସାଇନ୍ ଇନ୍',
    'search': 'ଖୋଜନ୍ତୁ...',
    'no.results': 'କୌଣସି ଫଳାଫଳ ମିଳିଲା ନାହିଁ',
    'welcome': 'ସ୍ୱାଗତ',
    'home': 'ହୋମ',
    'dashboard': 'ଡ୍ୟାଶବୋର୍ଡ',
  },
  'as': { // Assamese
    'app.title': 'ভাৰতীয় মাহিতি অধিকাৰ',
    'sign.up': 'ছাইন আপ',
    'sign.in': 'ছাইন ইন',
    'search': 'সন্ধান কৰক...',
    'no.results': 'কোনো ফলাফল পোৱা নগল',
    'welcome': 'স্বাগতম',
    'home': 'হোম',
    'dashboard': 'ডেশবৰ্ড',
  },
  'ur': { // Urdu
    'app.title': 'بھارتی ماہیتی ادھیکار',
    'sign.up': 'سائن اپ',
    'sign.in': 'سائن ان',
    'search': 'تلاش کریں...',
    'no.results': 'کوئی نتیجہ نہیں',
    'welcome': 'خوش آمدید',
    'home': 'ہوم',
    'dashboard': 'ڈیش بورڈ',
  },
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('hi'); // Default Hindi
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && translations[savedLanguage]) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsReady(true);
    }
  };

  const changeLanguage = async (langCode) => {
    if (translations[langCode]) {
      setLanguage(langCode);
      try {
        await AsyncStorage.setItem('app_language', langCode);
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  if (!isReady) {
    return null; // or a loading screen
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};