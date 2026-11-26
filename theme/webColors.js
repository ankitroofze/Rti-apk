import normalizeColor from '@react-native/normalize-colors';

const surface = '--rti-surface';
const raised = '--rti-raised';
const inset = '--rti-inset';
const border = '--rti-border';
const text = '--rti-text';
const muted = '--rti-muted';
const accents = {
  red: ['49, 26, 24', '255, 165, 159', '157, 38, 33'],
  orange: ['49, 35, 24', '255, 187, 128', '138, 57, 16'],
  yellow: ['49, 44, 24', '253, 224, 128', '108, 78, 11'],
  green: ['24, 49, 32', '134, 230, 177', '27, 104, 57'],
  teal: ['24, 49, 48', '116, 226, 222', '16, 101, 104'],
  blue: ['24, 34, 49', '153, 196, 255', '33, 82, 155'],
  purple: ['36, 24, 49', '202, 175, 255', '91, 53, 151'],
  pink: ['49, 24, 41', '250, 165, 216', '132, 40, 94'],
};

const tokenColors = {
  [surface]: '19, 28, 49',
  [raised]: '27, 39, 61',
  [inset]: '36, 50, 74',
  [border]: '57, 72, 98',
  [text]: '248, 250, 252',
  [muted]: '183, 197, 217',
};

function getHue(red, green, blue, max, range) {
  if (max === red) return (60 * (green - blue) / range + 360) % 360;
  if (max === green) return 60 * ((blue - red) / range + 2);
  return 60 * ((red - green) / range + 4);
}

function getAccent(hue) {
  if (hue < 15 || hue >= 345) return 'red';
  if (hue < 42) return 'orange';
  if (hue < 65) return 'yellow';
  if (hue < 161) return 'green';
  if (hue < 193) return 'teal';
  if (hue < 248) return 'blue';
  if (hue < 295) return 'purple';
  return 'pink';
}

for (const [name, [background, foreground, solid]] of Object.entries(accents)) {
  tokenColors[`--rti-${name}-surface`] = background;
  tokenColors[`--rti-${name}-text`] = foreground;
  tokenColors[`--rti-${name}-solid`] = solid;
}

const properties = {
  background: 'surface',
  backgroundColor: 'surface',
  color: 'text',
  caretColor: 'text',
  outlineColor: 'border',
  placeholderTextColor: 'text',
  '--placeholderTextColor': 'text',
  textDecorationColor: 'text',
};

function linearChannel(channel) {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function tokenFor(role, red, green, blue, alpha) {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const range = max - min;
  const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const neutral = range <= 48 || (blue === max && range <= 75 && red <= green);
  const accent = neutral ? null : getAccent(getHue(red, green, blue, max, range));

  if (role === 'text') {
    if (luma >= 166) return null;
    if (accent) return `--rti-${accent}-text`;
    return luma < 84 ? text : muted;
  }
  if (role === 'border') {
    if (alpha === 1 && luma < 65) return null;
    return accent && luma < 170 && alpha > 0.65 ? `--rti-${accent}-text` : border;
  }
  if (accent) {
    if (min >= 150 && luma >= 180) return `--rti-${accent}-surface`;
    const luminance = 0.2126 * linearChannel(red) + 0.7152 * linearChannel(green) + 0.0722 * linearChannel(blue);
    return alpha > 0.65 && luminance > 0.183 ? `--rti-${accent}-solid` : null;
  }
  if (luma < 153) return null;
  if (luma >= 250) return surface;
  return luma >= 226 ? raised : inset;
}

function themedColor(value, role) {
  if (typeof value !== 'string' || value.startsWith('var(')) return value;

  const packed = normalizeColor(value);
  if (packed == null) return value;

  const alpha = (packed & 255) / 255;
  if (alpha === 0) return value;
  const red = packed >>> 24;
  const green = packed >>> 16 & 255;
  const blue = packed >>> 8 & 255;
  const token = tokenFor(role, red, green, blue, alpha);
  if (!token) return value;
  if (token === border && alpha < 0.3) return `var(--rti-subtle-border, ${value})`;
  return `rgba(var(${token}, ${red}, ${green}, ${blue}), ${alpha})`;
}

const cssColors = /(?:url|var)\([^()]*\)|#[\da-f]{3,8}\b|rgba?\([^()]*\)|\b(?:white|black|whitesmoke)\b/gi;
const cssDeclarations = /([\w-]+)(\s*:\s*)([^;{}]+)(?=[;}])/g;

export function themeWebValue(value, property) {
  if (typeof value !== 'string' || !property) return value;
  const role = properties[property] || (/^border.*Color$/.test(property) ? 'border' : null);
  if (property === 'background' || property === 'backgroundImage' || /^(border|outline)(Top|Right|Bottom|Left)?$/.test(property)) {
    return value.replace(cssColors, color => themedColor(color, role || (property.startsWith('background') ? 'surface' : 'border')));
  }
  if (role) return themedColor(value, role);
  return value;
}

export function themeWebStyle(style) {
  return Object.fromEntries(
    Object.entries(style).map(([property, value]) => [property, themeWebValue(value, property)]),
  );
}

export function themeWebCss(css) {
  return css.replace(cssDeclarations, (_, property, spacing, value) => {
    const camelCase = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const [, color, suffix = ''] = value.match(/^([\s\S]*?)(\s*!important\s*|\s+)$/i) || [null, value];
    return property + spacing + themeWebValue(color, camelCase) + suffix;
  });
}

export function webThemeCss() {
  const entries = Object.entries(tokenColors);
  const darkVariables = entries.map(([name, channels]) => `${name}:${channels}`).join(';');
  const resetVariables = Object.keys(tokenColors).map(name => `${name}:initial`).join(';');

  return `
    html[data-theme="dark"] {
      color-scheme: dark;
      --rti-subtle-border: #2b3951;
      --rti-logo-background: #fff;
      ${darkVariables}
    }
    html[data-theme="dark"] [data-color-scheme="light"] {
      color-scheme: light;
      --rti-subtle-border: initial;
      ${resetVariables}
    }
  `;
}
