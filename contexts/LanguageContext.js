// contexts/LanguageContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert, Text, TextInput } from 'react-native';
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


// ═════════════════════════════════════════════════════════
// AUTO TRANSLATE — poori app ke saare <Text> / placeholder / Alert ko language ke hisaab se badalta hai.
// Dictionary (neeche ROWS) me nayi line jodo: ['English', 'Hindi', 'Marathi']
// Kisi text ko translate nahi karna ho: <Text translate={false}>...</Text>
// Optional: baaki languages ke liye .env me EXPO_PUBLIC_GOOGLE_TRANSLATE_KEY=<key>
// ═════════════════════════════════════════════════════════
const ROWS = [
  // ── Common ──
  ['Back', 'वापस', 'मागे'], ['Cancel', 'रद्द करें', 'रद्द करा'], ['Next', 'आगे', 'पुढे'],
  ['Save', 'सहेजें', 'जतन करा'], ['Delete', 'हटाएं', 'हटवा'], ['Edit', 'संपादित करें', 'संपादित करा'],
  ['Submit', 'जमा करें', 'सबमिट करा'], ['Done', 'हो गया', 'पूर्ण'], ['Close', 'बंद करें', 'बंद करा'],
  ['Copy', 'कॉपी करें', 'कॉपी करा'], ['Share', 'शेयर करें', 'शेअर करा'],
  ['Search...', 'खोजें...', 'शोधा...'], ['Loading...', 'लोड हो रहा है...', 'लोड होत आहे...'],
  ['Please wait...', 'कृपया प्रतीक्षा करें...', 'कृपया प्रतीक्षा करा...'],
  ['Continue', 'जारी रखें', 'पुढे चला'], ['Skip', 'छोड़ें', 'वगळा'], ['Skip for now', 'अभी छोड़ें', 'आत्ता वगळा'],
  ['Retry', 'फिर कोशिश करें', 'पुन्हा प्रयत्न करा'], ['Try again', 'फिर कोशिश करें', 'पुन्हा प्रयत्न करा'],
  ['Reload', 'रीलोड करें', 'रीलोड करा'], ['Reset', 'रीसेट करें', 'रीसेट करा'],
  ['Apply Filters', 'फ़िल्टर लगाएं', 'फिल्टर लागू करा'], ['Clear All', 'सब हटाएं', 'सर्व साफ करा'],
  ['Clear Filters', 'फ़िल्टर हटाएं', 'फिल्टर साफ करा'], ['Load more', 'और लोड करें', 'आणखी लोड करा'],
  ['View All', 'सभी देखें', 'सर्व पहा'], ['View', 'देखें', 'पहा'], ['See All', 'सभी देखें', 'सर्व पहा'],
  ['View More', 'और देखें', 'आणखी पहा'], ['View Less', 'कम देखें', 'कमी पहा'], ['Read more', 'और पढ़ें', 'आणखी वाचा'],
  ['Open', 'खोलें', 'उघडा'], ['Print', 'प्रिंट करें', 'प्रिंट करा'], ['Download', 'डाउनलोड करें', 'डाउनलोड करा'],
  ['Remove', 'हटाएं', 'काढा'], ['Change', 'बदलें', 'बदला'], ['Error', 'त्रुटि', 'त्रुटी'], ['Success', 'सफलता', 'यशस्वी'],
  ['Something went wrong', 'कुछ गलत हो गया', 'काहीतरी चूक झाली'],
  ['Something went wrong. Please try again.', 'कुछ गलत हो गया। कृपया फिर कोशिश करें।', 'काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.'],
  ['Session expired. Please login again.', 'सत्र समाप्त हो गया। कृपया फिर से लॉगिन करें।', 'सत्र संपले. कृपया पुन्हा लॉगिन करा.'],
  ['Login required', 'लॉगिन आवश्यक है', 'लॉगिन आवश्यक आहे'],
  ['Premium Required', 'प्रीमियम आवश्यक है', 'प्रीमियम आवश्यक आहे'],
  ['Subscription Required', 'सब्सक्रिप्शन आवश्यक है', 'सबस्क्रिप्शन आवश्यक आहे'],
  ['Copied!', 'कॉपी हो गया!', 'कॉपी झाले!'],

  // ── Login / Register ──
  ['Sign In', 'साइन इन', 'साइन इन'], ['Sign Up', 'साइन अप', 'साइन अप'], ['Login', 'लॉगिन', 'लॉगिन'],
  ['Login / Sign Up', 'लॉगिन / साइन अप', 'लॉगिन / साइन अप'], ['Register', 'रजिस्टर करें', 'नोंदणी करा'],
  ['Create your account', 'अपना खाता बनाएं', 'तुमचे खाते तयार करा'],
  ['Email', 'ईमेल', 'ईमेल'], ['Email Address', 'ईमेल पता', 'ईमेल पत्ता'], ['Email address', 'ईमेल पता', 'ईमेल पत्ता'],
  ['Password', 'पासवर्ड', 'पासवर्ड'], ['Confirm Password', 'पासवर्ड की पुष्टि करें', 'पासवर्डची पुष्टी करा'],
  ['Current Password', 'वर्तमान पासवर्ड', 'सध्याचा पासवर्ड'], ['New Password', 'नया पासवर्ड', 'नवीन पासवर्ड'],
  ['Forgot password?', 'पासवर्ड भूल गए?', 'पासवर्ड विसरलात?'], ['Forgot Password', 'पासवर्ड भूल गए', 'पासवर्ड विसरलात'],
  ['Reset Password', 'पासवर्ड रीसेट करें', 'पासवर्ड रीसेट करा'],
  ['Send OTP', 'OTP भेजें', 'OTP पाठवा'], ['Verify OTP', 'OTP सत्यापित करें', 'OTP पडताळा'], ['Enter OTP', 'OTP दर्ज करें', 'OTP टाका'],
  ['First Name', 'पहला नाम', 'पहिले नाव'], ['Middle Name', 'मध्य नाम', 'मधले नाव'], ['Last Name', 'अंतिम नाम', 'आडनाव'],
  ['Mobile Number', 'मोबाइल नंबर', 'मोबाइल नंबर'], ['Contact Number', 'संपर्क नंबर', 'संपर्क क्रमांक'],
  ['Already have an account?', 'पहले से खाता है?', 'आधीच खाते आहे?'],
  ['Terms & Conditions', 'नियम और शर्तें', 'अटी आणि शर्ती'], ['Privacy Policy', 'गोपनीयता नीति', 'गोपनीयता धोरण'],
  ['Refund Policy', 'रिफंड नीति', 'परतावा धोरण'], ['Email / Mobile', 'ईमेल / मोबाइल', 'ईमेल / मोबाइल'],
  ['Enter your password', 'अपना पासवर्ड दर्ज करें', 'तुमचा पासवर्ड टाका'],
  ['Please enter your credentials to continue', 'जारी रखने के लिए अपनी जानकारी दर्ज करें', 'पुढे जाण्यासाठी तुमची माहिती टाका'],
  ['Registration successful!', 'पंजीकरण सफल रहा!', 'नोंदणी यशस्वी!'],
  ['Delete Account', 'खाता हटाएं', 'खाते हटवा'], ['Account Deleted', 'खाता हटा दिया गया', 'खाते हटवले'],
  ['Account verification', 'खाता सत्यापन', 'खाते पडताळणी'],

  // ── Location ──
  ['State', 'राज्य', 'राज्य'], ['District', 'जिला', 'जिल्हा'], ['Taluka', 'तालुका', 'तालुका'], ['Village', 'गाँव', 'गाव'], ['City', 'शहर', 'शहर'],
  ['Select Your State', 'अपना राज्य चुनें', 'तुमचे राज्य निवडा'], ['Select Your District', 'अपना जिला चुनें', 'तुमचा जिल्हा निवडा'],
  ['Select Your Taluka', 'अपना तालुका चुनें', 'तुमचा तालुका निवडा'], ['Select Your Village', 'अपना गाँव चुनें', 'तुमचे गाव निवडा'],
  ['Search state...', 'राज्य खोजें...', 'राज्य शोधा...'], ['Search district...', 'जिला खोजें...', 'जिल्हा शोधा...'],
  ['Search taluka...', 'तालुका खोजें...', 'तालुका शोधा...'], ['Search village...', 'गाँव खोजें...', 'गाव शोधा...'],
  ['Setup Location', 'लोकेशन सेट करें', 'स्थान सेट करा'], ['Complete Setup', 'सेटअप पूरा करें', 'सेटअप पूर्ण करा'],
  ['Change Location', 'लोकेशन बदलें', 'स्थान बदला'], ['All States', 'सभी राज्य', 'सर्व राज्ये'], ['All Districts', 'सभी जिले', 'सर्व जिल्हे'],
  ['All Talukas', 'सभी तालुके', 'सर्व तालुके'], ['All Villages', 'सभी गाँव', 'सर्व गावे'],
  ['Select your location', 'अपना स्थान चुनें', 'तुमचे स्थान निवडा'],

  // ── Profile / Public profile ──
  ['Profile', 'प्रोफाइल', 'प्रोफाइल'], ['Posts', 'पोस्ट', 'पोस्ट'], ['POSTS', 'पोस्ट', 'पोस्ट'],
  ['Activity', 'गतिविधि', 'क्रियाकलाप'], ['ACTIVITY', 'गतिविधि', 'क्रियाकलाप'],
  ['ID & Letter', 'आईडी और पत्र', 'ओळखपत्र आणि पत्र'], ['ID & LETTER', 'आईडी और पत्र', 'ओळखपत्र आणि पत्र'],
  ['Documents', 'दस्तावेज़', 'कागदपत्रे'], ['ID Card', 'आईडी कार्ड', 'ओळखपत्र'], ['Appointment Letter', 'नियुक्ति पत्र', 'नियुक्ती पत्र'],
  ['Followers', 'फ़ॉलोअर्स', 'फॉलोअर्स'], ['Following', 'फ़ॉलोइंग', 'फॉलोइंग'], ['Follow', 'फ़ॉलो करें', 'फॉलो करा'],
  ['Edit Profile', 'प्रोफाइल संपादित करें', 'प्रोफाइल संपादित करा'], ['Share Profile', 'प्रोफाइल शेयर करें', 'प्रोफाइल शेअर करा'],
  ['Copy Profile Link', 'प्रोफाइल लिंक कॉपी करें', 'प्रोफाइल लिंक कॉपी करा'],
  ['Block User', 'यूज़र को ब्लॉक करें', 'यूजरला ब्लॉक करा'], ['Unblock', 'अनब्लॉक करें', 'अनब्लॉक करा'],
  ['Report User', 'यूज़र की रिपोर्ट करें', 'यूजरची तक्रार करा'], ['Report', 'रिपोर्ट करें', 'तक्रार करा'],
  ['Referral Code', 'रेफरल कोड', 'रेफरल कोड'], ['Referral Code:', 'रेफरल कोड:', 'रेफरल कोड:'],
  ['My Referral Code', 'मेरा रेफरल कोड', 'माझा रेफरल कोड'], ['Your Referral Code', 'आपका रेफरल कोड', 'तुमचा रेफरल कोड'],
  ['Refer & Earn', 'रेफर करें और कमाएं', 'रेफर करा आणि कमवा'],
  ['Download ID Card', 'आईडी कार्ड डाउनलोड करें', 'ओळखपत्र डाउनलोड करा'],
  ['Download Appointment Letter', 'नियुक्ति पत्र डाउनलोड करें', 'नियुक्ती पत्र डाउनलोड करा'],
  ['Download ID', 'आईडी डाउनलोड करें', 'आयडी डाउनलोड करा'], ['Download Letter', 'पत्र डाउनलोड करें', 'पत्र डाउनलोड करा'],
  ['Front', 'आगे', 'पुढील'], ['Bio', 'परिचय', 'परिचय'],
  ['No posts yet.', 'अभी कोई पोस्ट नहीं।', 'अजून पोस्ट नाहीत.'], ['No posts yet', 'अभी कोई पोस्ट नहीं', 'अजून पोस्ट नाहीत'],
  ['No posts found.', 'कोई पोस्ट नहीं मिली।', 'पोस्ट सापडल्या नाहीत.'],
  ['No activity yet.', 'अभी कोई गतिविधि नहीं।', 'अजून कोणतेही क्रियाकलाप नाहीत.'],
  ['Profile link copied!', 'प्रोफाइल लिंक कॉपी हो गया!', 'प्रोफाइल लिंक कॉपी झाली!'],
  ['Referral code copied!', 'रेफरल कोड कॉपी हो गया!', 'रेफरल कोड कॉपी झाला!'],
  ['Guest', 'अतिथि', 'पाहुणा'], ['RTI News Member', 'आरटीआई न्यूज़ सदस्य', 'आरटीआय न्यूज सदस्य'],
  ['Wallet', 'वॉलेट', 'वॉलेट'], ['My Posts', 'मेरी पोस्ट', 'माझ्या पोस्ट'], ['Create Post', 'पोस्ट बनाएं', 'पोस्ट तयार करा'],
  ['Profile Details', 'प्रोफाइल विवरण', 'प्रोफाइल तपशील'],
  ['Login to view your profile', 'प्रोफाइल देखने के लिए लॉगिन करें', 'प्रोफाइल पाहण्यासाठी लॉगिन करा'],
  ['Photo', 'फोटो', 'फोटो'], ['Save Changes', 'बदलाव सहेजें', 'बदल जतन करा'],
  ['Update your basic details.', 'अपनी बुनियादी जानकारी अपडेट करें।', 'तुमची मूलभूत माहिती अपडेट करा.'],

  // ── Settings / Notifications ──
  ['Settings', 'सेटिंग्स', 'सेटिंग्ज'], ['Account Settings', 'खाता सेटिंग्स', 'खाते सेटिंग्ज'],
  ['Change Password', 'पासवर्ड बदलें', 'पासवर्ड बदला'], ['Select Language', 'भाषा चुनें', 'भाषा निवडा'],
  ['Language is required.', 'भाषा चुनना आवश्यक है।', 'भाषा निवडणे आवश्यक आहे.'],
  ['Settings updated!', 'सेटिंग्स अपडेट हो गईं!', 'सेटिंग्ज अपडेट झाल्या!'],
  ['Manage your account & preferences', 'अपना खाता और पसंद प्रबंधित करें', 'तुमचे खाते आणि प्राधान्ये व्यवस्थापित करा'],
  ['Notifications', 'सूचनाएं', 'सूचना'], ['Mark all as read', 'सभी को पढ़ा हुआ मार्क करें', 'सर्व वाचले म्हणून चिन्हांकित करा'],
  ['Mark as Read', 'पढ़ा हुआ मार्क करें', 'वाचले म्हणून चिन्हांकित करा'],
  ['No notifications yet', 'अभी कोई सूचना नहीं', 'अजून कोणत्याही सूचना नाहीत'],
  ['Recent Notifications', 'हाल की सूचनाएं', 'अलीकडील सूचना'], ['Unread', 'अपठित', 'न वाचलेले'], ['Read', 'पढ़ा हुआ', 'वाचलेले'], ['Total', 'कुल', 'एकूण'],

  // ── Subscription / Payment ──
  ['Subscription Plans', 'सब्सक्रिप्शन प्लान', 'सबस्क्रिप्शन प्लॅन'], ['My Subscriptions', 'मेरे सब्सक्रिप्शन', 'माझे सबस्क्रिप्शन'],
  ['Take Subscription', 'सब्सक्रिप्शन लें', 'सबस्क्रिप्शन घ्या'], ['Choose Your Plan', 'अपना प्लान चुनें', 'तुमचा प्लॅन निवडा'],
  ['Choose Premium Plan', 'प्रीमियम प्लान चुनें', 'प्रीमियम प्लॅन निवडा'], ['Our Plans', 'हमारे प्लान', 'आमचे प्लॅन'],
  ['Available Plans', 'उपलब्ध प्लान', 'उपलब्ध प्लॅन'], ['Current Plan', 'वर्तमान प्लान', 'सध्याचा प्लॅन'],
  ['Current Plans', 'वर्तमान प्लान', 'सध्याचे प्लॅन'], ['No active plan', 'कोई सक्रिय प्लान नहीं', 'कोणताही सक्रिय प्लॅन नाही'],
  ['Most Popular', 'सबसे लोकप्रिय', 'सर्वाधिक लोकप्रिय'], ['Popular', 'लोकप्रिय', 'लोकप्रिय'],
  ['Pay Now', 'अभी भुगतान करें', 'आता पैसे भरा'], ['Pay now', 'अभी भुगतान करें', 'आता पैसे भरा'],
  ['Yes, Buy Plan', 'हाँ, प्लान खरीदें', 'होय, प्लॅन खरेदी करा'], ['No, Cancel', 'नहीं, रद्द करें', 'नाही, रद्द करा'],
  ['Confirm Purchase', 'खरीद की पुष्टि करें', 'खरेदीची पुष्टी करा'], ['Upgrade', 'अपग्रेड करें', 'अपग्रेड करा'],
  ['Upgrade Your Role', 'अपना रोल अपग्रेड करें', 'तुमची भूमिका अपग्रेड करा'], ['Renew', 'नवीनीकरण करें', 'नूतनीकरण करा'],
  ['Purchased', 'खरीदा गया', 'खरेदी केले'], ['Expires', 'समाप्ति', 'समाप्ती'], ['Benefits', 'लाभ', 'फायदे'], ['Roles', 'भूमिकाएं', 'भूमिका'],
  ["What's included", 'क्या शामिल है', 'काय समाविष्ट आहे'],
  ['Payment History', 'भुगतान इतिहास', 'पेमेंट इतिहास'], ['Transaction History', 'लेन-देन इतिहास', 'व्यवहार इतिहास'],
  ['Subscription Expired', 'सब्सक्रिप्शन समाप्त हो गया', 'सबस्क्रिप्शन संपले'], ['Status', 'स्थिति', 'स्थिती'],
  ['Validity', 'वैधता', 'वैधता'], ['Started', 'शुरू हुआ', 'सुरू झाले'], ['Ends', 'समाप्त', 'संपते'],
  ['Secure payment', 'सुरक्षित भुगतान', 'सुरक्षित पेमेंट'], ['Cancel anytime', 'कभी भी रद्द करें', 'केव्हाही रद्द करा'],
  ['Coming soon', 'जल्द आ रहा है', 'लवकरच येत आहे'], ['Get Blue Tick', 'ब्लू टिक पाएं', 'ब्लू टिक मिळवा'],
  ['Buy Role Subscription', 'रोल सब्सक्रिप्शन खरीदें', 'भूमिका सबस्क्रिप्शन खरेदी करा'],
  ['Select your seat', 'अपनी सीट चुनें', 'तुमची जागा निवडा'], ['Free limit reached', 'मुफ़्त सीमा पूरी हो गई', 'मोफत मर्यादा संपली'],

  // ── Wallet / Network ──
  ['Your Wallet', 'आपका वॉलेट', 'तुमचे वॉलेट'], ['Total Balance', 'कुल बैलेंस', 'एकूण शिल्लक'],
  ['Available Balance', 'उपलब्ध बैलेंस', 'उपलब्ध शिल्लक'], ['Withdraw Earnings', 'कमाई निकालें', 'कमाई काढा'],
  ['Earnings', 'कमाई', 'कमाई'], ['Amount', 'राशि', 'रक्कम'], ['Type', 'प्रकार', 'प्रकार'], ['Source', 'स्रोत', 'स्रोत'],
  ['My Network', 'मेरा नेटवर्क', 'माझे नेटवर्क'], ['Total Members', 'कुल सदस्य', 'एकूण सदस्य'], ['Active', 'सक्रिय', 'सक्रिय'],
  ['Commission', 'कमीशन', 'कमिशन'], ['Total Commission', 'कुल कमीशन', 'एकूण कमिशन'],
  ['Your Rank', 'आपकी रैंक', 'तुमची रँक'], ['Current Rank', 'वर्तमान रैंक', 'सध्याची रँक'],
  ['Referral Bonus', 'रेफरल बोनस', 'रेफरल बोनस'], ['Valid Referrals', 'मान्य रेफरल', 'वैध रेफरल'],
  ['Share via', 'इसके माध्यम से शेयर करें', 'याद्वारे शेअर करा'],

  // ── News / Home / Chat / Market ──
  ['Trending News', 'ट्रेंडिंग समाचार', 'ट्रेंडिंग बातम्या'], ['TOP STORY', 'मुख्य खबर', 'मुख्य बातमी'],
  ['News Feed', 'न्यूज़ फ़ीड', 'न्यूज फीड'], ['Live News', 'लाइव समाचार', 'लाइव्ह बातम्या'], ['Live TV', 'लाइव टीवी', 'लाइव्ह टीव्ही'],
  ['Live Streaming', 'लाइव स्ट्रीमिंग', 'लाइव्ह स्ट्रीमिंग'], ['E-Paper', 'ई-पेपर', 'ई-पेपर'],
  ['Add Newspaper', 'अखबार जोड़ें', 'वृत्तपत्र जोडा'], ['Digital Newspaper', 'डिजिटल अखबार', 'डिजिटल वृत्तपत्र'],
  ['Edit News', 'समाचार संपादित करें', 'बातमी संपादित करा'], ['Delete News', 'समाचार हटाएं', 'बातमी हटवा'],
  ['Comment', 'टिप्पणी', 'टिप्पणी'], ['Comments', 'टिप्पणियाँ', 'टिप्पण्या'], ['Like', 'पसंद करें', 'आवडले'], ['Reply', 'जवाब दें', 'उत्तर द्या'],
  ['Write a comment...', 'टिप्पणी लिखें...', 'टिप्पणी लिहा...'], ['Write a reply...', 'जवाब लिखें...', 'उत्तर लिहा...'],
  ['No comments yet', 'अभी कोई टिप्पणी नहीं', 'अजून टिप्पण्या नाहीत'], ['No comments yet.', 'अभी कोई टिप्पणी नहीं।', 'अजून टिप्पण्या नाहीत.'],
  ['Be the first to comment on this article', 'इस लेख पर सबसे पहले टिप्पणी करें', 'या लेखावर प्रथम टिप्पणी करा'],
  ['Copy link', 'लिंक कॉपी करें', 'लिंक कॉपी करा'],
  ['Advertisement', 'विज्ञापन', 'जाहिरात'], ['ADVERTISEMENT', 'विज्ञापन', 'जाहिरात'], ['Sponsored', 'प्रायोजित', 'प्रायोजित'], ['SPONSORED', 'प्रायोजित', 'प्रायोजित'],
  ['Call Now', 'अभी कॉल करें', 'आत्ता कॉल करा'], ['Call', 'कॉल करें', 'कॉल करा'], ['Contact', 'संपर्क', 'संपर्क'],
  ['Contact Us', 'हमसे संपर्क करें', 'आमच्याशी संपर्क साधा'], ['Home', 'होम', 'मुख्यपृष्ठ'], ['Dashboard', 'डैशबोर्ड', 'डॅशबोर्ड'],
  ['Quick Menu', 'क्विक मेनू', 'क्विक मेनू'], ['MAIN MENU', 'मुख्य मेनू', 'मुख्य मेनू'], ['Quiz', 'क्विज़', 'क्विझ'],
  ['Certification', 'प्रमाणन', 'प्रमाणीकरण'], ['Chats', 'चैट', 'चॅट'], ['Type a message', 'संदेश लिखें', 'संदेश लिहा'],
  ['Search chats & groups', 'चैट और ग्रुप खोजें', 'चॅट आणि ग्रुप शोधा'],
  ['Gallery', 'गैलरी', 'गॅलरी'], ['Video', 'वीडियो', 'व्हिडिओ'], ['Images', 'चित्र', 'चित्रे'], ['Post', 'पोस्ट करें', 'पोस्ट करा'],
  ['Title *', 'शीर्षक *', 'शीर्षक *'], ['Category', 'श्रेणी', 'श्रेणी'], ['Description', 'विवरण', 'वर्णन'],
  ['Price', 'कीमत', 'किंमत'], ['Quantity', 'मात्रा', 'प्रमाण'], ['Product', 'उत्पाद', 'उत्पादन'], ['Products', 'उत्पाद', 'उत्पादने'],
  ['Sell', 'बेचें', 'विका'], ['Name', 'नाम', 'नाव'], ['Plan', 'प्लान', 'प्लॅन'], ['Rank', 'रैंक', 'रँक'],
  ['Date', 'तारीख', 'तारीख'], ['Score', 'स्कोर', 'गुण'], ['Result', 'परिणाम', 'निकाल'],
  ['Loading products...', 'उत्पाद लोड हो रहे हैं...', 'उत्पादने लोड होत आहेत...'],
  ['No products found', 'कोई उत्पाद नहीं मिला', 'कोणतेही उत्पादन सापडले नाही'],
  ['No results found', 'कोई परिणाम नहीं मिला', 'कोणतेही निकाल सापडले नाहीत'],
  ['Verified Seller', 'सत्यापित विक्रेता', 'पडताळलेला विक्रेता'], ['Enquire', 'पूछताछ करें', 'चौकशी करा'],
  ['Send Enquiry', 'पूछताछ भेजें', 'चौकशी पाठवा'],
  ['Camera permission required', 'कैमरा अनुमति आवश्यक है', 'कॅमेरा परवानगी आवश्यक आहे'],
  ['Allow Camera', 'कैमरा की अनुमति दें', 'कॅमेरा परवानगी द्या'], ['Open Settings', 'सेटिंग्स खोलें', 'सेटिंग्ज उघडा'],
  ['ID Card Verification', 'आईडी कार्ड सत्यापन', 'ओळखपत्र पडताळणी'], ['Scan Again', 'फिर स्कैन करें', 'पुन्हा स्कॅन करा'],
  ['Invalid QR Code', 'अमान्य QR कोड', 'अवैध QR कोड'],
  ['Get instant alerts', 'तुरंत अलर्ट पाएं', 'त्वरित अलर्ट मिळवा'], ['Later', 'बाद में', 'नंतर'], ['Maybe later', 'बाद में', 'नंतर'],
  ['Pending', 'लंबित', 'प्रलंबित'], ['Approve', 'स्वीकृत करें', 'मंजूर करा'], ['Reject', 'अस्वीकार करें', 'नाकारा'],
  ['Published', 'प्रकाशित', 'प्रकाशित'], ['Articles', 'लेख', 'लेख'], ['Views', 'व्यूज़', 'व्ह्यूज'], ['Shares', 'शेयर', 'शेअर्स'],
  ['Details', 'विवरण', 'तपशील'], ['Filter by State', 'राज्य के अनुसार फ़िल्टर करें', 'राज्यानुसार फिल्टर करा'], ['Choose', 'चुनें', 'निवडा'],
];

const build = (idx) => ROWS.reduce((acc, r) => { acc[r[0]] = r[idx]; return acc; }, {});

// Dictionary per language. Jis language ka dictionary yahan nahi hai, wahan MT fallback (autoTranslate.js) chalega.
const AUTO_DICT = {
  hi: build(1),
  mr: build(2),
};

const MT_KEY = process.env.EXPO_PUBLIC_GOOGLE_TRANSLATE_KEY || '';
const MT_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
const MT_LANGS = ['hi', 'mr', 'bn', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'or', 'as', 'ur', 'ne', 'sa', 'sd', 'kok', 'mai', 'do'];
const MT_CODE = { do: 'doi' }; // Google ke alag codes

// In brand/technical words ko kabhi translate nahi karna
const NEVER = new Set(['RTI', 'RTI News', 'RTI NEWS', 'RTI India', 'WhatsApp', 'YouTube', 'UPI', 'PAN', 'IFSC', 'QR', 'OTP', 'PDF', 'LIVE', 'ID', 'Gmail']);

let lang = 'en';
let version = 0;
const listeners = new Set();
const mtCache = {};      // { hi: { 'Hello': 'नमस्ते' } }
const mtQueue = new Set();
let mtTimer = null;
let mtLoaded = {};

const bump = () => { version += 1; listeners.forEach((l) => l(version)); };

function useVersion() {
  const [, setV] = useState(version);
  useEffect(() => {
    listeners.add(setV);
    setV(version); // subscribe hone se pehle language badli ho to
    return () => { listeners.delete(setV); };
  }, []);
}

// ── MT (optional) ───────────────────────────────────────
async function loadMtCache(code) {
  if (mtLoaded[code]) return;
  mtLoaded[code] = true;
  try {
    const raw = await AsyncStorage.getItem(`auto_mt_cache_v1_${code}`);
    mtCache[code] = { ...(raw ? JSON.parse(raw) : {}), ...(mtCache[code] || {}) };
    if (code === lang) bump();
  } catch { mtCache[code] = mtCache[code] || {}; }
}

async function flushMt() {
  mtTimer = null;
  const code = lang;
  const batch = Array.from(mtQueue).slice(0, 90);
  batch.forEach((s) => mtQueue.delete(s));
  if (!batch.length || !MT_KEY || code === 'en') return;
  try {
    const res = await fetch(`${MT_ENDPOINT}?key=${encodeURIComponent(MT_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: batch, source: 'en', target: MT_CODE[code] || code, format: 'text' }),
    });
    const json = await res.json();
    const out = json?.data?.translations || [];
    mtCache[code] = mtCache[code] || {};
    batch.forEach((s, i) => { if (out[i]?.translatedText) mtCache[code][s] = out[i].translatedText; });
    AsyncStorage.setItem(`auto_mt_cache_v1_${code}`, JSON.stringify(mtCache[code])).catch(() => {});
    bump();
  } catch { /* network fail: English dikhta rahega */ }
  if (mtQueue.size) mtTimer = setTimeout(flushMt, 300);
}

function queueMt(s) {
  if (!MT_KEY || !MT_LANGS.includes(lang)) return;
  if (mtCache[lang]?.[s] !== undefined || mtQueue.has(s)) return;
  mtQueue.add(s);
  if (!mtTimer) mtTimer = setTimeout(flushMt, 150);
}

// ── Core translate ──────────────────────────────────────
const hasLatinLetters = (s) => /[A-Za-z]/.test(s);
const isNonLatinAlready = (s) => /[^\u0000-\u024F\u2000-\u2BFF\uFE0F\u{1F000}-\u{1FFFF}]/u.test(s);
const looksLikeData = (s) => /^(https?:\/\/|www\.)|@|^[\w.-]+\.[a-z]{2,}$|^\+?[\d\s()-]+$/i.test(s);

function translateText(input) {
  if (typeof input !== 'string' || lang === 'en') return input;
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(input);
  const lead = m[1]; const core = m[2]; const tail = m[3];
  if (!core || core.length > 300 || !hasLatinLetters(core) || isNonLatinAlready(core) || looksLikeData(core) || NEVER.has(core)) return input;

  const dict = AUTO_DICT[lang];
  let out = dict?.[core];
  if (out === undefined) {
    // "Name:" jaise label -> "Name" dhundo, ':' wapas jodo
    const colon = /^(.*?)(\s*:)$/.exec(core);
    if (colon && dict?.[colon[1]] !== undefined) out = `${dict[colon[1]]}:`;
  }
  if (out === undefined) {
    const mt = mtCache[lang]?.[core];
    if (mt !== undefined) out = mt;
    else { queueMt(core); return input; }
  }
  return `${lead}${out}${tail}`;
}

function translateChildren(children) {
  if (typeof children === 'string') return translateText(children);
  if (Array.isArray(children)) {
    let changed = false;
    const next = children.map((c) => {
      const t = typeof c === 'string' ? translateText(c) : (Array.isArray(c) ? translateChildren(c) : c);
      if (t !== c) changed = true;
      return t;
    });
    return changed ? next : children;
  }
  return children;
}

// ── Language set karna (LanguageContext se call hota hai) ──
function setAutoTranslateLanguage(code) {
  const next = String(code || 'en').toLowerCase();
  if (next === lang) return;
  lang = next;
  if (next !== 'en') loadMtCache(next);
  bump();
}
const getAutoTranslateLanguage = () => lang;

// ── Patch RN components (sirf ek baar) ──────────────────
let installed = false;
function patchComponent(Comp, name, propsFix) {
  if (!Comp || typeof Comp.render !== 'function') {
    console.warn(`[autoTranslate] ${name}.render nahi mila — is RN version par ${name} auto-translate nahi hoga.`);
    return;
  }
  if (Comp.__autoTranslatePatched) return;
  const orig = Comp.render;
  Comp.render = function patchedRender(props, ref) {
    useVersion(); // language badalte hi ye component dobara render hoga
    if (lang === 'en' || props?.translate === false) return orig.call(this, props, ref);
    return orig.call(this, propsFix(props), ref);
  };
  Comp.__autoTranslatePatched = true;
}

function installAutoTranslate() {
  if (installed) return;
  installed = true;

  patchComponent(Text, 'Text', (p) => {
    const children = translateChildren(p.children);
    return children === p.children ? p : { ...p, children };
  });

  patchComponent(TextInput, 'TextInput', (p) => {
    const placeholder = translateText(p.placeholder);
    return placeholder === p.placeholder ? p : { ...p, placeholder };
  });

  // Alert.alert (native popups)
  try {
    const origAlert = Alert.alert.bind(Alert);
    Alert.alert = (title, message, buttons, options) => origAlert(
      translateText(title),
      translateText(message),
      Array.isArray(buttons) ? buttons.map((b) => (b && typeof b.text === 'string' ? { ...b, text: translateText(b.text) } : b)) : buttons,
      options,
    );
  } catch { /* ignore */ }
}


installAutoTranslate();
// ═════════ AUTO TRANSLATE END ═════════

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

  // Language badalte hi poori app ka text (har screen) usi language me ho jaata hai
  useEffect(() => {
    setAutoTranslateLanguage(language);
  }, [language]);

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