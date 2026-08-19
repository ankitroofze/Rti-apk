import React, { useCallback, useEffect, useState } from 'react';
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

const notify = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
};

const money = (value) => {
  const text = String(value || '').trim();
  return text ? `Rs. ${text}` : 'Price on request';
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
  <View style={{width:36,height:36,borderRadius:10,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#fed7aa'}}>
    <Ionicons name="cube-outline" size={18} color="#ea580c" />
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
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [enquiryProduct, setEnquiryProduct] = useState(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    const summary = await UserStore.getEcomeMarketplaceSummary();
    setListings(Array.isArray(summary?.listings) ? summary.listings : []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadListings(); }, [loadListings]));

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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={{ height: insets.top, backgroundColor: '#fff' }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Buy</Text>
          <Text style={styles.headerSub}>Browse ecommerce products</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Sell')} style={styles.sellBtn} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.sellBtnText}>Sell</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="cart-outline" size={28} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Ecome Marketplace</Text>
            <Text style={styles.heroText}>View products, contact sellers, or send an enquiry.</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#ea580c" />
            <Text style={styles.stateText}>Loading products...</Text>
          </View>
        ) : listings.length ? (
          <View style={styles.listingsGrid}>
            {listings.map((item) => (
              <TouchableOpacity
                key={`${item.owner_email}-${item.id}`}
                style={styles.card}
                onPress={() => {
                  setSelectedImageIndex(0);
                  setSelectedProduct(item);
                }}
                activeOpacity={0.88}
              >
                <ProductMedia
                  item={item}
                  onOpen={(index = 0) => {
                    setSelectedImageIndex(index);
                    setSelectedProduct(item);
                  }}
                />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.cardPrice}>{money(item.price)}</Text>
                  </View>
                  <Text style={styles.cardMeta}>{item.sector || 'General'} | {item.city || 'Location N/A'}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description || 'No description added.'}</Text>
                  <View style={styles.cardBottomRow}>
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={(e) => { e.stopPropagation?.(); handleCall(item.contact); }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="call-outline" size={14} color="#fff" />
                      <Text style={styles.actionBtnText}>Call</Text>
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
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.stateText}>Subscribed sellers can add products from the Sell page.</Text>
          </View>
        )}
      </ScrollView>

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
                          <Text style={styles.metaChipText}>{selectedProduct.sector}</Text>
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
                      <InfoRow icon="person-outline" label="Seller" value={selectedProduct.owner_name || selectedProduct.author_name} />
                      <InfoRow icon="call-outline" label="Contact" value={selectedProduct.contact} />
                      <InfoRow icon="time-outline" label="Listed" value={selectedProduct.createdAt ? getRelativeTime(selectedProduct.createdAt) : null} />
                    </View>
                    <View style={styles.modalActions}>
                      <TouchableOpacity style={styles.modalCallBtn} onPress={() => handleCall(selectedProduct.contact)} activeOpacity={0.85}>
                        <Ionicons name="call" size={18} color="#fff" />
                        <Text style={styles.modalActionText}>Call Seller</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  headerSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  sellBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#16a34a', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9,
  },
  sellBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  scroll: { flex: 1 },
  content: {
    padding: 16,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    flexDirection: 'row', gap: 14, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#fef3c7', backgroundColor: '#fffbeb', marginBottom: 20,
  },
  heroIcon: {
    width: 50, height: 50, borderRadius: 14, alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#fef3c7',
  },
  heroTitle: { fontSize: 16, fontWeight: '900', color: '#92400e' },
  heroText: { fontSize: 12, color: '#b45309', marginTop: 4, lineHeight: 18 },

  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    width: Platform.OS === 'web' ? 'calc(50% - 8px)' : '100%',
    ...(Platform.OS !== 'web' ? { marginBottom: 14 } : {}),
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
  },

  cardBody: { padding: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#0f172a', lineHeight: 21 },
  cardPrice: { fontSize: 14, fontWeight: '900', color: '#ea580c', flexShrink: 0 },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 5 },
  cardDesc: { fontSize: 13, color: '#475569', lineHeight: 19, marginTop: 6 },

  // ✅ FIXED: Buttons smaller, properly spaced from text
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
    backgroundColor: '#0369a1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  enquireBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  stateBox: {
    alignItems: 'center', justifyContent: 'center', padding: 28,
    borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff',
  },
  stateText: { marginTop: 8, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginTop: 8 },

  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
  },
  detailSheet: {
    width: '100%', maxWidth: 520, maxHeight: '92%',
    backgroundColor: '#f8fafc',
    borderRadius: Platform.OS === 'web' ? 20 : 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalCloseBtn: {
    position: 'absolute', top: 12, right: 14, zIndex: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center',
  },
  gallery: { width: '100%', backgroundColor: '#f0fdf4' },
  galleryItem: { width: '100%', aspectRatio: 4 / 3 },
modalProductImage: { width: '100%', height: '100%', backgroundColor: '#dcfce7' },
modalProductImageFallback: {
  width: '100%', height: '100%', backgroundColor: '#f0fdf4',
  alignItems: 'center', justifyContent: 'center',
},
  modalThumbRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  modalThumbWrap: {
    width: 74, height: 58, borderRadius: 10, overflow: 'hidden',
    backgroundColor: '#dcfce7', borderWidth: 2, borderColor: 'transparent',
  },
  modalThumbWrapActive: { borderColor: '#ea580c' },
  modalThumbImage: { width: '100%', height: '100%' },
  modalThumbFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4',
  },
  videoLabel: { marginTop: 8, fontSize: 12, color: '#16a34a', fontWeight: '700' },
  imageCounter: {
    position: 'absolute', right: 12, bottom: 12,
    backgroundColor: 'rgba(15,23,42,0.75)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  imageCounterText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  modalProductInfo: {
    backgroundColor: '#fff', padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#e2e8f0', borderTopWidth: 0,
  },
  modalTitlePriceRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 10, marginTop: 4,
  },
  modalProductTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: '#0f172a', lineHeight: 26 },
  modalPriceBadge: {
    backgroundColor: '#fff7ed', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#fed7aa',
  },
  modalPriceText: { fontSize: 16, fontWeight: '900', color: '#ea580c' },
  modalMetaChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 14 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#eff6ff', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  metaChipText: { fontSize: 12, color: '#0369a1', fontWeight: '600' },
  modalDescSection: { marginBottom: 14 },
  modalSectionLabel: {
    fontSize: 12, fontWeight: '800', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  modalDescText: { fontSize: 14, color: '#334155', lineHeight: 21 },
  modalInfoGrid: { gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoIconWrap: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  infoValue: { fontSize: 13, color: '#0f172a', fontWeight: '700', flex: 1 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCallBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#0369a1', borderRadius: 14, paddingVertical: 14,
  },
  modalWhatsappBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 14,
  },
  modalEnquiryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#ea580c', borderRadius: 14, paddingVertical: 14, marginTop: 10,
  },
  modalActionText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, paddingRight: 52,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  sheetTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', flex: 1 },
  formContent: { padding: 16, paddingBottom: 32 },
  productInfoBox: {
    backgroundColor: '#fff7ed', borderRadius: 12, borderWidth: 1,
    borderColor: '#fed7aa', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  productInfoLabel: { fontSize: 11, color: '#ea580c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
productInfoValue: { fontSize: 15, color: '#0f172a', fontWeight: '800' },
  formLabel: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8, marginTop: 14 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 2,
  },
  input: { flex: 1, fontSize: 15, color: '#0f172a', paddingVertical: 12, outlineStyle: 'none' },
  textArea: {
    minHeight: 90, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    backgroundColor: '#fff', paddingHorizontal: 14,
  },
  submitEnquiryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, marginTop: 20,
  },
  submitEnquiryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});