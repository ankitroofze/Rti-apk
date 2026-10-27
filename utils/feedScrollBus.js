// Home feed scroll events ko cards tak pahunchane ke liye chhota event bus.
// HomeScreen ka ScrollView onScroll me emitFeedScroll() bulata hai; jo video card play ho raha hai
// wo subscribe karke apni on-screen position check karta hai aur scroll out hote hi pause ho jata hai.
const listeners = new Set();

export function subscribeFeedScroll(fn) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function emitFeedScroll() {
  listeners.forEach((fn) => { try { fn(); } catch (_) { /* ignore */ } });
}