// constants/musicLibrary.js
// Free Music Library — 20-25 selected songs.
//
// ⚠️ SIRF wahi songs daalo jinke usage rights tumhare paas hon (royalty-free / licensed / khud ke).
// Audio file apne server / CDN par host karo (mp3, 128-192 kbps) aur cover image bhi.
// Neeche 24 slots ready hain — har entry me title, artist, cover aur url apna daalo.
const BASE = 'https://rtinews.in/music';   // <- apna music folder URL

const RAW = [
  ['Breaking Beat',     'RTI Studio'],
  ['News Pulse',        'RTI Studio'],
  ['Desh Pratham',      'RTI Studio'],
  ['Janta Ki Awaaz',    'RTI Studio'],
  ['Satya Ki Raah',     'RTI Studio'],
  ['Power Drive',       'RTI Studio'],
  ['Sunrise Mood',      'RTI Studio'],
  ['Village Vibes',     'RTI Studio'],
  ['City Rush',         'RTI Studio'],
  ['Inspire',           'RTI Studio'],
  ['Emotional Piano',   'RTI Studio'],
  ['Folk Dhol',         'RTI Studio'],
  ['Patriotic Flow',    'RTI Studio'],
  ['Calm Morning',      'RTI Studio'],
  ['Energy Boost',      'RTI Studio'],
  ['Reporter Theme',    'RTI Studio'],
  ['Night Story',       'RTI Studio'],
  ['Action Intro',      'RTI Studio'],
  ['Happy Day',         'RTI Studio'],
  ['Sad Violin',        'RTI Studio'],
  ['Festival Mood',     'RTI Studio'],
  ['Motivation',        'RTI Studio'],
  ['Chill Lofi',        'RTI Studio'],
  ['Outro Beat',        'RTI Studio'],
];

export const MUSIC_LIBRARY = RAW.map(([title, artist], i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    id: `song-${n}`,
    title,
    artist,
    cover: `${BASE}/covers/song-${n}.jpg`,
    url: `${BASE}/song-${n}.mp3`,
  };
});