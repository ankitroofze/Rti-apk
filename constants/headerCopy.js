// constants/headerCopy.js
// Home page header (AppNavbar) ke saare texts — English + 22 Indian languages.
// Ye STATIC translations hain: na API, na key, na internet, na bill.
//
// ⚠️ REVIEW NOTE: hi, mr, bn, gu, ta, te, kn, ml, pa, or, as, ur, ne — common languages, translations reliable.
// bo, do, ks, kok, mai, mni, sa, sat, sd — kam-prachalit languages hain; inke liye UI terms aksar
// transliterate hote hain. Release se pehle kisi native speaker se ek baar check karwa lena.
// (sat = Ol Chiki script: phone me font na ho to dabbe dikh sakte hain.)

const HEADER_COPY = {
  en: {
    home: 'Home', newsFeed: 'News Feed', feed: 'Feed', publish: 'Publish', post: 'Post',
    promote: 'Promote', advertise: 'Advertise', ePaper: 'E-Paper', settings: 'Settings',
    subscription: 'Subscription', referral: 'Referral', ecom: 'Ecom', certificate: 'Certificate',
    live: 'Live', signIn: 'Sign In', profile: 'Profile', logout: 'Logout', premium: 'Premium',
    selectLanguage: 'Select Language', brandSubtitle: 'ALL INDIA RTI NEWS NETWORK',
  },
  hi: {
    home: 'होम', newsFeed: 'न्यूज़ फ़ीड', feed: 'फ़ीड', publish: 'प्रकाशित करें', post: 'पोस्ट',
    promote: 'प्रमोट करें', advertise: 'विज्ञापन', ePaper: 'ई-पेपर', settings: 'सेटिंग्स',
    subscription: 'सब्सक्रिप्शन', referral: 'रेफरल', ecom: 'ई-कॉम', certificate: 'प्रमाणपत्र',
    live: 'लाइव', signIn: 'साइन इन', profile: 'प्रोफ़ाइल', logout: 'लॉग आउट', premium: 'प्रीमियम',
    selectLanguage: 'भाषा चुनें', brandSubtitle: 'ऑल इंडिया RTI न्यूज़ नेटवर्क',
  },
  mr: {
    home: 'होम', newsFeed: 'न्यूज फीड', feed: 'फीड', publish: 'प्रकाशित करा', post: 'पोस्ट',
    promote: 'प्रमोट करा', advertise: 'जाहिरात', ePaper: 'ई-पेपर', settings: 'सेटिंग्ज',
    subscription: 'सबस्क्रिप्शन', referral: 'रेफरल', ecom: 'ई-कॉम', certificate: 'प्रमाणपत्र',
    live: 'लाइव्ह', signIn: 'साइन इन', profile: 'प्रोफाइल', logout: 'लॉग आउट', premium: 'प्रीमियम',
    selectLanguage: 'भाषा निवडा', brandSubtitle: 'ऑल इंडिया RTI न्यूज नेटवर्क',
  },
  bn: {
    home: 'হোম', newsFeed: 'নিউজ ফিড', feed: 'ফিড', publish: 'প্রকাশ করুন', post: 'পোস্ট',
    promote: 'প্রচার করুন', advertise: 'বিজ্ঞাপন', ePaper: 'ই-পেপার', settings: 'সেটিংস',
    subscription: 'সাবস্ক্রিপশন', referral: 'রেফারেল', ecom: 'ই-কম', certificate: 'সার্টিফিকেট',
    live: 'লাইভ', signIn: 'সাইন ইন', profile: 'প্রোফাইল', logout: 'লগ আউট', premium: 'প্রিমিয়াম',
    selectLanguage: 'ভাষা নির্বাচন করুন', brandSubtitle: 'অল ইন্ডিয়া RTI নিউজ নেটওয়ার্ক',
  },
  gu: {
    home: 'હોમ', newsFeed: 'ન્યૂઝ ફીડ', feed: 'ફીડ', publish: 'પ્રકાશિત કરો', post: 'પોસ્ટ',
    promote: 'પ્રમોટ કરો', advertise: 'જાહેરાત', ePaper: 'ઈ-પેપર', settings: 'સેટિંગ્સ',
    subscription: 'સબ્સ્ક્રિપ્શન', referral: 'રેફરલ', ecom: 'ઈ-કોમ', certificate: 'પ્રમાણપત્ર',
    live: 'લાઈવ', signIn: 'સાઇન ઇન', profile: 'પ્રોફાઇલ', logout: 'લૉગ આઉટ', premium: 'પ્રીમિયમ',
    selectLanguage: 'ભાષા પસંદ કરો', brandSubtitle: 'ઓલ ઇન્ડિયા RTI ન્યૂઝ નેટવર્ક',
  },
  ta: {
    home: 'முகப்பு', newsFeed: 'செய்தி ஊட்டம்', feed: 'ஊட்டம்', publish: 'வெளியிடு', post: 'பதிவு',
    promote: 'விளம்பரப்படுத்து', advertise: 'விளம்பரம்', ePaper: 'இ-பேப்பர்', settings: 'அமைப்புகள்',
    subscription: 'சந்தா', referral: 'பரிந்துரை', ecom: 'இ-காம்', certificate: 'சான்றிதழ்',
    live: 'நேரலை', signIn: 'உள்நுழை', profile: 'சுயவிவரம்', logout: 'வெளியேறு', premium: 'பிரீமியம்',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்', brandSubtitle: 'அகில இந்திய RTI செய்தி வலையமைப்பு',
  },
  te: {
    home: 'హోమ్', newsFeed: 'న్యూస్ ఫీడ్', feed: 'ఫీడ్', publish: 'ప్రచురించు', post: 'పోస్ట్',
    promote: 'ప్రమోట్ చేయండి', advertise: 'ప్రకటన', ePaper: 'ఈ-పేపర్', settings: 'సెట్టింగ్‌లు',
    subscription: 'సబ్‌స్క్రిప్షన్', referral: 'రెఫరల్', ecom: 'ఈ-కామ్', certificate: 'సర్టిఫికెట్',
    live: 'లైవ్', signIn: 'సైన్ ఇన్', profile: 'ప్రొఫైల్', logout: 'లాగ్ అవుట్', premium: 'ప్రీమియం',
    selectLanguage: 'భాషను ఎంచుకోండి', brandSubtitle: 'ఆల్ ఇండియా RTI న్యూస్ నెట్‌వర్క్',
  },
  kn: {
    home: 'ಹೋಮ್', newsFeed: 'ನ್ಯೂಸ್ ಫೀಡ್', feed: 'ಫೀಡ್', publish: 'ಪ್ರಕಟಿಸಿ', post: 'ಪೋಸ್ಟ್',
    promote: 'ಪ್ರಚಾರ ಮಾಡಿ', advertise: 'ಜಾಹೀರಾತು', ePaper: 'ಇ-ಪೇಪರ್', settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    subscription: 'ಚಂದಾದಾರಿಕೆ', referral: 'ರೆಫರಲ್', ecom: 'ಇ-ಕಾಮ್', certificate: 'ಪ್ರಮಾಣಪತ್ರ',
    live: 'ಲೈವ್', signIn: 'ಸೈನ್ ಇನ್', profile: 'ಪ್ರೊಫೈಲ್', logout: 'ಲಾಗ್ ಔಟ್', premium: 'ಪ್ರೀಮಿಯಂ',
    selectLanguage: 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ', brandSubtitle: 'ಆಲ್ ಇಂಡಿಯಾ RTI ನ್ಯೂಸ್ ನೆಟ್‌ವರ್ಕ್',
  },
  ml: {
    home: 'ഹോം', newsFeed: 'ന്യൂസ് ഫീഡ്', feed: 'ഫീഡ്', publish: 'പ്രസിദ്ധീകരിക്കുക', post: 'പോസ്റ്റ്',
    promote: 'പ്രമോട്ട് ചെയ്യുക', advertise: 'പരസ്യം', ePaper: 'ഇ-പേപ്പർ', settings: 'ക്രമീകരണങ്ങൾ',
    subscription: 'സബ്സ്ക്രിപ്ഷൻ', referral: 'റഫറൽ', ecom: 'ഇ-കോം', certificate: 'സർട്ടിഫിക്കറ്റ്',
    live: 'ലൈവ്', signIn: 'സൈൻ ഇൻ', profile: 'പ്രൊഫൈൽ', logout: 'ലോഗ് ഔട്ട്', premium: 'പ്രീമിയം',
    selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക', brandSubtitle: 'ഓൾ ഇന്ത്യ RTI ന്യൂസ് നെറ്റ്‌വർക്ക്',
  },
  pa: {
    home: 'ਹੋਮ', newsFeed: 'ਨਿਊਜ਼ ਫੀਡ', feed: 'ਫੀਡ', publish: 'ਪ੍ਰਕਾਸ਼ਿਤ ਕਰੋ', post: 'ਪੋਸਟ',
    promote: 'ਪ੍ਰਮੋਟ ਕਰੋ', advertise: 'ਇਸ਼ਤਿਹਾਰ', ePaper: 'ਈ-ਪੇਪਰ', settings: 'ਸੈਟਿੰਗਾਂ',
    subscription: 'ਸਬਸਕ੍ਰਿਪਸ਼ਨ', referral: 'ਰੈਫਰਲ', ecom: 'ਈ-ਕਾਮ', certificate: 'ਸਰਟੀਫਿਕੇਟ',
    live: 'ਲਾਈਵ', signIn: 'ਸਾਈਨ ਇਨ', profile: 'ਪ੍ਰੋਫਾਈਲ', logout: 'ਲੌਗ ਆਊਟ', premium: 'ਪ੍ਰੀਮੀਅਮ',
    selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ', brandSubtitle: 'ਆਲ ਇੰਡੀਆ RTI ਨਿਊਜ਼ ਨੈੱਟਵਰਕ',
  },
  or: {
    home: 'ହୋମ୍', newsFeed: 'ନ୍ୟୁଜ୍ ଫିଡ୍', feed: 'ଫିଡ୍', publish: 'ପ୍ରକାଶ କରନ୍ତୁ', post: 'ପୋଷ୍ଟ',
    promote: 'ପ୍ରଚାର କରନ୍ତୁ', advertise: 'ବିଜ୍ଞାପନ', ePaper: 'ଇ-ପେପର୍', settings: 'ସେଟିଂସ୍',
    subscription: 'ସବସ୍କ୍ରିପସନ୍', referral: 'ରେଫରାଲ୍', ecom: 'ଇ-କମ୍', certificate: 'ପ୍ରମାଣପତ୍ର',
    live: 'ଲାଇଭ୍', signIn: 'ସାଇନ୍ ଇନ୍', profile: 'ପ୍ରୋଫାଇଲ୍', logout: 'ଲଗ୍ ଆଉଟ୍', premium: 'ପ୍ରିମିୟମ୍',
    selectLanguage: 'ଭାଷା ବାଛନ୍ତୁ', brandSubtitle: 'ଅଲ୍ ଇଣ୍ଡିଆ RTI ନ୍ୟୁଜ୍ ନେଟୱାର୍କ',
  },
  as: {
    home: 'হোম', newsFeed: 'নিউজ ফিড', feed: 'ফিড', publish: 'প্ৰকাশ কৰক', post: 'পোষ্ট',
    promote: 'প্ৰচাৰ কৰক', advertise: 'বিজ্ঞাপন', ePaper: 'ই-পেপাৰ', settings: 'ছেটিংছ',
    subscription: 'চাবস্ক্ৰিপচন', referral: 'ৰেফাৰেল', ecom: 'ই-কম', certificate: 'প্ৰমাণপত্ৰ',
    live: 'লাইভ', signIn: 'ছাইন ইন', profile: 'প্ৰফাইল', logout: 'লগ আউট', premium: 'প্ৰিমিয়াম',
    selectLanguage: 'ভাষা বাছনি কৰক', brandSubtitle: 'অল ইণ্ডিয়া RTI নিউজ নেটৱৰ্ক',
  },
  ur: {
    home: 'ہوم', newsFeed: 'نیوز فیڈ', feed: 'فیڈ', publish: 'شائع کریں', post: 'پوسٹ',
    promote: 'پروموٹ کریں', advertise: 'اشتہار', ePaper: 'ای-پیپر', settings: 'ترتیبات',
    subscription: 'سبسکرپشن', referral: 'ریفرل', ecom: 'ای-کام', certificate: 'سرٹیفکیٹ',
    live: 'لائیو', signIn: 'سائن اِن', profile: 'پروفائل', logout: 'لاگ آؤٹ', premium: 'پریمیم',
    selectLanguage: 'زبان منتخب کریں', brandSubtitle: 'آل انڈیا RTI نیوز نیٹ ورک',
  },
  ne: {
    home: 'होम', newsFeed: 'न्युज फिड', feed: 'फिड', publish: 'प्रकाशित गर्नुहोस्', post: 'पोस्ट',
    promote: 'प्रमोट गर्नुहोस्', advertise: 'विज्ञापन', ePaper: 'ई-पेपर', settings: 'सेटिङहरू',
    subscription: 'सदस्यता', referral: 'रेफरल', ecom: 'ई-कम', certificate: 'प्रमाणपत्र',
    live: 'लाइभ', signIn: 'साइन इन', profile: 'प्रोफाइल', logout: 'लग आउट', premium: 'प्रिमियम',
    selectLanguage: 'भाषा छान्नुहोस्', brandSubtitle: 'अल इन्डिया RTI न्युज नेटवर्क',
  },
  // ── Kam-prachalit languages (native speaker se review karwa lena) ──
  sa: {
    home: 'मुखपृष्ठम्', newsFeed: 'वार्ताप्रवाहः', feed: 'प्रवाहः', publish: 'प्रकाशयतु', post: 'प्रेषणम्',
    promote: 'प्रवर्धयतु', advertise: 'विज्ञापनम्', ePaper: 'ई-पत्रम्', settings: 'विन्यासाः',
    subscription: 'सदस्यता', referral: 'संस्तुतिः', ecom: 'ई-वाणिज्यम्', certificate: 'प्रमाणपत्रम्',
    live: 'साक्षात्', signIn: 'प्रविशतु', profile: 'परिचयः', logout: 'निर्गच्छतु', premium: 'प्रीमियम',
    selectLanguage: 'भाषां चिनोतु', brandSubtitle: 'अखिलभारतीय RTI वार्ताजालम्',
  },
  kok: {
    home: 'होम', newsFeed: 'न्यूज फीड', feed: 'फीड', publish: 'प्रकाशीत करात', post: 'पोस्ट',
    promote: 'प्रमोट करात', advertise: 'जाहीरात', ePaper: 'ई-पेपर', settings: 'सेटींग्स',
    subscription: 'सबस्क्रिप्शन', referral: 'रेफरल', ecom: 'ई-कॉम', certificate: 'प्रमाणपत्र',
    live: 'लायव्ह', signIn: 'साइन इन', profile: 'प्रोफाइल', logout: 'लॉग आउट', premium: 'प्रीमियम',
    selectLanguage: 'भास वेंचात', brandSubtitle: 'ऑल इंडिया RTI न्यूज नेटवर्क',
  },
  mai: {
    home: 'होम', newsFeed: 'न्यूज फीड', feed: 'फीड', publish: 'प्रकाशित करू', post: 'पोस्ट',
    promote: 'प्रमोट करू', advertise: 'विज्ञापन', ePaper: 'ई-पेपर', settings: 'सेटिंग्स',
    subscription: 'सब्सक्रिप्शन', referral: 'रेफरल', ecom: 'ई-कॉम', certificate: 'प्रमाणपत्र',
    live: 'लाइव', signIn: 'साइन इन', profile: 'प्रोफाइल', logout: 'लॉग आउट', premium: 'प्रीमियम',
    selectLanguage: 'भाषा चुनू', brandSubtitle: 'ऑल इंडिया RTI न्यूज नेटवर्क',
  },
  do: {
    home: 'होम', newsFeed: 'न्यूज़ फीड', feed: 'फीड', publish: 'प्रकाशत करो', post: 'पोस्ट',
    promote: 'प्रमोट करो', advertise: 'इश्तिहार', ePaper: 'ई-पेपर', settings: 'सेटिंग्ज़',
    subscription: 'सब्सक्रिप्शन', referral: 'रेफरल', ecom: 'ई-कॉम', certificate: 'सर्टिफिकेट',
    live: 'लाइव', signIn: 'साइन इन', profile: 'प्रोफाइल', logout: 'लॉग आउट', premium: 'प्रीमियम',
    selectLanguage: 'भाशा चुनो', brandSubtitle: 'ऑल इंडिया RTI न्यूज़ नेटवर्क',
  },
  bo: {
    home: 'होम', newsFeed: 'न्यूज फिड', feed: 'फिड', publish: 'पब्लिश', post: 'पोस्ट',
    promote: 'प्रमोट', advertise: 'विज्ञापन', ePaper: 'ई-पेपर', settings: 'सेटिङ',
    subscription: 'सबस्क्रिप्सन', referral: 'रेफारेल', ecom: 'ई-कम', certificate: 'सार्टिफिकेट',
    live: 'लाइभ', signIn: 'साइन इन', profile: 'प्रोफाइल', logout: 'लग आउट', premium: 'प्रिमियाम',
    selectLanguage: 'भाषा चुनो', brandSubtitle: 'अल इन्डिया RTI न्यूज नेटवर्क',
  },
  sd: {
    home: 'گھر', newsFeed: 'نيوز فيڊ', feed: 'فيڊ', publish: 'شايع ڪريو', post: 'پوسٽ',
    promote: 'پروموٽ ڪريو', advertise: 'اشتهار', ePaper: 'اي-پيپر', settings: 'سيٽنگون',
    subscription: 'سبسڪرپشن', referral: 'ريفرل', ecom: 'اي-ڪام', certificate: 'سرٽيفڪيٽ',
    live: 'لائيو', signIn: 'سائن ان', profile: 'پروفائيل', logout: 'لاگ آئوٽ', premium: 'پريميم',
    selectLanguage: 'ٻولي چونڊيو', brandSubtitle: 'آل انڊيا RTI نيوز نيٽ ورڪ',
  },
  ks: {
    home: 'ہوم', newsFeed: 'نیوٗز فیڈ', feed: 'فیڈ', publish: 'شایع کرو', post: 'پوسٹ',
    promote: 'پروموٹ کرو', advertise: 'اِشتِہار', ePaper: 'ای-پیپر', settings: 'سیٹنگز',
    subscription: 'سبسکرپشن', referral: 'ریفرل', ecom: 'ای-کام', certificate: 'سرٹیفکیٹ',
    live: 'لایو', signIn: 'سائن اِن', profile: 'پروفایل', logout: 'لاگ آؤٹ', premium: 'پریمیم',
    selectLanguage: 'زبان ژارو', brandSubtitle: 'آل انڈیا RTI نیوٗز نیٹ ورک',
  },
  mni: {
    home: 'হোম', newsFeed: 'নিউজ ফীড', feed: 'ফীড', publish: 'পাব্লিশ তৌরো', post: 'পোস্ট',
    promote: 'প্রমোট তৌরো', advertise: 'বিজ্ঞাপন', ePaper: 'ই-পেপর', settings: 'সেটিংস',
    subscription: 'সাবস্ক্রিপসন', referral: 'রেফেরেল', ecom: 'ই-কম', certificate: 'সার্টিফিকেট',
    live: 'লাইভ', signIn: 'সাইন ইন', profile: 'প্রোফাইল', logout: 'লগ আউট', premium: 'প্রীমিয়ম',
    selectLanguage: 'ভাষা বাছাই তৌরো', brandSubtitle: 'অল ইণ্ডিয়া RTI নিউজ নেটৱর্ক',
  },
  sat: {
    home: 'ᱦᱚᱢ', newsFeed: 'ᱱᱤᱭᱩᱡ ᱯᱷᱤᱰ', feed: 'ᱯᱷᱤᱰ', publish: 'ᱯᱟᱵᱞᱤᱥ ᱢᱮ', post: 'ᱯᱚᱥᱴ',
    promote: 'ᱯᱨᱚᱢᱚᱴ ᱢᱮ', advertise: 'ᱵᱤᱜᱽᱭᱟᱯᱚᱱ', ePaper: 'ᱤ-ᱯᱮᱯᱚᱨ', settings: 'ᱥᱮᱴᱤᱝ',
    subscription: 'ᱥᱟᱵᱥᱠᱨᱤᱯᱥᱚᱱ', referral: 'ᱨᱮᱯᱷᱮᱨᱟᱞ', ecom: 'ᱤ-ᱠᱚᱢ', certificate: 'ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ',
    live: 'ᱞᱟᱭᱤᱵ', signIn: 'ᱥᱟᱭᱤᱱ ᱤᱱ', profile: 'ᱯᱨᱚᱯᱷᱟᱭᱤᱞ', logout: 'ᱞᱚᱜ ᱟᱣᱴ', premium: 'ᱯᱨᱤᱢᱤᱭᱟᱢ',
    selectLanguage: 'ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ', brandSubtitle: 'ᱚᱞ ᱤᱱᱰᱤᱭᱟ RTI ᱱᱤᱭᱩᱡ ᱱᱮᱴᱣᱟᱨᱠ',
  },
};

// Jis language ka koi key na ho, wahan English dikhega (header kabhi khaali nahi rahega)
export function getHeaderCopy(language) {
  const base = HEADER_COPY.en;
  if (!language || language === 'en' || !HEADER_COPY[language]) return base;
  return { ...base, ...HEADER_COPY[language] };
}

// Nav item ke labelKey -> headerCopy key
export const NAV_LABEL_TO_KEY = {
  home: 'home',
  'News Feed': 'newsFeed',
  feed: 'feed',
  Publish: 'publish',
  create: 'post',
  Promote: 'promote',
  advertise: 'advertise',
  'E-Paper': 'ePaper',
  Settings: 'settings',
  liveStreaming: 'live',
};

export default HEADER_COPY;