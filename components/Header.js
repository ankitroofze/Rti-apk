// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Modal,
//   Pressable,
//   TextInput,
// } from 'react-native';
// import { Feather } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import styles from '../styles/HeaderStyles';
// import { UserStore } from '../store/UserStore';

// export default function Header({ title = 'RTI News', onMenuPress, onLogout, navigation, userName }) {
//   const appNavigation = useNavigation();
//   const [menuVisible, setMenuVisible] = useState(false);
//   const [passwordModalVisible, setPasswordModalVisible] = useState(false);
//   const [savingPassword, setSavingPassword] = useState(false);
//   const [passwordErrors, setPasswordErrors] = useState({});
//   const [passwordSuccess, setPasswordSuccess] = useState('');
//   const [passwordForm, setPasswordForm] = useState({
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: '',
//   });

//   const updatePasswordField = (key, value) => {
//     setPasswordForm((prev) => ({ ...prev, [key]: value }));
//     setPasswordErrors((prev) => ({ ...prev, [key]: '', form: '' }));
//     setPasswordSuccess('');
//   };

//   const closePasswordModal = () => {
//     setPasswordModalVisible(false);
//     setPasswordForm({
//       currentPassword: '',
//       newPassword: '',
//       confirmPassword: '',
//     });
//     setPasswordErrors({});
//     setPasswordSuccess('');
//   };

//   const handleChangePassword = () => {
//     setMenuVisible(false);
//     setPasswordModalVisible(true);
//   };

//   const submitPasswordChange = async () => {
//     const currentPassword = passwordForm.currentPassword.trim();
//     const newPassword = passwordForm.newPassword.trim();
//     const confirmPassword = passwordForm.confirmPassword.trim();
//     const nextErrors = {};

//     if (!currentPassword) nextErrors.currentPassword = 'Current password is required.';
//     if (!newPassword) nextErrors.newPassword = 'New password is required.';
//     if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your new password.';

//     if (newPassword && newPassword.length < 4) {
//       nextErrors.newPassword = 'New password must be at least 4 characters.';
//     }

//     if (newPassword && confirmPassword && newPassword !== confirmPassword) {
//       nextErrors.confirmPassword = 'New password and confirm password do not match.';
//     }

//     if (Object.keys(nextErrors).length) {
//       setPasswordErrors(nextErrors);
//       setPasswordSuccess('');
//       return;
//     }

//     setPasswordErrors({});
//     setPasswordSuccess('');
//     setSavingPassword(true);
//     const result = await UserStore.changeCurrentUserPassword({
//       currentPassword,
//       newPassword,
//     });
//     setSavingPassword(false);

//     if (!result.ok) {
//       const message = result.message || 'Unable to change password.';
//       if (message.toLowerCase().includes('current password')) {
//         setPasswordErrors({ currentPassword: message });
//       } else if (message.toLowerCase().includes('new password')) {
//         setPasswordErrors({ newPassword: message });
//       } else {
//         setPasswordErrors({ form: message });
//       }
//       return;
//     }

//     setPasswordForm({
//       currentPassword: '',
//       newPassword: '',
//       confirmPassword: '',
//     });
//     setPasswordErrors({});
//     setPasswordSuccess('Password changed successfully.');
//     (navigation || appNavigation)?.navigate('Dashboard');
//   };

//   const handleLogout = () => {
//     setMenuVisible(false);
//     if (onLogout) onLogout();
//   };

//   return (
//     <View style={styles.safeArea}>
//       <View style={styles.header}>
//         {/* ── Hamburger ── */}
//         <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress}>
//           <View style={styles.bar} />
//           <View style={styles.bar} />
//           <View style={styles.bar} />
//         </TouchableOpacity>

//         {/* ── Title ── */}
//         <View style={styles.titleContainer}>
//           <Text style={styles.logo}>📰</Text>
//           <Text style={styles.title}>{title}</Text>
//         </View>

//         {/* ── Right Section ── */}
//         <View style={styles.rightSection}>
//           {/* Notification Bell */}
//           <TouchableOpacity style={styles.notifBtn}>
//             <Text style={styles.notifIcon}>🔔</Text>
//           </TouchableOpacity>

//           {/* User Avatar */}
//           <TouchableOpacity
//             style={styles.avatarBtn}
//             onPress={() => setMenuVisible(true)}
//           >
//             <View style={styles.avatarCircle}>
//               <Text style={styles.avatarText}>
//                 {userName ? userName.charAt(0).toUpperCase() : 'U'}
//               </Text>
//             </View>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* ── Account Settings Dropdown Modal ── */}
//       <Modal
//         visible={menuVisible}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setMenuVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <Pressable
//             style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
//             onPress={() => setMenuVisible(false)}
//           />
//           <View style={styles.dropdownCard}>
//             {/* Header */}
//             <View style={styles.dropdownHeader}>
//               <Feather name="settings" size={16} color="#2563eb" />
//               <Text style={styles.dropdownTitle}>Account Settings</Text>
//             </View>

//             <View style={styles.dropdownDivider} />

//             {/* Change Password */}
//             <TouchableOpacity
//               style={styles.dropdownItem}
//               onPress={handleChangePassword}
//             >
//               <View style={styles.dropdownItemIcon}>
//                 <Feather name="lock" size={16} color="#2563eb" />
//               </View>
//               <View style={styles.dropdownItemInfo}>
//                 <Text style={styles.dropdownItemText}>Change Password</Text>
//                 <Text style={styles.dropdownItemSub}>Update your password</Text>
//               </View>
//               <Feather name="chevron-right" size={14} color="#94a3b8" />
//             </TouchableOpacity>

//             <View style={styles.dropdownDivider} />

//             {/* Logout */}
//             <TouchableOpacity
//               style={styles.dropdownItem}
//               onPress={handleLogout}
//             >
//               <View style={[styles.dropdownItemIcon, styles.dropdownItemIconRed]}>
//                 <Feather name="log-out" size={16} color="#ef4444" />
//               </View>
//               <View style={styles.dropdownItemInfo}>
//                 <Text style={[styles.dropdownItemText, styles.dropdownItemTextRed]}>
//                   Logout
//                 </Text>
//                 <Text style={styles.dropdownItemSub}>Sign out of your account</Text>
//               </View>
//               <Feather name="chevron-right" size={14} color="#94a3b8" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       <Modal
//         visible={passwordModalVisible}
//         transparent
//         animationType="fade"
//         onRequestClose={closePasswordModal}
//       >
//         <View style={styles.passwordOverlay}>
//           <Pressable
//             style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
//             onPress={closePasswordModal}
//           />
//           <View style={styles.passwordModalCard}>
//             <View style={styles.passwordHeader}>
//               <View style={styles.passwordHeaderIcon}>
//                 <Feather name="lock" size={18} color="#2563eb" />
//               </View>
//               <View style={styles.passwordHeaderInfo}>
//                 <Text style={styles.passwordTitle}>Change Password</Text>
//                 <Text style={styles.passwordSubtitle}>Update your account password securely</Text>
//               </View>
//             </View>

//             {passwordSuccess ? (
//               <View style={styles.passwordSuccessBox}>
//                 <Feather name="check-circle" size={18} color="#16a34a" />
//                 <Text style={styles.passwordSuccessText}>{passwordSuccess}</Text>
//               </View>
//             ) : null}

//                 <View style={styles.passwordInputGroup}>
//                   <Text style={styles.passwordLabel}>Current Password</Text>
//                   <TextInput
//                     style={[
//                       styles.passwordInput,
//                       passwordErrors.currentPassword && styles.passwordInputError,
//                     ]}
//                     value={passwordForm.currentPassword}
//                     onChangeText={(text) => updatePasswordField('currentPassword', text)}
//                     placeholder="Enter current password"
//                     placeholderTextColor="#94a3b8"
//                     secureTextEntry
//                     autoCapitalize="none"
//                   />
//                   {passwordErrors.currentPassword ? (
//                     <Text style={styles.passwordErrorText}>{passwordErrors.currentPassword}</Text>
//                   ) : null}
//                 </View>

//                 <View style={styles.passwordInputGroup}>
//                   <Text style={styles.passwordLabel}>New Password</Text>
//                   <TextInput
//                     style={[
//                       styles.passwordInput,
//                       passwordErrors.newPassword && styles.passwordInputError,
//                     ]}
//                     value={passwordForm.newPassword}
//                     onChangeText={(text) => updatePasswordField('newPassword', text)}
//                     placeholder="Enter new password"
//                     placeholderTextColor="#94a3b8"
//                     secureTextEntry
//                     autoCapitalize="none"
//                   />
//                   {passwordErrors.newPassword ? (
//                     <Text style={styles.passwordErrorText}>{passwordErrors.newPassword}</Text>
//                   ) : null}
//                 </View>

//                 <View style={styles.passwordInputGroup}>
//                   <Text style={styles.passwordLabel}>Confirm Password</Text>
//                   <TextInput
//                     style={[
//                       styles.passwordInput,
//                       passwordErrors.confirmPassword && styles.passwordInputError,
//                     ]}
//                     value={passwordForm.confirmPassword}
//                     onChangeText={(text) => updatePasswordField('confirmPassword', text)}
//                     placeholder="Re-enter new password"
//                     placeholderTextColor="#94a3b8"
//                     secureTextEntry
//                     autoCapitalize="none"
//                   />
//                   {passwordErrors.confirmPassword ? (
//                     <Text style={styles.passwordErrorText}>{passwordErrors.confirmPassword}</Text>
//                   ) : null}
//                 </View>

//                 {passwordErrors.form ? (
//                   <Text style={styles.passwordFormError}>{passwordErrors.form}</Text>
//                 ) : null}

//             <View style={styles.passwordActions}>
//               <TouchableOpacity style={styles.passwordCancelBtn} onPress={closePasswordModal}>
//                 <Text style={styles.passwordCancelText}>Cancel</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.passwordSaveBtn}
//                 onPress={submitPasswordChange}
//                 disabled={savingPassword}
//               >
//                 <Text style={styles.passwordSaveText}>
//                   {savingPassword ? 'Updating...' : 'Update Password'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }
