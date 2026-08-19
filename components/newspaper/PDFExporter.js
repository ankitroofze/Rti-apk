import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { usePdfStore } from '../../store/newspaperStore';

// ─── Article HTML ────────────────────────────────────────────────────────────
function articleHtml(d = {}, isMain = false) {
  return `
    <div style="padding:${isMain ? '10px 12px' : '8px 10px'};background:${isMain ? '#fffdf8' : '#fff'};height:100%;box-sizing:border-box;">
      ${d.title ? `
        <div style="font-size:${isMain ? '15px' : '13px'};font-weight:900;color:#111;line-height:1.35;margin-bottom:3px;font-family:'Noto Serif Devanagari',serif;">
          ${d.title}
        </div>` : ''}
      ${d.sub ? `<div style="font-size:9px;color:#555;margin-bottom:4px;font-style:italic;">${d.sub}</div>` : ''}
      <div style="height:1.5px;background:#111;margin-bottom:6px;"></div>
      ${d.image ? `<img src="${d.image}" style="width:100%;height:110px;object-fit:cover;border:1px solid #999;margin-bottom:6px;display:block;"/>` : ''}
      ${d.body ? `<div style="font-size:10.5px;line-height:1.8;color:#222;text-align:justify;font-family:'Noto Serif Devanagari',serif;">${d.body}</div>` : ''}
      ${(d.reporter || d.location) ? `
        <div style="font-size:8.5px;color:#666;border-top:0.5px solid #bbb;padding-top:4px;margin-top:6px;display:flex;justify-content:space-between;font-style:italic;">
          <span>${d.reporter ? '✍ ' + d.reporter : ''}</span>
          <span>${d.location ? '● ' + d.location : ''}</span>
        </div>` : ''}
    </div>`;
}

// ─── Full Newspaper Header HTML ───────────────────────────────────────────────
function headerHtml(h = {}) {
  const contact1 = h.contact1 || 'M. 8484029332';
  const contact2 = h.contact2 || '7020667971';
  const regNo    = h.regNo    || 'REG. NO. : RNIMAH/MUL/2014/66399  |  TITLE REGN. NO. : MAH/MUL/03200/13/1/2013-TC';
  const name     = h.newspaperName || 'भारतीय माहिती अधिकार';
  const tagline  = h.tagline  || 'मराठी, हिंदी व इंग्रजी भाषेमध्ये सर्वत्र प्रसिद्ध होणारे एकमेव असे न्यूजपेपर';
  const website  = h.website  || 'web : www.rtinewsnetwork.com';
  const email    = h.extra    || 'e-mail : rticheck@gmail.com';
  const editor   = h.editorName   || 'मा. शौकत अब्दुलकलाम नायकवडी';
  const edTitle  = h.editorTitle  || 'मुख्य संपादक, संस्थापक, अध्यक्ष, प्रकाशक, मालक';
  const office   = h.officeInfo   || '● क्षेत्रीय कार्यालय : व्हीनस कॉर्नर, स्टेशन रोड, केव्हिज प्लाझा, कोल्हापूर.';
  const date     = h.date     || '● वर्ष : ६ वे  ● महिना : जुलै २०१९  ● १२ अंक साठी वार्षिक वर्गणी : फक्त १९०/-  ● Posting Registration No. SGL/108/2019-2021';
  const logoUri  = h.logoUri  || '';

  return `
  <!-- ── ROW 1: Contact | PRESS | RegNo | RTi Branding ── -->
  <div style="display:flex;align-items:center;justify-content:space-between;
              padding:8px 12px 6px 12px;border-bottom:1px solid #ccc;background:#fff;">

    <!-- LEFT: Phone numbers -->
    <div style="flex:1.2;text-align:left;">
      <div style="font-size:15px;font-weight:900;color:#111;line-height:1.4;">${contact1}</div>
      <div style="font-size:15px;font-weight:900;color:#111;line-height:1.4;">${contact2}</div>
    </div>

    <!-- CENTER: PRESS badge + RegNo -->
    <div style="flex:2.5;text-align:center;">
      <div style="display:inline-block;background:#e00000;color:#fff;
                  font-size:16px;font-weight:900;font-style:italic;letter-spacing:5px;
                  padding:5px 22px;border-radius:30px;border:3px solid #fff;
                  outline:2px solid #e00000;margin-bottom:5px;">PRESS</div>
      <div style="font-size:8px;color:#333;letter-spacing:0.1px;">${regNo}</div>
    </div>

    <!-- RIGHT: Govt + RTi branding -->
    <div style="flex:1.8;text-align:right;">
      <div style="font-size:7.5px;color:#444;line-height:1.4;">Govt. of INDIA approved</div>
      <div style="font-size:7.5px;color:#444;line-height:1.4;">Registred Ministry of Broadcasting, Delhi.</div>
      <div style="margin-top:2px;">
        <span style="font-size:18px;font-weight:900;font-style:italic;color:#111;">All </span>
        <span style="font-size:18px;font-weight:900;font-style:italic;color:#cc0000;">INDIA </span>
        <span style="font-size:18px;font-weight:900;font-style:italic;color:#0055aa;">RTi</span>
      </div>
      <div style="font-size:10px;font-weight:800;color:#cc0000;letter-spacing:1px;">NEWS NETWORK</div>
    </div>
  </div>

  <!-- ── ROW 2: Logo + Black Banner ── -->
  <div style="position:relative;background:#111;height:90px;display:flex;align-items:center;">
    <!-- Logo circle -->
    <div style="position:absolute;left:14px;top:-22px;
                width:134px;height:134px;border-radius:50%;
                border:3px solid #fff;background:#333;overflow:hidden;
                display:flex;align-items:center;justify-content:center;z-index:10;">
      ${logoUri
        ? `<img src="${logoUri}" style="width:134px;height:134px;object-fit:cover;"/>`
        : `<div style="color:#aaa;font-size:11px;font-weight:700;text-align:center;">LOGO</div>`}
    </div>
    <!-- Newspaper name -->
    <div style="flex:1;text-align:center;padding-left:160px;padding-right:12px;">
      <span style="font-size:52px;font-weight:900;color:#fff;letter-spacing:1px;
                   font-family:'Noto Serif Devanagari',serif;line-height:1;">${name}</span>
    </div>
  </div>
  <!-- Space below banner for logo bottom overflow -->
  <div style="height:22px;background:#fff;"></div>

  <!-- ── ROW 3: Tagline ── -->
  <div style="text-align:center;padding:5px 12px;border-bottom:1px solid #bbb;background:#fff;">
    <span style="font-size:10px;color:#222;font-weight:500;letter-spacing:0.3px;">${tagline}</span>
  </div>

  <!-- ── ROW 4: Website | Email | Editor ── -->
  <div style="display:flex;align-items:center;justify-content:space-between;
              padding:4px 12px;border-bottom:1px solid #ccc;background:#fff;">
    <div style="font-size:9.5px;color:#333;">${website} &nbsp;|&nbsp; ${email}</div>
    <div style="text-align:right;">
      <div style="font-size:11px;font-weight:800;color:#111;">${editor}</div>
      <div style="font-size:8px;color:#555;">${edTitle}</div>
    </div>
  </div>

  <!-- ── ROW 5: Office ── -->
  <div style="padding:4px 12px;border-bottom:1px solid #ddd;background:#fafafa;">
    <span style="font-size:9px;color:#333;">${office}</span>
  </div>

  <!-- ── ROW 6: Date strip ── -->
  <div style="padding:5px 12px;background:#f0ede6;border-top:1px solid #bbb;border-bottom:3px solid #111;">
    <span style="font-size:9px;color:#333;letter-spacing:0.3px;">${date}</span>
  </div>`;
}

// ─── Headline HTML ────────────────────────────────────────────────────────────
function headlineHtml(hl = {}) {
  if (!hl.title) return '';
  return `
  <div style="border-top:3px solid #111;border-bottom:3px solid #111;background:#fff;">
    <div style="padding:10px 14px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#111;line-height:1.3;
                  font-family:'Noto Serif Devanagari',serif;">${hl.title}</div>
      ${hl.sub ? `<div style="font-size:11px;color:#333;margin-top:4px;font-style:italic;
                              border-top:1px solid #ddd;padding-top:3px;">${hl.sub}</div>` : ''}
    </div>
  </div>`;
}

// ─── Body columns for each layout ────────────────────────────────────────────
function bodyHtml(sections = {}, templateId = 'layout1') {
  const br = 'border-right:1px solid #ccc;';
  const lw = sections.lawyer || {};

  if (templateId === 'layout1') {
    return `
      <div style="display:flex;border-bottom:1px solid #ccc;min-height:200px;">
        <div style="width:25%;${br}">${articleHtml(sections.left)}</div>
        <div style="width:50%;${br}">${articleHtml(sections.center, true)}</div>
        <div style="width:25%;">${articleHtml(sections.right)}</div>
      </div>
      <div style="display:flex;border-bottom:1px solid #ccc;min-height:180px;">
        <div style="width:50%;${br}">${articleHtml(sections.bottom_l)}</div>
        <div style="width:50%;">${articleHtml(sections.bottom_r)}</div>
      </div>`;
  }

  return `
    <div style="display:flex;border-bottom:1px solid #ccc;min-height:200px;">
      <div style="width:35%;${br}">${articleHtml(sections.left)}</div>
      <div style="width:40%;${br}">${articleHtml(sections.center, true)}</div>
      <div style="width:25%;">${articleHtml(sections.right)}</div>
    </div>
    <div style="border-top:2.5px solid #111;border-bottom:2.5px solid #111;
                background:#f5f0e8;padding:6px 14px;text-align:center;font-size:10px;color:#333;">
      ${lw.text || ''}
    </div>
    <div style="display:flex;border-bottom:1px solid #ccc;min-height:180px;">
      <div style="width:33%;${br}">${articleHtml(sections.bot_l)}</div>
      <div style="width:33%;${br}">${articleHtml(sections.bot_c)}</div>
      <div style="width:34%;">${articleHtml(sections.bot_r)}</div>
    </div>`;
}

// ─── Footer HTML ──────────────────────────────────────────────────────────────
function footerHtml(ft = {}) {
  return `
  <div style="border-top:3px double #111;display:flex;align-items:center;
              justify-content:space-between;padding:6px 12px;background:#fafafa;">
    <span style="font-size:9px;color:#444;flex:1;">${ft.left || '© भारतीय माहिती अधिकार'}</span>
    <span style="font-size:9px;font-weight:700;color:#222;flex:2;text-align:center;font-style:italic;">
      सर्वसामान्य जनतेत भारतीय कायद्याचे प्रबोधन करणारे एकमेव न्यूज पेपर!
    </span>
    <span style="font-size:9px;color:#444;flex:1;text-align:right;">${ft.right || 'www.rtinewsnetwork.com'}</span>
  </div>`;
}

// ─── Full Page HTML ───────────────────────────────────────────────────────────
function buildHtml(sections = {}, templateId = 'layout1') {
  const h  = sections.header  || {};
  const hl = sections.headline || {};
  const ft = sections.footer  || {};

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;700;900&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Noto Serif Devanagari',serif; background:#e8e4df; }

    @media print {
      @page {
        size: A3 portrait;
        margin: 10mm;
      }
      body { background: #fff !important; }
      .newspaper-page {
        width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
      }
    }
  </style>
</head>
<body>
<div class="newspaper-page"
     style="width:277mm;min-height:390mm;margin:0 auto;border:1px solid #555;
            background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.2);overflow:hidden;">

  ${headerHtml(h)}
  ${headlineHtml(hl)}
  ${bodyHtml(sections, templateId)}
  ${footerHtml(ft)}

</div>
</body>
</html>`;
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export async function exportToPdf(sections, templateId) {
  const { setGenerating, setLastUri } = usePdfStore.getState();
  try {
    setGenerating(true);
    const html = buildHtml(sections, templateId);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    setLastUri(uri);
    setGenerating(false);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'PDF Share / Save karein',
      });
    }
    return uri;
  } catch (err) {
    setGenerating(false);
    throw err;
  }
}

export async function printDirectly(sections, templateId) {
  const html = buildHtml(sections, templateId);
  await Print.printAsync({ html });
}