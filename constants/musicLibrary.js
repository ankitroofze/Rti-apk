// constants/musicLibrary.js
// Music library — sirf yeh 7 songs (assets/music folder se, app ke saath bundle hote hain).
// Koi server / CDN URL nahi chahiye: EAS update ya build me files khud upload ho jaati hain.
import { Asset } from 'expo-asset';

// NOTE: Metro me require() ka path static string hona chahiye (variable nahi chalega).
const RAW = [
  { id: 'local-01', title: 'Breaking News 1', artist: 'Mondamusic',    module: require('../assets/music/mondamusic-breaking-news-2-560152.mp3') },
  { id: 'local-02', title: 'Breaking News 2', artist: 'Krasnoshchok',  module: require('../assets/music/krasnoshchok-news-breaking-news-music-529078.mp3') },
  { id: 'local-03', title: 'Breaking News 3', artist: 'Nastelbom',     module: require('../assets/music/nastelbom-breaking-news-513433.mp3') },
  { id: 'local-04', title: 'Breaking News 4', artist: 'Paulyudin',     module: require('../assets/music/paulyudin-breaking-news-113982.mp3') },
  { id: 'local-05', title: 'Breaking News 5', artist: 'Paulyudin',     module: require('../assets/music/paulyudin-breaking-news-494566.mp3') },
  { id: 'local-06', title: 'Breaking News 6', artist: 'Sigmamusicart', module: require('../assets/music/sigmamusicart-breaking-news-252187.mp3') },
  { id: 'local-07', title: 'Breaking News 7', artist: 'The Mountain',  module: require('../assets/music/the_mountain-news-news-music-490008.mp3') },
];

export const MUSIC_LIBRARY = RAW.map((s) => ({ ...s, cover: null, url: null }));

// Song ko playable URI me badlo. `url` = phone par local file:// (player + on-device merge dono ke liye),
// `remoteUrl` = https link (sirf tab jab available ho — server-side fallback merge ke liye).
export async function resolveSong(song) {
  const asset = Asset.fromModule(song.module);
  try { await asset.downloadAsync(); } catch (_) { /* uri se hi try karenge */ }
  const url = asset.localUri || asset.uri;
  const remoteUrl = /^https?:/i.test(String(asset.uri || '')) ? asset.uri : null;
  return { ...song, url, remoteUrl };
}