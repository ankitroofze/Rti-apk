// constants/frameTemplates.js
// News post ke liye "Breaking News" templates. Naya template add karna ho to:
//   1) png ko assets/frames/ me daalo (transparent bg, sirf banner),
//   2) neeche ek entry add karo. Baaki sab (picker, feed, preview) khud ho jayega.
//
// kind: 'lower' -> sirf neeche ka banner; photo / video poore box me aati hai, banner niche chipakta hai
// bands: banner ke andar text kahan chalega (sab values banner image ki width/height ka fraction hain)
//   source: 'title' | 'description' | 'both'
export const FRAME_TEMPLATES = [
  {
    id: 'glossy2',
    label: 'Orange Blue',
    kind: 'lower',
    asset: require('../assets/frames/frame-glossy2.png'),
    aspect: 1080 / 135,
    bands: [
      { source: 'both', left: 0.4, right: 0.905, top: 0.34, height: 0.4, color: '#FFFFFF', sep: '#FBBF24', speed: 40 },
    ],
  },
  {
    id: 'glossy1',
    label: 'Glossy Blue',
    kind: 'lower',
    asset: require('../assets/frames/frame-glossy1.png'),
    aspect: 1080 / 126,
    bands: [
      { source: 'both', left: 0.34, right: 0.925, top: 0.4, height: 0.42, color: '#FFFFFF', sep: '#FBBF24', speed: 40 },
    ],
  },
  {
    id: 'redbar',
    label: 'Red Bar',
    kind: 'lower',
    asset: require('../assets/frames/frame-redbar.png'),
    aspect: 1080 / 80,
    bands: [
      { source: 'both', left: 0.31, right: 0.895, top: 0.2, height: 0.58, color: '#FFF4CC', sep: '#FBBF24', speed: 40 },
    ],
  },
  {
    id: 'banner',
    label: 'White + Blue',
    kind: 'lower',
    asset: require('../assets/frames/frame-banner.png'),
    aspect: 1080 / 137,
    // 2 line banner: safed patti me TITLE, neeli patti me DESCRIPTION
    bands: [
      { source: 'title', left: 0.35, right: 0.945, top: 0.265, height: 0.33, color: '#0B1F4D', sep: '#DC2626', speed: 40 },
      { source: 'description', fallback: 'RTI INDIA NEWS', left: 0.35, right: 0.945, top: 0.645, height: 0.26, color: '#FFFFFF', sep: '#FBBF24', speed: 34 },
    ],
  },
];

// Purani posts (jinme template id nahi aata) isi template se dikhengi
export const DEFAULT_FRAME_ID = 'glossy2';

export function getFrameTemplate(id) {
  return FRAME_TEMPLATES.find((t) => t.id === id) || FRAME_TEMPLATES.find((t) => t.id === DEFAULT_FRAME_ID) || FRAME_TEMPLATES[0];
}