// import { StyleSheet, Platform, StatusBar } from 'react-native';

// const HeaderStyles = StyleSheet.create({
//   // ── Safe Area ──
//   safeArea: {
//     backgroundColor: '#1e293b',
//     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
//   },

//   // ── Header Bar ──
//   header: {
//     backgroundColor: '#1e293b',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: '#334155',
//     zIndex: 100,
//   },

//   // ── Hamburger ──
//   menuBtn: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: '#0f172a',
//     gap: 4,
//   },
//   bar: {
//     width: 20,
//     height: 2,
//     backgroundColor: '#94a3b8',
//     borderRadius: 2,
//     marginVertical: 2,
//   },

//   // ── Title ──
//   titleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   logo: { fontSize: 22 },
//   title: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: '#38bdf8',
//     letterSpacing: 0.5,
//   },

//   // ── Right Section ──
//   rightSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   notifBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 8,
//     backgroundColor: '#0f172a',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   notifIcon: { fontSize: 16 },

//   // ── User Avatar Button ──
//   avatarBtn: {
//     padding: 4,
//   },
//   avatarCircle: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#2563eb',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#60a5fa',
//   },
//   avatarText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '800',
//   },

//   // ── Modal Overlay ──
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(15, 23, 42, 0.45)',
//     justifyContent: 'flex-start',
//     alignItems: 'flex-end',
//     paddingTop: Platform.OS === 'android'
//       ? (StatusBar.currentHeight ?? 0) + 62
//       : 80,
//     paddingRight: 16,
//   },

//   // ── Dropdown Card ──
//   dropdownCard: {
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     width: 240,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//     overflow: 'hidden',
//   },

//   // ── Dropdown Header ──
//   dropdownHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     backgroundColor: '#f8fafc',
//   },
//   dropdownTitle: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#0f172a',
//   },

//   // ── Divider ──
//   dropdownDivider: {
//     height: 1,
//     backgroundColor: '#f1f5f9',
//   },

//   // ── Dropdown Items ──
//   dropdownItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//   },
//   dropdownItemIcon: {
//     width: 34,
//     height: 34,
//     borderRadius: 8,
//     backgroundColor: '#eff6ff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   dropdownItemIconRed: {
//     backgroundColor: '#fff1f2',
//   },
//   dropdownItemInfo: {
//     flex: 1,
//   },
//   dropdownItemText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#0f172a',
//   },
//   dropdownItemTextRed: {
//     color: '#ef4444',
//   },
//   dropdownItemSub: {
//     fontSize: 11,
//     color: '#94a3b8',
//     marginTop: 2,
//   },

//   passwordOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(15, 23, 42, 0.55)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   passwordModalCard: {
//     width: '100%',
//     maxWidth: 420,
//     backgroundColor: '#ffffff',
//     borderRadius: 20,
//     padding: 20,
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.18,
//     shadowRadius: 18,
//   },
//   passwordHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 18,
//   },
//   passwordHeaderIcon: {
//     width: 42,
//     height: 42,
//     borderRadius: 12,
//     backgroundColor: '#eff6ff',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   passwordHeaderInfo: {
//     flex: 1,
//   },
//   passwordTitle: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: '#0f172a',
//   },
//   passwordSubtitle: {
//     marginTop: 4,
//     fontSize: 12,
//     color: '#64748b',
//     lineHeight: 18,
//   },
//   passwordSuccessBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     marginBottom: 16,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderRadius: 12,
//     backgroundColor: '#f0fdf4',
//     borderWidth: 1,
//     borderColor: '#86efac',
//   },
//   passwordSuccessText: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#166534',
//     textAlign: 'center',
//   },
//   passwordInputGroup: {
//     marginBottom: 14,
//   },
//   passwordLabel: {
//     marginBottom: 6,
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#334155',
//   },
//   passwordInput: {
//     borderWidth: 1,
//     borderColor: '#cbd5e1',
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 14,
//     color: '#0f172a',
//     backgroundColor: '#f8fafc',
//   },
//   passwordInputError: {
//     borderColor: '#ef4444',
//     backgroundColor: '#fef2f2',
//   },
//   passwordErrorText: {
//     marginTop: 6,
//     fontSize: 12,
//     color: '#dc2626',
//     lineHeight: 16,
//   },
//   passwordFormError: {
//     marginTop: -2,
//     marginBottom: 10,
//     fontSize: 12,
//     color: '#dc2626',
//     lineHeight: 16,
//   },
//   passwordActions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     gap: 10,
//     marginTop: 10,
//   },
//   passwordCancelBtn: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 12,
//     backgroundColor: '#e2e8f0',
//   },
//   passwordCancelText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#334155',
//   },
//   passwordSaveBtn: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 12,
//     backgroundColor: '#2563eb',
//   },
//   passwordSaveText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#ffffff',
//   },
// });

// export default HeaderStyles;
