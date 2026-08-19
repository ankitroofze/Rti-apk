const fs = require('fs');
const path = require('path');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function toTitleCase(s) {
  return String(s || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.length ? w[0].toUpperCase() + w.slice(1) : w)
    .join(' ');
}

function normalizeStateName(s) {
  const raw = String(s || '').trim();
  const upper = raw.toUpperCase();
  if (upper.startsWith('THE ')) return raw.slice(4).trim();
  return raw;
}

function normalizeKey(s) {
  return String(s || '')
    .trim()
    .toUpperCase()
    .replace(/&/g, 'AND')
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readCsvRows(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { header: [], rows: [] };
  const header = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    rows.push(parseCsvLine(lines[i]));
  }
  return { header, rows };
}

function uniqSorted(arr) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

const root = process.cwd();
const stateCsv = path.join(root, 'data', 'lgd', '1-state.csv');
const districtCsv = path.join(root, 'data', 'lgd', '2-district.csv');
const subdistrictCsv = path.join(root, 'data', 'lgd', '3-subdistrict.csv');

if (!fs.existsSync(stateCsv) || !fs.existsSync(districtCsv) || !fs.existsSync(subdistrictCsv)) {
  console.error('Missing LGD CSV files under data/lgd/.');
  process.exit(1);
}

const statesData = readCsvRows(stateCsv);
const districtsData = readCsvRows(districtCsv);
const subdistrictsData = readCsvRows(subdistrictCsv);

const canonicalStateByKey = {};
const stateDisplayNames = [];

for (const row of statesData.rows) {
  const stateNameRaw = normalizeStateName(row[3] || row[4] || '');
  if (!stateNameRaw) continue;
  const stateName = toTitleCase(stateNameRaw);
  const key = normalizeKey(stateNameRaw);
  canonicalStateByKey[key] = stateName;
  stateDisplayNames.push(stateName);
}

const states = uniqSorted(stateDisplayNames);

const districtsByState = {};
for (const row of districtsData.rows) {
  const stateNameRaw = normalizeStateName(row[1] || '');
  const districtNameRaw = String(row[3] || '').trim();
  if (!stateNameRaw || !districtNameRaw) continue;

  const stateKey = normalizeKey(stateNameRaw);
  const state = canonicalStateByKey[stateKey] || toTitleCase(stateNameRaw);
  const district = toTitleCase(districtNameRaw);

  if (!districtsByState[state]) districtsByState[state] = [];
  districtsByState[state].push(district);
}
for (const state of Object.keys(districtsByState)) {
  districtsByState[state] = uniqSorted(districtsByState[state]);
}

const talukasByStateDistrict = {};
for (const row of subdistrictsData.rows) {
  const stateNameRaw = normalizeStateName(row[2] || '');
  const districtNameRaw = String(row[4] || '').trim();
  const subNameRaw = String(row[7] || '').trim();
  if (!stateNameRaw || !districtNameRaw || !subNameRaw) continue;

  const stateKey = normalizeKey(stateNameRaw);
  const state = canonicalStateByKey[stateKey] || toTitleCase(stateNameRaw);
  const district = toTitleCase(districtNameRaw);
  const taluka = toTitleCase(subNameRaw);

  if (!talukasByStateDistrict[state]) talukasByStateDistrict[state] = {};
  if (!talukasByStateDistrict[state][district]) talukasByStateDistrict[state][district] = [];
  talukasByStateDistrict[state][district].push(taluka);
}
for (const state of Object.keys(talukasByStateDistrict)) {
  for (const district of Object.keys(talukasByStateDistrict[state])) {
    talukasByStateDistrict[state][district] = uniqSorted(talukasByStateDistrict[state][district]);
  }
}

// Add alias keys for legacy UI state names
const stateAliases = {
  'Andaman & Nicobar': 'Andaman And Nicobar Islands',
  'Jammu & Kashmir': 'Jammu And Kashmir',
  'Dadra & Nagar Haveli and Daman & Diu': 'Dadra And Nagar Haveli And Daman And Diu',
};

const out = {
  states,
  districtsByState,
  talukasByStateDistrict,
  stateAliases,
};

const outPath = path.join(root, 'data', 'location', 'india-location.json');
fs.writeFileSync(outPath, JSON.stringify(out));
console.log('Wrote', outPath);
console.log('States:', states.length, 'District states:', Object.keys(districtsByState).length);
