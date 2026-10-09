// locationData.js
// All-India State → District → Taluka data (LGD dump)
// Source files downloaded into `data/lgd/` and compiled into `data/location/india-location.json`.

import LGD from '../data/location/india-location.json';

// Some metro districts are missing taluka/tehsil splits in the compiled LGD dump.
// Provide a small override map so dropdowns still work for common cases.
const TALUKA_OVERRIDES = {
  Maharashtra: {
    'Mumbai Suburban': ['Andheri', 'Borivali', 'Kurla'],
    'Mumbai': ['Mumbai'],
  },
};

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/&/g, 'AND')
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveStateName(stateName) {
  const raw = String(stateName || '').trim();
  if (!raw) return '';

  const alias = LGD.stateAliases?.[raw];
  if (alias) return alias;

  const key = normalizeKey(raw);
  const match = (LGD.states || []).find((s) => normalizeKey(s) === key);
  return match || raw;
}

export const INDIAN_STATES = (LGD.states || []).filter((x) => !/[\u0900-\u097F]/.test(x));

export const getDistricts = (stateName) => {
  const state = resolveStateName(stateName);
return (LGD.districtsByState?.[state] || []).filter((x) => !/[\u0900-\u097F]/.test(x));
};

export const getTalukas = (stateName, districtName) => {
  const state = resolveStateName(stateName);
  const districtKey = normalizeKey(districtName);

  const overrideForState = TALUKA_OVERRIDES[state];
  if (overrideForState) {
    const overrideDistrict = Object.keys(overrideForState).find((d) => normalizeKey(d) === districtKey);
    if (overrideDistrict) return overrideForState[overrideDistrict].slice();
  }

  const districtMap = LGD.talukasByStateDistrict?.[state] || {};
  const district = Object.keys(districtMap).find((d) => normalizeKey(d) === districtKey);
  if (!district) return [];

 return (districtMap[district] || []).filter((x) => !/[\u0900-\u097F]/.test(x));
};

// Sheher ke areas (LGD village CSV me nahi hote) — yaha manually add kar sakte ho
const VILLAGE_OVERRIDES = {
  Maharashtra: {
    'Mumbai Suburban': {
      Borivali: [
        'Borivali East', 'Borivali West', 'Kandivali East', 'Kandivali West',
        'Malad East', 'Malad West', 'Dahisar East', 'Dahisar West',
        'Charkop', 'Gorai', 'Eksar', 'Magathane', 'Poisar', 'Shimpoli',
        'Mandapeshwar', 'Kulvem', 'Manori', 'Mith Chowky', 'Mahavir Nagar',
        'IC Colony', 'Lokhandwala Kandivali', 'Thakur Village', 'Samta Nagar',
        'Aksa', 'Marve', 'Madh', 'Erangal', 'Bhati',
      ],
      Andheri: [
        'Andheri East', 'Andheri West', 'Jogeshwari East', 'Jogeshwari West',
        'Goregaon East', 'Goregaon West', 'Vile Parle East', 'Vile Parle West',
        'Santacruz East', 'Santacruz West', 'Bandra East', 'Bandra West',
        'Khar East', 'Khar West', 'Juhu', 'Versova', 'Oshiwara', 'Lokhandwala',
        'Four Bungalows', 'Sakinaka', 'Marol', 'Chakala', 'MIDC', 'Seepz',
        'Vakola', 'Kalina', 'Bandra Kurla Complex', 'Film City', 'Aarey Colony',
        'Mahakali', 'Ram Mandir', 'Ghatla', 'Dindoshi', 'Malad Link Road',
      ],
      Kurla: [
        'Kurla East', 'Kurla West', 'Ghatkopar East', 'Ghatkopar West',
        'Vikhroli East', 'Vikhroli West', 'Bhandup East', 'Bhandup West',
        'Mulund East', 'Mulund West', 'Chembur', 'Govandi', 'Mankhurd',
        'Kanjurmarg', 'Powai', 'Chandivali', 'Vidyavihar', 'Tilak Nagar',
        'Chunabhatti', 'Asalpha', 'Saki Naka', 'Nahur', 'Sion', 'Deonar',
        'Trombay', 'Kajupada', 'Kamani', 'Parksite', 'Ghatkopar Laxmi Nagar',
      ],
    },
    Mumbai: {
      Mumbai: [
        'Colaba', 'Fort', 'Churchgate', 'Marine Lines', 'Girgaon', 'Grant Road',
        'Malabar Hill', 'Byculla', 'Dadar East', 'Dadar West', 'Worli', 'Parel',
        'Lower Parel', 'Mahalaxmi', 'Mazgaon', 'Matunga', 'Wadala', 'Mahim',
        'Prabhadevi', 'Cuffe Parade', 'Tardeo', 'Kalbadevi', 'Bhuleshwar',
        'Dongri', 'Chinchpokli', 'Lalbaug', 'Cotton Green', 'Sewri', 'Nagpada',
        'Mumbai Central', 'Marine Drive', 'Nariman Point', 'Breach Candy',
        'Cumballa Hill', 'Walkeshwar', 'Sandhurst Road', 'Reay Road',
      ],
    },
  },
};

export const getVillages = (stateName, districtName, talukaName) => {
  const state = resolveStateName(stateName);
  const stMap = VILLAGE_OVERRIDES[state] || {};
  const dName = Object.keys(stMap).find((d) => normalizeKey(d) === normalizeKey(districtName));
  const tMap = dName ? stMap[dName] : {};
  const tName = Object.keys(tMap).find((t) => normalizeKey(t) === normalizeKey(talukaName));
  const extra = tName ? tMap[tName] : [];
  const base = getLgdVillages(stateName, districtName, talukaName);
  return Array.from(new Set([...extra, ...base])).sort((a, b) => a.localeCompare(b));
};

const getLgdVillages = (stateName, districtName, talukaName) => {
  const state = resolveStateName(stateName);
  const districtKey = normalizeKey(districtName);
  const talukaKey = normalizeKey(talukaName);

  const districtMap = LGD.villagesByStateDistrictTaluka?.[state] || {};
  const district = Object.keys(districtMap).find((d) => normalizeKey(d) === districtKey);
  if (!district) return [];

  const talukaMap = districtMap[district] || {};
  const taluka = Object.keys(talukaMap).find((t) => normalizeKey(t) === talukaKey);
  if (!taluka) return [];

return (talukaMap[taluka] || []).filter((x) => !/[\u0900-\u097F]/.test(x));
};