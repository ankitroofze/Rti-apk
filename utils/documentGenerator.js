import { Platform } from 'react-native';
import { esc, fmt, fmtValidUpto, generateMemberId, getRank } from './profileHelpers';
import { resolveModuleImageSrc, resolvePdfImageSrc } from './imageHandling';
import {
  RTI_VOICE_LOGO,
  RTI_VOICE_LOGO_B64,
  RTI_LOGO_B64,
  CERT_LOGO,
  RIBBON_IMAGE,
  GREEN_BANNER,
  MIC_ICON,
  MIC_ICON_B64,
  QR_CODE,
} from '../constants/profileConstants';

export async function buildIdCardHtml(profile, { webPreview = Platform.OS === 'web' } = {}) {
  const memberId = generateMemberId(profile.email);
  const rank = getRank(profile.referral_count || 0);
  const seatName = String(profile?.state_seat?.seat_name || profile?.author_seat_name || '').trim();
  const designation = seatName || `${rank.title} - RTI News Member`;
  const location = [profile.village, profile.state].filter(Boolean).join(', ') || 'Not provided';
  const validUpto = fmtValidUpto();
  const docTitle = profile?.name?.trim() ? `ID Card - ${profile.name.trim()}` : 'ID Card';
  const resolvedPhoto = await resolvePdfImageSrc(profile.profile_image);
  const photoHtml = resolvedPhoto
    ? `<img src="${esc(resolvedPhoto)}" style="width:100%;height:100%;object-fit:cover;"/>`
    : `<div style="width:100%;height:100%;background:#d1d5db;display:flex;align-items:center;justify-content:center;color:#6b7280;font-weight:700;">No Photo</div>`;

  const certLogoSrc = await resolveModuleImageSrc(CERT_LOGO, 'image/jpeg') || RTI_LOGO_B64;
  const greenBannerSrc = await resolveModuleImageSrc(GREEN_BANNER, 'image/jpeg') || '';
  const greenBannerHtml = greenBannerSrc ? `<img class="green-banner" src="${esc(greenBannerSrc)}" alt=""/>` : '';

  const micIconSrc = await resolveModuleImageSrc(MIC_ICON, 'image/png');
  const micSvg = `<img src="${esc(micIconSrc || MIC_ICON_B64)}" style="width:40px;height:40px;object-fit:contain;border-radius:50%;"/>`;
  const qrIconSrc = await resolveModuleImageSrc(QR_CODE, 'image/png');
  const qrInnerHtml = qrIconSrc
    ? `<div class="id-card-qr-inner"><img src="${esc(qrIconSrc)}" style="width:100%;height:100%;object-fit:contain;"/></div>`
    : '<div class="id-card-qr-inner"><div class="title">QR</div></div>';

  const bodyClass = webPreview ? 'preview' : '';
  const webToolbar = webPreview ? `
  <div class="web-toolbar">
    <div class="web-toolbar-left">
      <div class="web-toolbar-title">${esc(docTitle)}</div>
      <div class="web-toolbar-sub">Click <b>Download PDF</b> and choose <b>Save as PDF</b>.</div>
    </div>
    <div class="web-toolbar-actions">
      <button class="web-toolbar-btn" onclick="window.print()">Download PDF</button>
      <button class="web-toolbar-btn secondary" onclick="window.close()">Close</button>
    </div>
  </div>
  `.trim() : '';

  const responsiveScript = webPreview ? `
<script>
  (function () {
    function apply() {
      var el = document.querySelector('.id-card-preview');
      if (!el) return;
      var tb = document.querySelector('.web-toolbar');
      var tbH = tb ? tb.offsetHeight : 0;
      var padding = 28;
      var w = Math.max(1, (window.innerWidth || 1) - padding);
      var scale = Math.min(1, w / el.offsetWidth);
      document.documentElement.style.setProperty('--scale', String(scale));
      document.body.style.height = String(Math.round(el.offsetHeight * scale + padding + tbH)) + 'px';
    }
    window.addEventListener('resize', apply);
    apply();
  })();
</script>`.trim() : '';

  const autoPrintScript = webPreview ? `
<script>
  (function () {
    window.__PDF_READY__ = false;
    function imagesReady() {
      var imgs = Array.prototype.slice.call(document.images || []);
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        if (!img.complete) return false;
        if (typeof img.naturalWidth === 'number' && img.naturalWidth === 0) return false;
      }
      return true;
    }
    function tryPrint() {
      if (!imagesReady()) return setTimeout(tryPrint, 60);
      window.__PDF_READY__ = true;
    }
    window.addEventListener('load', function () { setTimeout(tryPrint, 300); });
  })();
</script>`.trim() : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${esc(docTitle)}</title>
  <style>
   @page { size: A4 portrait; margin: 0; }
   *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    :root{--scale:1;--print-scale:1;}
    body{background:rgba(218, 213, 213, 0.76);display:flex;justify-content:center;align-items:center;flex-direction:column;padding:14px;font-family:Arial,sans-serif;-webkit-text-size-adjust:100%;}
    body.preview{justify-content:flex-start;}
    .scale{transform-origin:top center;}
    body.preview .scale{transform:scale(var(--scale));}
     @media print{
       body{padding:0 !important;background:#fff;}
       body.preview{padding:0 !important;}
       body.preview .scale{transform:scale(var(--print-scale)) !important;transform-origin:top center;}
       body:not(.preview) .scale{transform:none !important;}
       .id-card-preview{box-shadow:none !important;}
     }
   ${webPreview ? `
   .web-toolbar{position:sticky;top:0;z-index:10;width:100%;max-width:760px;margin:0 auto 12px auto;background:#111827;color:#fff;border-radius:14px;padding:10px 12px;display:flex;gap:12px;align-items:center;justify-content:space-between;box-shadow:0 10px 28px rgba(0,0,0,0.18);}
   .web-toolbar-title{font-weight:800;font-size:13px;line-height:16px;}
   .web-toolbar-sub{font-size:12px;color:rgba(255,255,255,0.8);line-height:16px;margin-top:2px;}
   .web-toolbar-actions{display:flex;gap:8px;flex-shrink:0;}
   .web-toolbar-btn{appearance:none;border:none;border-radius:12px;padding:9px 12px;background:#22c55e;color:#052e16;font-weight:800;font-size:12px;cursor:pointer;}
   .web-toolbar-btn.secondary{background:rgba(255,255,255,0.12);color:#fff;}
   @media print{.web-toolbar{display:none !important;}}
   ` : ''}
   .document-wrapper{display:flex;justify-content:center;align-items:center;width:100%;}
   .id-card-preview{width:342px;max-width:100%;border-radius:16px;overflow:hidden;background-color:#fff;box-shadow:0 10px 28px rgba(0,0,0,0.22);}
   .green-banner{width:100%;height:15px;object-fit:fill;display:block;}
   /* SVG backgrounds can render incorrectly in PDF generation; use CSS backgrounds instead. */
   .svg-fill{display:none !important;}
   .id-card-header{position:relative;background:#EB8C28;padding:10px 12px;text-align:center;}
   .id-card-header-content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;}
   .id-card-header h1{font-size:21px;font-weight:800;color:#fff;margin-bottom:4px;letter-spacing:0.3px;line-height:26px;}
   .id-card-header-row{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:2px;}
   .id-card-mic{width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex:0 0 40px;}
  .id-card-header .network{font-size:22px;font-weight:900;color:#101827;line-height:22px;text-align:center;}
  .id-card-header .sub{font-size:18px;font-weight:700;color:#8B2E1A; margin-top:4px;}
  .id-card-header .reg{font-size:11px;font-weight:700;color:#1a3a8a;margin-top:1px;letter-spacing:0.3px;}
  .id-card-photo-row{display:flex;align-items:center;justify-content:space-between;padding:14px;background:rgba(218, 213, 213, 0.76);}
  .id-card-logo{width:64px;height:64px;border-radius:32px;background:#fff;overflow:hidden;}
  .id-card-photo-box{width:110px;height:130px;border:2.5px solid #16a34a;border-radius:8px;overflow:hidden;background:#d1d5db;}
  .id-card-photo-box img{width:100%;height:100%;object-fit:cover;}
  .id-card-qr-box{width:64px;height:64px;display:flex;align-items:center;justify-content:center;}
  .id-card-qr-inner{width:60px;height:60px;border:2px solid #1f2937;border-radius:4px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .id-card-qr-inner .title{font-size:14px;font-weight:900;color:#1f2937;}
  .id-card-qr-inner .sub{font-size:6px;color:#374151;margin-top:2px;text-align:center;}
  .id-card-details{padding:8px 14px;background:rgba(218, 213, 213, 0.76);}
  .id-card-row{display:flex;align-items:center;margin-bottom:5px;}
  .id-card-valid{margin-top:2px;margin-bottom:4px;text-align:center;font-size:11px;color:#374151;font-weight:600;}
  .id-card-key-bold{width:66px;font-size:13px;font-weight:900;color:#cc2200;}
  .id-card-key-light{width:66px;font-size:12px;font-weight:600;color:#374151;}
  .id-card-val{font-size:12px;font-weight:600;color:#1f2937;flex:1;}
  .id-card-val-light{font-size:12px;color:#374151;flex:1;}
  .id-card-valid{margin-top:2px;margin-bottom:4px;text-align:center;font-size:11px;color:#374151;font-weight:600;}
   .press-footer-wrapper{overflow:hidden;}
    .press-green-bar{position:relative;background:#15803d;display:flex;align-items:stretch;}
    .press-green-bar > :not(.svg-fill){position:relative;z-index:1;}
    .press-green-block{width:45px;background:#15803d;}
   .press-approved-center{flex:1;background:#fff;text-align:center;padding:5px 6px;}
   .press-approved-center .from{font-size:9px;color:#374151;font-weight:500;}
   .press-approved-center .desig{font-size:8px;color:#374151;margin-top:1px;}
    .press-red-bar{position:relative;background:#15803d;display:flex;align-items:stretch;padding:1px 0;}
    .press-red-bar > :not(.svg-fill){position:relative;z-index:1;}
    .press-red-side{flex:1;}
    .press-red-box{position:relative;background:#dc2626;padding:0 35px;align-items:center;justify-content:center;display:flex;}
   .press-red-box .text{font-size:32px;font-weight:900;color:#fff;letter-spacing:12px;font-style:italic;}
 </style>
  </head><body class="${bodyClass}">
  ${webToolbar}
  <div class="document-wrapper">
    <div class="id-card-preview scale">
    <div class="id-card-header">
      <svg class="svg-fill" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="100" height="100" fill="#EB8C28"></rect>
      </svg>
      <div class="id-card-header-content">
        <div><h1>Bhartiya Mahiti Adhikar</h1></div>
        <div class="id-card-header-row">
          <div class="id-card-mic">${micSvg}</div>
          <div class="network">ALL INDIA RTI<br/>NEWS NETWORK</div>
        </div>
        <div class="sub">BhaRTIya V😊ice / RTI Media</div>
        <div class="reg">RNI.MAH/MUL/66399 &#9733; UDYAM-MH-29-0022246</div>
      </div>
    </div>
    ${greenBannerHtml}
    <div class="id-card-photo-row">
      <div class="id-card-logo"><img src="${esc(certLogoSrc || RTI_LOGO_B64)}" style="width:100%;height:100%;object-fit:cover;"/></div>
      <div class="id-card-photo-box">${photoHtml}</div>
      <div class="id-card-qr-box">
        ${qrInnerHtml}
      </div>
    </div>
    <div class="id-card-details">
      <div class="id-card-row"><div class="id-card-key-bold">Name;-</div><div class="id-card-val">${esc(profile.name || '')}</div></div>
      <div class="id-card-row"><div class="id-card-key-bold">Desig;-</div><div class="id-card-val">${esc(designation)}</div></div>
      <div class="id-card-row"><div class="id-card-key-light">Area;-</div><div class="id-card-val-light">${esc(location)}</div></div>
      <div class="id-card-row"><div class="id-card-key-light">Mo:</div><div class="id-card-val-light">${esc(profile.contact_number || '')}</div></div>
      <div class="id-card-row"><div class="id-card-key-light">ID No;-</div><div class="id-card-val-light">${esc(memberId)}</div></div>
      <div class="id-card-valid">Valid Upto ;- ${esc(validUpto)}</div>
    </div>
      <div class="press-footer-wrapper">
        <div class="press-green-bar">
          <svg class="svg-fill" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="100" height="100" fill="#15803d"></rect>
          </svg>
          <div class="press-green-block"></div>
          <div class="press-approved-center"><div class="from">This Identity Card is approved from</div><div class="desig">Chief Editor, All India President</div></div>
          <div class="press-green-block"></div>
        </div>
        <div class="press-red-bar">
          <svg class="svg-fill" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="100" height="100" fill="#15803d"></rect>
          </svg>
          <div class="press-red-side"></div>
          <div class="press-red-box">
            <svg class="svg-fill" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="100" height="100" fill="#dc2626"></rect>
            </svg>
            <div class="text" style="position:relative;z-index:1;">PRESS</div>
          </div>
          <div class="press-red-side"></div>
        </div>
      </div>
  </div>
</div>
${responsiveScript}
${autoPrintScript}
</body></html>`;
}

export async function buildAppointmentLetterHtml(profile, { webPreview = Platform.OS === 'web' } = {}) {
  const location = [profile.village, profile.state].filter(Boolean).join(', ') || 'Not provided';
  const issued = fmt();
  const validUpto = fmtValidUpto();
  const phoneNumber = profile.phone_number || profile.contact_number || '';
  const mobileNumber = profile.mobile_number || profile.mobile || profile.contact_number || '';
  const docTitle = profile?.name?.trim() ? `Appointment Letter - ${profile.name.trim()}` : 'Appointment Letter';

  const resolvedPhoto = await resolvePdfImageSrc(profile.profile_image);
  const ribbonSrc = await resolveModuleImageSrc(RIBBON_IMAGE, 'image/png') || '';
  const voiceLogoSrc = await resolveModuleImageSrc(RTI_VOICE_LOGO, 'image/jpeg') || RTI_VOICE_LOGO_B64;
  const certLogoSrc = await resolveModuleImageSrc(CERT_LOGO, 'image/jpeg') || RTI_LOGO_B64;
  const greenBannerSrc = await resolveModuleImageSrc(GREEN_BANNER, 'image/jpeg') || '';
  const greenBannerHtml = greenBannerSrc ? `<div class="green-wrap"><img src="${esc(greenBannerSrc)}" alt=""/></div>` : '';

  const isValidPhoto = resolvedPhoto &&
    (resolvedPhoto.startsWith('data:image') || resolvedPhoto.startsWith('http'));

  const photoHtml = isValidPhoto
    ? `<img src="${esc(resolvedPhoto)}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;"/>`
    : `<div style="width:100%;height:100%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;color:#6b7280;font-size:11px;font-weight:700;border-radius:6px;">No Photo</div>`;

  const bodyClass = webPreview ? 'preview' : '';
  const webToolbar = webPreview ? `
  <div class="web-toolbar">
    <div class="web-toolbar-left">
      <div class="web-toolbar-title">${esc(docTitle)}</div>
      <div class="web-toolbar-sub">Click <b>Download PDF</b> and choose <b>Save as PDF</b>.</div>
    </div>
    <div class="web-toolbar-actions">
      <button class="web-toolbar-btn" onclick="window.print()">Download PDF</button>
      <button class="web-toolbar-btn secondary" onclick="window.close()">Close</button>
    </div>
  </div>
  `.trim() : '';

  const responsiveScript = webPreview ? `
<script>
  (function () {
    function apply() {
      var el = document.querySelector('.letter');
      if (!el) return;
      var tb = document.querySelector('.web-toolbar');
      var tbH = tb ? tb.offsetHeight : 0;
      var padding = 24;
      var w = Math.max(1, (window.innerWidth || 1) - padding);
      var scale = Math.min(1, w / el.offsetWidth);
      document.documentElement.style.setProperty('--scale', String(scale));
      document.body.style.height = String(Math.round(el.offsetHeight * scale + padding + tbH)) + 'px';
    }
    window.addEventListener('resize', apply);
    apply();
  })();
 </script>`.trim() : '';

  const autoPrintScript = webPreview ? `
<script>
  (function () {
    window.__PDF_READY__ = false;
    function imagesReady() {
      var imgs = Array.prototype.slice.call(document.images || []);
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        if (!img.complete) return false;
        if (typeof img.naturalWidth === 'number' && img.naturalWidth === 0) return false;
      }
      return true;
    }
    function tryPrint() {
      if (!imagesReady()) return setTimeout(tryPrint, 60);
      window.__PDF_READY__ = true;
    }
    window.addEventListener('load', function () { setTimeout(tryPrint, 300); });
  })();
</script>`.trim() : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${esc(docTitle)}</title>
 <style>
  @page { size: A4 portrait; margin: 0; }
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  :root{--scale:1;--print-scale:1;}
  html,body{margin:0;padding:0;background:#e9edf0;font-family:Arial,sans-serif;-webkit-text-size-adjust:100%;}
  body{background:rgba(218, 213, 213, 0.76);display:flex;justify-content:center;align-items:center;flex-direction:column;padding:14px;}
  body.preview{justify-content:flex-start;}
  .scale{transform-origin:top center;}
  body.preview .scale{transform:scale(var(--scale));}
  @media print{
    body{padding:0 !important;background:#fff;}
    body.preview{padding:0 !important;}
    body.preview .scale{transform:scale(var(--print-scale)) !important;transform-origin:top center;}
    body:not(.preview) .scale{transform:none !important;}
  }
  ${webPreview ? `
  .web-toolbar{position:sticky;top:0;z-index:10;width:100%;max-width:820px;margin:0 auto 12px auto;background:#111827;color:#fff;border-radius:14px;padding:10px 12px;display:flex;gap:12px;align-items:center;justify-content:space-between;box-shadow:0 10px 28px rgba(0,0,0,0.18);}
  .web-toolbar-title{font-weight:800;font-size:13px;line-height:16px;}
  .web-toolbar-sub{font-size:12px;color:rgba(255,255,255,0.8);line-height:16px;margin-top:2px;}
  .web-toolbar-actions{display:flex;gap:8px;flex-shrink:0;}
  .web-toolbar-btn{appearance:none;border:none;border-radius:12px;padding:9px 12px;background:#22c55e;color:#052e16;font-weight:800;font-size:12px;cursor:pointer;}
  .web-toolbar-btn.secondary{background:rgba(255,255,255,0.12);color:#fff;}
  @media print{.web-toolbar{display:none !important;}}
  ` : ''}
  .letter{width:210mm;height:297mm;background:#e9edf0;display:flex;flex-direction:column;break-inside:avoid-page;page-break-inside:avoid;}
  .svg-fill{display:none !important;}
  .press-badge{display:flex;justify-content:center;padding-top:20px;padding-bottom:14px;}
  .press-pill{position:relative;display:inline-flex;align-items:center;justify-content:center;padding:10px 38px;border-radius:999px;overflow:hidden;background:#dc2626;}
  .press-pill span{position:relative;z-index:1;font-size:18px;font-weight:800;color:#fff;letter-spacing:3px;}
  .logo-row{display:flex;align-items:flex-end;justify-content:center;padding:22px 28px 0px;gap:15px;}
  .brand{flex:0 0 auto;}
  .brand-top{font-size:36px;font-weight:900;line-height:40px;}
  .brand-bottom{font-size:36px;font-weight:900;line-height:40px;color:#111827;}
  .rni{font-size:10px;color:#dc2626;font-weight:900;margin-top:2px;letter-spacing:0.5px;}
  .center-logo{width:115px;height:115px;border-radius:50%;border:3px solid #15803d;overflow:hidden;flex-shrink:0;background:#fff;}
  .center-logo img{width:100%;height:100%;object-fit:cover;}
  .network-wrap{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:4px;}
  .network-badge{position:relative;background:#1d4ed8;border-radius:4px;padding:10px 16px;text-align:center;width:100%;overflow:hidden;}
  .network-badge > *{position:relative;z-index:1;}
  .network-badge div{font-size:20px;font-weight:700;color:#fff;line-height:26px;}
  .udyam{font-size:9px;color:#dc2626;font-weight:900;text-align:center;width:100%;}
  .red-banner{position:relative;background:#dc2626;padding:10px 40px;margin:4px 16px 10px;overflow:hidden;}
  .red-banner > *{position:relative;z-index:1;}
  .red-banner div{font-size:32px;font-weight:900;color:#fff;text-align:center;}
  .green-wrap{padding:0 12px;margin-top:-4px;margin-bottom:6px;}
  .green-wrap img{width:100%;height:15px;object-fit:fill;display:block;}
  .subtitle{font-size:16px;font-weight:600;color:#374151;text-align:center;padding:8px 16px;line-height:22px;}
  .ribbon-row{display:flex;align-items:center;gap:10px;padding:6px 14px 4px;}
  .ribbon-image{width:75%;height:105px;object-fit:contain;background:#e9edf0;}
  .ribbon-logo{width:94px;height:94px;object-fit:contain;flex-shrink:0;background:#fff;border:1px solid #d1d5db;padding:4px;}
  .since{font-size:16px;color:#374151;line-height:24px;padding:6px 14px 8px;text-align:center;}
  .details-row{display:flex;align-items:flex-start;padding:8px 14px 10px;gap:10px;flex:1;}
  .details{flex:1;}
  .detail-line{font-size:25px;color:#374151;margin-bottom:7px;line-height:32px;}
  .detail-bold{font-weight:700;color:#111827;}
  .highlight{color:#dc2626;font-weight:900;font-size:28px;}
  .highlight-mid{color:#dc2626;font-weight:600;}
  .date-line{font-size:26px;font-weight:700;color:#111827;margin-bottom:8px;}
  .body-copy{font-size:20px;color:#4b5563;line-height:28px;}
  .photo-box{width:140px;height:180px;border:2px solid #d1d5db;border-radius:6px;overflow:hidden;background:#e9edf0;flex-shrink:0;margin-top:20px;}
  .sign-row{display:flex;justify-content:space-between;align-items:flex-end;padding:10px 14px 10px;}
  .contact-title{font-size:18px;font-weight:700;color:#374151;margin-bottom:2px;}
  .contact-value{font-size:18px;font-weight:800;color:#111827;line-height:24px;}
  .sign-right{text-align:right;}
  .faithfully{font-size:18px;color:#374151;margin-bottom:3px;}
  .sign-name{font-size:18px;font-weight:700;color:#111827;line-height:24px;}
  .sign-sub{font-size:15px;color:#6b7280;margin-top:2px;}
  .footer{position:relative;background:#dc2626;color:#fff;text-align:center;padding:8px 20px;font-size:14px;font-weight:600;line-height:20px;margin:4px 16px 10px;border-radius:0;overflow:hidden;}
  .footer > *{position:relative;z-index:1;}
 </style>
 </head><body class="${bodyClass}">
 ${webToolbar}
 <div class="letter scale">
  <div class="press-badge">
    <div class="press-pill">
      <span>PRESS</span>
    </div>
  </div>
  <div class="logo-row">
    <div class="brand">
      <div class="brand-top"><span style="color:#f97316;">Bha</span><span style="color:#1d4ed8;">RTI</span><span style="color:#15803d;">ya</span></div>
      <div class="brand-bottom">V<span style="color:#f97316;">😊</span>ICE</div>
      <div class="rni">RNI/MAH/MUL/66399</div>
    </div>
    <div class="center-logo"><img src="${esc(certLogoSrc || RTI_LOGO_B64)}" alt="Logo"/></div>
    <div class="network-wrap">
      <div class="network-badge"><div>All India RTI News</div><div>Network</div></div>
      <div class="udyam">UDYAM-MH-29-0022246</div>
    </div>
  </div>
  <div class="red-banner"><div>Bhartiya Mahiti Adhikar</div></div>
  ${greenBannerHtml}
  <div class="subtitle">News Paper Published in Marathi, Hindi &amp; English language<br/>Member: ${esc(profile.name || '___________')}</div>
  <div class="ribbon-row">
    <img class="ribbon-image" src="${esc(ribbonSrc || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')}" alt="Ribbon"/>
    <img class="ribbon-logo" src="${esc(voiceLogoSrc || RTI_VOICE_LOGO_B64)}" alt="RTI Voice"/>
  </div>
  <div class="since">Subjected to the Movement of Right to Information in<br/>The organisational Social Work Field Since <span style="color:#dc2626;font-weight:800;">'15th'</span> Years</div>
  <div class="details-row">
    <div class="details">
      <div class="detail-line"><span class="detail-bold">Mr/Mrs ;- </span><span class="highlight">${esc(profile.name || '___________')}</span></div>
      <div class="detail-line"><span class="detail-bold">appointed as </span><span class="highlight-mid">All India</span></div>
      <div class="detail-line"><span class="detail-bold">State/District/Taluka/Village ;- </span><br/><span class="highlight-mid">${esc(location)}</span></div>
      <div class="date-line">Date: <span class="highlight-mid">${esc(issued)}</span> &nbsp;&nbsp;to&nbsp;&nbsp; <span class="highlight-mid">${esc(validUpto)}</span></div>
      <div class="body-copy">On a Non-Payment basis as a Social Activity<br/>and will follow all "Bhartiya<br/><span style="font-weight:700;">Sanvidhan</span>" Rules and Regulations.</div>
    </div>
    <div class="photo-box">${photoHtml}</div>
  </div>
  <div class="sign-row">
    <div><div class="contact-title">Contact</div><div class="contact-value"><span style="font-size:9px;font-weight:600;color:#6b7280;">Ph: </span>${esc(phoneNumber || '___________')}</div><div class="contact-value"><span style="font-size:9px;font-weight:600;color:#6b7280;">Mob: </span>${esc(mobileNumber || '___________')}</div></div>
    <div class="sign-right"><div class="faithfully">Your Faithfully</div><div class="sign-name">Owner/Publisher/All India President</div><div class="sign-name">Chief Editor Bhartiya Mahiti Adhikar</div><div class="sign-sub">(All India RTI News Network)</div></div>
  </div>
  <div class="footer"><div>E-mail: ${esc(profile.email || '___________')} | Web: www.bhartiyamahitladhikar.com</div></div>
 </div>
${responsiveScript}
${autoPrintScript}
 </body></html>`;
}
