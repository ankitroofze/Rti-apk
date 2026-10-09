// utils/adGrouping.js
// Ek hi user (owner) ke multiple ads ko ek group me jodta hai, taaki UI me
// wo ek hi ad slot ke andar swipe / arrows se dekhe ja sakein.
// Owner pehchan: owner_id, nahi to owner_email. Dono khaali ho to ad akela
// (solo) rahega — alag users galti se merge nahi honge.

export function groupAdsByOwner(ads = []) {
  const list = Array.isArray(ads) ? ads : [];
  const order = [];
  const map = new Map();
  list.forEach((ad, i) => {
    if (!ad) return;
    const owner = String(ad.owner_id ?? ad.owner_email ?? '').trim().toLowerCase();
    const key = owner || `solo-${ad.id ?? i}`;
    if (!map.has(key)) { map.set(key, []); order.push(key); }
    map.get(key).push(ad);
  });
  return order.map((key) => map.get(key));
}

// Feed ke liye: group me 2+ ads hon to pehle ad ke upar `adGroup` laga deta hai.
export function groupAdStories(ads = []) {
  return groupAdsByOwner(ads).map((group) => (
    group.length > 1 ? { ...group[0], adGroup: group } : group[0]
  ));
}