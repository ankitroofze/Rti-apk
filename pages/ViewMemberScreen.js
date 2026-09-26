// pages/VerifyMemberScreen.js
// ─────────────────────────────────────────────────────────
// Public verification page — opens when someone scans the QR code printed
// on a member's ID card. Works without login and without the app installed
// (it's a normal web page). All the data shown here comes from the `d`
// query param that was encoded into the QR itself (see utils/verificationHelpers.js).
// ─────────────────────────────────────────────────────────

import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { decodeVerificationData, getVerificationStatus, fmtDisplayDate, fmtDisplayDateTime } from '../utils/verificationHelpers';
import { getResponsiveWindowWidth } from '../utils/webDevice';

// ── Fixed organisation info — same for every member, so it isn't encoded in
// the QR (keeps the QR small). Update these here if the org details change. ──
const ORG_INFO = {
  name: 'Bhartiya Mahiti Adhikar — All India RTI News Network',
  registrationNumber: 'RNI.MAH/MUL/66399',
  udyamNumber: 'UDYAM-MH-29-0022246',
  website: 'https://rtinews.in',
  phone: '+91-XXXXXXXXXX',
  email: 'info@rtinews.in',
  officeLocation: 'Maharashtra, India',
  approvedBy: 'Chief Editor / All India President',
  whatsapp: '+91-XXXXXXXXXX',
};

const GREEN = '#16a34a';
const RED = '#dc2626';
const ORANGE = '#F97316';

function SectionCard({ title, icon, children }) {
  return (
    <View style={{ backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {icon}
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
      <Text style={{ fontSize: 13, color: '#64748b' }}>{label}</Text>
      <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '700', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

export default function VerifyMemberScreen({ route }) {
  const { width } = useWindowDimensions();
  const colWidth = Math.min(getResponsiveWindowWidth(width), 480);

  const [encoded, setEncoded] = useState(route?.params?.d || '');

  // Web: this page is opened directly from a scanned QR link
  // (https://rtinews.in/verify?d=...), so read the query param from the URL.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && !encoded) {
      try {
        const params = new URLSearchParams(window.location.search);
        const d = params.get('d');
        if (d) setEncoded(d);
      } catch (_e) {}
    }
  }, [encoded]);

  const payload = useMemo(() => (encoded ? decodeVerificationData(encoded) : null), [encoded]);
  const status = useMemo(() => getVerificationStatus(payload), [payload]);
  const [now] = useState(() => new Date());

  const isValid = Boolean(payload) && payload.tokenValid !== false;

  if (!encoded || !payload || !isValid) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Feather name="alert-triangle" size={48} color={RED} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 12 }}>Invalid QR Code</Text>
        <Text style={{ fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center' }}>
          This link could not be verified. Please scan the QR code directly from a genuine ID card.
        </Text>
      </View>
    );
  }

  const statusColor = status.active ? GREEN : RED;
  const statusBg = status.active ? '#f0fdf4' : '#fef2f2';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 12 }}>
      <View style={{ width: colWidth, maxWidth: '100%' }}>

        {/* 1. Live Verification Status */}
        <View style={{ backgroundColor: statusBg, borderRadius: 12, borderWidth: 1, borderColor: statusColor, padding: 18, alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: statusColor }} />
            <Text style={{ fontSize: 17, fontWeight: '900', color: statusColor }}>
              {status.active ? 'ID VERIFIED' : 'ID EXPIRED'}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: '#334155', marginTop: 6 }}>ID Status: <Text style={{ fontWeight: '800', color: statusColor }}>{status.label}</Text></Text>
          <Text style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
            Verification: {status.active ? 'Successfully Verified' : 'Card Validity Has Expired'}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Last Verified: {fmtDisplayDateTime(now.toISOString())}</Text>
        </View>

        {/* 2. Digital ID Card */}
        <SectionCard title="Digital ID Card" icon={<Feather name="credit-card" size={16} color={ORANGE} />}>
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: statusBg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: statusColor, marginBottom: 8 }}>
              <Feather name={status.active ? 'check' : 'x'} size={28} color={statusColor} />
            </View>
            <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center' }}>
              QR verification mark — matched against ID {payload.id}.{'\n'}
              (Photo is kept only on the physical/app card, not inside the QR, to keep it scannable.)
            </Text>
          </View>
        </SectionCard>

        {/* 3. Member Profile */}
        <SectionCard title="Member Profile" icon={<Feather name="user" size={16} color={ORANGE} />}>
          <Row label="Full Name" value={payload.n} />
          <Row label="ID Number" value={payload.id} />
          <Row label="Designation" value={payload.d} />
          <Row label="Area / State" value={payload.a} />
          <Row label="Joining Date" value={fmtDisplayDate(payload.id_dt)} />
          <Row label="Valid Upto" value={fmtDisplayDate(payload.vu)} />
          <Row label="Member Type" value={payload.mt} />
        </SectionCard>

        {/* 4. Organization Information */}
        <SectionCard title="Organization Information" icon={<Feather name="briefcase" size={16} color={ORANGE} />}>
          <Row label="Organization Name" value={ORG_INFO.name} />
          <Row label="Registration Number" value={ORG_INFO.registrationNumber} />
          <Row label="UDYAM Number" value={ORG_INFO.udyamNumber} />
          <Row label="Official Website" value={ORG_INFO.website} />
          <Row label="Office Contact" value={ORG_INFO.phone} />
          <Row label="Official Email" value={ORG_INFO.email} />
        </SectionCard>

        {/* 5. Authority / Approval */}
        <SectionCard title="Authority / Approval" icon={<Feather name="award" size={16} color={ORANGE} />}>
          <Row label="Approved By" value={ORG_INFO.approvedBy} />
          <Row label="Approval Date" value={fmtDisplayDate(payload.id_dt)} />
          <Row label="Authorized Signature" value="On File" />
          <Row label="Organization Seal" value="On File" />
        </SectionCard>

        {/* 6. ID History */}
        <SectionCard title="ID History" icon={<Feather name="clock" size={16} color={ORANGE} />}>
          <Row label="ID Issued" value={fmtDisplayDate(payload.id_dt)} />
          <Row label="Last Updated" value={fmtDisplayDate(payload.id_dt)} />
          <Row label="Renewal Date" value={fmtDisplayDate(payload.vu)} />
        </SectionCard>

        {/* 7. QR Security Information */}
        <SectionCard title="QR Security Information" icon={<Feather name="shield" size={16} color={ORANGE} />}>
          <Row label="Unique Verification ID" value={payload.id} />
          <Row label="QR Generated Date" value={fmtDisplayDateTime(payload.gen)} />
          <Row label="Verification Token" value={payload.tok} />
          <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, fontStyle: 'italic' }}>
            This QR code is digitally linked to our verification system.
          </Text>
        </SectionCard>

        {/* 8. Contact Options */}
        <SectionCard title="Contact Options" icon={<Feather name="phone-call" size={16} color={ORANGE} />}>
          <View style={{ gap: 10 }}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => Linking.openURL(`tel:${ORG_INFO.phone}`)}>
              <Text style={{ fontSize: 14 }}>📞 Call Organization</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => Linking.openURL(`mailto:${ORG_INFO.email}`)}>
              <Text style={{ fontSize: 14 }}>📧 Email Organization</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => Linking.openURL(ORG_INFO.website)}>
              <Text style={{ fontSize: 14 }}>🌐 Visit Official Website</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => {}}>
              <Text style={{ fontSize: 14 }}>📍 {ORG_INFO.officeLocation}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => Linking.openURL(`https://wa.me/${ORG_INFO.whatsapp.replace(/[^0-9]/g, '')}`)}>
              <Text style={{ fontSize: 14 }}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

      </View>
    </ScrollView>
  );
}
