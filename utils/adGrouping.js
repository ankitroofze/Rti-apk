// utils/adGrouping.js
// Ek hi user (owner) ke multiple ads ko ek group me jodta hai, taaki UI me
// wo ek hi ad slot ke andar swipe / arrows se dekhe ja sakein.
// Owner pehchan: owner_id, nahi to owner_email. Dono khaali ho to ad akela
// (solo) rahega — alag users galti se merge nahi honge.

export function groupAdsByOwner(ads = []) {
  const list = Array.isArray(ads) ? ads : [];
  const order = [];
  const map = new Map();
  const seenIds = new Set();
  list.forEach((ad, i) => {
    if (!ad) return;
    // same ad id dobara aaye (edit ke baad) to skip — ek ad ek hi baar
    if (ad.id != null) {
      const idKey = String(ad.id);
      if (seenIds.has(idKey)) return;
      seenIds.add(idKey);
    }
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

export function uniqueSponsoredAds(ads = []) {
  const seenIds = new Set();
  const seenCreatives = new Set();
  const seenCampaigns = new Set();

  return ads.filter((ad) => {
    if (!ad) return false;
    const id = String(ad.originalAdId ?? ad.ad_id ?? ad.id ?? '').trim().replace(/^ad-feed-/, '');
    const owner = String(ad.owner_id ?? ad.user_id ?? ad.owner_email ?? '').trim().toLowerCase();
    const title = String(ad.title || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const media = String(ad.video || ad.video_url || ad.image || ad.photo || ad.image_url || ad.images?.[0] || '')
      .trim().split(/[?#]/)[0];
    const creative = title && media ? JSON.stringify([owner, title, media]) : '';
    const destination = String(ad.redirection_url || ad.url || ad.extraValues?.website_url || ad.extraValues?.shop_url || '').trim();
    const description = String(ad.description || ad.excerpt || '').trim().replace(/\s+/g, ' ');
    // The same campaign can have a different media URL after a re-upload.
    const campaign = owner && title && destination
      ? JSON.stringify([owner, title, ad.redirect ?? ad.redirection, destination, description])
      : '';

    if (id && seenIds.has(id)) return false;
    if (id) seenIds.add(id);
    if (creative && seenCreatives.has(creative)) return false;
    if (campaign && seenCampaigns.has(campaign)) return false;
    if (creative) seenCreatives.add(creative);
    if (campaign) seenCampaigns.add(campaign);
    return true;
  });
}
