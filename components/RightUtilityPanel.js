import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openExternalUrl } from '../utils/adRedirect';

function SponsoredImage({ ad }) {
  const [failedToLoad, setFailedToLoad] = useState(false);
  const imageUri = ad.image || ad.photo || ad.image_url || ad.images?.[0] || ad.photos?.[0] || '';

  if (!imageUri || failedToLoad) {
    return (
      <View style={[styles.sponsoredImage, styles.sponsoredImageFallback]}>
        <Ionicons name="image-outline" size={28} color="#94a3b8" />
        <Text style={styles.sponsoredImageFallbackText}>Advertisement</Text>
      </View>
    );
  }

  return <Image source={{ uri: imageUri }} style={styles.sponsoredImage} resizeMode="cover" onError={() => setFailedToLoad(true)} />;
}

export default function RightUtilityPanel({
  navigation, trendingStories = [], onOpenDetails, ads = [], onOpenLeadForm,
  onViewMoreAds, onBackFromAds, showingAllAds = false, firstNewsStory = null,
}) {
  const latestUpdates = useMemo(() => {
    return [...trendingStories]
      .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))
      .slice(0, 4);
  }, [trendingStories]);

  return (
    <View style={styles.rail}>
      {/* ── "View More" click hone ke baad — SAB ads yahin "Top Story" jaisi badi card style me ── */}
      {showingAllAds && ads.length ? (
        <View style={styles.card}>
          <View style={[styles.cardHeaderRow, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="megaphone" size={15} color="#e11d48" />
              <Text style={styles.cardTitle}>Sponsored</Text>
            </View>
            <TouchableOpacity onPress={onBackFromAds} activeOpacity={0.8}>
              <Text style={styles.viewMoreText}>View Less</Text>
            </TouchableOpacity>
          </View>
          {ads.map((ad, idx) => (
            <View
              key={ad.id}
              style={[
                styles.sponsoredAdBlock,
                idx === ads.length - 1 && styles.sponsoredAdBlockLast,
              ]}
            >
              <View style={styles.sponsoredHeader}>
                <View style={styles.sponsoredAvatar}><Text style={{ color: '#fff', fontWeight: '800' }}>{(ad.owner_name || 'A')[0]}</Text></View>
                <View>
                  <Text style={styles.sponsoredName}>{ad.owner_name || 'Advertiser'}</Text>
                  <Text style={styles.sponsoredSub}>Sponsored</Text>
                </View>
              </View>
              <Text style={styles.sponsoredHeadline}>{ad.title}</Text>
              {ad.description ? (
                <TouchableOpacity onPress={() => onOpenDetails?.(ad)} activeOpacity={0.7}>
                  <Text style={styles.sponsoredDesc} numberOfLines={2} ellipsizeMode="tail">
                    {ad.description}
                  </Text>
                </TouchableOpacity>
              ) : null}
            <SponsoredImage ad={ad} />
              <View style={styles.sponsoredBtnRow}>
                {ad.redirect === 'lead_form' ? (
                  <TouchableOpacity style={[styles.sponsoredBtn, { backgroundColor: '#ea580c' }]} activeOpacity={0.88} onPress={() => onOpenLeadForm?.(ad)}>
                    <Ionicons name="document-text-outline" size={14} color="#fff" />
                    <Text style={styles.sponsoredBtnText}>Fill Leads Form</Text>
                  </TouchableOpacity>
                ) : null}
              {(ad.redirect === 'website' || ad.redirect === 'shop' || ad.redirect === 'whatsapp') ? (
                  <TouchableOpacity
                    style={[styles.sponsoredBtn, { backgroundColor: '#ea580c' }]}
                    activeOpacity={0.88}
                    onPress={() => {
                      if (ad.redirect === 'whatsapp') {
                        const phone = String(ad.extraValues?.whatsapp_number || ad.owner_mobile || '').replace(/\D/g, '');
                        if (phone) openExternalUrl(`https://wa.me/91${phone}`);
                        return;
                      }
                      openExternalUrl(ad.redirect === 'shop' ? ad.extraValues?.shop_url : ad.extraValues?.website_url);
                    }}
                  >
                    <Ionicons
                      name={ad.redirect === 'shop' ? 'storefront-outline' : ad.redirect === 'whatsapp' ? 'logo-whatsapp' : 'globe-outline'}
                      size={14}
                      color="#fff"
                    />
                    <Text style={styles.sponsoredBtnText}>
                      {ad.redirect === 'shop' ? 'Visit Shop' : ad.redirect === 'whatsapp' ? 'Message on Whatsapp' : 'Visit Website'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {ad.owner_mobile && ad.allowCalls !== false ? (
                  <TouchableOpacity style={[styles.sponsoredBtn, { backgroundColor: '#16a34a' }]} activeOpacity={0.88} onPress={() => Linking.openURL(`tel:${ad.owner_mobile}`)}>
                    <Ionicons name="call" size={14} color="#fff" />
                    <Text style={styles.sponsoredBtnText}>Call Now</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : ads.length ? (
        <View style={styles.card}>
          <View style={[styles.cardHeaderRow, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="megaphone" size={15} color="#e11d48" />
              <Text style={styles.cardTitle}>Sponsored</Text>
            </View>
            {ads.length > 3 ? (
              <TouchableOpacity onPress={onViewMoreAds} activeOpacity={0.8}>
                <Text style={styles.viewMoreText}>View More</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {ads.slice(0, 3).map((ad) => (
            <View key={ad.id} style={{ marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 14 }}>
              <View style={styles.sponsoredHeader}>
                <View style={styles.sponsoredAvatar}><Text style={{ color: '#fff', fontWeight: '800' }}>{(ad.owner_name || 'A')[0]}</Text></View>
                <View>
                  <Text style={styles.sponsoredName}>{ad.owner_name || 'Advertiser'}</Text>
                  <Text style={styles.sponsoredSub}>Sponsored</Text>
                </View>
              </View>
              <Text style={styles.sponsoredHeadline}>{ad.title}</Text>
              {ad.description ? (
                <TouchableOpacity onPress={() => onOpenDetails?.(ad)} activeOpacity={0.7}>
                  <Text style={styles.sponsoredDesc} numberOfLines={2} ellipsizeMode="tail">
                    {ad.description}
                  </Text>
                </TouchableOpacity>
              ) : null}
          <SponsoredImage ad={ad} />
              <View style={styles.sponsoredBtnRow}>
                {ad.redirect === 'lead_form' ? (
                  <TouchableOpacity style={[styles.sponsoredBtn, { backgroundColor: '#ea580c' }]} activeOpacity={0.88} onPress={() => onOpenLeadForm?.(ad)}>
                    <Ionicons name="document-text-outline" size={14} color="#fff" />
                    <Text style={styles.sponsoredBtnText}>Fill Leads Form</Text>
                  </TouchableOpacity>
                ) : null}
                {(ad.redirect === 'website' || ad.redirect === 'shop') ? (
                  <TouchableOpacity
                    style={[styles.sponsoredBtn, { backgroundColor: '#ea580c' }]}
                    activeOpacity={0.88}
                    onPress={() => openExternalUrl(ad.redirect === 'shop' ? ad.extraValues?.shop_url : ad.extraValues?.website_url)}
                  >
                    <Ionicons name={ad.redirect === 'shop' ? 'storefront-outline' : 'globe-outline'} size={14} color="#fff" />
                    <Text style={styles.sponsoredBtnText}>{ad.redirect === 'shop' ? 'Visit Shop' : 'Visit Website'}</Text>
                  </TouchableOpacity>
                ) : null}
                {ad.owner_mobile && ad.allowCalls !== false ? (
                  <TouchableOpacity style={[styles.sponsoredBtn, { backgroundColor: '#16a34a' }]} activeOpacity={0.88} onPress={() => Linking.openURL(`tel:${ad.owner_mobile}`)}>
                    <Ionicons name="call" size={14} color="#fff" />
                    <Text style={styles.sponsoredBtnText}>Call Now</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Latest Updates ── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="flash" size={15} color="#e11d48" />
          <Text style={styles.cardTitle}>Latest Updates</Text>
        </View>
        {(latestUpdates.length ? latestUpdates : []).map((story, i) => (
          <TouchableOpacity key={story.id || i} style={styles.updateRow} activeOpacity={0.8} onPress={() => onOpenDetails?.(story)}>
            <Image source={{ uri: story.image || 'https://picsum.photos/seed/update' + i + '/80/80' }} style={styles.updateThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.updateTitle} numberOfLines={2}>{story.title}</Text>
              <Text style={styles.updateTime}>{story.publishedAgo || story.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── RTI News Desk profile card ── */}
      <View style={styles.card}>
        <View style={styles.deskHeaderRow}>
          <View style={styles.deskAvatar}>
            <Ionicons name="shield-checkmark" size={18} color="#e11d48" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.deskName}>RTI News Desk</Text>
              <Ionicons name="checkmark-circle" size={13} color="#2563eb" />
            </View>
            <Text style={styles.deskHandle}>@rtinewsdesk</Text>
          </View>
          <TouchableOpacity onPress={() => navigation?.navigate?.('UserPublicProfile')}>
            <Text style={styles.viewProfileLink}>View Profile</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.deskDesc}>Official account of RTI News Network. Delivering accurate and unbiased news.</Text>
        <View style={styles.deskStatsRow}>
          <View style={styles.deskStat}><Text style={styles.deskStatNum}>12.5K</Text><Text style={styles.deskStatLabel}>Posts</Text></View>
          <View style={styles.deskStat}><Text style={styles.deskStatNum}>85K</Text><Text style={styles.deskStatLabel}>Followers</Text></View>
          <View style={styles.deskStat}><Text style={styles.deskStatNum}>120</Text><Text style={styles.deskStatLabel}>Following</Text></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
   rail: {
    width: '100%',
    marginLeft: '-98px',
    gap: 5,
  },

  card: {
    borderWidth: 1,
    borderColor: '#dddee0',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 24,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },

  // Sponsored
  sponsoredAdBlock: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
  },

  sponsoredAdBlockLast: {
    marginBottom: 0,
    borderBottomWidth: 0,
    paddingBottom: 0,
  },

  sponsoredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  sponsoredAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sponsoredName: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#0f172a',
  },

  sponsoredSub: {
    fontSize: 13,
    color: '#4b596d',
    marginTop: 2,
  },

  sponsoredHeadline: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },

  sponsoredDesc: {
    fontSize: 13,
    color: '#4b596d',
    lineHeight: 20,
    marginBottom: 14,
  },

  sponsoredImage: {
    width: '100%',
    height: 160,
    borderRadius: 2,
    marginBottom: 14,
    backgroundColor: '#eef2f7',
  },
  sponsoredImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#dbe3ee',
    borderStyle: 'dashed',
  },
  sponsoredImageFallbackText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },

  sponsoredBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },

  sponsoredBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 2,
    paddingVertical: 10,
  },

 sponsoredBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  viewMoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f97316',
  },
  // Updates
  updateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  updateThumb: {
    width: 70,
    height: 70,
    borderRadius: 2,
    backgroundColor: '#f1f5f9',
  },

  updateTitle: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#0f172a',
    lineHeight: 20,
  },

  updateTime: {
    fontSize: 13,
    color: '#4b596d',
    marginTop: 8,
  },

  // News Desk
  deskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },

  deskAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deskName: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#0f172a',
  },

  deskHandle: {
    fontSize: 13,
    color: '#4b596d',
    marginTop: 2,
  },

  viewProfileLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 4,
  },

  deskDesc: {
    fontSize: 13,
    color: '#4b596d',
    lineHeight: 20,
    marginBottom: 16,
  },

  deskStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#ececec',
    paddingTop: 14,
  },

  deskStat: {
    alignItems: 'center',
  },

  deskStatNum: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },

  deskStatLabel: {
    fontSize: 13,
    color: '#4b596d',
    marginTop: 4,
  },
});
