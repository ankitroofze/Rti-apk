// constants/musicLibrary.js
// Music library — these 7 songs (from assets/music, bundled with the app).
// No server / CDN URL needed: the files ship with the app / EAS update.
// To rename a song in the editor, just change its `title` below.
import { Asset } from 'expo-asset';

// NOTE: Metro needs require() paths to be static strings (no variables).
const RAW = [
  { id: 'local-01', title: 'Breaking News 2',          artist: 'Mondamusic',    code: '560152', module: require('../assets/music/mondamusic-breaking-news-2-560152.mp3') },
  { id: 'local-02', title: 'News Breaking News Music', artist: 'Krasnoshchok',  code: '529078', module: require('../assets/music/krasnoshchok-news-breaking-news-music-529078.mp3') },
  { id: 'local-03', title: 'Breaking News',            artist: 'Nastelbom',     code: '513433', module: require('../assets/music/nastelbom-breaking-news-513433.mp3') },
  { id: 'local-04', title: 'Breaking News',            artist: 'Paulyudin',     code: '113982', module: require('../assets/music/paulyudin-breaking-news-113982.mp3') },
  { id: 'local-05', title: 'Breaking News',            artist: 'Paulyudin',     code: '494566', module: require('../assets/music/paulyudin-breaking-news-494566.mp3') },
  { id: 'local-06', title: 'Breaking News',            artist: 'Sigmamusicart', code: '252187', module: require('../assets/music/sigmamusicart-breaking-news-252187.mp3') },
  { id: 'local-07', title: 'News Music',               artist: 'The Mountain',  code: '490008', module: require('../assets/music/the_mountain-news-news-music-490008.mp3') },
];

export const MUSIC_LIBRARY = RAW.map((s) => ({ ...s, cover: null, url: null }));

// Turn a song into a playable URI. `url` = local file:// on the phone (player + on-device merge),
// `remoteUrl` = https link (only when available — for the server-side fallback merge).
export async function resolveSong(song) {
  const asset = Asset.fromModule(song.module);
  try { await asset.downloadAsync(); } catch (_) { /* fall back to uri */ }
  const url = asset.localUri || asset.uri;
  const remoteUrl = /^https?:/i.test(String(asset.uri || '')) ? asset.uri : null;
  return { ...song, url, remoteUrl };
}