# RTI News & Marketplace — Complete API Endpoints Documentation

> **नोट (Note):** यह दस्तावेज़ `new-rti` एप्लिकेशन में उपयोग किए जाने वाले सभी **API Endpoints**, उनके **HTTP Methods**, **Payload / Parameters**, और **Purpose (किस काम के लिए है)** की पूरी सूची प्रदान करता है।  
> इसमें **Public APIs** (बिना लॉगिन / No Token) और **Protected APIs** (Bearer Token आवश्यक) को अलग-अलग श्रेणियों में विस्तार से समझाया गया है।

---

## 📌 1. Base URL और कॉन्फ़िगरेशन (Base URL & Configuration)

- **Native Mobile & Default API:**  
  `https://189.72.144.238/api/api` (या `process.env.EXPO_PUBLIC_API_URL`)
- **Web Browser (Reverse Proxy):**  
  `/api-proxy` (यह वेब पर CORS से बचने के लिए `https://189.72.144.238/api/api` पर फॉरवर्ड होता है)
- **प्रमाणीकरण (Authentication Header):**  
  Protected APIs के लिए: `Authorization: Bearer <auth_token>`
- **डिफ़ॉल्ट टाइमआउट:**  
  `30,000 ms` (30 सेकंड) | वीडियो अपलोड के लिए: `120,000 ms` (2 मिनट)

---

## 🌐 भाग 1: PUBLIC APIs (बिना लॉगिन के उपलब्ध / No Auth Required)

इन APIs को कॉल करने के लिए किसी भी लॉगिन या Bearer Token की ज़रूरत नहीं होती। यदि यूजर लॉगिन है, तो भी यह अनुरोध स्वीकार्य होता है।

### 1.1 ऑथेंटिकेशन और पासवर्ड रिकवरी (Authentication & Password Recovery)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `POST` | `/register` | `{ name, email, phone, password, password_confirmation, role, state, district, taluka, village, referral_code }` | नए यूजर का रजिस्ट्रेशन करने के लिए। |
| `POST` | `/login` | `{ email, password }` | यूजर लॉगिन करने और Bearer Token प्राप्त करने के लिए। |
| `POST` | `/account/reactivate` | `{ email, password }` | निष्क्रिय (Deactivated) या हटाए गए अकाउंट को पुनः सक्रिय (Reactivate) करने के लिए। |
| `POST` | `/register/request-otp` | `{ email, phone }` | रजिस्ट्रेशन प्रक्रिया के दौरान ईमेल/फ़ोन पर सत्यापन OTP भेजने के लिए। |
| `POST` | `/register/verify-otp` | `{ email, phone, otp }` | रजिस्ट्रेशन OTP का सत्यापन करने के लिए। |
| `POST` | `/forgot-password/request-otp` | Form-Data: `{ email }` | फॉरगॉट पासवर्ड के लिए यूजर के ईमेल पर रीसेट OTP भेजने के लिए। |
| `POST` | `/forgot-password/verify-otp` | Form-Data: `{ email, otp }` | फॉरगॉट पासवर्ड के OTP को वेरिफ़ाई करने के लिए। |
| `POST` | `/forgot-password/reset-password` | Form-Data: `{ email, otp, password, password_confirmation }` | OTP वेरिफ़ाई होने के बाद नया पासवर्ड सेट करने के लिए। |

---

### 1.2 डिजिटल आईडी कार्ड सत्यापन (Public ID Card Verification)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/id-cards/verify/:token` | URL Param: `token` (QR कोड या टोकन स्ट्रिंग) | किसी भी यूजर/रिपोर्टर के डिजिटल आईडी कार्ड के QR कोड को स्कैन करके उसकी प्रामाणिकता (Authenticity) वेरिफ़ाई करने के लिए। |

---

### 1.3 न्यूज़, रील्स और फीड्स (Public News Feed & Content)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/news` | Query: `?page=1&per_page=20&type=1&category=...&state=...&district=...&search=...&cursor=...` | पब्लिक न्यूज़ आर्टिकल्स की लिस्ट फ़िल्टर और पेजिनेशन के साथ प्राप्त करने के लिए। |
| `GET` | `/feeds` | Query: `?page=1&per_page=20&type=2&cursor=...` | शॉर्ट वीडियो रील्स (Feeds) की सूची प्राप्त करने के लिए। |
| `GET` | `/news/:id` | URL Param: `id` (News ID) | किसी विशिष्ट न्यूज़ पोस्ट की पूरी डिटेल (टाइटल, विवरण, मीडिया, व्यूज, लाइक्स) प्राप्त करने के लिए। |
| `POST` | `/news/:id/share` | URL Param: `id` | न्यूज़ आर्टिकल का शेयर काउंट बढ़ाने और शेयर लिंक प्राप्त करने के लिए। |
| `POST` | `/counts` | JSON: `{ news_id }` | न्यूज़ पोस्ट पर व्यूज (View Count) को रिकॉर्ड करने के लिए। |
| `GET` | `/newspapers` | Query: `?date=YYYY-MM-DD` | डिजिटल समाचार पत्र (E-Papers) के संस्करणों की सूची प्राप्त करने के लिए। |
| `GET` | `/newspapers/:id` | URL Param: `id` | किसी विशिष्ट ई-पेपर संस्करण या पीडीएफ को डाउनलोड/देखने के लिए। |

---

### 1.4 न्यूज़ कमेंट्स और चर्चा (Public Comments & Discussions)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/comments/:newsId` | Query: `?page=1&per_page=20&cursor=...` | किसी न्यूज़ पोस्ट के कमेंट्स की सूची देखने के लिए। |
| `GET` | `/comments/:newsId/detailed` | Query: `?cursor=...&per_page=20` | किसी पोस्ट के विस्तृत कमेंट्स (रिप्लाई काउंट्स और थ्रेडिंग सहित) प्राप्त करने के लिए। |
| `GET` | `/comments/:commentId/replies` | Query: `?cursor=...&per_page=20` | किसी मुख्य कमेंट के नीचे आए रिप्लाई (Nested Replies) प्राप्त करने के लिए। |

---

### 1.5 स्पॉन्सर्ड विज्ञापन (Public Sponsored Ads)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/ads-details` | None | होम पेज, पॉप-अप और फीड में प्रदर्शित होने वाले सभी सक्रिय विज्ञापनों की सूची प्राप्त करने के लिए। |
| `GET` | `/ads-details/:id` | URL Param: `id` (Ad ID) | किसी विशिष्ट विज्ञापन का पूरा विवरण (इमेज, वीडियो, रीडायरेक्शन लिंक, लीड फॉर्म) देखने के लिए। |
| `POST` | `/ads-views` | Form-Data: `{ ads_id, user_id? }` | किसी विज्ञापन का इम्प्रेशन या व्यू काउंट रिकॉर्ड करने के लिए। |

---

### 1.6 ई-कॉमर्स व मार्केटप्लेस (Public E-Commerce Listings & Inquiries)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/ecom-details` | Query: फ़िल्टर (श्रेणी, शहर, उपलब्धता) | मार्केटप्लेस में बेचे जा रहे सभी प्रोडक्ट्स और लिस्टिंग्स को ब्राउज़ करने के लिए। |
| `GET` | `/ecom-details/:id` | URL Param: `id` (Product ID) | किसी विशिष्ट प्रोडक्ट की पूरी जानकारी (कीमत, विवरण, फोटो, सेलर की जानकारी) प्राप्त करने के लिए। |
| `POST` | `/ecom-enquiries` | Form-Data: `{ ecom_id, name, phone, email, message }` | ग्राहक द्वारा किसी प्रोडक्ट के विक्रेता को अपनी इन्क्वायरी / मैसेज भेजने के लिए। |

---

### 1.7 सब्सक्रिप्शन व मेंबरशिप प्लान्स की सूची (Public Subscription Plans)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/role-subscription-plans` | Query: `?user_id=...&state=...&district=...&taluka=...` | उपलब्ध रोल/सदस्यता प्लान्स (राज्य, जिला, तहसील, रिपोर्टर) की सूची देखने के लिए। |
| `GET` | `/subscription-plans` | None | विज्ञापन (Ads Packages) के लिए उपलब्ध प्लान्स की सूची देखने के लिए। |
| `GET` | `/quiz-subscription-plans` | None | क्विज़ और ऑनलाइन परीक्षा के अभ्यास सब्सक्रिप्शन प्लान्स की सूची देखने के लिए। |

---

### 1.8 पब्लिक यूजर प्रोफाइल (Public User Profiles)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/profile/:id` | URL Param: `id` (User ID) | किसी भी यूजर/रिपोर्टर की पब्लिक प्रोफाइल (नाम, बायो, अवतार, पोस्ट्स, फॉलोअर्स संख्या) देखने के लिए। |

---

## 🔒 भाग 2: PROTECTED APIs (लॉगिन आवश्यक / Requires Bearer Token)

इन APIs को कॉल करने के लिए अनुरोध के हेडर में वैध टोकन होना अनिवार्य है:  
`Authorization: Bearer <auth_token>`

---

### 2.1 यूजर प्रोफाइल और लोकेशन (User Profile & Hierarchy)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/profile` | None | लॉगिन यूजर की पूरी निजी प्रोफाइल, असाइन किए गए रोल्स, मेंबरशिप स्टेटस और परमिशन प्राप्त करने के लिए। |
| `POST` | `/profile` | Form-Data: `{ name, email, phone, bio }` | यूजर के प्रोफाइल टेक्स्ट डिटेल्स (नाम, ईमेल, फोन नंबर, बायो) को अपडेट करने के लिए। |
| `POST` | `/profile/image` | Form-Data: `{ profile_image: <file> }` | प्रोफाइल फोटो अपलोड या चेंज करने के लिए (सामान्य यूजर के लिए पहली बार फ्री, उसके बाद सब्सक्रिप्शन अनिवार्य)। |
| `GET` | `/state` | None | यूजर का वर्तमान असाइन किया गया भौगोलिक क्षेत्र (राज्य, जिला, तहसील, ग्राम) प्राप्त करने के लिए। |
| `POST` | `/state` | JSON / Form-Data: `{ state, district, taluka, village }` | यूजर का राज्य, जिला, तहसील या गांव का असाइनमेंट अपडेट करने के लिए। |
| `POST` | `/account` | None | यूजर अकाउंट को निष्क्रिय (Deactivate) या स्थायी रूप से डिलीट करने के लिए। |

---

### 2.2 न्यूज़ और रील्स मैनेजमेंट (News & Video Post Creation/Management)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `POST` | `/news` | Multipart Form-Data: `{ type, title, subTitle, description, reportType, media, media_type, extra_images, music_id, music_url, music_volume, mute_original, voice, use_frame, frame_template, frame_merged }` | नई न्यूज़ या वीडियो रील पब्लिश करने के लिए (फ़्रेम, म्यूज़िक और वॉइस-ओवर सपोर्ट सहित)। |
| `POST` / `PUT` | `/news/:id` | Multipart Form-Data | पहले से पोस्ट की गई न्यूज़ या वीडियो के कंटेंट को एडिट/अपडेट करने के लिए। |
| `DELETE` | `/news/:id` | URL Param: `id` | अपनी पोस्ट की गई न्यूज़ या वीडियो को डिलीट करने के लिए। |
| `POST` | `/news/:id/status` | Form-Data: `{ status }` | न्यूज़ पोस्ट का स्टेटस बदलने के लिए (उदा. ड्राफ्ट, पब्लिश, अनपब्लिश)। |
| `GET` | `/my-news` | Query: `?type=1` (News) या `?type=2` (Feed) | वर्तमान लॉगिन यूजर द्वारा पब्लिश किए गए सभी आर्टिकल्स और वीडियो की लिस्ट देखने के लिए। |
| `GET` | `/my-news/:id` | URL Param: `id` | यूजर की अपनी पोस्ट की गई न्यूज़ की विस्तृत जानकारी प्राप्त करने के लिए। |

---

### 2.3 सोशल इंटरेक्शन, फॉलो और मॉडरेशन (Social Engagements & Moderation)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `POST` | `/likes` | Form-Data / JSON: `{ news_id, user_id, ads_id }` | किसी न्यूज़ पोस्ट या विज्ञापन को लाइक करने के लिए। |
| `DELETE` | `/likes/:newsId` | URL Param: `newsId` | किसी न्यूज़ पोस्ट से अपना लाइक हटाने (Unlike) के लिए। |
| `POST` | `/comments` | Form-Data: `{ news_id, comment }` | न्यूज़ आर्टिकल पर अपना कमेंट सबमिट करने के लिए। |
| `POST` | `/comments/:commentId` | JSON: `{ text }` | अपने कमेंट के टेक्स्ट को एडिट करने के लिए। |
| `POST` (Delete) | `/comments/:commentId` | URL Param: `commentId` | अपने कमेंट को डिलीट करने के लिए। |
| `POST` | `/comments/:commentId/like` | URL Param: `commentId` | किसी के कमेंट को लाइक करने के लिए। |
| `POST` | `/comments/:commentId/replies` | JSON: `{ text }` | किसी कमेंट का रिप्लाई (थ्रेडेड रिप्लाई) पोस्ट करने के लिए। |
| `POST` | `/comment-replies/:replyId` | JSON: `{ text }` | अपने रिप्लाई टेक्स्ट को एडिट करने के लिए। |
| `DELETE` | `/comment-replies/:replyId` | URL Param: `replyId` | अपने रिप्लाई को डिलीट करने के लिए। |
| `POST` | `/comment-replies/:replyId/like` | URL Param: `replyId` | किसी रिप्लाई को लाइक करने के लिए। |
| `POST` | `/users/follow` | JSON: `{ target_id, email }` | किसी अन्य यूजर/रिपोर्टर को फॉलो करने के लिए। |
| `POST` | `/users/unfollow` | JSON: `{ target_id, email }` | किसी यूजर को अनफॉलो करने के लिए। |
| `GET` | `/users/followers` | Query: `?user_id=...` | यूजर के सभी फॉलोअर्स की सूची प्राप्त करने के लिए। |
| `GET` | `/users/following` | Query: `?user_id=...` | यूजर द्वारा फॉलो किए जा रहे लोगों की सूची देखने के लिए। |
| `POST` | `/users/block` | JSON: `{ user_id }` | किसी अनुचित यूजर को ब्लॉक करने के लिए। |
| `POST` | `/users/unblock` | JSON: `{ user_id }` | पहले से ब्लॉक किए गए यूजर को अनब्लॉक करने के लिए। |
| `GET` | `/users/blocked` | None | वर्तमान यूजर द्वारा ब्लॉक किए गए सभी अकाउंट्स की सूची प्राप्त करने के लिए। |
| `POST` | `/news/:newsId/report` | JSON: `{ reason, details }` | किसी फेक या आपत्तिजनक न्यूज़ पोस्ट की रिपोर्ट सबमिट करने के लिए। |
| `POST` | `/users/:userId/report` | JSON: `{ reason, details }` | किसी फ्रॉड या आपत्तिजनक प्रोफाइल की एडमिन को रिपोर्ट सबमिट करने के लिए। |

---

### 2.4 डिजिटल पहचान पत्र (Digital ID Cards)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/id-cards` | None | लॉगिन यूजर के सभी सक्रिय डिजिटल आईडी कार्ड्स (पदनाम, वैलिडिटी, क्यूआर कोड) प्राप्त करने के लिए। |
| `POST` | `/id-cards` | JSON: `{ role_id, ... }` | यूजर के लिए नए पद का डिजिटल आईडी कार्ड जनरेट या इश्यू करने के लिए। |

---

### 2.5 विज्ञापन प्रबंधन (Advertiser Management)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `POST` | `/ads-details` | Multipart Form-Data: `{ title, description, image, url, ads_sub_id, redirection, redirection_url, start_date, end_date, status, images, video }` | नया विज्ञापन (इमेज/वीडियो/लीड फॉर्म) बनाकर सबमिट करने के लिए। |
| `POST` / `PUT` | `/ads-details/:id` | Multipart Form-Data | पहले से चल रहे विज्ञापन की सामग्री या सेटिंग्स अपडेट करने के लिए। |
| `DELETE` | `/ads-details/:id` | URL Param: `id` | अपने किसी विज्ञापन कैंपेन को डिलीट करने के लिए। |
| `GET` | `/ads-views` | None | यूजर के विज्ञापनों पर मिले कुल व्यूज और इम्प्रेशन एनालिटिक्स प्राप्त करने के लिए। |
| `GET` | `/ads-views/:adsId` | URL Param: `adsId` | किसी एक विज्ञापन कैंपेन की व्यू स्टेटिस्टिक्स प्राप्त करने के लिए। |

---

### 2.6 विक्रेता व मार्केटप्लेस प्रबंधन (Seller & Product Management)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `POST` | `/ecom-details` | Multipart Form-Data: `{ ecom_sub_id, category, product_name, in_stock, price, description, city, contact, start_date, end_date, images }` | ई-कॉमर्स मार्केटप्लेस में नया उत्पाद (Product) लिस्ट करने के लिए। |
| `POST` | `/ecom-details/:id` | Multipart Form-Data | लिस्टेड प्रोडक्ट की कीमत, फोटो, विवरण आदि अपडेट करने के लिए। |
| `POST` (Status) | `/ecom-details/:id` | Form-Data: `{ status }` | प्रोडक्ट की एक्टिव / इन-एक्टिव स्थिति को बदलने के लिए। |
| `POST` (Stock) | `/ecom-details/:id` | Form-Data: `{ in_stock: '1'/'0' }` | प्रोडक्ट का स्टॉक स्टेटस (In Stock / Out of Stock) टॉगल करने के लिए। |
| `POST` (Delete) | `/ecom-details/:id` | URL Param: `id` | लिस्टेड प्रोडक्ट को मार्केटप्लेस से डिलीट करने के लिए। |
| `GET` | `/ecom-enquiries` | None | वर्तमान यूजर द्वारा अन्य विक्रेताओं से की गई इन्क्वायरीज की सूची। |
| `GET` | `/ecom-enquiries/received` | Query: `?cursor=...&ecom_id=...&status=...&per_page=20` | विक्रेता द्वारा अपने उत्पादों पर ग्राहकों से प्राप्त इन्क्वायरीज (Customer Leads) देखने के लिए। |
| `GET` | `/ecom-enquiries/:id` | URL Param: `id` | किसी विशिष्ट ग्राहक इन्क्वायरी की पूरी बातचीत और संपर्क विवरण देखने के लिए। |
| `PUT` / `POST` | `/ecom-enquiries/:id` | Form-Data / JSON: `{ status }` | इन्क्वायरी का स्टेटस (New, Contacted, Completed) अपडेट करने के लिए। |
| `DELETE` | `/ecom-enquiries/:id` | URL Param: `id` | किसी इन्क्वायरी रिकॉर्ड को डिलीट करने के लिए। |
| `GET` | `/ecom-subscriptions` | None | यूजर के सक्रिय ई-कॉमर्स सेलिंग सब्सक्रिप्शन पैकेज देखने के लिए। |
| `POST` | `/ecom-subscriptions/purchase` | JSON: `{ plan_id }` | ई-कॉमर्स सेलिंग पैकेज खरीदने के लिए Razorpay आर्डर जनरेट करने के लिए। |
| `GET` | `/admin-rti/ecom-enquiries` | Query: `?enq_status=...` | एडमिन द्वारा सभी प्लेटफॉर्म इन्क्वायरीज को मॉनिटर करने के लिए। |
| `POST` | `/admin-rti/ecom-enquiries/:id/status` | Form-Data: `{ status }` | एडमिन द्वारा इन्क्वायरी स्टेटस बदलने के लिए। |

---

### 2.7 सदस्यता, सब्सक्रिप्शन और रेजरपे पेमेंट्स (Subscriptions & Razorpay Payments)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `POST` | `/role-subscriptions/purchase` | JSON: `{ plan_id, role_id, state_id, district_id, taluka_id }` | रिपोर्टर/अधिकारी पद सदस्यता के लिए Razorpay आर्डर आईडी जनरेट करने के लिए। |
| `POST` | `/role-subscriptions/payment/verify` | JSON: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature, plan_id, ... }` | रेजरपे पेमेंट सिग्नेचर वेरिफ़ाई करके पद सदस्यता सक्रिय (Activate) करने के लिए। |
| `POST` | `/role-subscriptions/payment/failed` | JSON: `{ order_id, reason, error_code }` | रोल पेमेंट के विफल होने पर बैकएंड में विफलता लॉग रिकॉर्ड करने के लिए। |
| `GET` | `/my-role-subscriptions` | None | यूजर की वर्तमान में सक्रिय सभी रोल मेंबरशिप्स और असाइन की गई सीटों की सूची देखने के लिए। |
| `GET` | `/my-subscriptions` | None | यूजर के सभी प्रकार के एक्टिव सब्सक्रिप्शन्स (Ads, Ecom, Role) की सूची देखने के लिए। |
| `POST` | `/subscription-plans/purchase` | JSON: `{ plan_id }` | विज्ञापन पैकेज सब्सक्रिप्शन के लिए Razorpay पेमेंट आर्डर बनाने के लिए। |
| `POST` | `/subscriptions/payment/verify` | JSON: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }` | विज्ञापन या ई-कॉमर्स सब्सक्रिप्शन पेमेंट को वेरिफ़ाई और एक्टिवेट करने के लिए। |
| `POST` | `/subscriptions/payment/failed` | JSON: `{ order_id, reason }` | सब्सक्रिप्शन पेमेंट फेलियर रिकॉर्ड करने के लिए। |

---

### 2.8 इनवॉइस और पेमेंट हिस्ट्री (Payment History & Invoices)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/payment-history` | Query: `?page=1&per_page=20&type=...` | यूजर द्वारा किए गए सभी भुगतानों (Subscriptions, Orders) और उनकी रसीदों का इतिहास देखने के लिए। |
| `POST` | `/payment/send-invoice` | JSON: `{ payment_id, invoice_number, email }` | उपयोगकर्ता को 18% GST (SAC: 998431) वाली आधिकारिक टैक्स इनवॉइस की कॉपी उनके ईमेल पर भेजने के लिए (सपोर्ट: `rticheck@gmail.com`)। |

---

### 2.9 वॉलेट, रेफरल और निकासी (Wallet, Referrals & Withdrawals)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/wallet` | None | यूजर के वॉलेट का उपलब्ध बैलेंस, कुल कमाई, और पेंडिंग राशि प्राप्त करने के लिए। |
| `GET` | `/wallet/commissions` | Query: `?status=...&level=...&page=1&per_page=20` | रेफरल डाउनलाइन और टीम से मिली कमीशन आय का पूरा ब्योरा प्राप्त करने के लिए। |
| `GET` | `/wallet/transactions` | Query: `?type=credit/debit&page=1&per_page=20` | वॉलेट पासबुक (क्रेडिट और डेबिट लेनदेन का विस्तृत इतिहास) देखने के लिए। |
| `GET` | `/wallet/withdrawals` | Query: `?page=1&per_page=20` | बैंक खाते या UPI में किए गए विड्रॉल (पैसे निकालने) के अनुरोधों की सूची और स्थिति देखने के लिए। |
| `POST` | `/wallet/withdrawals` | JSON: `{ amount, payment_method, upi_id, account_number, ifsc_code, bank_name, beneficiary_name }` | वॉलेट बैलेंस को अपने बैंक खाते या UPI आईडी में ट्रांसफर करने का अनुरोध सबमिट करने के लिए। |
| `PATCH` | `/wallet/withdrawals/:id/cancel` | URL Param: `id` (Withdrawal ID) | किसी पेंडिंग विड्रॉल अनुरोध को रद्द करके पैसे वापस वॉलेट में जोड़ने के लिए। |
| `GET` | `/referral` | None | यूजर का रेफरल कोड, इनवाइट लिंक, जुड़े हुए मेंबर्स की संख्या और रेफरल रिवार्ड्स की जानकारी देखने के लिए। |

---

### 2.10 क्विज़, ट्रेनिंग और सर्टिफिकेशन (Quiz & Certification System)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/quiz-types/:type` | Path: `:type` (`practice`, `training`, `exam`), Query: `?subject=...&difficulty=...` | क्विज़ मोड के अनुसार परीक्षा प्रश्न और विकल्प प्राप्त करने के लिए। |
| `POST` | `/quiz/start` | JSON: `{ quiz_type, subject, difficulty }` | टाइमर के साथ एक नया टेस्ट/एग्जाम सत्र (Attempt) शुरू करने के लिए। |
| `POST` | `/quiz/submit` | JSON: `{ attempt_id, answers: [{ question_id, selected_option }] }` | प्रश्नोत्तरी के उत्तर सबमिट करने और स्कोर व पास/फेल रिजल्ट जनरेट करने के लिए। |
| `GET` | `/quiz/result/:attemptId` | URL Param: `attemptId` | दिए गए एग्जाम का स्कोरकार्ड, प्रतिशत, सही/गलत उत्तर विश्लेषण देखने के लिए। |
| `GET` | `/quiz/history` | Query: `?user_id=<id>&quiz_type=exam` | यूजर के पुराने सभी एग्जाम प्रयासों का इतिहास और सर्टिफिकेट पात्रता देखने के लिए। |
| `POST` | `/quiz-subscriptions/purchase` | JSON: `{ plan_id }` | क्विज़ अभ्यास योजना का Razorpay पेमेंट आर्डर बनाने के लिए। |
| `POST` | `/quiz-subscriptions/payment/verify` | JSON: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }` | क्विज़ सब्सक्रिप्शन भुगतान वेरिफ़ाई करने के लिए। |
| `GET` | `/my-quiz-subscriptions` | None | यूजर के एक्टिव क्विज़ सब्सक्रिप्शन्स की सूची देखने के लिए। |
| `POST` | `/quiz-subscriptions/payment/failed` | JSON: `{ order_id, reason }` | क्विज़ पेमेंट फेल होने की स्थिति रिकॉर्ड करने के लिए। |

---

### 2.11 नोटिफिकेशन और पुश डिवाइस टोकन्स (Notifications & Push Tokens)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/notifications` | Query: `?per_page=20&cursor=...&unread=1` | यूजर के इन-ऐप नोटिफिकेशन्स की सूची कर्सर पेजिनेशन के साथ प्राप्त करने के लिए। |
| `GET` | `/notifications/unread-count` | None | ऐप हेडर/बेल आइकन पर अनरीड नोटिफिकेशन्स की संख्या का बैज दिखाने के लिए। |
| `POST` | `/notifications/:id/read` | URL Param: `id` | किसी विशिष्ट नोटिफिकेशन को पढ़ा हुआ (Read) मार्क करने के लिए। |
| `POST` | `/notifications/read-all` | None | यूजर के सभी अनरीड नोटिफिकेशन्स को एक साथ पढ़ा हुआ मार्क करने के लिए। |
| `DELETE` | `/notifications/:id` | URL Param: `id` | किसी नोटिफिकेशन को इनबॉक्स से हटाने के लिए। |
| `POST` | `/device-tokens` | JSON: `{ token, platform, device_name }` | डिवाइस का FCM / Expo पुश नोटिफिकेशन टोकन रजिस्टर करने के लिए। |
| `DELETE` | `/device-tokens` | JSON: `{ token }` | यूजर के लॉगआउट करने पर पुश नोटिफिकेशन टोकन को डी-रजिस्टर करने के लिए। |

---

### 2.12 यूट्यूब लाइव स्ट्रीमिंग (YouTube Live Streaming)

| मेथड | एंडपॉइंट (Endpoint) | पेलोड / पैरामीटर्स | विवरण (Purpose) |
|---|---|---|---|
| `GET` | `/youtube/auth` | Query: `?token=...` | यूजर का यूट्यूब चैनल कनेक्ट करने के लिए Google OAuth ऑथेंटिकेशन URL प्राप्त करने के लिए। |
| `GET` | `/youtube/live/list` | None | यूजर द्वारा शेड्यूल किए गए या चल रहे यूट्यूब लाइव ब्रॉडकास्ट्स की सूची प्राप्त करने के लिए। |
| `POST` | `/youtube/live/create` | JSON: `{ title, privacy_status, scheduled_start_time }` | यूट्यूब पर नया लाइव ब्रॉडकास्ट स्ट्रीम शेड्यूल/क्रिएट करने के लिए। |
| `POST` | `/youtube/live/start` | JSON: `{ broadcast_id }` | शेड्यूल किए गए ब्रॉडकास्ट को आधिकारिक रूप से Live शुरू करने के लिए। |
| `POST` | `/youtube/live/end` | JSON: `{ broadcast_id }` | चल रहे यूट्यूब लाइव ब्रॉडकास्ट को समाप्त (End Stream) करने के लिए। |

---

## 🌍 भाग 3: बाहरी सेवाएँ (External Services)

| सेवा का नाम | मेथड | URL | विवरण (Purpose) |
|---|---|---|---|
| Google Cloud Translation API v2 | `POST` | `https://translation.googleapis.com/language/translate/v2?key=...` | ऐप में विभिन्न भारतीय भाषाओं (हिंदी, मराठी, गुजराती, बंगाली, तमिल आदि) में रियल-टाइम टेक्स्ट ट्रांसलेशन के लिए। |

---

## 📊 संक्षेप आँकड़े (Summary Statistics)

- **कुल एंडपॉइंट्स (Total Endpoints):** 70+ अद्वितीय एंडपॉइंट्स (CRUD परिचालनों सहित)
- **पब्लिक एंडपॉइंट्स (Public Endpoints):** 21
- **प्रोटेक्टेड एंडपॉइंट्स (Protected Endpoints):** 50+
- **प्रमाणीकरण प्रारूप (Auth Scheme):** `Bearer <JWT_TOKEN>`
- **कंटेंट प्रकार (Data Formats):** `application/json` एवं `multipart/form-data` (मीडिया अपलोड्स के लिए)

