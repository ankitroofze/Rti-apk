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

export const INDIAN_STATES = LGD.states || [];

export const getDistricts = (stateName) => {
  const state = resolveStateName(stateName);
  return (LGD.districtsByState?.[state] || []).slice();
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

  return (districtMap[district] || []).slice();
};
