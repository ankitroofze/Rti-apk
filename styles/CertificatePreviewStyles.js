import { Platform, StyleSheet } from 'react-native';

const DARK_GOLD = '#8b6914';
const RED       = '#b00000';

export default StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  contentContainer: {
    padding: 12,
    paddingBottom: 120,
    ...(Platform.OS === 'web' && {
      alignItems: 'center',
    }),
  },

  /* ─────────────────────────────
     CUSTOM HEADER
  ───────────────────────────── */
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      },
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 8,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  
  headerPlaceholder: {
    width: 40,
  },

  templateCard: {
    width: '100%',
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
    }),
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 2,
    backgroundColor: '#f7ecd4',
    shadowColor: '#8b6914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  templateImage: {
    width: '100%',
    aspectRatio: 1024 / 1536,
  },

  templateImageStyle: {
    resizeMode: 'contain',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  /* ─────────────────────────────
     TOP LOGOS
  ───────────────────────────── */
  logoLeft: {
    position: 'absolute',
    top: '6%',
    left: '15%',
    width: '21%',
    height: '10%',
  },

  logoCenter: {
    position: 'absolute',
    top: '5%',
    left: '37%',
    width: '26%',
    height: '11%',
  },

  logoRight: {
    position: 'absolute',
    top: '6%',
    right: '12%',
    width: '26%',
    height: '10%',
  },

  /* ─────────────────────────────
     BHARTIYA HEADER BANNER
  ───────────────────────────── */
  headerImage: {
    position: 'absolute',
    top: '15%',
    left: '0%',
    right: '0%',
    width: '100%',
    height: '9%',

  },
headerUserName: {
  position: 'absolute',
  top: '24%',
  left: '10%',
  right: '10%',
  fontSize: 11,
  fontWeight: '700',
  textAlign: 'center',
  color: '#008b23',
},

  

  /* ─────────────────────────────
     RIBBON
  ───────────────────────────── */
  ribbonImage: {
    position: 'absolute',
    top: '26%',
    left: '8%',
    right: '8%',
    width: '84%',
    height: '9%',
  },

  /* ─────────────────────────────
     CERTIFY TEXT
  ───────────────────────────── */
  certifyText: {
    position: 'absolute',
    top: '33%',
    left: '10%',
    right: '10%',
    fontSize: 11,
    textAlign: 'center',
    color: '#3a2a1a',
  },

  /* ─────────────────────────────
     AWARDEE NAME
  ───────────────────────────── */
  awardeeName: {
    position: 'absolute',
    top: '36%',
    left: '8%',
    right: '8%',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: RED,
  },

  /* ─────────────────────────────
     PASSED TEXT
  ───────────────────────────── */
  passedText: {
    position: 'absolute',
    top: '41%',
    left: '10%',
    right: '10%',
    fontSize: 11,
    textAlign: 'center',
    color: '#3a2a1a',
    lineHeight: 16,
  },

  boldText: {
    fontWeight: '700',
    color: '#1a1a1a',
  },

  /* ─────────────────────────────
     EXCELLENT RESULT IMAGE
  ───────────────────────────── */
  resultContainer: {
    position: 'absolute',
    top: '48%',
    left: '8%',
    right: '8%',
    alignItems: 'center',
  },

  excellentIcon: {
    width: '98%',
    height: 48,
  },

  /* ─────────────────────────────
     SINCE TEXT
  ───────────────────────────── */
  sinceText: {
    position: 'absolute',
    top: '56%',
    left: '12%',
    right: '12%',
    fontSize: 9.5,
    textAlign: 'center',
    color: '#3a2a1a',
    lineHeight: 14,
  },

  yearsHighlight: {
    color: RED,
    fontWeight: '700',
  },

  /* ─────────────────────────────
     CONGRATS TEXT
  ───────────────────────────── */
  congratsText: {
    position: 'absolute',
    top: '64%',
    left: '10%',
    right: '44%',
    fontSize: 11,
    textAlign: 'right',
    color: '#8b0000',
    fontStyle: 'italic',
    fontWeight: '700',
    lineHeight: 16,
  },

  /* ─────────────────────────────
     GOLD WINGS (left - quill/pen)
     Original image mein left-bottom mein hai
  ───────────────────────────── */
  goldWings: {
    position: 'absolute',
    bottom: '30%',
    left: '8%',
    width: '10%',
    height: '8%',
  },

  /* ─────────────────────────────
     GOLD LATTER (right - scroll)
     Original image mein right-center mein hai
  ───────────────────────────── */
  goldLatter: {
    position: 'absolute',
    top: '57%',
    right: '5%',
    width: '20%',
    height: '9%',
  },

  /* ─────────────────────────────
     SIGNATORY
  ───────────────────────────── */
  signatoryName: {
    position: 'absolute',
    top: '74%',
    left: '10%',
    right: '35%',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'left',
    color: '#8b0000',
  },

  signatoryRole: {
    position: 'absolute',
    top: '77%',
    left: '10%',
    right: '35%',
    fontSize: 7.5,
    textAlign: 'left',
    lineHeight: 11,
    color: '#333',
  },

  signatorySmall: {
    fontSize: 7,
    color: '#555',
  },

  /* ─────────────────────────────
     USER PHOTO with gold frame
     Original image mein right-bottom area mein hai
  ───────────────────────────── */
  photoWrapper: {
    position: 'absolute',
    right: '5%',
    top: '57%',
    width: '28%',
    height: '18%',
  },

  // Gold frame image (background)
  photoFrameImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  // Actual user photo - frame ke andar centered
  photoInner: {
    position: 'absolute',
    top: '12%',
    left: '21%',
    right: '21%',
    bottom: '30%',   // frame ke neeche ribbon hai isliye thoda upar
    overflow: 'hidden',
    borderRadius: 3,
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ddd',
  },

  photoPlaceholderText: {
    fontSize: 9,
    color: '#777',
  },

  /* ─────────────────────────────
     DATE BANNER
  ───────────────────────────── */
  dateBannerWrapper: {
    position: 'absolute',
    bottom: '15%',
    left: '10%',
    right: '15%',
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dateBannerImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '75%',
    height: '100%',
  },

  dateBannerText: {
    fontSize: 9,
    textAlign: 'center',
    color: '#3a2a1a',
    marginRight: 59,
    fontWeight: '600',
    zIndex: 1,
  },

  /* ─────────────────────────────
     FOOTER
  ───────────────────────────── */
  italicFooter: {
    position: 'absolute',
    bottom: '11%',
    left: '12%',
    right: '12%',
    fontSize: 8,
    textAlign: 'center',
    color: '#555',
    fontStyle: 'italic',
  },

  /* ─────────────────────────────
     EMAIL BANNER
  ───────────────────────────── */
  emailBannerWrapper: {
    position: 'absolute',
    bottom: '7%',
    left: '15%',
    right: '15%',
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emailBannerImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  emailBannerText: {
    fontSize: 8,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    zIndex: 1,
  },

  /* ─────────────────────────────
     ACTION BUTTONS
  ───────────────────────────── */
  actionBar: {
    width: '100%',
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
    }),
    marginTop: 16,
    gap: 10,
  },

  actionBtn: {
    backgroundColor: '#1e3a5f',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  actionBtnAlt: {
    backgroundColor: '#7c3aed',
  },

  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});