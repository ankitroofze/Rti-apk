// import { Feather, Ionicons } from '@expo/vector-icons';
// import { useFocusEffect } from '@react-navigation/native';
// import { useCallback, useRef, useState } from 'react';
// import {
//   Modal,
//   ScrollView,
//   Share,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import Footer from '../components/Footer';
// import Header from '../components/Header';
// import Sidebar from '../components/Sidebar';
// import PremiumBadge from '../components/PremiumBadge';
// import { useToast } from '../components/ui/ToastProvider';
// import { UserStore } from '../store/UserStore';
// import styles from '../styles/DashboardStyles';

// // ── Rank config ──────────────────────────────────────────────────────────────
// const RANK_CONFIG = {
//   Director:  { color: '#7c3aed', bg: '#f5f3ff', icon: 'star',       next: null,       nextAt: null  },
//   Manager:   { color: '#2563eb', bg: '#eff6ff', icon: 'trending-up', next: 'Director', nextAt: 500  },
//   Leader:    { color: '#0891b2', bg: '#ecfeff', icon: 'award',       next: 'Manager',  nextAt: 100  },
//   Promoter:  { color: '#16a34a', bg: '#f0fdf4', icon: 'users',       next: 'Leader',   nextAt: 25   },
//   Starter:   { color: '#d97706', bg: '#fffbeb', icon: 'user-plus',   next: 'Promoter', nextAt: 5    },
//   Member:    { color: '#64748b', bg: '#f8fafc', icon: 'user',        next: 'Starter',  nextAt: 1    },
// };

// const STATE_OPTIONS = [
//   'All States',
//   'Maharashtra', 'Delhi', 'Gujarat', 'Rajasthan', 'Uttar Pradesh',
//   'Karnataka', 'Tamil Nadu', 'West Bengal', 'Madhya Pradesh', 'Bihar',
// ];

// const SUBSCRIPTION_OPTIONS = ['All Plans', 'basic', 'premium', 'vip'];

// // ── Small Components ─────────────────────────────────────────────────────────
// function RankBadge({ rank }) {
//   const cfg = RANK_CONFIG[rank] || RANK_CONFIG.Member;
//   return (
//     <View style={[dashStyles.rankBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '44' }]}>
//       <Feather name={cfg.icon} size={13} color={cfg.color} />
//       <Text style={[dashStyles.rankBadgeText, { color: cfg.color }]}>{rank}</Text>
//     </View>
//   );
// }

// function ReferralCodeCard({ code, onShare }) {
//   return (
//     <View style={dashStyles.referralCard}>
//       <View style={dashStyles.referralLeft}>
//         <Text style={dashStyles.referralLabel}>My Referral Code</Text>
//         <Text style={dashStyles.referralCode}>{code || 'Generating...'}</Text>
//         <Text style={dashStyles.referralHint}>Share this code to earn referral bonus</Text>
//       </View>
//       <TouchableOpacity style={dashStyles.shareBtn} onPress={onShare} disabled={!code}>
//         <Feather name="share-2" size={16} color="#fff" />
//         <Text style={dashStyles.shareBtnText}>Share</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// function FilterChip({ label, active, onPress }) {
//   return (
//     <TouchableOpacity
//       style={[styles.filterBtn, active && styles.filterBtnActive]}
//       onPress={onPress}
//       activeOpacity={0.8}
//     >
//       <Text style={[styles.filterText, active && styles.filterTextActive]}>
//         {label === 'basic' ? 'Basic' : label === 'premium' ? 'Premium' : label === 'vip' ? 'VIP' : label}
//       </Text>
//     </TouchableOpacity>
//   );
// }

// function SeatSelectModal({
//   visible,
//   stateName,
//   seats,
//   selectedSeatId,
//   onSelectSeatId,
//   onCancel,
//   onConfirm,
// }) {
//   const seatsToShow = Array.isArray(seats) ? seats.slice(0, 5) : [];
//   const isLoadingSeats = seatsToShow.length === 0;

//   return (
//     <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
//       <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} activeOpacity={1} onPress={onCancel} />
//       <View
//         style={{
//           position: 'absolute',
//           bottom: 0,
//           left: 0,
//           right: 0,
//           backgroundColor: '#ffffff',
//           borderTopLeftRadius: 22,
//           borderTopRightRadius: 22,
//           padding: 16,
//           paddingBottom: 18,
//         }}
//       >
//         <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 99, alignSelf: 'center', marginBottom: 12 }} />

//         <Text style={{ fontSize: 14, fontWeight: '900', color: '#0f172a' }}>
//           Select Seat
//         </Text>
//         <Text style={{ marginTop: 4, fontSize: 12, color: '#64748b', fontWeight: '700' }}>
//           State: {stateName || '-'}
//         </Text>

//         <View style={{ marginTop: 12, gap: 8 }}>
//           {isLoadingSeats ? (
//             <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '700', paddingVertical: 10 }}>
//               Loading seats…
//             </Text>
//           ) : null}

//           {seatsToShow.map((seat) => {
//             const isTaken = seat.status === 'taken';
//             const isDisabled = seat.status === 'disabled';
//             const isSelected = selectedSeatId === seat.id;
//             const disabled = isTaken || isDisabled;

//             const borderColor = isSelected ? '#1d4ed8' : disabled ? '#e2e8f0' : '#cbd5e1';
//             const backgroundColor = isSelected ? '#eff6ff' : disabled ? '#f8fafc' : '#ffffff';
//             const statusText = isTaken ? 'Taken' : isDisabled ? 'Select state first' : 'Available';
//             const statusColor = isTaken || isDisabled ? '#64748b' : '#1d4ed8';

//             return (
//               <TouchableOpacity
//                 key={seat.id}
//                 activeOpacity={0.85}
//                 disabled={disabled}
//                 onPress={() => onSelectSeatId(seat.id)}
//                 style={{
//                   borderWidth: 1,
//                   borderColor,
//                   backgroundColor,
//                   borderRadius: 14,
//                   padding: 12,
//                   flexDirection: 'row',
//                   alignItems: 'center',
//                   justifyContent: 'space-between',
//                 }}
//               >
//                 <View style={{ flex: 1, paddingRight: 10 }}>
//                   <Text style={{ fontSize: 13, fontWeight: '900', color: disabled ? '#64748b' : '#0f172a' }}>
//                     {seat.name}
//                   </Text>
//                   <Text style={{ marginTop: 4, fontSize: 12, color: statusColor, fontWeight: '800' }}>
//                     {statusText}
//                   </Text>
//                 </View>

//                 {isSelected ? (
//                   <View style={{ backgroundColor: '#1d4ed8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
//                     <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>Selected</Text>
//                   </View>
//                 ) : null}
//               </TouchableOpacity>
//             );
//           })}
//         </View>

//         <View style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
//           <TouchableOpacity
//             style={{
//               flex: 1,
//               borderWidth: 1,
//               borderColor: '#cbd5e1',
//               backgroundColor: '#ffffff',
//               borderRadius: 14,
//               paddingVertical: 12,
//               alignItems: 'center',
//             }}
//             onPress={onCancel}
//             activeOpacity={0.85}
//           >
//             <Text style={{ color: '#0f172a', fontWeight: '900' }}>Cancel</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={{
//               flex: 1,
//               borderWidth: 1,
//               borderColor: selectedSeatId ? '#0f172a' : '#cbd5e1',
//               backgroundColor: selectedSeatId ? '#0f172a' : '#e2e8f0',
//               borderRadius: 14,
//               paddingVertical: 12,
//               alignItems: 'center',
//             }}
//             onPress={onConfirm}
//             activeOpacity={0.85}
//             disabled={!selectedSeatId || isLoadingSeats}
//           >
//             <Text style={{ color: selectedSeatId ? '#fff' : '#64748b', fontWeight: '900' }}>
//               Pay Now
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// // Subscription Plans Data
// const SUBSCRIPTION_PLANS = [
//   { plan_id: 'plan-basic', plan_name: 'Basic Access', price: 199, duration: '30 Days', features: ['News Feed', 'e-Paper', 'Notifications'], color: '#16a34a', popular: false },
//   { plan_id: 'plan-pro', plan_name: 'Pro Access', price: 499, duration: '90 Days', features: ['News Feed', 'e-Paper', 'Live Streaming', 'Wallet', 'Certification'], color: '#2563eb', popular: true },
//   { plan_id: 'plan-premium', plan_name: 'Premium Access', price: 899, duration: '180 Days', features: ['All Features', 'Priority Support', 'Certificate Download', 'Referral Bonus'], color: '#7c3aed', popular: false },
// ];

// // ── Main Screen ──────────────────────────────────────────────────────────────
// export default function DashboardScreen({ navigation, route }) {
//   const { showPopup, showToast } = useToast();
//   const handledRegistrationToastRef = useRef(false);
//   const handledSubscriptionModalRef = useRef(false);
//   const [sidebarVisible, setSidebarVisible]   = useState(false);
//   const [activeSidebarItem, setActiveSidebarItem] = useState('Dashboard');
//   const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
//   const [seatModalOpen, setSeatModalOpen] = useState(false);
//   const [seatSummary, setSeatSummary] = useState(null);
//   const [selectedSeatId, setSelectedSeatId] = useState('');
//   const [pendingPlan, setPendingPlan] = useState(null);

//   // User data
//   const [currentUser, setCurrentUser]   = useState(null);
//   const [allUsers, setAllUsers]         = useState([]);
//   const [walletBalance, setWalletBalance] = useState(0);
//   const [loading, setLoading]           = useState(true);

//   // Filters
//   const [stateFilter, setStateFilter]               = useState('All States');
//   const [subscriptionFilter, setSubscriptionFilter] = useState('All Plans');

//   const registrationJustCompleted = Boolean(route?.params?.registrationJustCompleted);
//   const fromRegistration = Boolean(route?.params?.newUser);

//   // ── Load data ──────────────────────────────────────────────────────────────
//   useFocusEffect(
//     useCallback(() => {
//       let mounted = true;
//       (async () => {
//         setLoading(true);
//         const user = await UserStore.getCurrentUser();
//         if (!mounted) return;
//         if (!user) { navigation.replace('Login'); return; }

//         const users = await UserStore.getAllUsers();
//         const wallet = await UserStore.getWalletSummary();
//         const seats = await UserStore.getStateSeatSummary();

//         if (!mounted) return;
//         setCurrentUser(user);
//         setAllUsers(users || []);
//         setWalletBalance(wallet?.total_balance || 0);
//         setSeatSummary(seats || null);
//         const seatId = seats?.current_seat?.seat_id || '';
//         setSelectedSeatId((prev) => prev || seatId);
//         setLoading(false);

//         if (registrationJustCompleted && !handledRegistrationToastRef.current) {
//           handledRegistrationToastRef.current = true;
//           showToast('Registration successful!', 'success');
//         }

//         // Show subscription modal when navigating from registration (first time login)
//         if (fromRegistration && !handledSubscriptionModalRef.current) {
//           handledSubscriptionModalRef.current = true;
//           setTimeout(() => setShowSubscriptionModal(true), 1000);
//         }
//       })();
//       return () => { mounted = false; };
//     }, [fromRegistration, navigation, registrationJustCompleted, showToast])
//   );

//   const handleLogout = async () => {
//     await UserStore.clearCurrentUser();
//     navigation.replace('Login');
//   };

//   const handleShareReferral = async () => {
//     if (!currentUser?.my_referral_code) return;
//     try {
//       await Share.share({
//         message: `Join RTI News using my referral code: ${currentUser.my_referral_code}\nDownload the app and register today!`,
//         title: 'RTI News Referral Code',
//       });
//     } catch {}
//   };

//   // ── FIX: Seat confirm → subscription save → success toast (no navigation) ──
//   const handleSeatConfirm = async () => {
//     if (!pendingPlan || !selectedSeatId) return;

//     try {
//       // 1. Seat UserStore mein save karo
//       await UserStore.saveSelectedSeat(selectedSeatId);

//       // 2. Subscription UserStore mein save karo
//       await UserStore.saveSubscription({
//         plan_id: pendingPlan.plan_id,
//         plan_name: pendingPlan.plan_name,
//         seat_id: selectedSeatId,
//         price: pendingPlan.price,
//         duration: pendingPlan.duration,
//       });

//       // 3. Local currentUser state update karo taaki UI refresh ho
//       setCurrentUser((prev) => ({
//         ...prev,
//         subscription_type: pendingPlan.plan_id.replace('plan-', ''), // e.g. 'basic', 'pro', 'premium'
//         subscription_active: true,
//       }));

//       // 4. Modals band karo
//       setSeatModalOpen(false);
//       setShowSubscriptionModal(false);
//       setPendingPlan(null);

//       // 5. Success toast dikhao
//       showToast(`${pendingPlan.plan_name} Subscription Successful! 🎉`, 'success');

//     } catch (err) {
//       console.error('Subscription save failed:', err);
//       showToast('Something went wrong. Please try again.', 'error');
//     }
//   };

//   // ── FIX: Plan select karte waqt existing seat ka bhi same flow ──
//   const handlePlanPress = (plan) => {
//     setPendingPlan(plan);

//     const stateName = seatSummary?.state || currentUser?.state || '';

//     if (!stateName) {
//       showPopup(
//         'Please select your state first.',
//         'error',
//         {
//           primaryLabel: 'Open',
//           secondaryLabel: 'Cancel',
//           onPrimaryPress: () =>
//             navigation.navigate('StateSelect', {
//               fromPremium: true,
//               autoOpen: true,
//             }),
//         }
//       );
//       return;
//     }

//     const existingSeatId = seatSummary?.current_seat?.seat_id || '';

//     if (existingSeatId) {
//       // Already seat hai → seedha subscription save karo
//       setSelectedSeatId(existingSeatId);
//       handleDirectSubscribe(plan, existingSeatId);
//       return;
//     }

//     // Seat nahi hai → seat modal kholo
//     setSeatModalOpen(true);
//   };

//   // Existing seat ke saath direct subscribe (seat modal skip)
//   const handleDirectSubscribe = async (plan, seatId) => {
//     try {
//       await UserStore.saveSubscription({
//         plan_id: plan.plan_id,
//         plan_name: plan.plan_name,
//         seat_id: seatId,
//         price: plan.price,
//         duration: plan.duration,
//       });

//       setCurrentUser((prev) => ({
//         ...prev,
//         subscription_type: plan.plan_id.replace('plan-', ''),
//         subscription_active: true,
//       }));

//       setShowSubscriptionModal(false);
//       setPendingPlan(null);

//       showToast(`${plan.plan_name} Subscription Successful! 🎉`, 'success');

//     } catch (err) {
//       console.error('Subscription save failed:', err);
//       showToast('Something went wrong. Please try again.', 'error');
//     }
//   };

//   // ── Filtered users ─────────────────────────────────────────────────────────
//   const filteredUsers = allUsers.filter((u) => {
//     const stateOk = stateFilter === 'All States' || u.state === stateFilter;
//     const subOk   = subscriptionFilter === 'All Plans' || u.subscription_type === subscriptionFilter;
//     return stateOk && subOk;
//   });

//   // ── Stats ──────────────────────────────────────────────────────────────────
//   const totalReferrals  = currentUser?.referral_count || 0;
//   const rank            = currentUser?.rank || 'Member';
//   const rankCfg         = RANK_CONFIG[rank] || RANK_CONFIG.Member;
//   const nextRankAt      = rankCfg.nextAt;
//   const progressPct     = nextRankAt
//     ? Math.min((totalReferrals / nextRankAt) * 100, 100)
//     : 100;

//   const statsData = [
//     { label: 'Total Members', value: String(filteredUsers.length), icon: 'people-outline',     color: '#6366f1' },
//     { label: 'My Referrals',  value: String(totalReferrals),       icon: 'person-add-outline', color: '#22c55e' },
//     { label: 'Wallet',        value: `₹${walletBalance}`,          icon: 'wallet-outline',     color: '#f59e0b' },
//   ];

//   return (
//     <View style={styles.root}>

//       {/* ── Seat Select Modal ── */}
//       <SeatSelectModal
//         visible={seatModalOpen}
//         stateName={seatSummary?.state || currentUser?.state || ''}
//         seats={seatSummary?.seats || []}
//         selectedSeatId={selectedSeatId}
//         onSelectSeatId={setSelectedSeatId}
//         onCancel={() => {
//           setSeatModalOpen(false);
//           setPendingPlan(null);
//         }}
//         // FIX: onConfirm ab handleSeatConfirm call karta hai
//         onConfirm={handleSeatConfirm}
//       />

//       <Header
//         title="Dashboard"
//         onMenuPress={() => setSidebarVisible(true)}
//         onLogout={handleLogout}
//       />

//       <ScrollView
//         style={styles.content}
//         contentContainerStyle={styles.contentPadding}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* ── Welcome Banner ── */}
//         <View style={styles.welcomeBanner}>
//           <View style={styles.welcomeLeft}>
//             <Text style={styles.welcomeGreeting}>Welcome 👋</Text>
//             <View style={styles.welcomeNameRow}>
//               <Text style={styles.welcomeText}>{currentUser?.name || 'User'}</Text>
//               {UserStore.hasActiveSubscription(currentUser) ? (
//                 <PremiumBadge size={16} style={styles.welcomeBadgeIcon} />
//               ) : null}
//             </View>
//             <Text style={styles.welcomeSub}>
//               {currentUser?.state ? `📍 ${currentUser.state}` : 'Manage your dashboard easily'}
//             </Text>
//             <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
//               <RankBadge rank={rank} />
//               {currentUser?.subscription_type ? (
//                 <TouchableOpacity
//                   style={dashStyles.subTypeBadge}
//                   onPress={() => navigation.navigate('Subscription Plans')}
//                   activeOpacity={0.85}
//                 >
//                   <Text style={dashStyles.subTypeBadgeText}>
//                     {currentUser.subscription_type.toUpperCase()}
//                   </Text>
//                 </TouchableOpacity>
//               ) : null}
//             </View>
//           </View>
//         </View>

//         {/* ── Rank Progress ── */}
//         {Boolean(rankCfg.next) && (
//           <View style={dashStyles.rankProgressCard}>
//             <View style={dashStyles.rankProgressTop}>
//               <View>
//                 <Text style={dashStyles.rankProgressTitle}>Rank Progress</Text>
//                 <Text style={dashStyles.rankProgressSub}>
//                   {totalReferrals} / {nextRankAt} referrals to reach <Text style={{ color: rankCfg.color, fontWeight: '800' }}>{rankCfg.next}</Text>
//                 </Text>
//               </View>
//               <RankBadge rank={rank} />
//             </View>
//             <View style={dashStyles.progressBarBg}>
//               <View style={[dashStyles.progressBarFill, { width: `${progressPct}%`, backgroundColor: rankCfg.color }]} />
//             </View>
//             <Text style={dashStyles.progressPct}>{Math.round(progressPct)}% complete</Text>
//           </View>
//         )}

//         {/* ── Referral Code Card ── */}
//         <ReferralCodeCard
//           code={currentUser?.my_referral_code}
//           onShare={handleShareReferral}
//         />

//         {/* ── Stats Cards ── */}
//         <View style={styles.statsRow}>
//           {statsData.map((stat) => (
//             <View key={stat.label} style={styles.statCard}>
//               <View style={[styles.statIconBox, { backgroundColor: stat.color + '22' }]}>
//                 <Ionicons name={stat.icon} size={18} color={stat.color} />
//               </View>
//               <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
//               <Text style={styles.statLabel}>{stat.label}</Text>
//             </View>
//           ))}
//         </View>

//         {/* ── State Filter ── */}
//         <Text style={dashStyles.filterSectionLabel}>Filter by State</Text>
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           style={styles.filterScroll}
//           contentContainerStyle={{ paddingBottom: 4 }}
//         >
//           {STATE_OPTIONS.map((s) => (
//             <FilterChip
//               key={s}
//               label={s}
//               active={stateFilter === s}
//               onPress={() => setStateFilter(s)}
//             />
//           ))}
//         </ScrollView>

//         {/* ── Subscription Filter ── */}
//         <Text style={dashStyles.filterSectionLabel}>Filter by Subscription</Text>
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           style={[styles.filterScroll, { marginBottom: 14 }]}
//           contentContainerStyle={{ paddingBottom: 4 }}
//         >
//           {SUBSCRIPTION_OPTIONS.map((s) => (
//             <FilterChip
//               key={s}
//               label={s}
//               active={subscriptionFilter === s}
//               onPress={() => setSubscriptionFilter(s)}
//             />
//           ))}
//         </ScrollView>

//         {/* ── Members Table ── */}
//         <View style={dashStyles.tableCard}>
//           <Text style={dashStyles.tableTitle}>
//             Members ({filteredUsers.length})
//           </Text>

//           {loading ? (
//             <Text style={dashStyles.emptyText}>Loading...</Text>
//           ) : filteredUsers.length === 0 ? (
//             <Text style={dashStyles.emptyText}>No members found for selected filters.</Text>
//           ) : (
//             <>
//               {/* Table Header */}
//               <View style={dashStyles.tableHeader}>
//                 <Text style={[dashStyles.thCell, { flex: 2 }]}>Name</Text>
//                 <Text style={[dashStyles.thCell, { flex: 1.5 }]}>State</Text>
//                 <Text style={[dashStyles.thCell, { flex: 1 }]}>Plan</Text>
//                 <Text style={[dashStyles.thCell, { flex: 1 }]}>Rank</Text>
//               </View>

//               {/* Table Rows */}
//               {filteredUsers.map((u, idx) => (
//                 <View
//                   key={u.email}
//                   style={[dashStyles.tableRow, idx % 2 === 0 && dashStyles.tableRowAlt]}
//                 >
//                   <View style={{ flex: 2 }}>
//                     <View style={dashStyles.tdNameRow}>
//                       <Text style={dashStyles.tdName} numberOfLines={1}>{u.name || '-'}</Text>
//                       {UserStore.hasActiveSubscription(u) ? (
//                         <PremiumBadge size={13} style={dashStyles.tdBadge} />
//                       ) : null}
//                     </View>
//                     <Text style={dashStyles.tdEmail} numberOfLines={1}>{u.mobile || '-'}</Text>
//                   </View>
//                   <Text style={[dashStyles.tdCell, { flex: 1.5 }]} numberOfLines={1}>
//                     {u.state || '-'}
//                   </Text>
//                   <Text style={[dashStyles.tdCell, { flex: 1 }]} numberOfLines={1}>
//                     {u.subscription_type ? u.subscription_type.charAt(0).toUpperCase() + u.subscription_type.slice(1) : '-'}
//                   </Text>
//                   <View style={{ flex: 1, alignItems: 'flex-start' }}>
//                     <RankBadge rank={u.rank || 'Member'} />
//                   </View>
//                 </View>
//               ))}
//             </>
//           )}
//         </View>

//         <View style={{ height: 20 }} />
//       </ScrollView>

//       <Footer />

//       <Sidebar
//         visible={sidebarVisible}
//         onClose={() => setSidebarVisible(false)}
//         onItemPress={(item) => setActiveSidebarItem(item)}
//         activeItem={activeSidebarItem}
//       />

//       {/* ── Subscription Modal ── */}
//       {showSubscriptionModal ? (
//         <View style={modalStyles.overlay}>
//           <View style={modalStyles.modalContent}>
//             <View style={modalStyles.modalHeader}>
//               <Text style={modalStyles.modalTitle}>Choose Your Plan</Text>
//               <Text style={modalStyles.modalSubtitle}>
//                 Upgrade to unlock premium features
//               </Text>
//             </View>

//             <ScrollView
//               showsVerticalScrollIndicator={false}
//               style={{ maxHeight: 380 }}
//             >
//               {SUBSCRIPTION_PLANS.map((plan) => (
//                 <TouchableOpacity
//                   key={plan.plan_id}
//                   style={[
//                     modalStyles.planCard,
//                     {
//                       borderWidth:
//                         (pendingPlan?.plan_id === plan.plan_id || plan.popular)
//                           ? 2
//                           : 1,
//                       borderColor:
//                         pendingPlan?.plan_id === plan.plan_id
//                           ? plan.color
//                           : (plan.color + '44'),
//                       backgroundColor:
//                         pendingPlan?.plan_id === plan.plan_id
//                           ? (plan.color + '0F')
//                           : '#f8fafc',
//                     },
//                     pendingPlan?.plan_id === plan.plan_id &&
//                       modalStyles.planCardSelected,
//                   ]}
//                   // FIX: handlePlanPress use karo
//                   onPress={() => handlePlanPress(plan)}
//                   activeOpacity={0.8}
//                 >
//                   {plan.popular ? (
//                     <View
//                       style={[
//                         modalStyles.popularBadge,
//                         { backgroundColor: plan.color },
//                       ]}
//                     >
//                       <Text style={modalStyles.popularText}>
//                         MOST POPULAR
//                       </Text>
//                     </View>
//                   ) : null}

//                   <View style={modalStyles.planHeader}>
//                     <View>
//                       <Text
//                         style={[
//                           modalStyles.planName,
//                           { color: plan.color },
//                         ]}
//                       >
//                         {plan.plan_name}
//                       </Text>
//                       <Text style={modalStyles.planDuration}>
//                         {plan.duration}
//                       </Text>
//                     </View>
//                     <Text style={modalStyles.planPrice}>
//                       ₹{plan.price}
//                     </Text>
//                   </View>

//                   <View style={modalStyles.featuresList}>
//                     {plan.features.map((feature, idx) => (
//                       <View
//                         key={idx}
//                         style={modalStyles.featureItem}
//                       >
//                         <Ionicons
//                           name="checkmark-circle"
//                           size={14}
//                           color={plan.color}
//                         />
//                         <Text style={modalStyles.featureText}>
//                           {feature}
//                         </Text>
//                       </View>
//                     ))}
//                   </View>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>

//             <TouchableOpacity
//               style={modalStyles.closeBtn}
//               onPress={() => {
//                 setShowSubscriptionModal(false);
//                 setPendingPlan(null);
//               }}
//               activeOpacity={0.8}
//             >
//               <Text style={modalStyles.closeBtnText}>
//                 Maybe Later
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       ) : null}
//     </View>
//   );
// }

// // ── Extra local styles ────────────────────────────────────────────────────────
// import { StyleSheet } from 'react-native';

// const dashStyles = StyleSheet.create({
//   rankBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 999,
//     borderWidth: 1,
//     alignSelf: 'flex-start',
//   },
//   rankBadgeText: {
//     fontSize: 11,
//     fontWeight: '800',
//   },
//   subTypeBadge: {
//     backgroundColor: '#7c3aed22',
//     borderRadius: 999,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderWidth: 1,
//     borderColor: '#7c3aed44',
//     alignSelf: 'flex-start',
//   },
//   subTypeBadgeText: {
//     fontSize: 11,
//     fontWeight: '800',
//     color: '#7c3aed',
//   },
//   rankProgressCard: {
//     backgroundColor: '#fff',
//     borderRadius: 18,
//     padding: 16,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   rankProgressTop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   rankProgressTitle: {
//     fontSize: 14,
//     fontWeight: '800',
//     color: '#0f172a',
//     marginBottom: 2,
//   },
//   rankProgressSub: {
//     fontSize: 12,
//     color: '#64748b',
//   },
//   progressBarBg: {
//     height: 8,
//     backgroundColor: '#e2e8f0',
//     borderRadius: 999,
//     overflow: 'hidden',
//     marginBottom: 6,
//   },
//   progressBarFill: {
//     height: '100%',
//     borderRadius: 999,
//   },
//   progressPct: {
//     fontSize: 11,
//     color: '#94a3b8',
//     textAlign: 'right',
//     fontWeight: '600',
//   },
//   referralCard: {
//     backgroundColor: '#1e3a5f',
//     borderRadius: 18,
//     padding: 16,
//     marginBottom: 14,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   referralLeft: { flex: 1 },
//   referralLabel: {
//     fontSize: 11,
//     color: '#93c5fd',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//     marginBottom: 4,
//   },
//   referralCode: {
//     fontSize: 22,
//     fontWeight: '900',
//     color: '#fff',
//     letterSpacing: 1,
//     marginBottom: 4,
//   },
//   referralHint: {
//     fontSize: 11,
//     color: '#93c5fd',
//   },
//   shareBtn: {
//     backgroundColor: '#38bdf8',
//     borderRadius: 12,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   shareBtnText: {
//     color: '#fff',
//     fontWeight: '800',
//     fontSize: 13,
//   },
//   filterSectionLabel: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#64748b',
//     marginBottom: 6,
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   tableCard: {
//     backgroundColor: '#fff',
//     borderRadius: 18,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     marginBottom: 8,
//   },
//   tableTitle: {
//     fontSize: 15,
//     fontWeight: '800',
//     color: '#0f172a',
//     marginBottom: 12,
//   },
//   tableHeader: {
//     flexDirection: 'row',
//     backgroundColor: '#f1f5f9',
//     borderRadius: 10,
//     paddingVertical: 8,
//     paddingHorizontal: 10,
//     marginBottom: 4,
//   },
//   thCell: {
//     fontSize: 11,
//     fontWeight: '800',
//     color: '#64748b',
//     textTransform: 'uppercase',
//     letterSpacing: 0.3,
//   },
//   tableRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 10,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//   },
//   tableRowAlt: {
//     backgroundColor: '#f8fafc',
//   },
//   tdName: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#0f172a',
//   },
//   tdNameRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   tdBadge: {
//     marginTop: 1,
//   },
//   tdEmail: {
//     fontSize: 11,
//     color: '#94a3b8',
//     marginTop: 1,
//   },
//   tdCell: {
//     fontSize: 12,
//     color: '#475569',
//     fontWeight: '500',
//   },
//   emptyText: {
//     fontSize: 13,
//     color: '#94a3b8',
//     textAlign: 'center',
//     paddingVertical: 16,
//   },
// });

// // ── Modal Styles ──────────────────────────────────────────────────────────────
// const modalStyles = StyleSheet.create({
//   overlay: {
//     position: 'absolute',
//     top: 0, left: 0, right: 0, bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 1000,
//     padding: 20,
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderRadius: 24,
//     padding: 20,
//     width: '100%',
//     maxWidth: 400,
//     maxHeight: '80%',
//   },
//   modalHeader: {
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '900',
//     color: '#0f172a',
//     marginBottom: 4,
//   },
//   modalSubtitle: {
//     fontSize: 13,
//     color: '#64748b',
//     textAlign: 'center',
//   },
//   planCard: {
//     backgroundColor: '#f8fafc',
//     borderRadius: 16,
//     padding: 14,
//     marginBottom: 12,
//     borderWidth: 1,
//   },
//   planCardSelected: {
//     transform: [{ scale: 1.01 }],
//   },
//   popularBadge: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 99,
//     marginBottom: 8,
//   },
//   popularText: {
//     fontSize: 10,
//     fontWeight: '800',
//     color: '#fff',
//     letterSpacing: 0.5,
//   },
//   planHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   planName: {
//     fontSize: 16,
//     fontWeight: '800',
//   },
//   planDuration: {
//     fontSize: 12,
//     color: '#64748b',
//     marginTop: 2,
//   },
//   planPrice: {
//     fontSize: 22,
//     fontWeight: '900',
//     color: '#0f172a',
//   },
//   featuresList: {
//     marginTop: 4,
//   },
//   featureItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginBottom: 4,
//   },
//   featureText: {
//     fontSize: 12,
//     color: '#475569',
//   },
//   closeBtn: {
//     backgroundColor: '#f1f5f9',
//     borderRadius: 12,
//     paddingVertical: 12,
//     alignItems: 'center',
//     marginTop: 16,
//   },
//   closeBtnText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#64748b',
//   },
// });
