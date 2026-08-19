import { create } from 'zustand';

// ─── Default data (all empty/dynamic) ─────────────────────────────────────────────
const defaultHeader = {
  newspaperName: '',
  tagline: '',
  date: '',
  contact1: '',
  contact2: '',
  website: '',
  extra: '',
  regNo: '',
  govtText1: '',
  govtText2: '',
  rtiAll: '',
  rtiIndia: '',
  rtiRti: '',
  rtiNetwork: '',
  editorName: '',
  editorTitle: '',
  officeInfo: '',
  logoUri: '',
  bannerBgColor: '#111111',
  bannerTextColor: '#ffffff',
  dateBgColor: '#111111',
  dateTextColor: '#ffffff',
};

const defaultFooter = {
  content: '',
  bgColor: '#111111',
  textColor: '#ffffff',
};

const defaultHeadline = {
  title: '',
  sub: '',
  subsub: '',
  headlineBgColor: '#111111',
};

const defArticle = (title = '', sub = '', body = '', reporter = '', location = '') => ({
  title, 
  sub, 
  body, 
  reporter, 
  location, 
  date: '', 
  image: '',
});

const defaultSections = {
  header: defaultHeader,
  headline: defaultHeadline,
  left_big: defArticle(),
  left_small: defArticle(),
  center_top: defArticle(),
  center_mid: defArticle(),
  center_bottom: defArticle(),
  right: defArticle(),
  footer: defaultFooter,
  masthead: { date: '', title: '', website: '' },
  top_left: defArticle(),
  top_right: defArticle(),
  mid_left: defArticle(),
  mid_right: defArticle(),
  bot_main: defArticle(),
  bot_side: defArticle(),
  slogan: { text: '' },
};

// ─── Template Store ───────────────────────────────────────────────────────────
export const useTemplateStore = create((set) => ({
  templateId: 'layout1',
  setTemplate: (id) => set({ templateId: id }),
}));

// ─── Editor Store ─────────────────────────────────────────────────────────────
export const useEditorStore = create((set, get) => ({
  sections: JSON.parse(JSON.stringify(defaultSections)),
  activeSection: null,

  setActiveSection: (id) => set({ activeSection: id }),

  updateSection: (sectionId, key, value) =>
    set((state) => ({
      sections: {
        ...state.sections,
        [sectionId]: {
          ...state.sections[sectionId],
          [key]: value,
        },
      },
    })),

  resetAll: () =>
    set({
      sections: JSON.parse(JSON.stringify(defaultSections)),
      activeSection: null,
    }),

  getSectionData: (id) => get().sections[id] || {},
}));

// ─── Image Store ──────────────────────────────────────────────────────────────
export const useImageStore = create((set) => ({
  uploading: false,
  setUploading: (v) => set({ uploading: v }),
}));

// ─── PDF Store ────────────────────────────────────────────────────────────────
export const usePdfStore = create((set) => ({
  generating: false,
  lastUri: null,
  setGenerating: (v) => set({ generating: v }),
  setLastUri: (uri) => set({ lastUri: uri }),
}));