import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const DashboardStyles = StyleSheet.create({
  // ───────────────── ROOT ─────────────────
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  content: {
    flex: 1,
  },

  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 90,
  },

  // ───────────────── WELCOME BANNER ─────────────────
  welcomeBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#1e293b',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  welcomeLeft: {
    flex: 1,
  },

  welcomeGreeting: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  welcomeText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
  },

  welcomeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  welcomeBadgeIcon: {
    marginTop: 2,
  },

  welcomeSub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 6,
  },

  // ───────────────── STATS ─────────────────
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 10,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  statIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '700',
  },

  // ───────────────── FILTER BUTTON ─────────────────
  filterScroll: {
    marginBottom: 10,
  },

  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  filterBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },

  filterTextActive: {
    color: '#ffffff',
  },

  // ───────────────── GENERIC CARD ─────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },

  sectionText: {
    fontSize: 13,
    lineHeight: 21,
    color: '#64748b',
  },

  // ───────────────── FEATURED CARD ─────────────────
  featuredCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#6366f1',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#6366f1',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  featuredBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#d97706',
  },

  featuredTitle: {
    fontSize: 18,
    lineHeight: 26,
    color: '#0f172a',
    fontWeight: '800',
    marginBottom: 12,
  },

  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  featuredMeta: {
    fontSize: 12,
    color: '#64748b',
  },

  // ───────────────── NEWS CARD ─────────────────
  cardLeft: {
    flexDirection: 'row',
    gap: 12,
  },

  catDot: {
    width: 5,
    borderRadius: 999,
    minHeight: 64,
  },

  cardBody: {
    flex: 1,
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  catLabel: {
    fontSize: 11,
    fontWeight: '900',
  },

  cardTime: {
    fontSize: 11,
    color: '#94a3b8',
  },

  newsTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    color: '#0f172a',
    marginBottom: 10,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  readTime: {
    fontSize: 11,
    color: '#64748b',
  },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },

  bookmarkBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  shareBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  catBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 30,
  },

  catText: {
    fontSize: 11,
    fontWeight: '900',
  },

  readBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  readBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default DashboardStyles;