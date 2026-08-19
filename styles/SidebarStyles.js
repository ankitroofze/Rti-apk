// styles/SidebarStyles.js
import { StyleSheet, Platform } from 'react-native';

const C = {
  primary: '#ea580c',
  primaryLight: '#fff7ed',
  primaryBorder: '#fed7aa',
  border: '#e2e8f0',
  text: '#0f172a',
  sub: '#64748b',
  white: '#ffffff',
  bg: '#f8fafc',
};

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: Platform.OS === 'web' ? 300 : '80%',
    maxWidth: 340,
    backgroundColor: C.white,
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 44 : 18,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
      web: {
        boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
      },
    }),
  },

  // Header
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  drawerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: '600', // ✅ Weight 600
    color: C.text,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto', // ✅ Roboto font
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 6, // ✅ Border radius 6px
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },

  menuLabel: {
    fontSize: 10,
    fontWeight: '600', // ✅ Weight 600
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto', // ✅ Roboto font
  },

  menuScroll: {
    flex: 1,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6, // ✅ Border radius 6px
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: C.primaryLight,
  },
  menuItemLogout: {
    marginTop: 4,
  },

  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6, // ✅ Border radius 6px
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    marginRight: 12,
  },
  menuIconActive: {
    backgroundColor: C.primary,
  },
  menuIconLogout: {
    backgroundColor: '#fef2f2',
  },

  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600', // ✅ Weight 600
    color: '#475569',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto', // ✅ Roboto font
  },
  menuTextActive: {
    color: C.primary,
    fontWeight: '600', // ✅ Weight 600
  },
  menuTextLogout: {
    color: '#ef4444',
    fontWeight: '600', // ✅ Weight 600
  },

  activeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 6, // ✅ Border radius 6px
    backgroundColor: C.primary,
  },

  // Footer
  drawerFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: 20,
  },
  drawerFooterText: {
    fontSize: 12,
    fontWeight: '600', // ✅ Weight 600
    color: '#94a3b8',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto', // ✅ Roboto font
  },
  drawerFooterSub: {
    fontSize: 10,
    fontWeight: '600', // ✅ Weight 600
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto', // ✅ Roboto font
  },
});