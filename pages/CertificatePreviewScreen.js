import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '../components/ui/ToastProvider';
import { UserStore } from '../store/UserStore';
import styles from '../styles/CertificatePreviewStyles';

/* ── IMAGES ── */
const CERT_TEMPLATE   = require('../assets/images/certificate_template_v3.png');
const RIBBON_IMG      = require('../assets/images/certificate_ribon.png');
const LOGO_LEFT       = require('../assets/images/certi_bha.png');
const LOGO_RIGHT      = require('../assets/images/all_india_rti.png');
const LOGO_CENTER     = require('../assets/images/certificate_logo.jpg');
const HEADER_BHARTIYA = require('../assets/images/bhartiya.png');
const EXCELLENT_IMG   = require('../assets/images/exc.png');
const GOLD_WINGS      = require('../assets/images/gold_wings.png');   // left - quill/pen
const GOLD_LATTER     = require('../assets/images/gold_latter.png');  // right - scroll
const USER_IMG_FRAME  = require('../assets/images/user_img.png');     // photo frame
const DATE_BANNER     = require('../assets/images/date_banner.png');  // date background
const EMAIL_BANNER    = require('../assets/images/email_banner.png'); // email footer

const CERT_WIDTH = 1024;
const CERT_HEIGHT = 1536;
const FONT_SCALE = CERT_WIDTH / 375;
const assetDataUriCache = new Map();

const blobToDataUriAsync = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Unable to read blob'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(blob);
  });

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const mimeTypeFromUri = (uri = '') => {
  const normalized = String(uri).toLowerCase().split('?')[0];
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) return 'image/jpeg';
  if (normalized.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
};

const moduleToDataUri = async (moduleRef) => {
  if (assetDataUriCache.has(moduleRef)) return assetDataUriCache.get(moduleRef);

  const asset = Asset.fromModule(moduleRef);
  if (!asset.localUri) await asset.downloadAsync();

  const localUri = asset.localUri || asset.uri;

  let dataUri = '';
  if (Platform.OS === 'web') {
    const response = await fetch(localUri);
    const blob = await response.blob();
    dataUri = await blobToDataUriAsync(blob);
  } else {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    dataUri = `data:${mimeTypeFromUri(localUri)};base64,${base64}`;
  }

  assetDataUriCache.set(moduleRef, dataUri);
  return dataUri;
};

const resolvePhotoUriForHtml = async (uri) => {
  if (!uri) return '';
  if (String(uri).startsWith('data:')) return uri;

  const str = String(uri);

  if (Platform.OS === 'web') {
    try {
      if (str.startsWith('file://')) return '';
      const response = await fetch(str);
      const blob = await response.blob();
      return await blobToDataUriAsync(blob);
    } catch {
      return str;
    }
  }

  if (str.startsWith('file://')) {
    const base64 = await FileSystem.readAsStringAsync(str, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:${mimeTypeFromUri(str)};base64,${base64}`;
  }

  return str;
};

const buildCertificateHtml = ({ images, userName, issueDate, photoUri }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { size: ${CERT_WIDTH}px ${CERT_HEIGHT}px; margin: 0; }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: ${CERT_WIDTH}px;
      height: ${CERT_HEIGHT}px;
      background: #e4d7b8;
      font-family: Arial, Helvetica, sans-serif;
    }
    .page {
      width: ${CERT_WIDTH}px;
      height: ${CERT_HEIGHT}px;
      overflow: hidden;
      background: #e4d7b8;
    }
    .certificate {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: url('${images.template}') center/cover no-repeat;
    }
    .layer, .text { position: absolute; display: block; margin: 0; white-space: pre-line; }
    .logo-left { top: 6%; left: 15%; width: 21%; height: 10%; object-fit: contain; }
    .logo-center { top: 5%; left: 37%; width: 26%; height: 11%; object-fit: contain; }
    .logo-right { top: 6%; right: 12%; width: 26%; height: 10%; object-fit: contain; }
    .header-image { top: 15%; left: 0; width: 100%; height: 9%; object-fit: contain; }
    .header-user {
      top: 24%; left: 10%; right: 10%;
      color: #8b0000; text-align: center;
      font-size: ${11 * FONT_SCALE}px; font-weight: 700;
    }
    .ribbon { top: 26%; left: 8%; width: 84%; height: 9%; object-fit: contain; }
    .awardee-name {
      top: 36%; left: 8%; right: 8%;
      color: #b00000; text-align: center;
      font-size: ${22 * FONT_SCALE}px; font-weight: 800;
    }
    .passed-text {
      top: 41%; left: 10%; right: 10%;
      color: #3a2a1a; text-align: center;
      font-size: ${11 * FONT_SCALE}px; line-height: ${16 * FONT_SCALE}px;
    }
    .passed-text strong { color: #1a1a1a; font-weight: 700; }
    .result-wrap {
      position: absolute; top: 48%; left: 8%; right: 8%;
      text-align: center;
    }
    .excellent { width: 98%; height: auto; object-fit: contain; }
    .since-text {
      top: 56%; left: 12%; right: 12%;
      color: #3a2a1a; text-align: center;
      font-size: ${9.5 * FONT_SCALE}px; line-height: ${14 * FONT_SCALE}px;
    }
    .since-text .highlight { color: #b00000; font-weight: 700; }
    .congrats {
      top: 64%; left: 10%; right: 44%;
      color: #8b0000; text-align: right; font-style: italic;
      font-size: ${11 * FONT_SCALE}px; font-weight: 700; line-height: ${16 * FONT_SCALE}px;
    }
    .gold-wings { left: 8%; bottom: 30%; width: 10%; height: 8%; object-fit: contain; }
    .gold-latter { top: 57%; right: 5%; width: 20%; height: 9%; object-fit: contain; }
    .signatory-name {
      top: 74%; left: 10%; right: 35%;
      color: #8b0000; text-align: left;
      font-size: ${9 * FONT_SCALE}px; font-weight: 700;
    }
    .signatory-role {
      top: 77%; left: 10%; right: 35%;
      color: #333333; text-align: left;
      font-size: ${7.5 * FONT_SCALE}px; line-height: ${11 * FONT_SCALE}px;
    }
    .signatory-role .small { color: #555555; font-size: ${7 * FONT_SCALE}px; }
    .photo-wrapper { position: absolute; top: 67%; right: 5%; width: 28%; height: 18%; }
    .photo-frame { inset: 0; width: 100%; height: 100%; object-fit: fill; }
    .photo-inner {
      position: absolute; top: 12%; left: 21%; right: 21%; bottom: 30%;
      overflow: hidden; border-radius: 6px; background: #dddddd;
    }
    .photo-inner img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .photo-placeholder {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      color: #777777; font-size: ${9 * FONT_SCALE}px; font-weight: 600;
    }
    .date-banner-wrap {
      position: absolute; left: 10%; right: 15%; bottom: 15%;
      height: ${20 * FONT_SCALE}px;
      display: flex; align-items: center; justify-content: center;
    }
    .date-banner { position: absolute; left: 0; top: 0; width: 75%; height: 100%; object-fit: fill; }
    .date-banner-text {
      position: relative; margin-right: ${59 * FONT_SCALE}px;
      color: #3a2a1a; font-size: ${9 * FONT_SCALE}px; font-weight: 600;
    }
    .footer-note {
      bottom: 11%; left: 12%; right: 12%;
      color: #555555; text-align: center; font-style: italic;
      font-size: ${8 * FONT_SCALE}px;
    }
    .email-wrap {
      position: absolute; left: 15%; right: 15%; bottom: 7%;
      height: ${15 * FONT_SCALE}px;
    }
    .email-banner { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; }

    :root { --scale: 1; }
    body.preview {
      width: 100%;
      height: auto;
      overflow: hidden;
      display: flex;
      justify-content: center;
      background: #e4d7b8;
    }
    .scale { transform-origin: top left; transform: scale(var(--scale)); }
  </style>
</head>
<body class="%BODY_CLASS%">
  <div class="page %PAGE_CLASS%">
    <div class="certificate">
      <img class="layer logo-left" src="${images.logoLeft}" alt="" />
      <img class="layer logo-center" src="${images.logoCenter}" alt="" />
      <img class="layer logo-right" src="${images.logoRight}" alt="" />
      <img class="layer header-image" src="${images.header}" alt="" />
      <p class="text header-user">Hon. Mr. ${escapeHtml(userName)}</p>
      <img class="layer ribbon" src="${images.ribbon}" alt="" />
      <p class="text awardee-name">${escapeHtml(userName)}</p>
      <p class="text passed-text">has successfully passed the examination conducted by
<strong>Bhartiya Mahiti Adhikar</strong> with</p>
      <div class="result-wrap"><img class="excellent" src="${images.excellent}" alt="" /></div>
      <p class="text since-text">Subjected to the movement of Right to Information in the
organisational social work field since <span class="highlight">"15th"</span> Years</p>
      <p class="text congrats">Congratulations on your
outstanding achievement!</p>
      <img class="layer gold-wings" src="${images.goldWings}" alt="" />
      <img class="layer gold-latter" src="${images.goldLatter}" alt="" />
      <p class="text signatory-name">Hon. Mr. ${escapeHtml(userName)}</p>
      <p class="text signatory-role">Chief Editor / Owner / Publisher / All India
President Bhartiya Mahiti Adhikar<span class="small"> (All India RTI News Work)</span></p>
      <div class="photo-wrapper">
        <img class="layer photo-frame" src="${images.photoFrame}" alt="" />
        <div class="photo-inner">
          ${photoUri ? `<img src="${photoUri}" alt="User" />` : '<div class="photo-placeholder">Photo</div>'}
        </div>
      </div>
      <div class="date-banner-wrap">
        <img class="date-banner" src="${images.dateBanner}" alt="" />
        <div class="date-banner-text">Date of Issue: <strong>${escapeHtml(issueDate)}</strong></div>
      </div>
      <p class="text footer-note">This certificate is awarded as a recognition of excellent performance.</p>
      <div class="email-wrap"><img class="email-banner" src="${images.emailBanner}" alt="" /></div>
    </div>
  </div>
  %RESPONSIVE_SCRIPT%
</body>
</html>
`;

export default function CertificatePreviewScreen({ navigation, route }) {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { result } = route.params || {};

  const [downloading, setDownloading]       = useState(false);
  const [currentUser, setCurrentUser]       = useState(null);
  const [webHtml, setWebHtml]               = useState('');
  const [webPreviewWidth, setWebPreviewWidth] = useState(0);

  const IFrame = useMemo(() => {
    if (Platform.OS !== 'web') return null;
    return (props) => React.createElement('iframe', props);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const user = await UserStore.getCurrentUser();
        if (!mounted) return;
        if (!user) { navigation.replace('Login'); return; }
        setCurrentUser(user);

        if (Platform.OS === 'web') {
          try {
            const userNameForHtml = user?.name || result?.user_name || 'Participant';
            const issueDateForHtml = result?.date || new Date().toLocaleDateString('en-IN');
            const photoForHtml = user?.profile_image || result?.user_photo || '';

            const [
              template,
              ribbon,
              logoLeft,
              logoRight,
              logoCenter,
              header,
              excellent,
              goldWings,
              goldLatter,
              photoFrame,
              dateBanner,
              emailBanner,
              resolvedPhotoUri,
            ] = await Promise.all([
              moduleToDataUri(CERT_TEMPLATE),
              moduleToDataUri(RIBBON_IMG),
              moduleToDataUri(LOGO_LEFT),
              moduleToDataUri(LOGO_RIGHT),
              moduleToDataUri(LOGO_CENTER),
              moduleToDataUri(HEADER_BHARTIYA),
              moduleToDataUri(EXCELLENT_IMG),
              moduleToDataUri(GOLD_WINGS),
              moduleToDataUri(GOLD_LATTER),
              moduleToDataUri(USER_IMG_FRAME),
              moduleToDataUri(DATE_BANNER),
              moduleToDataUri(EMAIL_BANNER),
              resolvePhotoUriForHtml(photoForHtml),
            ]);

            const responsiveScript = `
<script>
  (function () {
    function apply() {
      var w = Math.max(1, window.innerWidth || 1);
      var scale = Math.min(1, w / ${CERT_WIDTH});
      document.documentElement.style.setProperty('--scale', String(scale));
      document.body.style.height = String(Math.round(${CERT_HEIGHT} * scale)) + 'px';
    }
    window.addEventListener('resize', apply);
    apply();
  })();
</script>`.trim();

            const html = buildCertificateHtml({
              images: {
                template,
                ribbon,
                logoLeft,
                logoRight,
                logoCenter,
                header,
                excellent,
                goldWings,
                goldLatter,
                photoFrame,
                dateBanner,
                emailBanner,
              },
              userName: userNameForHtml,
              issueDate: issueDateForHtml,
              photoUri: resolvedPhotoUri,
            })
              .replace('%BODY_CLASS%', 'preview')
              .replace('%PAGE_CLASS%', 'scale')
              .replace('%RESPONSIVE_SCRIPT%', responsiveScript);

            if (mounted) setWebHtml(html);
          } catch (e) {
            console.error('Certificate web preview error:', e);
            if (mounted) setWebHtml('');
          }
        }
      })();
      return () => { mounted = false; };
    }, [navigation, result])
  );

  const userName = currentUser?.name || result?.user_name || 'Participant';
  const issueDate = result?.date || new Date().toLocaleDateString('en-IN');
  const photoUri = currentUser?.profile_image || result?.user_photo || '';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      showToast('Generating certificate PDF...', 'info');

      const [
        template,
        ribbon,
        logoLeft,
        logoRight,
        logoCenter,
        header,
        excellent,
        goldWings,
        goldLatter,
        photoFrame,
        dateBanner,
        emailBanner,
        resolvedPhotoUri,
      ] = await Promise.all([
        moduleToDataUri(CERT_TEMPLATE),
        moduleToDataUri(RIBBON_IMG),
        moduleToDataUri(LOGO_LEFT),
        moduleToDataUri(LOGO_RIGHT),
        moduleToDataUri(LOGO_CENTER),
        moduleToDataUri(HEADER_BHARTIYA),
        moduleToDataUri(EXCELLENT_IMG),
        moduleToDataUri(GOLD_WINGS),
        moduleToDataUri(GOLD_LATTER),
        moduleToDataUri(USER_IMG_FRAME),
        moduleToDataUri(DATE_BANNER),
        moduleToDataUri(EMAIL_BANNER),
        resolvePhotoUriForHtml(photoUri),
      ]);

      const html = buildCertificateHtml({
        images: {
          template,
          ribbon,
          logoLeft,
          logoRight,
          logoCenter,
          header,
          excellent,
          goldWings,
          goldLatter,
          photoFrame,
          dateBanner,
          emailBanner,
        },
        userName,
        issueDate,
        photoUri: resolvedPhotoUri,
      })
        .replace('%BODY_CLASS%', '')
        .replace('%PAGE_CLASS%', '')
        .replace('%RESPONSIVE_SCRIPT%', '');

      if (Platform.OS === 'web') {
        if (typeof window === 'undefined') throw new Error('window is not available');

        // Open popup synchronously to avoid popup blockers.
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          showToast('Popup blocked. Please allow popups to download PDF.', 'error');
          return;
        }

        const autoPrintScript = `
<script>
  (function () {
    function doPrint() {
      try { window.focus(); } catch (e) {}
      try { window.print(); } catch (e) {}
    }
    function ready() { setTimeout(doPrint, 250); }
    if (document.readyState === 'complete') ready();
    else window.addEventListener('load', ready);
    window.onafterprint = function () { try { window.close(); } catch (e) {} };
  })();
</script>`.trim();

        const printHtml = buildCertificateHtml({
          images: {
            template,
            ribbon,
            logoLeft,
            logoRight,
            logoCenter,
            header,
            excellent,
            goldWings,
            goldLatter,
            photoFrame,
            dateBanner,
            emailBanner,
          },
          userName,
          issueDate,
          photoUri: resolvedPhotoUri,
        })
          .replace('%BODY_CLASS%', '')
          .replace('%PAGE_CLASS%', '')
          .replace('%RESPONSIVE_SCRIPT%', autoPrintScript);

        try {
          printWindow.document.open();
          printWindow.document.write(printHtml);
          printWindow.document.close();
        } catch (e) {
          console.error('Print window write error:', e);
          showToast('Unable to open print window.', 'error');
          try { printWindow.close(); } catch {}
          return;
        }

        showToast('Print dialog opened. Save as PDF to download.', 'success');
        return;
      }

      const { uri } = await Print.printToFileAsync({
        html,
        width: CERT_WIDTH,
        height: CERT_HEIGHT,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Certificate PDF',
          UTI: 'com.adobe.pdf',
        });
      }
      showToast('Certificate PDF ready.', 'success');
    } catch (e) {
      console.error('Certificate PDF error:', e);
      showToast('Error generating certificate PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const webPreviewHeight =
    webPreviewWidth > 0 ? Math.round(webPreviewWidth * (CERT_HEIGHT / CERT_WIDTH)) : 520;

  return (
    <View style={styles.root}>
      {/* Back Button Header */}
      <View style={[styles.customHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificate Preview</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#f5e6c8" />

        <View
          style={styles.templateCard}
          onLayout={(e) => {
            if (Platform.OS !== 'web') return;
            const nextWidth = Math.round(e?.nativeEvent?.layout?.width || 0);
            if (nextWidth > 0 && nextWidth !== webPreviewWidth) setWebPreviewWidth(nextWidth);
          }}
        >
          {Platform.OS === 'web' && webHtml && IFrame ? (
            <View style={{ width: '100%', height: webPreviewHeight }}>
              <IFrame
                title="Certificate Preview"
                srcDoc={webHtml}
                style={{ width: '100%', height: '100%', border: '0' }}
              />
            </View>
          ) : (
            <ImageBackground
              source={CERT_TEMPLATE}
              style={styles.templateImage}
              imageStyle={styles.templateImageStyle}
            >
            <View style={styles.overlay}>

              {/* ── TOP LOGOS ── */}
              <Image source={LOGO_LEFT}   style={styles.logoLeft}   resizeMode="contain" />
              <Image source={LOGO_CENTER} style={styles.logoCenter} resizeMode="contain" />
              <Image source={LOGO_RIGHT}  style={styles.logoRight}  resizeMode="contain" />

              
              {/* ── BHARTIYA HEADER BANNER ── */}
             <Image source={HEADER_BHARTIYA} style={styles.headerImage} resizeMode="contain" />
             <Text style={styles.headerUserName}>Hon. Mr. {userName}</Text>
              {/* ── RIBBON ── */}
              <Image source={RIBBON_IMG} style={styles.ribbonImage} resizeMode="contain" />

             

              {/* ── USER NAME ── */}
              <Text style={styles.awardeeName}>{userName}</Text>

              {/* ── PASSED TEXT ── */}
              <Text style={styles.passedText}>
                has successfully passed the examination conducted by{'\n'}
                <Text style={styles.boldText}>Bhartiya Mahiti Adhikar</Text> with
              </Text>

              {/* ── EXCELLENT RESULT IMAGE ── */}
              <View style={styles.resultContainer}>
                <Image source={EXCELLENT_IMG} style={styles.excellentIcon} resizeMode="contain" />
              </View>

              {/* ── SINCE TEXT ── */}
              <Text style={styles.sinceText}>
                Subjected to the movement of Right to Information in the{'\n'}
                organisational social work field since{' '}
                <Text style={styles.yearsHighlight}>"15th"</Text> Years
              </Text>

              {/* ── CONGRATS ── */}
              <Text style={styles.congratsText}>
                Congratulations on your{'\n'}Outstanding achievement!
              </Text>

              {/* ── GOLD WINGS (left - quill) ── */}
              <Image source={GOLD_WINGS} style={styles.goldWings} resizeMode="contain" />

              {/* ── GOLD LATTER (right - scroll) ── */}
              <Image source={GOLD_LATTER} style={styles.goldLatter} resizeMode="contain" />

              {/* ── SIGNATORY ── */}
              <Text style={styles.signatoryName}>Hon. Mr. {userName}</Text>
              <Text style={styles.signatoryRole}>
                Chief Editor / Owner / Publisher / All India{'\n'}
                President Bhartiya Mahiti Adhikar
                <Text style={styles.signatorySmall}> (All India RTI News Work)</Text>
              </Text>

              {/* ── USER PHOTO with gold frame ── */}
              <View style={styles.photoWrapper}>
                {/* Gold frame image behind */}
                <Image source={USER_IMG_FRAME} style={styles.photoFrameImg} resizeMode="stretch" />
                {/* User photo inside frame */}
                <View style={styles.photoInner}>
                  {photoUri
                    ? <Image source={{ uri: photoUri }} style={styles.photo} />
                    : <View style={styles.photoPlaceholder}>
                        <Text style={styles.photoPlaceholderText}>Photo</Text>
                      </View>
                  }
                </View>
              </View>

              {/* ── DATE BANNER ── */}
              <View style={styles.dateBannerWrapper}>
                <Image source={DATE_BANNER} style={styles.dateBannerImg} resizeMode="stretch" />
                <Text style={styles.dateBannerText}>
                  Date of Issue: <Text style={{ fontWeight: '700' }}>{issueDate}</Text>
                </Text>
              </View>

              {/* ── FOOTER ── */}
              <Text style={styles.italicFooter}>
                This certificate is awarded as a recognition of excellent performance.
              </Text>

              {/* ── EMAIL BANNER ── */}
              <View style={styles.emailBannerWrapper}>
                <Image source={EMAIL_BANNER} style={styles.emailBannerImg} resizeMode="stretch" />
               
              </View>

            </View>
          </ImageBackground>
          )}
        </View>

        {/* ── DOWNLOAD BUTTON ── */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDownload}
            disabled={downloading}
          >
            <Feather name="download" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>
              {downloading ? 'Generating PDF...' : 'Download Certificate (PDF)'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}