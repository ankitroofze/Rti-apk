import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from 'react-native';

// ✅ Ab poora UI seedhe web (HTML) elements se bana hai — RN-web ScrollView/TextInput ki
//    height / autofill problems ki wajah se list gayab ho jaati thi.
//
// Shared searchable dropdown for Select State / District / Taluka / Village (WEB only).
//
// Pehle ke bugs:
//  1. FlatList height auto-parent me 0 ho jaati thi -> "maha" type karte hi list gayab.
//  2. Chrome is input ko address field samajh ke "Maharashtra / Manage addresses"
//     autofill popup dikhata tha (screenshot) -> autoComplete off + unique name.
//  3. Search sirf simple includes() tha -> ab case / extra spaces / accents / symbols
//     ignore hote hain, aur "starts with" results upar aate hain.

const MAX_RENDER = 300; // bahut bade lists (villages) me web ko hang hone se bachata hai

const norm = (v) =>
  String(v == null ? '' : v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function filterAndRank(items, query) {
  const list = Array.isArray(items) ? items.filter((i) => i != null && String(i).trim() !== '') : [];
  const q = norm(query);
  if (!q) return list;
  const words = q.split(' ');
  const compactQ = q.replace(/ /g, '');
  const starts = [];
  const wordStarts = [];
  const contains = [];
  for (const item of list) {
    const n = norm(item);
    const compact = n.replace(/ /g, '');
    if (n.startsWith(q) || compact.startsWith(compactQ)) starts.push(item);
    else if (words.every((w) => n.split(' ').some((t) => t.startsWith(w)))) wordStarts.push(item);
    else if (words.every((w) => n.includes(w)) || compact.includes(compactQ)) contains.push(item);
  }
  return [...starts, ...wordStarts, ...contains];
}

export default function LocationDropdownModal({ visible, title, items, selected, onSelect, onClose, placeholder, emptyText }) {
  const [search, setSearch] = useState('');
  const [locked, setLocked] = useState(true); // readOnly-until-focus: Chrome autofill popup ko rokta hai
  const [inputName] = useState(() => `rti_loc_${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => { if (!visible) { setSearch(''); setLocked(true); } }, [visible]);

  const filtered = useMemo(() => filterAndRank(items, search), [items, search]);
  const shown = filtered.length > MAX_RENDER ? filtered.slice(0, MAX_RENDER) : filtered;

  const pick = (item) => { onSelect(item); onClose(); setSearch(''); };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && shown.length > 0) { e.preventDefault(); pick(shown[0]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <div style={st.overlay} onClick={onClose}>
        <div style={st.sheet} onClick={(e) => e.stopPropagation()}>
          <div style={st.handle} />
          <div style={st.title}>{title}</div>

          <div style={st.searchWrap}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              style={st.searchInput}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder || 'Search...'}
              autoFocus
              readOnly={locked}
              onFocus={() => setLocked(false)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              name={inputName}
              id={inputName}
              aria-autocomplete="none"
              data-lpignore="true"
              data-form-type="other"
              data-1p-ignore="true"
            />
            {search ? (
              <button type="button" onClick={() => setSearch('')} style={st.clearBtn} aria-label="Clear search">✕</button>
            ) : null}
          </div>

          {shown.length === 0 ? (
            <div style={st.empty}>{emptyText || 'No results found'}</div>
          ) : (
            <div style={st.list}>
              {shown.map((item, index) => {
                const isSel = selected === item;
                return (
                  <div
                    key={`${item}-${index}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => pick(item)}
                    onKeyDown={(e) => { if (e.key === 'Enter') pick(item); }}
                    style={{ ...st.item, ...(isSel ? st.itemSelected : null) }}
                  >
                    <span style={{ ...st.itemText, ...(isSel ? st.itemTextSelected : null) }}>{String(item)}</span>
                    {isSel ? <span style={{ color: '#B91C1C', fontSize: 16 }}>✓</span> : null}
                  </div>
                );
              })}
              {filtered.length > MAX_RENDER ? (
                <div style={st.more}>Showing first {MAX_RENDER} of {filtered.length} — type more letters to narrow down</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

const FONT = "'Roboto', sans-serif";
const st = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box', zIndex: 99999 },
  sheet: { width: '100%', maxWidth: 420, maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 20, background: '#ffffff', padding: '20px 20px 24px', boxSizing: 'border-box', fontFamily: FONT },
  handle: { width: 40, height: 4, background: '#EEEEEE', borderRadius: 99, alignSelf: 'center', marginBottom: 14, flexShrink: 0 },
  title: { fontSize: 16, fontWeight: 800, color: '#111111', marginBottom: 12, textAlign: 'center', fontFamily: FONT, flexShrink: 0 },
  searchWrap: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, background: '#F8F8F8', border: '1.5px solid #EEEEEE', borderRadius: 12, padding: '9px 12px', marginBottom: 10, flexShrink: 0 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 14, color: '#111111', padding: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT },
  clearBtn: { border: 'none', background: 'transparent', color: '#9ca3af', fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1 },
  list: { overflowY: 'auto', maxHeight: 320, minHeight: 0, flex: '0 1 auto' },
  item: { minHeight: 43, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '0 14px', borderRadius: 12, marginBottom: 3, cursor: 'pointer', boxSizing: 'border-box' },
  itemSelected: { background: 'rgba(185,28,28,0.08)' },
  itemText: { flex: 1, fontSize: 14, color: '#111111', fontWeight: 500, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemTextSelected: { color: '#B91C1C', fontWeight: 700 },
  empty: { textAlign: 'center', color: '#9ca3af', padding: '20px 0', fontFamily: FONT },
  more: { textAlign: 'center', color: '#9ca3af', fontSize: 12, padding: '10px 0', fontFamily: FONT },
};