// screens/NotificationsScreen.js
// ⚠️ Ye purana "bina sidebar" wala duplicate Notifications page tha — hata diya gaya.
// Ab sirf ek hi page hai: pages/NotificationsScreen.js (sidebar wale QuickMenu ke andar khulta hai).
// Agar navigator me ab bhi ye file import ho rahi ho to ye bas wahi page re-export karti hai,
// aur wo desktop web par apne aap sidebar wale QuickMenu me redirect ho jata hai.
// Navigator me import `../pages/NotificationsScreen` kar do to is file ko delete kar sakte ho.
export { default } from '../pages/NotificationsScreen';