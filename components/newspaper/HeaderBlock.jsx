import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const LOGO_SIZE = 160;
const BANNER_HEIGHT = 120;
const OVERLAP = 40;

const stripHtml = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .trim();

export default function HeaderBlock({ data = {}, isEditing = false, onDataChange }) {
  const [localLogoUri, setLocalLogoUri] = useState(data.logoUri || '');
  
  useEffect(() => {
    if (Platform.OS === 'web') {
      const savedLogo = localStorage.getItem('newspaper_logo');
      if (savedLogo && savedLogo !== 'undefined' && savedLogo !== 'null') {
        setLocalLogoUri(savedLogo);
        if (onDataChange && !data.logoUri) {
          onDataChange({ ...data, logoUri: savedLogo });
        }
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && localLogoUri && localLogoUri !== 'undefined') {
      localStorage.setItem('newspaper_logo', localLogoUri);
    }
  }, [localLogoUri]);

  useEffect(() => {
    if (data.logoUri && data.logoUri !== localLogoUri) {
      setLocalLogoUri(data.logoUri);
      if (Platform.OS === 'web') {
        localStorage.setItem('newspaper_logo', data.logoUri);
      }
    }
  }, [data.logoUri]);

  const {
    newspaperName = '',
    tagline = '',
    date = '',
    contact1 = '',
    contact2 = '',
    extra = '',
    regNo = '',
    titleRegNo = '',
    website = '',
    editorName = '',
    editorTitle = '',
    officeInfo = '',
    govtText1 = '',
    govtText2 = '',
    rtiAll = '',
    rtiIndia = '',
    rtiRti = '',
    rtiNetwork = '',
    logoUri = '',
  } = data;

  const isWeb = Platform.OS === 'web';
  const displayLogoUri = localLogoUri || logoUri;

  const pickLogoMobile = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Media library access needed.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        let imageUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setLocalLogoUri(imageUri);
        onDataChange && onDataChange({ ...data, logoUri: imageUri });
      }
    } catch (e) {
      Alert.alert('Error', 'Image pick failed: ' + e.message);
    }
  };

  // ─── Combine rtiAll + rtiIndia + rtiRti into one line, rtiNetwork below ───
  const rtiLine1Parts = [
    stripHtml(rtiAll),
    stripHtml(rtiIndia),
    stripHtml(rtiRti),
  ].filter(Boolean);
  const rtiLine1 = rtiLine1Parts.join(' ');
  const rtiLine2 = stripHtml(rtiNetwork);

  return (
    <View style={[styles.container, isEditing && styles.editing]}>
      <View style={styles.header}>

        {/* ── Top Row: Phone | PRESS | Govt Info ── */}
        <View style={styles.topRow}>
          <View style={styles.leftColumn}>
            {isWeb
              ? <div style={{ fontSize: 24, fontWeight: 800, color: '#000' }}><span>M. </span><span dangerouslySetInnerHTML={{ __html: contact1 || '' }} /></div>
              : <Text style={styles.phoneText}>M. {stripHtml(contact1)}</Text>}
            {isWeb
              ? <div dangerouslySetInnerHTML={{ __html: contact2 || '' }} style={{ fontSize: 24, fontWeight: 800, color: '#000' }} />
              : <Text style={styles.phoneText}>{stripHtml(contact2)}</Text>}
          </View>

          <View style={styles.centerColumn}>
            <View style={styles.pressBox}>
              <View style={styles.pressInnerBorder}>
                <Text style={styles.pressText}>PRESS</Text>
              </View>
            </View>
          </View>

          <View style={styles.rightColumn}>
            {isWeb
              ? <div dangerouslySetInnerHTML={{ __html: govtText1 || '' }} style={{ fontSize: 13, color: '#444', lineHeight: '17px' }} />
              : <Text style={styles.govtText}>{stripHtml(govtText1)}</Text>}
            {isWeb
              ? <div dangerouslySetInnerHTML={{ __html: govtText2 || '' }} style={{ fontSize: 13, color: '#444', lineHeight: '17px' }} />
              : <Text style={styles.govtText}>{stripHtml(govtText2)}</Text>}
          </View>
        </View>

        {/* ── Registration + RTI Block ── */}
        <View style={styles.regSection}>
  <View style={{ flex: 1, paddingLeft: LOGO_SIZE - 140, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
    {isWeb ? (
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, fontSize: 16, color: '#111', fontWeight: 400 }}>
        {regNo && <div dangerouslySetInnerHTML={{ __html: regNo }} />}
        {regNo && titleRegNo && <span>  |  </span>}
        {titleRegNo && <div dangerouslySetInnerHTML={{ __html: titleRegNo }} />}
      </div>
    ) : (
      <>
        <Text style={[styles.regNumber, { paddingLeft: 0, flex: 0 }]} numberOfLines={1} adjustsFontSizeToFit>
          {stripHtml(regNo)}
        </Text>
        {!!stripHtml(titleRegNo) && (
          <>
            <Text style={{ fontSize: 16, color: '#111' }}>  |  </Text>
            <Text style={[styles.regNumber, { paddingLeft: 0, flex: 0 }]} numberOfLines={1} adjustsFontSizeToFit>
              {stripHtml(titleRegNo)}
            </Text>
          </>
        )}
      </>
    )}
  </View>

          {/* RTI stacked: "All India RTI" on top, "News Network" below */}
          <View style={styles.rtiTopRight}>
            {/* Line 1: All India RTI (horizontal parts) */}
            {isWeb ? (
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                {rtiAll && (
                  <div dangerouslySetInnerHTML={{ __html: rtiAll }}
                    style={{ fontSize: 20, fontWeight: 900, color: '#111', fontStyle: 'italic' }} />
                )}
                {rtiIndia && (
                  <div dangerouslySetInnerHTML={{ __html: rtiIndia }}
                    style={{ fontSize: 20, fontWeight: 800, color: '#111', fontStyle: 'italic' }} />
                )}
                {rtiRti && (
                  <div dangerouslySetInnerHTML={{ __html: rtiRti }}
                    style={{ fontSize: 20, fontWeight: 900, color: '#111', fontStyle: 'italic' }} />
                )}
              </div>
            ) : (
              <View style={styles.rtiRow}>
                {!!rtiLine1 && (
                  <Text style={styles.rtiMainText}>{rtiLine1}</Text>
                )}
              </View>
            )}

            {/* Line 2: News Network — always on its own line */}
            {isWeb ? (
              rtiNetwork ? (
                <div dangerouslySetInnerHTML={{ __html: rtiNetwork }}
                  style={{ fontSize: 15, fontWeight: 800, color: '#cc0000', fontStyle: 'italic', marginTop: 2, textAlign: 'right' }} />
              ) : null
            ) : (
              !!rtiLine2 && (
                <Text style={styles.rtiNetwork}>{rtiLine2}</Text>
              )
            )}
          </View>
        </View>

        {/* ── Black Banner with Logo ── */}
        <View style={styles.logoBannerWrapper}>
          <View style={[styles.blackBanner, { backgroundColor: data.bannerBgColor || '#111' }]}>
            {isWeb ? (
              <div dangerouslySetInnerHTML={{ __html: newspaperName || '' }}
                style={{ color: data.bannerTextColor || '#fff', fontSize: 52, fontWeight: 900, textAlign: 'center', letterSpacing: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
            ) : (
              <Text style={[styles.newspaperName, { color: data.bannerTextColor || '#fff' }]} numberOfLines={1} adjustsFontSizeToFit>
                {stripHtml(newspaperName)}
              </Text>
            )}
          </View>
          <View style={styles.logoOuterContainer}>
            <View style={styles.logoContainer}>
              {displayLogoUri && displayLogoUri !== 'undefined' ? (
                <Image source={{ uri: displayLogoUri }} style={styles.logoImage} resizeMode="cover" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>LOGO</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Tagline ── */}
        <View style={styles.taglineSection}>
          {isWeb
            ? <div dangerouslySetInnerHTML={{ __html: tagline || '' }} style={{ fontSize: 20, color: '#222', textAlign: 'center', fontWeight: 900 }} />
            : <Text style={styles.tagline}>{stripHtml(tagline)}</Text>}
        </View>

        {/* ── Info Row: website + email | editor name ── */}
        <View style={styles.infoSection}>
          <View style={styles.websiteRow}>
            {isWeb
              ? <div dangerouslySetInnerHTML={{ __html: website || '' }} style={{ fontSize: 22, color: '#333', fontWeight: 700 }} />
              : <Text style={styles.infoText}>{stripHtml(website)}</Text>}
            <Text style={styles.separator}>  |  </Text>
            {isWeb
              ? <div dangerouslySetInnerHTML={{ __html: extra || '' }} style={{ fontSize: 22, color: '#333', fontWeight: 700 }} />
              : <Text style={styles.infoText}>{stripHtml(extra)}</Text>}
          </View>
          <View style={styles.editorSection}>
            {isWeb
              ? <div dangerouslySetInnerHTML={{ __html: editorName || '' }} style={{ fontSize: 18, fontWeight: 900, color: '#111' }} />
              : <Text style={styles.editorName}>{stripHtml(editorName)}</Text>}
          </View>
        </View>

       {/* ── Address | Editor Title ── */}
        <View style={styles.addressSection}>
          {isWeb
            ? <div dangerouslySetInnerHTML={{ __html: officeInfo || '' }} style={{ fontSize: 15, color: '#333', flex: 1, minWidth: 0 }} />
            : <Text style={styles.addressText}>{stripHtml(officeInfo)}</Text>}
          {isWeb
            ? <div dangerouslySetInnerHTML={{ __html: editorTitle || '' }} style={{ fontSize: 14, color: '#111', fontWeight: 900, textAlign: 'right', whiteSpace: 'normal', wordBreak: 'break-word', flexShrink: 0, width: 'auto', maxWidth: '55%', lineHeight: '1.6', backgroundColor: 'transparent' }} />
            : <Text style={styles.editorTitle}>{stripHtml(editorTitle)}</Text>}
        </View>

        {/* ── Date Strip ── */}
        <View style={[styles.dateSection, { backgroundColor: data.dateBgColor || '#111' }]}>
          <Text style={[styles.dateText, { color: data.dateTextColor || '#fff' }]}>
            {stripHtml(date)}
          </Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    width: '100%',
  },
  editing: {
    borderColor: '#111',
    borderWidth: 2,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 5,
  },

  // Top Row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 5,
    paddingTop: 5,
    backgroundColor: '#fff',
  },
  leftColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  phoneText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    lineHeight: 20,
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pressBox: {
    backgroundColor: '#dd0000',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 40,
    alignSelf: 'center',
  },
  pressInnerBorder: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: '#fff',
  },
  pressText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },
  rightColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  govtText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 17,
  },

  // Reg + RTI row
  regSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingBottom: 0,
    paddingLeft: LOGO_SIZE - 20,
    backgroundColor: '#fff',
  },
  regNumber: {
    fontSize: 16,
    color: '#111',
    textAlign: 'center',
    fontWeight: '400',
    flex: 1,
    paddingLeft: LOGO_SIZE - 140,
  },

  // RTI stacked block (top-right of reg section)
  rtiTopRight: {
    alignItems: 'flex-end',  // right-align both lines
    marginLeft: 16,
    flexShrink: 0,
  },
  rtiRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  // Combined "All India RTI" on one line (native)
  rtiMainText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
    fontStyle: 'italic',
  },
  // "News Network" below — red, smaller
  rtiNetwork: {
    fontSize: 15,
    fontWeight: '800',
    color: '#cc0000',
    fontStyle: 'italic',
    marginTop: 2,
    textAlign: 'right',
  },

  // Black Banner + Logo
  logoBannerWrapper: {
    position: 'relative',
    marginTop: 0,
    marginBottom: 0,
  },
  logoOuterContainer: {
    position: 'absolute',
    top: (100 / 2) - (LOGO_SIZE / 2),
    left: 30,
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    zIndex: 20,
    elevation: 10,
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 12,
    borderColor: '#000',
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  blackBanner: {
    backgroundColor: '#111',
    width: '100%',
    height: 100,
    paddingLeft: LOGO_SIZE + 40,
    paddingRight: 12,
    justifyContent: 'center',
  },
  newspaperName: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
    flexShrink: 1,
  },

  // Tagline
  taglineSection: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 0,
    width: '100%',
  },
  tagline: {
    fontSize: 20,
    color: '#222',
    textAlign: 'center',
    fontWeight: '900',
  },

  // Info Row
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
    paddingBottom: 3,
  },
  infoText: {
    fontSize: 22,
    color: '#333',
    fontWeight: '700',
  },
  separator: {
    fontSize: 22,
    color: '#555',
    fontWeight: '700',
  },
  editorSection: {
    alignItems: 'flex-end',
    marginLeft: 10,
    flexShrink: 0,
  },
  editorName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },

  // Address
  addressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  editorTitle: {
    fontSize: 14,
    color: '#111',
    textAlign: 'right',
    flexShrink: 0,
    marginLeft: 10,
    fontWeight: '900',
  },

  // Date Strip
  dateSection: {
    backgroundColor: '#111',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#bbb',
    borderBottomWidth: 2,
    borderBottomColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
});