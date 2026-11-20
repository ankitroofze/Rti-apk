// Background me notifee notification tap hua to data yahan rakhte hain; app foreground aate hi bootstrap isse navigate karta hai.
let pending = null;
export const setPendingNotification = (data) => { pending = { data, at: Date.now() }; };
// 10 sec se purana pending ignore (killed-start par initial notification already handle ho chuka hota hai)
export const takePendingNotification = () => {
  const p = pending;
  pending = null;
  return p && Date.now() - p.at < 10000 ? p.data : null;
};
