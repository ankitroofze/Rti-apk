import ModuleAndroidHeader from '../components/ModuleAndroidHeader';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserStore } from '../store/UserStore';
import { useToast } from '../components/ui/ToastProvider';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from '../utils/webMediaStore';
import ModuleWebHeader from '../components/Modulewebheader';
import Sidebar from '../components/Sidebar';

// Hero / banner — full banner image, drop your file at assets/images/ecom-buy-h.jpeg
const ECOM_HERO_IMAGE = require('../assets/images/ecom-buy-h.jpeg');

const BRAND = {
  primary: '#dc2626',
  primaryDark: '#b91c1c',
  primaryLight: '#fef2f2',
  primaryBorder: '#fecaca',
  ink: '#0f172a',
  sub: '#64748b',
  faint: '#94a3b8',
  line: '#e2e8f0',
  blue: '#2563eb',
};

const CATEGORY_ICONS = {
  All: 'grid-outline',
  Electronics: 'hardware-chip-outline',
  Vehicles: 'car-sport-outline',
  'Mobiles & Tablets': 'phone-portrait-outline',
  Fashion: 'shirt-outline',
  'Home & Living': 'home-outline',
  'Books & Stationery': 'book-outline',
  Photography: 'camera-outline',
  Others: 'ellipsis-horizontal-outline',
};

const FALLBACK_CATEGORIES = [
  'Electronics',
  'Vehicles',
  'Mobiles & Tablets',
  'Fashion',
  'Home & Living',
  'Books & Stationery',
  'Others',
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
];

const priceValue = (v) => {
  const n = parseFloat(String(v || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const notify = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
};

const money = (value) => {
  const text = String(value || '').trim();
  return text ? `₹ ${text}` : 'Price on request';
};

const normalizeIndianMobileNumber = (value = '') => {
  const digits = String(value || '').replace(/\D+/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(0, 10);
};

const isValidIndianMobileNumber = (value = '') =>
  /^[6-9]\d{9}$/.test(normalizeIndianMobileNumber(value));

const splitName = (name = '') => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
};

const getMediaItems = (item = {}) => {
  const items = Array.isArray(item.mediaItems) ? item.mediaItems : [];
  if (items.length) return items.filter((media) => media?.uri);
  const imageItems = Array.isArray(item.images)
    ? item.images.filter(Boolean).map((uri) => ({ uri: String(uri), type: 'image' }))
    : [];
  if (imageItems.length) return imageItems;
  if (item.mediaUri) return [{ uri: item.mediaUri, type: item.mediaType || 'image' }];
  return [];
};

const getRelativeTime = (dateStr) => {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  } catch {
    return 'Recently';
  }
};

const getProductImages = (item = {}) =>
  getMediaItems(item).filter(
    (media) => media?.uri && String(media.type || '').toLowerCase() !== 'video'
  );

const ResolvedMediaImage = ({ uri, style, resizeMode }) => {
  const [resolvedUri, setResolvedUri] = useState(uri);

  useEffect(() => {
    let alive = true;
    let objectUrl = '';

    const resolve = async () => {
      if (Platform.OS !== 'web' || !isIdbMediaUri(uri)) {
        setResolvedUri(uri);
        return;
      }

      const nextUri = await resolveIdbMediaUriToObjectUrl(uri);
      if (!alive) {
        if (nextUri && typeof URL !== 'undefined') { try { URL.revokeObjectURL(nextUri); } catch {} }
        return;
      }
      objectUrl = nextUri || '';
      setResolvedUri(nextUri || uri);
    };

    resolve();
    return () => {
      alive = false;
      if (objectUrl && typeof URL !== 'undefined') {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [uri]);

  return <Image source={{ uri: resolvedUri }} style={style} resizeMode={resizeMode} />;
};

const ProductMedia = ({ item, onOpen }) => {
  const imageItems = getProductImages(item);
  const mediaItems = getMediaItems(item);
  const firstImage = imageItems[0];
  const firstMedia = mediaItems[0];
  const totalImages = imageItems.length;
  const isVideo = firstMedia?.uri && String(firstMedia.type || '').toLowerCase() === 'video';

  if (!firstMedia?.uri) {
    return (
      <View style={styles.cardMediaFallback}>
        <Ionicons name="image-outline" size={32} color="#94a3b8" />
        <Text style={styles.noImageText}>No Image</Text>
      </View>
    );
  }

  if (isVideo && !firstImage) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={(e) => { e.stopPropagation?.(); onOpen?.(0); }}
        style={styles.cardMediaFallback}
      >
        <Ionicons name="videocam-outline" size={32} color="#16a34a" />
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <ResolvedMediaImage
        uri={firstImage.uri}
        style={styles.cardImage}
        resizeMode="cover"
      />
      {totalImages > 1 && (
        <View style={styles.photoCountBadge}>
          <Ionicons name="images-outline" size={12} color="#fff" />
          <Text style={styles.photoCountText}>{totalImages} Photos</Text>
        </View>
      )}
    </View>
  );
};

const ProductGallery = ({ item, selectedIndex = 0, onSelectIndex }) => {
  const mediaItems = getMediaItems(item);
  const activeIndex = Math.min(
    Math.max(Number(selectedIndex) || 0, 0),
    Math.max(mediaItems.length - 1, 0)
  );
  const activeMedia = mediaItems[activeIndex];

  if (!mediaItems.length) {
    return (
      <View style={styles.modalProductImageFallback}>
        <Ionicons name="image-outline" size={48} color="#16a34a" />
      </View>
    );
  }

  const isActiveImage = String(activeMedia?.type || '').toLowerCase() !== 'video';

  return (
    <View style={styles.gallery}>
      <View style={styles.galleryItem}>
        {isActiveImage ? (
          <ResolvedMediaImage uri={activeMedia.uri} style={styles.modalProductImage} resizeMode="cover" />
        ) : (
          <View style={styles.modalProductImageFallback}>
            <Ionicons name="videocam-outline" size={48} color="#16a34a" />
            <Text style={styles.videoLabel}>Video selected</Text>
          </View>
        )}
        {mediaItems.length > 1 && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>{activeIndex + 1}/{mediaItems.length}</Text>
          </View>
        )}
      </View>
      {mediaItems.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalThumbRow}>
          {mediaItems.map((media, index) => {
            const isImg = String(media.type || '').toLowerCase() !== 'video';
            return (
              <TouchableOpacity
                key={`${media.uri}-${index}`}
                style={[styles.modalThumbWrap, index === activeIndex && styles.modalThumbWrapActive]}
                onPress={() => onSelectIndex?.(index)}
                activeOpacity={0.85}
              >
                {isImg ? (
                  <ResolvedMediaImage uri={media.uri} style={styles.modalThumbImage} resizeMode="cover" />
                ) : (
                  <View style={styles.modalThumbFallback}>
                    <Ionicons name="videocam-outline" size={20} color="#16a34a" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const InfoRow = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={14} color="#16a34a" />
      </View>
      <Text style={styles.infoLabel}>{label}: </Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const EnquiryFormModal = ({ product, onClose, onSaved }) => {
  const { showToast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [quantity, setQuantity] = useState(product?.quantity || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const user = await UserStore.getCurrentUser();
      if (!alive || !user) return;
      const nameParts = splitName(user.name);
      setFirstName(String(user.first_name || user.firstName || nameParts.firstName || '').trim());
      setLastName(String(user.last_name || user.lastName || nameParts.lastName || '').trim());
      setEmail(String(user.email || '').trim());
      setContact(normalizeIndianMobileNumber(user.mobile || user.mobile_number || user.contact_number || ''));
    };
    load();
    return () => { alive = false; };
  }, []);

  const handleSubmit = async () => {
    if (saving) return;
    const normalizedContact = normalizeIndianMobileNumber(contact);
    if (!firstName.trim()) { showToast('Please enter your first name.', 'error'); return; }
    if (!email.trim()) { showToast('Please enter your email.', 'error'); return; }
    if (!normalizedContact) { showToast('Please enter your contact number.', 'error'); return; }
    if (!isValidIndianMobileNumber(normalizedContact)) {
      showToast('Please enter a valid 10 digit contact number.', 'error');
      return;
    }
    setSaving(true);
    const result = await UserStore.createEcomeEnquiry(product.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      contact: normalizedContact,
      quantity: quantity || product.quantity,
      message: message.trim(),
    });
    setSaving(false);
    if (!result.ok) { showToast(result.message || 'Unable to submit enquiry.', 'error'); return; }
    showToast('Your enquiry has been submitted.', 'success');
    onSaved?.();
    onClose();
  };

  if (!product) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.detailSheet, { maxHeight: '82%' }]} onPress={() => {}}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Send Enquiry</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <View style={styles.productInfoBox}>
              <View style={{width:36,height:36,borderRadius:10,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#fecaca'}}>
                <Ionicons name="cube-outline" size={18} color="#dc2626" />
              </View>
              <View style={{flex:1}}>
                <Text style={styles.productInfoLabel}>Product</Text>
                <Text style={styles.productInfoValue}>{product.title}</Text>
              </View>
            </View>
            <Text style={styles.formLabel}>First Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={16} color="#94a3b8" />
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Enter first name" placeholderTextColor="#94a3b8" />
            </View>
            <Text style={styles.formLabel}>Last Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={16} color="#94a3b8" />
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Enter last name" placeholderTextColor="#94a3b8" />
            </View>
            <Text style={styles.formLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={16} color="#94a3b8" />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter email" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" />
            </View>
            <Text style={styles.formLabel}>Contact Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={16} color="#94a3b8" />
              <TextInput style={styles.input} value={contact} onChangeText={(v) => setContact(normalizeIndianMobileNumber(v))} placeholder="Enter contact number" placeholderTextColor="#94a3b8" keyboardType="phone-pad" maxLength={10} />
            </View>
            <Text style={styles.formLabel}>Quantity</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="layers-outline" size={16} color="#94a3b8" />
              <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder={product.quantity || 'Enter quantity'} placeholderTextColor="#94a3b8" />
            </View>
            <Text style={styles.formLabel}>Message</Text>
            <TextInput style={[styles.input, styles.textArea]} value={message} onChangeText={setMessage} placeholder="e.g. What is the final price?" placeholderTextColor="#94a3b8" multiline />
            <TouchableOpacity style={[styles.submitEnquiryBtn, saving && { opacity: 0.65 }]} onPress={handleSubmit} activeOpacity={0.85} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.submitEnquiryText}>Send Enquiry</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default function FarmingBuyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
    const isWideWeb = isWeb && width >= 900;
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState({});
  const toggleWishlist = (item) => {
    setWishlist((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
  };
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [enquiryProduct, setEnquiryProduct] = useState(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // ── Marketplace UI state (search / category / price / sort) ──
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const loadListings = useCallback(async () => {
    setLoading(true);
    const summary = await UserStore.getEcomeMarketplaceSummary({ skipBlockedUsers: false });
    setListings(Array.isArray(summary?.listings) ? summary.listings : []);
    setLoading(false);
  }, []);

  const lastLoadRef = useRef(0);
  useFocusEffect(useCallback(() => {
    // 30 sec ke andar dobara focus ho to reload mat karo
    if (Date.now() - lastLoadRef.current < 30000 && listings.length) return;
    lastLoadRef.current = Date.now();
    loadListings();
  }, [loadListings, listings.length]));

  const categories = useMemo(() => {
    const fromData = Array.from(
      new Set(listings.map((l) => (l.sector || '').trim()).filter(Boolean))
    );
    const merged = fromData.length ? fromData : FALLBACK_CATEGORIES;
    return ['All', ...merged];
  }, [listings]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const min = minPrice ? priceValue(minPrice) : null;
    const max = maxPrice ? priceValue(maxPrice) : null;

    let result = listings.filter((item) => {
      if (activeCategory !== 'All' && (item.sector || 'Others') !== activeCategory) return false;
      if (q) {
        const hay = `${item.title || ''} ${item.description || ''} ${item.city || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const p = priceValue(item.price);
      if (min !== null && p < min) return false;
      if (max !== null && p > max) return false;
      return true;
    });

    if (sortBy === 'price_low') result = [...result].sort((a, b) => priceValue(a.price) - priceValue(b.price));
    else if (sortBy === 'price_high') result = [...result].sort((a, b) => priceValue(b.price) - priceValue(a.price));
    else result = [...result].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return result;
  }, [listings, activeCategory, searchQuery, minPrice, maxPrice, sortBy]);

  const handleCall = (contact) => {
    const phone = String(contact || '').replace(/\D/g, '');
    if (!phone) { notify('No contact', 'Seller phone number is not available.'); return; }
    const url = `tel:+91${phone}`;
    if (Platform.OS === 'web') { window.open(url); return; }
    Linking.openURL(url);
  };

  const handleWhatsApp = (product) => {
    const phone = String(product?.contact || '').replace(/\D/g, '');
    if (!phone) { notify('No contact', 'Seller phone number is not available.'); return; }
    const msg = encodeURIComponent(`Hi, I am interested in ${product.title}. Price: ${money(product.price)}`);
    const url = `https://wa.me/91${phone}?text=${msg}`;
    if (Platform.OS === 'web') { window.open(url, '_blank'); return; }
    Linking.openURL(url);
  };

  const openEnquiry = (product) => {
    setSelectedProduct(null);
    setEnquiryProduct(product);
  };

  const getSortLabel = () => {
    const option = SORT_OPTIONS.find(opt => opt.id === sortBy);
    return option ? option.label : 'Sort By';
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS !== 'android' && <View style={{ height: insets.top, backgroundColor: '#fff' }} />}

      <View style={isWideWeb ? styles.pageRow : { flex: 1 }}>
      <View style={{ flex: 1 }}>
      {/* ── Top bar: common ModuleWebHeader on web (same as Subscription Plans etc.), custom bar on native ── */}
      <ModuleWebHeader
        title="Ecome Marketplace"
        navigation={navigation}
        onBack={() => navigation.goBack()}
        onMenuPress={() => setSidebarVisible(true)}
        rightExtra={
          <TouchableOpacity onPress={() => navigation.navigate('Sell')} style={styles.sellBtnHeader} activeOpacity={0.85}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.sellBtnText}>Sell</Text>
          </TouchableOpacity>
        }
      />
      {Platform.OS !== 'web' ? (
<ModuleAndroidHeader title="Ecome Marketplace" onBack={() => navigation.goBack()} />
) : null}
{/* White native header removed — red ModuleAndroidHeader hi use hota hai */}
      {/* Search row — kept on its own line under the header so search functionality isn't lost
      <View style={styles.searchRow}>
        <View style={[styles.searchWrap, isWideWeb && styles.searchWrapWide]}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for products, sellers or categories..."
            placeholderTextColor="#94a3b8"
            style={[styles.searchInput, isWideWeb && styles.searchInputWide]}
          />
        </View>
      </View> */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
               {/* ── Hero banner — single full-width image only ── */}
        {Platform.OS === 'web' ? (
          <Image source={ECOM_HERO_IMAGE} style={styles.heroBannerImage} resizeMode="cover" />
        ) : null}
        {/* ── Category chips (Mobile only) ── */}
        {!isWideWeb && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {categories.map((cat) => {
              const displayName = cat === 'All' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.chip, activeCategory === cat && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[cat] || 'pricetag-outline'}
                    size={15}
                    color={activeCategory === cat ? '#fff' : BRAND.primary}
                  />
                  <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>{displayName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={isWideWeb ? styles.bodyRow : null}>
          {/* ── Web sidebar: categories + price + sort ── */}
          {isWideWeb && (
            <View style={styles.sidebar}>
              <Text style={styles.sidebarLabel}>Categories</Text>
              {categories.map((cat) => {
                const displayName = cat === 'All' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={[styles.sidebarItem, activeCategory === cat && styles.sidebarItemActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.sidebarItemText, activeCategory === cat && styles.sidebarItemTextActive]}>
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.sidebarLabel, { marginTop: 22 }]}>Price Range</Text>
              <View style={styles.priceRow}>
                <View style={styles.priceInputWrap}>
                  <Text style={styles.priceRs}>₹</Text>
                  <TextInput
                    value={minPrice}
                    onChangeText={setMinPrice}
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    style={styles.priceInput}
                  />
                </View>
                <Text style={{ color: BRAND.faint }}>–</Text>
                <View style={styles.priceInputWrap}>
                  <Text style={styles.priceRs}>₹</Text>
                  <TextInput
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="10,00,000"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    style={styles.priceInput}
                  />
                </View>
              </View>

              <Text style={[styles.sidebarLabel, { marginTop: 22 }]}>Sort By</Text>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setSortBy(opt.id)}
                  style={[styles.sortItem, sortBy === opt.id && styles.sortItemActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={sortBy === opt.id ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={sortBy === opt.id ? BRAND.primary : '#cbd5e1'}
                  />
                  <Text style={styles.sortItemText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.applyBtn}
                activeOpacity={0.85}
                onPress={() => { setActiveCategory(activeCategory); }}
              >
                <Ionicons name="options-outline" size={16} color="#fff" />
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Main content: results header + grid ── */}
          <View style={{ flex: 1 }}>
            <View style={styles.resultsBar}>
              <Text style={styles.resultsText}>
                {loading ? 'Loading…' : `Showing ${filteredListings.length} of ${listings.length} products`}
              </Text>
              {!isWideWeb && (
                <View style={styles.sortDropdownWrap}>
                  <TouchableOpacity
                    style={styles.sortDropdownBtn}
                    onPress={() => setShowSortDropdown(!showSortDropdown)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.sortDropdownText}>{getSortLabel()}</Text>
                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                  </TouchableOpacity>
                  {showSortDropdown && (
                    <View style={styles.sortDropdownMenu}>
                      {SORT_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.sortDropdownItem, sortBy === opt.id && styles.sortDropdownItemActive]}
                          onPress={() => {
                            setSortBy(opt.id);
                            setShowSortDropdown(false);
                          }}
                        >
                          <Text style={[styles.sortDropdownItemText, sortBy === opt.id && styles.sortDropdownItemTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
              {isWideWeb && (
                <View style={styles.sortPills}>
                  {SORT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setSortBy(opt.id)}
                      style={[styles.sortPill, sortBy === opt.id && styles.sortPillActive]}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.sortPillText, sortBy === opt.id && styles.sortPillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {loading ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color={BRAND.primary} />
                <Text style={styles.stateText}>Loading products...</Text>
              </View>
            ) : filteredListings.length ? (
              <View style={styles.listingsGrid}>
                {filteredListings.map((item) => (
                  <TouchableOpacity
                    key={`${item.owner_email}-${item.id}`}
                    style={[styles.card, isWideWeb && styles.cardWeb]}
                    onPress={() => {
                      setSelectedImageIndex(0);
                      setSelectedProduct(item);
                    }}
                    activeOpacity={0.88}
                  >
                    <View>
                      <ProductMedia
                        item={item}
                        onOpen={(index = 0) => {
                          setSelectedImageIndex(index);
                          setSelectedProduct(item);
                        }}
                      />
                      <View style={styles.verifiedRibbon}>
                        <Text style={styles.verifiedRibbonText}>Verified Seller</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.wishlistBtn}
                        activeOpacity={0.8}
                        onPress={(e) => { e.stopPropagation?.(); toggleWishlist?.(item); }}
                      >
                        <Ionicons
                          name={wishlist?.[item.id] ? 'heart' : 'heart-outline'}
                          size={16}
                          color={wishlist?.[item.id] ? '#dc2626' : '#64748b'}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.cardBody}>
                      {item.sector ? (
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryPillText}>
                            {item.sector.charAt(0).toUpperCase() + item.sector.slice(1).toLowerCase()}
                          </Text>
                        </View>
                      ) : null}
                      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.cardDesc} numberOfLines={2}>{item.description || 'No description added.'}</Text>
                      {item.city ? (
                        <View style={styles.cardCityRow}>
                          <Ionicons name="location-outline" size={13} color="#64748b" />
                          <Text style={styles.cardCityText} numberOfLines={1}>{item.city}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.cardPrice}>{money(item.price)}</Text>
                      <View style={styles.cardBottomRow}>
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={(e) => { e.stopPropagation?.(); handleCall(item.contact); }}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="call-outline" size={14} color={BRAND.primaryDark} />
                          <Text style={styles.callBtnText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.enquireBtn}
                          onPress={(e) => { e.stopPropagation?.(); openEnquiry(item); }}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>Enquire</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.stateBox}>
                <Ionicons name="basket-outline" size={28} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No products found</Text>
                <Text style={styles.stateText}>Try changing your filters, or check back later for new listings.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      </View>
      </View>

      <Modal
        visible={Boolean(selectedProduct)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedProduct(null)}>
          <Pressable style={styles.detailSheet} onPress={() => {}}>
            {selectedProduct ? (
              <>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedProduct(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                  <ProductGallery
                    item={selectedProduct}
                    selectedIndex={selectedImageIndex}
                    onSelectIndex={setSelectedImageIndex}
                  />
                  <View style={styles.modalProductInfo}>
                    <View style={styles.modalTitlePriceRow}>
                      <Text style={styles.modalProductTitle}>{selectedProduct.title || 'Untitled Product'}</Text>
                      <View style={styles.modalPriceBadge}>
                        <Text style={styles.modalPriceText}>{money(selectedProduct.price)}</Text>
                      </View>
                    </View>
                    <View style={styles.modalMetaChipsRow}>
                      {selectedProduct.sector ? (
                        <View style={styles.metaChip}>
                          <Ionicons name="grid-outline" size={12} color="#0369a1" />
                          <Text style={styles.metaChipText}>
                            {selectedProduct.sector.charAt(0).toUpperCase() + selectedProduct.sector.slice(1).toLowerCase()}
                          </Text>
                        </View>
                      ) : null}
                      {selectedProduct.city ? (
                        <View style={styles.metaChip}>
                          <Ionicons name="location-outline" size={12} color="#0369a1" />
                          <Text style={styles.metaChipText}>{selectedProduct.city}</Text>
                        </View>
                      ) : null}
                      {selectedProduct.quantity ? (
                        <View style={styles.metaChip}>
                          <Ionicons name="layers-outline" size={12} color="#0369a1" />
                          <Text style={styles.metaChipText}>Qty: {selectedProduct.quantity}</Text>
                        </View>
                      ) : null}
                    </View>
                    {selectedProduct.description ? (
                      <View style={styles.modalDescSection}>
                        <Text style={styles.modalSectionLabel}>Description</Text>
                        <Text style={styles.modalDescText}>{selectedProduct.description}</Text>
                      </View>
                    ) : null}
                    <View style={styles.modalInfoGrid}>
                      <InfoRow icon="location-outline" label="City" value={selectedProduct.city} />
                      <InfoRow icon="person-outline" label="Seller" value={selectedProduct.owner_name || selectedProduct.author_name} />
                      <InfoRow icon="call-outline" label="Contact" value={selectedProduct.contact} />
                      <InfoRow icon="time-outline" label="Listed" value={selectedProduct.createdAt ? getRelativeTime(selectedProduct.createdAt) : null} />
                    </View>
                    <View style={styles.modalActions}>
                      <TouchableOpacity style={styles.modalCallBtn} onPress={() => handleCall(selectedProduct.contact)} activeOpacity={0.85}>
                        <Ionicons name="call" size={18} color="#dc2626" />
                        <Text style={[styles.modalActionText, { color: '#dc2626' }]}>Call Seller</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalWhatsappBtn} onPress={() => handleWhatsApp(selectedProduct)} activeOpacity={0.85}>
                        <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                        <Text style={styles.modalActionText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.modalEnquiryBtn} onPress={() => openEnquiry(selectedProduct)} activeOpacity={0.85}>
                      <Ionicons name="send" size={18} color="#fff" />
                      <Text style={styles.modalActionText}>Send Enquiry</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <EnquiryFormModal
        product={enquiryProduct}
        onClose={() => setEnquiryProduct(null)}
        onSaved={loadListings}
      />

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        activeItem="eCome Marketplace"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: Platform.OS === 'web' ? 'auto' : 'auto',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND.ink,
   fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : 'Roboto_700Bold',
  },
  searchWrap: {
    flex: 1,
    maxWidth: 500,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchWrapWide: {
    maxWidth: 600,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: BRAND.ink,
    padding: 0,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  searchInputWide: {
    fontSize: 16,
  },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRAND.primary,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  sellBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  sellBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  pageRow: { flex: 1, flexDirection: 'row' },
  scroll: { flex: 1 },
  content: {
    padding: 16,
    maxWidth: 1380,
    width: '100%',
    alignSelf: 'center',
  },
  // ── Hero banner — coded design ──
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#b91c1c',
    backgroundImage: 'linear-gradient(90deg, #7f1d1d 0%, #b91c1c 100%)',
    borderRadius: 16,
    padding: 22,
  },
  heroBannerLeft: { flex: 1, paddingRight: 12 },
  heroBannerLabel: { color: '#fecaca', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  heroBannerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  heroBannerSubtitle: { color: '#fecaca', fontSize: 13, fontWeight: '500' },
  heroBannerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatsRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: -20,
    marginBottom: 16,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(15,23,42,0.08)' },
      default: { elevation: 3 },
    }),
  },
  heroStatsRowWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatItem: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  heroStatTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  heroStatSubtitle: { fontSize: 11, color: '#64748b', marginTop: 2 },
  // ── Category chips ──
  chipRow: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    flexWrap: Platform.OS === 'android' ? 'wrap' : 'nowrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  chipTextActive: { color: '#fff' },

  // ── Web sidebar + filters ──
  bodyRow: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  sidebar: {
    width: 250,
    flexShrink: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 8,
    padding: 18,
  },
  sidebarLabel: {
    fontSize: 19,
    fontWeight: '700',
    color: BRAND.ink,
    marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  sidebarItem: { paddingVertical: 9, paddingHorizontal: 10, borderRadius: 5 },
  sidebarItemActive: { backgroundColor: BRAND.primaryLight },
  sidebarItemText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  sidebarItemTextActive: { color: BRAND.primaryDark, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: '#f8fafc',
  },
  priceRs: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  priceInput: {
    flex: 1,
    fontSize: 12,
    color: BRAND.ink,
    padding: 0,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  sortItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  sortItemActive: {},
  sortItemText: {
    fontSize: 12.5,
    color: '#475569',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BRAND.primary,
    borderRadius: 5,
    paddingVertical: 11,
    marginTop: 22,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },

  // ── Results bar ──
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  resultsText: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  sortPills: { flexDirection: 'row', gap: 8 },
  sortPill: {
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  sortPillActive: { backgroundColor: BRAND.primaryLight, borderColor: BRAND.primaryBorder },
  sortPillText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  sortPillTextActive: { color: BRAND.primaryDark, fontWeight: '800' },

  // ── Sort Dropdown (Mobile) ──
  sortDropdownWrap: {
    position: 'relative',
    zIndex: 10,
  },
  sortDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  sortDropdownText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  sortDropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 8,
    padding: 4,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sortDropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  sortDropdownItemActive: {
    backgroundColor: BRAND.primaryLight,
  },
  sortDropdownItemText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  sortDropdownItemTextActive: {
    color: BRAND.primaryDark,
    fontWeight: '700',
  },

  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    width: Platform.OS === 'android' ? '100%' : (Platform.OS === 'web' ? 'calc(50% - 8px)' : '100%'),
    ...(Platform.OS !== 'web' ? { marginBottom: 14 } : {}),
  },
  cardWeb: {
    width: 'calc(25% - 12px)',
  },

  cardImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#dcfce7',
  },
  cardMediaFallback: {
    width: '100%',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    gap: 8,
  },

  noImageText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },

  photoCountBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },

  verifiedRibbon: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: BRAND.primaryDark,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedRibbonText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
heroBannerImage: {
  width: '100%',
  	...(Platform.OS === 'web' ? { height: 350 } : {}),
  aspectRatio: Platform.OS === 'web' ? 5.55 : 1314 / 370,
  borderRadius: 16,
  marginBottom: 16,
},
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND.primaryLight,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  categoryPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: BRAND.primaryDark,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  cardBody: { padding: 12 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 21,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  cardMeta: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 3,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  cardCityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardCityText: {
    flex: 1,
    marginLeft: 3,
    fontSize: 12,
    color: '#64748b',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  cardPrice: {
    fontSize: 14.5,
    fontWeight: '900',
    color: BRAND.primaryDark,
    marginTop: 5,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  cardDesc: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18,
    marginTop: 6,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: BRAND.primaryLight,
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  callBtnText: {
    color: BRAND.primaryDark,
    fontWeight: '700',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  enquireBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: BRAND.primaryDark,
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },

  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  stateText: {
    marginTop: 8,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 8,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
  },
  detailSheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    backgroundColor: '#f8fafc',
    borderRadius: Platform.OS === 'web' ? 20 : 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gallery: { width: '100%', backgroundColor: '#f0fdf4' },
  galleryItem: { width: '100%', aspectRatio: 4 / 3 },
  modalProductImage: { width: '100%', height: '100%', backgroundColor: '#dcfce7' },
  modalProductImageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalThumbRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  modalThumbWrap: {
    width: 74,
    height: 58,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modalThumbWrapActive: { borderColor: '#dc2626' },
  modalThumbImage: { width: '100%', height: '100%' },
  modalThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
  },
  videoLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  imageCounter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  modalProductInfo: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopWidth: 0,
  },
  modalTitlePriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  modalProductTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 26,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  modalPriceBadge: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  modalPriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#dc2626',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  modalMetaChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 14 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  metaChipText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  modalDescSection: { marginBottom: 14 },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  modalDescText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  modalInfoGrid: { gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  infoValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
    flex: 1,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    paddingVertical: 14,
  },
  modalWhatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 14,
  },
  modalEnquiryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  modalActionText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    paddingRight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    flex: 1,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  formContent: { padding: 16, paddingBottom: 32 },
  productInfoBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productInfoLabel: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  productInfoValue: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 14,
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 12,
    outlineStyle: 'none',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
  },
  submitEnquiryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 20,
  },
  submitEnquiryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? "'Roboto', sans-serif" : Platform.OS === 'android' ? 'Roboto' : 'System',
  },
});