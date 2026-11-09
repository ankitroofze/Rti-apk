// utils/invoiceGenerator.js
// ─────────────────────────────────────────────────────────────────
// Professional GST Tax Invoice & Receipt Generator (RTI India News)
//   • Subscription / Plan Invoice  -> Tax invoice with 18% GST calculation (SAC 998431)
//   • Wallet Withdrawal Receipt    -> Formal disbursement receipt with TDS / fee breakup
// Output: Print-ready & PDF-ready A4 HTML.
// Email: rticheck@gmail.com
// ─────────────────────────────────────────────────────────────────
import { Platform } from 'react-native';
import { esc, safeName } from './profileHelpers';
import { resolveModuleImageSrc } from './imageHandling';
import { CERT_LOGO } from '../constants/profileConstants';
import { AuthAPI } from '../auth/ClientAPI/AuthApi';

// ⚠️ Company details for Invoice & GST Billing
export const INVOICE_COMPANY = {
  name: 'RTI India News',
  legalName: 'RTI India News Network',
  tagline: 'RTI Voice · National News Network',
  email: 'rticheck@gmail.com', // Updated billing & support email
  address: 'Corporate Office: Nariman Point, Mumbai, Maharashtra, India - 400021',
  gstin: '27AABCR1234F1Z5',    // Maharashtra State Code 27
  pan: 'AABCR1234F',
  sacCode: '998431',            // SAC 998431: Online text / news / info services
  website: 'www.rtinews.in',
  state: 'Maharashtra',
  stateCode: '27',
};

const MODULE_LABELS = {
  role: 'Role / Membership',
  ads: 'Advertisement Services',
  ecom: 'E-Commerce Marketplace',
  quiz: 'Quiz Subscription',
};

// ── helpers ──────────────────────────────────────────────────────
const pick = (obj, keys) => {
  for (const k of keys) {
    const v = k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), obj);
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
};

const num = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const s = String(v).replace(/[^0-9.-]/g, '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export const inr = (v) => {
  const n = num(v);
  if (n == null) return '—';
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export function amountInWords(val) {
  const n = Math.round(Number(val) || 0);
  if (n <= 0) return 'Zero Rupees Only';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function convertLessThanThousand(numVal) {
    let s = '';
    if (numVal >= 100) {
      s += units[Math.floor(numVal / 100)] + ' Hundred ';
      numVal %= 100;
    }
    if (numVal >= 20) {
      s += tens[Math.floor(numVal / 10)] + ' ';
      numVal %= 10;
    }
    if (numVal > 0) {
      s += units[numVal] + ' ';
    }
    return s.trim();
  }
  let crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  let lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  let thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  let parts = [];
  if (crore) parts.push(convertLessThanThousand(crore) + ' Crore');
  if (lakh) parts.push(convertLessThanThousand(lakh) + ' Lakh');
  if (thousand) parts.push(convertLessThanThousand(thousand) + ' Thousand');
  if (rem) parts.push(convertLessThanThousand(rem));
  return (parts.join(' ') + ' Rupees Only').replace(/\s+/g, ' ');
}

// ── GST Calculation Engine ──────────────────────────────────────
export function calculateGstBreakup(payment = {}, user = {}) {
  const totalAmount = num(pick(payment, ['amount', 'total', 'paid_amount'])) || 0;
  const explicitTax = num(pick(payment, ['tax', 'tax_amount', 'gst', 'gst_amount']));
  const explicitBase = num(pick(payment, ['base_amount', 'subtotal', 'sub_total']));
  const explicitDiscount = num(pick(payment, ['discount', 'discount_amount'])) || 0;

  const COMPANY_STATE_CODE = INVOICE_COMPANY.stateCode || '27';
  const COMPANY_STATE_NAME = INVOICE_COMPANY.state || 'Maharashtra';

  const customerState = String(pick(user, ['state', 'province']) || pick(payment, ['state', 'customer_state']) || '').trim();
  const isInterState = customerState ? (!customerState.toLowerCase().includes('maharashtra') && customerState.toLowerCase() !== 'mh' && customerState !== '27') : false;

  const GST_RATE_PERCENT = 18; // 18% GST on digital news and publishing services

  let baseAmount = 0;
  let gstAmount = 0;
  let discountAmount = explicitDiscount;
  let finalTotal = totalAmount;

  if (explicitBase != null && explicitTax != null) {
    baseAmount = explicitBase;
    gstAmount = explicitTax;
    finalTotal = totalAmount || Math.round((baseAmount + gstAmount - discountAmount) * 100) / 100;
  } else if (explicitBase != null && explicitTax == null) {
    baseAmount = explicitBase;
    gstAmount = Math.round((baseAmount * (GST_RATE_PERCENT / 100)) * 100) / 100;
    finalTotal = totalAmount || Math.round((baseAmount + gstAmount - discountAmount) * 100) / 100;
  } else if (totalAmount > 0) {
    // Total is inclusive of 18% GST (Indian standard consumer subscription practice)
    baseAmount = Math.round((totalAmount / (1 + (GST_RATE_PERCENT / 100))) * 100) / 100;
    gstAmount = Math.round((totalAmount - baseAmount) * 100) / 100;
    finalTotal = totalAmount;
  }

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstAmount = gstAmount;
  } else {
    cgstAmount = Math.round((gstAmount / 2) * 100) / 100;
    sgstAmount = Math.round((gstAmount - cgstAmount) * 100) / 100;
  }

  return {
    totalAmount: finalTotal,
    baseAmount,
    gstAmount,
    discountAmount,
    gstRatePercent: GST_RATE_PERCENT,
    isInterState,
    cgstRate: isInterState ? 0 : 9,
    sgstRate: isInterState ? 0 : 9,
    igstRate: isInterState ? 18 : 0,
    cgstAmount,
    sgstAmount,
    igstAmount,
    sacCode: INVOICE_COMPANY.sacCode || '998431',
    customerState: customerState || COMPANY_STATE_NAME,
    companyState: COMPANY_STATE_NAME,
    companyStateCode: COMPANY_STATE_CODE,
  };
}

const row = (label, value) =>
  value === '' || value == null || value === '—'
    ? ''
    : `<tr><td class="k">${esc(label)}</td><td class="v">${esc(value)}</td></tr>`;

const BASE_CSS = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Roboto', Arial, Helvetica, sans-serif;
    color: #0f172a;
    margin: 0;
    padding: 0;
    background: #f8fafc;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 100%;
    max-width: 800px;
    margin: 20px auto;
    padding: 32px 36px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
  }
  @media print {
    body { background: #fff; }
    .page { margin: 0; padding: 20px; box-shadow: none; border: none; max-width: 100%; }
  }
  .accent-bar { height: 4px; background: #dc2626; border-radius: 4px 4px 0 0; margin: -32px -36px 24px -36px; }
  @media print { .accent-bar { margin: -20px -20px 20px -20px; } }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 18px;
    gap: 16px;
  }
  .brand-group { display: flex; align-items: flex-start; gap: 14px; }
  .brand-logo { width: 62px; height: 62px; object-fit: contain; border-radius: 50%; border: 1px solid #e2e8f0; background: #fff; flex-shrink: 0; }
  .brand { font-size: 21px; font-weight: 800; color: #dc2626; letter-spacing: 0.3px; line-height: 1.2; }
  .tag { font-size: 11px; font-weight: 600; color: #64748b; margin-top: 3px; }
  .co-details { font-size: 11.5px; color: #475569; margin-top: 6px; line-height: 1.55; }
  .co-details b { color: #1e293b; }
  .doc { text-align: right; }
  .doc h1 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1.5px; color: #0f172a; }
  .badge-paid {
    display: inline-block;
    margin-top: 6px;
    padding: 3px 12px;
    background: #dcfce7;
    color: #15803d;
    border: 1px solid #86efac;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .badge-pending {
    display: inline-block;
    margin-top: 6px;
    padding: 3px 12px;
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .doc-meta { font-size: 12px; color: #334155; margin-top: 8px; line-height: 1.6; }
  .doc-meta b { color: #0f172a; }
  .cols { display: flex; gap: 16px; margin-top: 20px; }
  .col-card {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
  }
  .col-title {
    font-size: 11px;
    font-weight: 800;
    color: #dc2626;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
  }
  .info-line { font-size: 12.5px; line-height: 1.6; color: #334155; }
  .info-line b { color: #0f172a; }
  .table-kv { width: 100%; border-collapse: collapse; }
  .table-kv td { padding: 3px 0; font-size: 12px; vertical-align: top; }
  .table-kv .k { width: 42%; color: #64748b; font-weight: 500; }
  .table-kv .v { color: #0f172a; font-weight: 600; word-break: break-all; }
  .items { width: 100%; border-collapse: collapse; margin-top: 22px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .items th {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 10px 12px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #334155;
    text-align: left;
  }
  .items td {
    border: 1px solid #e2e8f0;
    padding: 11px 12px;
    font-size: 12.5px;
    vertical-align: middle;
    color: #1e293b;
  }
  .items .sub-desc { font-size: 11px; color: #64748b; margin-top: 3px; }
  .r { text-align: right; }
  .c { text-align: center; }
  .summary-wrap { display: flex; justify-content: space-between; gap: 20px; margin-top: 18px; align-items: flex-start; }
  .tax-box {
    flex: 1.15;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 14px;
  }
  .tax-title { font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; }
  .tax-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  .tax-table th { color: #64748b; font-weight: 700; padding: 4px 6px; border-bottom: 1px solid #cbd5e1; text-align: left; }
  .tax-table td { padding: 4px 6px; color: #334155; }
  .tax-table .r { text-align: right; }
  .tax-table tr.tot-row td { border-top: 1px solid #cbd5e1; font-weight: 800; color: #0f172a; padding-top: 6px; }
  .words-box { margin-top: 10px; padding: 8px 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; color: #334155; }
  .words-box b { color: #dc2626; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 2px; }
  .totals-box { width: 44%; flex-shrink: 0; }
  .tot-table { width: 100%; border-collapse: collapse; }
  .tot-table td { padding: 6px 10px; font-size: 12.5px; color: #475569; }
  .tot-table .r { text-align: right; font-weight: 600; color: #1e293b; }
  .tot-table .grand td {
    border-top: 2px solid #dc2626;
    background: #fef2f2;
    color: #991b1b;
    font-weight: 900;
    font-size: 15px;
    padding: 10px 12px;
    border-radius: 4px;
  }
  .tot-table .grand .r { color: #dc2626; font-size: 16px; font-weight: 900; }
  .note {
    margin-top: 22px;
    padding: 12px 14px;
    background: #f8fafc;
    border-left: 3px solid #dc2626;
    border-radius: 4px;
    font-size: 11px;
    color: #475569;
    line-height: 1.6;
  }
  .note b { color: #0f172a; }
  .note a { color: #dc2626; text-decoration: none; font-weight: 600; }
  .foot {
    margin-top: 22px;
    text-align: center;
    font-size: 11px;
    color: #64748b;
    border-top: 1px dashed #cbd5e1;
    padding-top: 12px;
  }
  @page { size: A4; margin: 12mm; }
`;

// RTI logo cache (assets/images/certificate_logo.jpg) converted to base64
let _logoCache = '';
export async function loadInvoiceLogo() {
  if (_logoCache) return _logoCache;
  try {
    _logoCache = (await resolveModuleImageSrc(CERT_LOGO, 'image/jpeg')) || '';
  } catch (_) { _logoCache = ''; }
  return _logoCache;
}

const companyBlock = (logoSrc = '') => `
  <div class="brand-group">
    ${logoSrc ? `<img src="${esc(logoSrc)}" alt="${esc(INVOICE_COMPANY.name)}" class="brand-logo" />` : ''}
    <div>
      <div class="brand">${esc(INVOICE_COMPANY.name)}</div>
      ${INVOICE_COMPANY.tagline ? `<div class="tag">${esc(INVOICE_COMPANY.tagline)}</div>` : ''}
      <div class="co-details">
        ${INVOICE_COMPANY.address ? `${esc(INVOICE_COMPANY.address)}<br/>` : ''}
        <b>Email:</b> ${esc(INVOICE_COMPANY.email)}${INVOICE_COMPANY.website ? ` &nbsp;|&nbsp; <b>Web:</b> ${esc(INVOICE_COMPANY.website)}` : ''}<br/>
        <b>GSTIN:</b> ${esc(INVOICE_COMPANY.gstin)} &nbsp;|&nbsp; <b>PAN:</b> ${esc(INVOICE_COMPANY.pan)}<br/>
        <b>State:</b> ${esc(INVOICE_COMPANY.state)} (Code: ${esc(INVOICE_COMPANY.stateCode)})
      </div>
    </div>
  </div>`;

const wrap = (title, inner) => `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title><style>${BASE_CSS}</style></head><body><div class="page"><div class="accent-bar"></div>${inner}</div></body></html>`;

const buyerBlock = (user = {}, gst = {}) => {
  const name = pick(user, ['name', 'full_name']) || 'Valued Subscriber';
  const email = pick(user, ['email']);
  const phone = pick(user, ['contact_number', 'mobile_number', 'mobile', 'phone']);
  const village = pick(user, ['village']);
  const taluka = pick(user, ['taluka']);
  const district = pick(user, ['district']);
  const state = pick(user, ['state']) || gst.customerState || '';
  const addrParts = [village, taluka, district, state].filter(Boolean);
  const loc = addrParts.join(', ');
  return `
    <div class="info-line">
      <b>${esc(name)}</b><br/>
      ${email ? `<b>Email:</b> ${esc(email)}<br/>` : ''}
      ${phone ? `<b>Mobile:</b> ${esc(phone)}<br/>` : ''}
      ${loc ? `<b>Address:</b> ${esc(loc)}<br/>` : ''}
      <b>Place of Supply:</b> ${esc(state || INVOICE_COMPANY.state)}
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
  const planTitle = pick(payment, ['plan.title', 'plan.name', 'plan_name', 'plan_title']) || `${moduleLabel} Plan`;
  const planDuration = pick(payment, ['plan.duration', 'plan.duration_label', 'plan.validity_days', 'duration']);
  const paidOn = pick(payment, ['paid_at', 'purchase_date', 'created_at']);

  // Calculate 18% GST Breakup (Intra-State: CGST 9% + SGST 9%, Inter-State: IGST 18%)
  const gst = calculateGstBreakup(payment, user);

  const gatewayPay = pick(payment, ['razorpay_payment_id', 'gateway_payment_id', 'transaction_id', 'payment_reference', 'payment_id']);
  const gatewayOrder = pick(payment, ['razorpay_order_id', 'order_id', 'gateway_order_id']);
  const method = pick(payment, ['payment_method', 'method', 'gateway']) || 'Online Payment';

  const start = pick(payment, ['start_date']);
  const end = pick(payment, ['end_date']);
  const validity = start || end ? `${fmtDate(start)} → ${end ? fmtDate(end) : 'No expiry'}` : (planDuration ? `${planDuration}${/^\d+$/.test(String(planDuration)) ? ' days' : ''}` : 'Active');

  const inner = `
    <div class="top">
      ${companyBlock(logoSrc)}
      <div class="doc">
        <h1>TAX INVOICE</h1>
        <span class="badge-paid">PAID &amp; VERIFIED</span>
        <div class="doc-meta">
          <b>Invoice No:</b> ${esc(invNo)}<br/>
          <b>Date:</b> ${esc(fmtDate(paidOn))}<br/>
          <b>Reverse Charge:</b> No
        </div>
      </div>
    </div>

    <div class="cols">
      <div class="col-card">
        <div class="col-title">Billed To (Customer Details)</div>
        ${buyerBlock(user, gst)}
      </div>
      <div class="col-card">
        <div class="col-title">Payment &amp; Transaction Details</div>
        <table class="table-kv">
          ${row('Payment ID', gatewayPay || pick(payment, ['id']))}
          ${row('Order ID', gatewayOrder)}
          ${row('Payment Mode', String(method).toUpperCase())}
          ${row('Paid On', fmtDate(paidOn, true))}
          ${row('Place of Supply', gst.customerState)}
        </table>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th style="width:5%" class="c">#</th>
          <th>Description &amp; Service Particulars</th>
          <th style="width:13%" class="c">HSN / SAC</th>
          <th style="width:18%">Validity</th>
          <th class="r" style="width:15%">Taxable Value</th>
          <th class="c" style="width:10%">GST Rate</th>
          <th class="r" style="width:15%">Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="c">1</td>
          <td>
            <b>${esc(planTitle)}</b>
            <div class="sub-desc">${esc(moduleLabel)} · Digital Access Services</div>
          </td>
          <td class="c">${esc(gst.sacCode)}</td>
          <td>${esc(validity)}</td>
          <td class="r">${esc(inr(gst.baseAmount))}</td>
          <td class="c">${gst.gstRatePercent}%</td>
          <td class="r">${esc(inr(gst.totalAmount))}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary-wrap">
      <div class="tax-box">
        <div class="tax-title">GST Tax Calculation Summary (SAC: ${esc(gst.sacCode)})</div>
        <table class="tax-table">
          <thead>
            <tr>
              <th>Tax Component</th>
              <th class="c">Rate</th>
              <th class="r">Taxable Val</th>
              <th class="r">Tax Amt</th>
            </tr>
          </thead>
          <tbody>
            ${!gst.isInterState ? `
              <tr>
                <td>Central GST (CGST)</td>
                <td class="c">9.0%</td>
                <td class="r">${esc(inr(gst.baseAmount))}</td>
                <td class="r">${esc(inr(gst.cgstAmount))}</td>
              </tr>
              <tr>
                <td>State GST (SGST)</td>
                <td class="c">9.0%</td>
                <td class="r">${esc(inr(gst.baseAmount))}</td>
                <td class="r">${esc(inr(gst.sgstAmount))}</td>
              </tr>
            ` : `
              <tr>
                <td>Integrated GST (IGST)</td>
                <td class="c">18.0%</td>
                <td class="r">${esc(inr(gst.baseAmount))}</td>
                <td class="r">${esc(inr(gst.igstAmount))}</td>
              </tr>
            `}
            <tr class="tot-row">
              <td><b>Total Tax (18%)</b></td>
              <td class="c"><b>18.0%</b></td>
              <td class="r"><b>${esc(inr(gst.baseAmount))}</b></td>
              <td class="r"><b>${esc(inr(gst.gstAmount))}</b></td>
            </tr>
          </tbody>
        </table>
        <div class="words-box">
          <b>Amount In Words:</b>
          ${esc(amountInWords(gst.totalAmount))}
        </div>
      </div>

      <div class="totals-box">
        <table class="tot-table">
          <tr>
            <td>Taxable Subtotal</td>
            <td class="r">${esc(inr(gst.baseAmount))}</td>
          </tr>
          ${gst.discountAmount ? `
            <tr>
              <td>Discount</td>
              <td class="r" style="color:#16a34a">- ${esc(inr(gst.discountAmount))}</td>
            </tr>
          ` : ''}
          ${!gst.isInterState ? `
            <tr>
              <td>CGST (9.0%)</td>
              <td class="r">${esc(inr(gst.cgstAmount))}</td>
            </tr>
            <tr>
              <td>SGST (9.0%)</td>
              <td class="r">${esc(inr(gst.sgstAmount))}</td>
            </tr>
          ` : `
            <tr>
              <td>IGST (18.0%)</td>
              <td class="r">${esc(inr(gst.igstAmount))}</td>
            </tr>
          `}
          <tr class="grand">
            <td>Grand Total Paid</td>
            <td class="r">${esc(inr(gst.totalAmount))}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="note">
      <b>Terms &amp; Information:</b><br/>
      • This is a computer-generated tax invoice and does not require a physical signature.<br/>
      • Services are billed under SAC Code ${esc(gst.sacCode)} (Online information &amp; news services) with applicable Goods and Services Tax (GST).<br/>
      • Digital subscriptions, credits and memberships once activated are non-refundable and non-transferable.<br/>
      • For any billing queries, GST input claims, or invoice support, please contact <b><a href="mailto:${esc(INVOICE_COMPANY.email)}">${esc(INVOICE_COMPANY.email)}</a></b> mentioning your Invoice No: <b>${esc(invNo)}</b>.
    </div>
    <div class="foot">Thank you for subscribing to ${esc(INVOICE_COMPANY.name)} · Empowering Citizens Through Free &amp; Transparent Information</div>`;

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
  const modeLabel = isUpi ? 'UPI Payout' : 'Bank Transfer';
  const utr = pick(w, ['payout_reference', 'utr', 'utr_number', 'transaction_id']);

  const inner = `
    <div class="top">
      ${companyBlock(logoSrc)}
      <div class="doc">
        <h1>PAYOUT RECEIPT</h1>
        <span class="${isPaid ? 'badge-paid' : 'badge-pending'}">${isPaid ? 'PROCESSED &amp; PAID' : 'APPROVED'}</span>
        <div class="doc-meta">
          <b>Receipt No:</b> ${esc(no)}<br/>
          <b>Date:</b> ${esc(fmtDate(processed || requested))}<br/>
          <b>Type:</b> Wallet Withdrawal
        </div>
      </div>
    </div>

    <div class="cols">
      <div class="col-card">
        <div class="col-title">Paid To (Member Details)</div>
        ${buyerBlock({ ...user, name: w.account_holder_name || user.name })}
      </div>
      <div class="col-card">
        <div class="col-title">Disbursement &amp; Request Details</div>
        <table class="table-kv">
          ${row('Request ID', pick(w, ['id']))}
          ${row('Requested On', fmtDate(requested, true))}
          ${row(isPaid ? 'Disbursed On' : 'Approved On', processed ? fmtDate(processed, true) : '')}
          ${row('UTR / Reference', utr)}
        </table>
      </div>
    </div>

    <div class="col-card" style="margin-top:16px">
      <div class="col-title">Beneficiary Payout Account</div>
      <table class="table-kv">
        ${row('Transfer Mode', modeLabel)}
        ${isUpi ? row('UPI ID', w.upi_id) : `${row('Account Holder', w.account_holder_name)}${row('Bank Name', w.bank_name)}${row('Account No', maskAcc(w.account_number))}${row('IFSC Code', w.ifsc_code || w.ifsc)}`}
        ${row('PAN Number', w.pan_number ? `${String(w.pan_number).slice(0, 2)}XXXXXX${String(w.pan_number).slice(-2)}` : '')}
      </table>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Particulars / Description</th>
          <th class="c" style="width:20%">Type</th>
          <th class="r" style="width:24%">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <b>Wallet Balance Withdrawal</b>
            <div class="sub-desc">Earnings disbursed to beneficiary via ${esc(modeLabel)}</div>
          </td>
          <td class="c">Gross Amount</td>
          <td class="r">${esc(inr(gross))}</td>
        </tr>
        ${fee ? `
          <tr>
            <td>Processing / Service Fee</td>
            <td class="c">Deduction</td>
            <td class="r" style="color:#dc2626">- ${esc(inr(fee))}</td>
          </tr>
        ` : ''}
        ${tds ? `
          <tr>
            <td>TDS / Withholding Tax</td>
            <td class="c">Statutory Tax</td>
            <td class="r" style="color:#dc2626">- ${esc(inr(tds))}</td>
          </tr>
        ` : ''}
      </tbody>
    </table>

    <div class="summary-wrap">
      <div class="tax-box">
        <div class="words-box" style="margin-top:0">
          <b>Disbursed Amount In Words:</b>
          ${esc(amountInWords(netShown))}
        </div>
      </div>
      <div class="totals-box">
        <table class="tot-table">
          <tr class="grand">
            <td>${isPaid ? 'Net Amount Disbursed' : 'Net Amount Payable'}</td>
            <td class="r">${esc(inr(netShown))}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="note">
      <b>Information:</b><br/>
      • This is a computer-generated payout receipt for the withdrawal requested from your ${esc(INVOICE_COMPANY.name)} wallet and does not require a signature.<br/>
      • Please quote Receipt No: <b>${esc(no)}</b> and UTR / Reference ID for any bank or accounting inquiries.<br/>
      • Support Email: <b><a href="mailto:${esc(INVOICE_COMPANY.email)}">${esc(INVOICE_COMPANY.email)}</a></b>
    </div>
    <div class="foot">${esc(INVOICE_COMPANY.name)} · ${esc(INVOICE_COMPANY.email)} · ${esc(INVOICE_COMPANY.website)}</div>`;

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
  // If onload doesn't fire on document.write
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

/**
 * Send subscription invoice copy to user's registered email
 * @param {object} payment
 * @param {object} user
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function sendInvoiceEmailCopy(payment = {}, user = {}) {
  try {
    const invNo = getPaymentInvoiceNo(payment);
    const logoSrc = await loadInvoiceLogo().catch(() => '');
    const html = buildSubscriptionInvoiceHtml(payment, user, logoSrc);
    const email = user?.email || payment?.email || payment?.user_email || '';
    if (!email) return { ok: false, message: 'User email address not found.' };

    const planTitle = pick(payment, ['plan.title', 'plan.name', 'plan_name', 'plan_title']) || 'Subscription';
    const amount = num(pick(payment, ['amount', 'total', 'paid_amount'])) || 0;

    const res = await AuthAPI.sendInvoiceEmail({
      email,
      paymentId: payment.payment_id || payment.id,
      invoiceNo: invNo,
      html,
      totalAmount: amount,
      planName: planTitle,
    });
    return res.ok ? { ok: true, message: `Invoice copy sent to ${email}!` } : res;
  } catch (err) {
    console.warn('[sendInvoiceEmailCopy] failed:', err);
    return { ok: false, message: err?.message || 'Could not send invoice email.' };
  }
}
