// utils/invoiceGenerator.js
// ─────────────────────────────────────────────────────────────────
// Invoice / Receipt generator (user side)
//   • Subscription invoice  -> GET /payment-history ki ek row se (paid payments)
//   • Withdrawal receipt    -> GET /wallet/withdrawals ki ek row se (paid / approved)
// Output: print-ready A4 HTML. downloadInvoicePdf() isse
//   web     -> print dialog (Save as PDF)
//   Android -> PDF file save (folder chuno) ya share
//   iOS     -> share sheet
// Backend jo bhi extra field bheje (gst, tax, razorpay ids, utr...) use automatically dikhaya jata hai;
// jo field API nahi deti wo invoice me dikhai hi nahi jati (koi value invent nahi hoti).
// ─────────────────────────────────────────────────────────────────
import { Platform } from 'react-native';
import { esc, safeName } from './profileHelpers';
import { resolveModuleImageSrc } from './imageHandling';
import { CERT_LOGO } from '../constants/profileConstants';

// ⚠️ Apni company ki details yahan bharo — invoice ke upar yahi dikhengi.
export const INVOICE_COMPANY = {
  name: 'RTI India News',
  tagline: 'RTI Voice · News Network',
  email: 'info@rtinews.in',
  address: '',        // example: 'Office no. 12, Main Road, Pune, Maharashtra - 411001'
  gstin: '',          // example: '27ABCDE1234F1Z5'  (khali ho to invoice par nahi dikhega)
  website: '',        // example: 'www.rtinews.in'
};

const MODULE_LABELS = { role: 'Role / Membership', ads: 'Advertisement', ecom: 'E-Commerce', quiz: 'Quiz' };

// ── helpers ──────────────────────────────────────────────────────
const pick = (obj, keys) => {
  for (const k of keys) {
    const v = k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), obj);
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
};

const num = (v) => {
  const n = Number(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

export const inr = (v) => {
  const n = num(v);
  if (n == null) return '—';
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
};

const fmtDate = (value, withTime = false) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (!withTime || !/\d{2}:\d{2}/.test(String(value))) return date;
  return `${date}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
};

const ymd = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const maskAcc = (v = '') => {
  const s = String(v || '').replace(/\s+/g, '');
  return s.length > 4 ? `${'X'.repeat(s.length - 4)}${s.slice(-4)}` : s;
};

const row = (label, value) =>
  value === '' || value == null || value === '—'
    ? ''
    : `<tr><td class="k">${esc(label)}</td><td class="v">${esc(value)}</td></tr>`;

const BASE_CSS = `
  *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:0;padding:0;background:#fff}
  .page{width:100%;max-width:760px;margin:0 auto;padding:28px 32px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #dc2626;padding-bottom:14px}
  .brand{font-size:22px;font-weight:800;color:#dc2626;letter-spacing:.3px} .tag{font-size:11px;color:#6b7280;margin-top:2px}
  .co{font-size:11px;color:#374151;margin-top:6px;line-height:1.5}
  .doc{text-align:right} .doc h1{margin:0;font-size:24px;letter-spacing:2px;color:#111827}
  .doc .no{font-size:12px;color:#374151;margin-top:6px;line-height:1.6}
  .badge{display:inline-block;margin-top:8px;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.5px}
  .b-paid{background:#dcfce7;color:#166534} .b-pending{background:#fef3c7;color:#92400e} .b-failed{background:#fee2e2;color:#991b1b} .b-gray{background:#f3f4f6;color:#374151}
  .cols{display:flex;gap:24px;margin-top:20px} .col{flex:1}
  .h{font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
  .box{font-size:13px;line-height:1.6;color:#111827}
  table{width:100%;border-collapse:collapse} .items{margin-top:22px}
  .items th{background:#f9fafb;border:1px solid #e5e7eb;padding:9px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:#374151;text-align:left}
  .items td{border:1px solid #e5e7eb;padding:10px;font-size:13px;vertical-align:top} .r{text-align:right}
  .sub{font-size:11px;color:#6b7280;margin-top:3px}
  .tot{width:46%;margin-left:auto;margin-top:12px} .tot td{padding:6px 10px;font-size:13px}
  .tot .grand td{border-top:2px solid #111827;font-weight:800;font-size:15px;padding-top:10px}
  .kv{margin-top:6px} .kv td{padding:5px 0;font-size:12.5px;vertical-align:top} .kv .k{width:38%;color:#6b7280} .kv .v{font-weight:600;word-break:break-all}
  .note{margin-top:22px;padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;font-size:11px;color:#4b5563;line-height:1.6}
  .foot{margin-top:26px;text-align:center;font-size:11px;color:#6b7280;border-top:1px dashed #d1d5db;padding-top:12px}
  @page{size:A4;margin:12mm} @media print{.page{padding:0} body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`;

// RTI ka logo (assets/images/certificate_logo.jpg) ko base64 me badalta hai taaki PDF / print me hamesha dikhe
let _logoCache = '';
export async function loadInvoiceLogo() {
  if (_logoCache) return _logoCache;
  try {
    _logoCache = (await resolveModuleImageSrc(CERT_LOGO, 'image/jpeg')) || '';
  } catch (_) { _logoCache = ''; }
  return _logoCache;
}

const companyBlock = (logoSrc = '') => `
  <div style="display:flex;align-items:flex-start;gap:12px">
    ${logoSrc ? `<img src="${esc(logoSrc)}" alt="${esc(INVOICE_COMPANY.name)}" style="width:62px;height:62px;object-fit:contain;border-radius:50%;border:1px solid #e5e7eb;background:#fff;flex-shrink:0"/>` : ''}
    <div>
    <div class="brand">${esc(INVOICE_COMPANY.name)}</div>
    ${INVOICE_COMPANY.tagline ? `<div class="tag">${esc(INVOICE_COMPANY.tagline)}</div>` : ''}
    <div class="co">
      ${INVOICE_COMPANY.address ? `${esc(INVOICE_COMPANY.address)}<br/>` : ''}
      ${INVOICE_COMPANY.email ? `Email: ${esc(INVOICE_COMPANY.email)}` : ''}${INVOICE_COMPANY.website ? ` &nbsp;|&nbsp; ${esc(INVOICE_COMPANY.website)}` : ''}
      ${INVOICE_COMPANY.gstin ? `<br/>GSTIN: ${esc(INVOICE_COMPANY.gstin)}` : ''}
    </div>
    </div>
  </div>`;

const wrap = (title, inner) => `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title><style>${BASE_CSS}</style></head><body><div class="page">${inner}</div></body></html>`;

const buyerBlock = (user = {}) => {
  const name = pick(user, ['name', 'full_name']);
  const email = pick(user, ['email']);
  const phone = pick(user, ['contact_number', 'mobile_number', 'mobile', 'phone']);
  const loc = [pick(user, ['village']), pick(user, ['taluka']), pick(user, ['district']), pick(user, ['state'])].filter(Boolean).join(', ');
  return `<div class="box">
    ${name ? `<b>${esc(name)}</b><br/>` : ''}
    ${email ? `${esc(email)}<br/>` : ''}
    ${phone ? `Mobile: ${esc(phone)}<br/>` : ''}
    ${loc ? esc(loc) : ''}
  </div>`;
};

// ── Subscription invoice ─────────────────────────────────────────
export function getPaymentInvoiceNo(p = {}) {
  const id = String(pick(p, ['invoice_number', 'invoice_no', 'payment_id', 'id', 'order_id']) || 'NA');
  const clean = id.replace(/[^a-z0-9]/gi, '').toUpperCase();
  if (/^INV/i.test(String(pick(p, ['invoice_number', 'invoice_no'])))) return String(pick(p, ['invoice_number', 'invoice_no']));
  const ym = ymd(pick(p, ['purchase_date', 'paid_at', 'created_at'])) || '000000';
  return `INV-${ym}-${clean.slice(-8) || 'NA'}`;
}

export function canInvoicePayment(p = {}) {
  return String(p?.status || '').toLowerCase() === 'paid' && String(p?.payment_id || '').indexOf('local-') !== 0;
}

export function buildSubscriptionInvoiceHtml(payment = {}, user = {}, logoSrc = '') {
  const invNo = getPaymentInvoiceNo(payment);
  const moduleKey = String(payment.module || '').toLowerCase();
  const moduleLabel = payment.module_label || MODULE_LABELS[moduleKey] || 'Subscription';
  const planTitle = pick(payment, ['plan.title', 'plan.name', 'plan_name', 'plan_title']) || 'Subscription Plan';
  const planDuration = pick(payment, ['plan.duration', 'plan.duration_label', 'plan.validity_days', 'duration']);
  const paidOn = pick(payment, ['paid_at', 'purchase_date', 'created_at']);
  const amount = num(pick(payment, ['amount', 'total', 'paid_amount']));

  // Tax / discount sirf tab dikhao jab API ne diya ho
  const tax = num(pick(payment, ['tax', 'tax_amount', 'gst', 'gst_amount']));
  const discount = num(pick(payment, ['discount', 'discount_amount']));
  const base = num(pick(payment, ['base_amount', 'subtotal', 'sub_total', 'price']));
  const hasBreakup = base != null && (tax != null || discount != null);

  const gatewayPay = pick(payment, ['razorpay_payment_id', 'gateway_payment_id', 'transaction_id', 'payment_reference']);
  const gatewayOrder = pick(payment, ['razorpay_order_id', 'order_id', 'gateway_order_id']);
  const method = pick(payment, ['payment_method', 'method', 'gateway']);

  const start = pick(payment, ['start_date']);
  const end = pick(payment, ['end_date']);
  const validity = start || end ? `${fmtDate(start)} → ${end ? fmtDate(end) : 'No expiry'}` : '';

  const inner = `
    <div class="top">
      ${companyBlock(logoSrc)}
      <div class="doc">
        <h1>INVOICE</h1>
        <div class="no"><b>Invoice No:</b> ${esc(invNo)}<br/><b>Date:</b> ${esc(fmtDate(paidOn))}</div>
        <span class="badge b-paid">PAID</span>
      </div>
    </div>

    <div class="cols">
      <div class="col"><div class="h">Billed To</div>${buyerBlock(user)}</div>
      <div class="col"><div class="h">Payment Details</div>
        <table class="kv">
          ${row('Payment ID', pick(payment, ['payment_id', 'id']))}
          ${row('Gateway Ref', gatewayPay)}
          ${row('Order ID', gatewayOrder)}
          ${row('Method', method ? String(method).toUpperCase() : '')}
          ${row('Paid On', fmtDate(paidOn, true))}
        </table>
      </div>
    </div>

    <table class="items">
      <thead><tr><th style="width:6%">#</th><th>Description</th><th style="width:26%">Validity</th><th class="r" style="width:16%">Amount</th></tr></thead>
      <tbody>
        <tr>
          <td>1</td>
          <td><b>${esc(planTitle)}</b><div class="sub">${esc(moduleLabel)}${planDuration ? ` · ${esc(planDuration)}${/^\d+$/.test(String(planDuration)) ? ' days' : ''}` : ''}</div></td>
          <td>${esc(validity || '—')}</td>
          <td class="r">${esc(inr(hasBreakup ? base : amount))}</td>
        </tr>
      </tbody>
    </table>

    <table class="tot">
      ${hasBreakup && discount ? `<tr><td>Discount</td><td class="r">- ${esc(inr(discount))}</td></tr>` : ''}
      ${hasBreakup && tax ? `<tr><td>Tax / GST</td><td class="r">${esc(inr(tax))}</td></tr>` : ''}
      <tr class="grand"><td>Total Paid</td><td class="r">${esc(inr(amount))}</td></tr>
    </table>

    <div class="note">This is a computer generated invoice for your ${esc(moduleLabel.toLowerCase())} subscription and does not require a signature.
    Digital services once activated are non-transferable. For any billing query contact ${esc(INVOICE_COMPANY.email || 'support')} with the Invoice No.</div>
    <div class="foot">Thank you for choosing ${esc(INVOICE_COMPANY.name)}</div>`;

  return wrap(`Invoice ${invNo}`, inner);
}

// ── Withdrawal receipt ───────────────────────────────────────────
export function getWithdrawalReceiptNo(w = {}) {
  const id = String(pick(w, ['receipt_number', 'reference_no', 'id']) || 'NA').replace(/[^a-z0-9]/gi, '').toUpperCase();
  const ym = ymd(pick(w, ['processed_at', 'paid_at', 'date', 'created_at'])) || '000000';
  return `WDR-${ym}-${id.slice(-8) || 'NA'}`;
}

export function canInvoiceWithdrawal(w = {}) {
  const st = String(w?.status || '').toLowerCase();
  return st === 'paid' || st === 'approved' || st === 'completed' || st === 'success';
}

export function buildWithdrawalReceiptHtml(w = {}, user = {}, logoSrc = '') {
  const no = getWithdrawalReceiptNo(w);
  const st = String(w.status || '').toLowerCase();
  const isPaid = st === 'paid' || st === 'completed' || st === 'success';
  const requested = pick(w, ['created_at', 'requested_at', 'date']);
  const processed = pick(w, ['paid_at', 'processed_at', 'approved_at', 'updated_at']);
  const gross = num(pick(w, ['amount', 'requested_amount']));
  const fee = num(pick(w, ['fee', 'charges', 'processing_fee', 'service_charge']));
  const tds = num(pick(w, ['tds', 'tds_amount']));
  const net = num(pick(w, ['net_amount', 'payable_amount', 'payout_amount']));
  const hasDeductions = (fee != null && fee > 0) || (tds != null && tds > 0);
  const netShown = net != null ? net : (hasDeductions ? (gross || 0) - (fee || 0) - (tds || 0) : gross);

  const isUpi = String(w.payment_mode || '').toLowerCase() === 'upi';
  const modeLabel = isUpi ? 'UPI' : 'Bank Transfer';
  const utr = pick(w, ['payout_reference', 'utr', 'utr_number', 'transaction_id']);

  const inner = `
    <div class="top">
      ${companyBlock(logoSrc)}
      <div class="doc">
        <h1>WITHDRAWAL<br/>RECEIPT</h1>
        <div class="no"><b>Receipt No:</b> ${esc(no)}<br/><b>Date:</b> ${esc(fmtDate(processed || requested))}</div>
        <span class="badge ${isPaid ? 'b-paid' : 'b-pending'}">${isPaid ? 'PAID' : 'APPROVED'}</span>
      </div>
    </div>

    <div class="cols">
      <div class="col"><div class="h">Paid To</div>${buyerBlock({ ...user, name: w.account_holder_name || user.name })}</div>
      <div class="col"><div class="h">Request Details</div>
        <table class="kv">
          ${row('Request ID', pick(w, ['id']))}
          ${row('Requested On', fmtDate(requested, true))}
          ${row(isPaid ? 'Paid On' : 'Approved On', processed ? fmtDate(processed, true) : '')}
          ${row('UTR / Reference', utr)}
        </table>
      </div>
    </div>

    <div class="h" style="margin-top:20px">Payout Account</div>
    <table class="kv">
      ${row('Mode', modeLabel)}
      ${isUpi ? row('UPI ID', w.upi_id) : `${row('Account Holder', w.account_holder_name)}${row('Bank', w.bank_name)}${row('Account No', maskAcc(w.account_number))}${row('IFSC', w.ifsc_code || w.ifsc)}`}
      ${row('PAN', w.pan_number ? `${String(w.pan_number).slice(0, 2)}XXXXXX${String(w.pan_number).slice(-2)}` : '')}
    </table>

    <table class="items">
      <thead><tr><th>Description</th><th class="r" style="width:22%">Amount</th></tr></thead>
      <tbody>
        <tr><td><b>Wallet withdrawal</b><div class="sub">Withdrawn from wallet balance via ${esc(modeLabel)}</div></td><td class="r">${esc(inr(gross))}</td></tr>
        ${fee ? `<tr><td>Processing fee</td><td class="r">- ${esc(inr(fee))}</td></tr>` : ''}
        ${tds ? `<tr><td>TDS</td><td class="r">- ${esc(inr(tds))}</td></tr>` : ''}
      </tbody>
    </table>
    <table class="tot">
      <tr class="grand"><td>${isPaid ? 'Net Amount Paid' : 'Net Amount Payable'}</td><td class="r">${esc(inr(netShown))}</td></tr>
    </table>

    <div class="note">This is a computer generated receipt for the withdrawal requested from your ${esc(INVOICE_COMPANY.name)} wallet and does not require a signature.
    Please quote the Receipt No / UTR for any bank related query.</div>
    <div class="foot">${esc(INVOICE_COMPANY.name)} · ${esc(INVOICE_COMPANY.email || '')}</div>`;

  return wrap(`Withdrawal Receipt ${no}`, inner);
}

// ── Download / Print (web + Android + iOS) ───────────────────────
const trySaveAndroid = async (uri, filename) => {
  try {
    if (Platform.OS !== 'android') return false;
    const FileSystem = await import('expo-file-system/legacy');
    const SAF = FileSystem.StorageAccessFramework;
    if (!SAF?.requestDirectoryPermissionsAsync || !SAF?.createFileAsync) return false;
    const permissions = await SAF.requestDirectoryPermissionsAsync();
    if (!permissions?.granted) return false;
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const dest = await SAF.createFileAsync(permissions.directoryUri, filename.replace(/\.pdf$/i, ''), 'application/pdf');
    await FileSystem.writeAsStringAsync(dest, b64, { encoding: FileSystem.EncodingType.Base64 });
    return true;
  } catch (_) { return false; }
};

const printViaIframe = (html) => new Promise((resolve) => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'invoice-print');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (_) { /* ignore */ }
    setTimeout(() => { try { document.body.removeChild(iframe); } catch (_) { /* ignore */ } resolve(); }, 1500);
  };
  iframe.onload = fire;
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  doc.open(); doc.write(html); doc.close();
  // kuch browsers me onload document.write par fire nahi hota
  setTimeout(fire, 700);
});

/**
 * @param {string} html   build*Html() ka output
 * @param {string} name   file ka naam (bina .pdf)
 * @returns {Promise<{ok:boolean, message?:string}>}
 */
export async function downloadInvoicePdf(html, name = 'invoice') {
  try {
    const filename = `${safeName(name) || 'invoice'}.pdf`;
    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') return { ok: false, message: 'Printing is not available.' };
      await printViaIframe(html);
      return { ok: true, message: 'Print dialog opened — choose "Save as PDF".' };
    }
    const Print = await import('expo-print');
    const Sharing = await import('expo-sharing');
    const a4 = { width: 595, height: 842 };
    let uri = '';
    try {
      ({ uri } = await Print.printToFileAsync({ html, base64: false, ...a4 }));
    } catch (e) {
      await Print.printAsync({ html, ...a4 });
      return { ok: true, message: 'Print opened.' };
    }
    if (await trySaveAndroid(uri, filename)) return { ok: true, message: 'PDF saved successfully.' };
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save / Share Invoice', UTI: 'com.adobe.pdf' });
      return { ok: true, message: 'Invoice ready.' };
    }
    return { ok: true, message: `PDF saved: ${uri.split('/').pop()}` };
  } catch (err) {
    return { ok: false, message: 'Unable to generate the invoice. Please try again.' };
  }
}