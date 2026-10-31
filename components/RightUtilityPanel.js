import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openExternalUrl } from '../utils/adRedirect';
import VerifiedBadge from './VerifiedBadge';
import { groupAdsByOwner } from '../utils/adGrouping';
import UserStore from '../store/UserStore';
import ProfileAvatar from './ProfileAvatar';
import AdVideoPlayer from './AdVideoPlayer';
import PostGridThumb from './PostGridThumb';

// India ke Chief Editor ki user ID yahan daalo (backend/admin panel se dekh lo).
const CHIEF_EDITOR_USER_ID = ''; // example: '12'

// Trending row ka thumbnail: video wali news me pehle video ka asli frame dikhao.
// (normalizeStoryItem video-news ko bhi random placeholder `image` de deta hai, isliye image par bharosa nahi)
function TrendingThumb({ story, index }) {
  const videoUri = String(typeof story?.video === 'string' ? story.video : story?.video?.uri || '').trim();
  const isVideo = story?.mediaType === 'Video' || Boolean(videoUri);
  if (isVideo && videoUri) {
    return (
      <View style={[styles.updateThumb, { overflow: 'hidden' }]}>
        <PostGridThumb videoUri={videoUri} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 5, bottom: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="play" size={11} color="#fff" />
        </View>
      </View>
    );
  }
  return <Image source={{ uri: story?.image || 'https://picsum.photos/seed/update' + index + '/80/80' }} style={styles.updateThumb} />;
}

const formatCount = (n) => {
  const v = Number(n || 0);
  if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(v);
};

function SponsoredImage({ ad }) {
  const [failedToLoad, setFailedToLoad] = useState(false);
  const [ratio, setRatio] = useState(null);
  const imageUri = ad.image || ad.photo || ad.image_url || ad.images?.[0] || ad.photos?.[0] || '';
  const videoUri = ad.video || ad.video_url || '';
  useEffect(() => {
    if (!imageUri) return undefined;
    let alive = true;
    Image.getSize(imageUri, (w, h) => { if (alive && w && h) setRatio(w / h); }, () => {});
    return () => { alive = false; };
  }, [imageUri]);

  // ✅ video ad (media_type 2): image nahi hoti — video player dikhao (muted autoplay + controls)
  if ((!imageUri || failedToLoad) && videoUri) {
    return <AdVideoPlayer key={videoUri} uri={videoUri} autoPlay style={[styles.sponsoredImage, { height: undefined, aspectRatio: 16 / 9 }]} />;
  }

  if (!imageUri || failedToLoad) {
    return (
      <View style={[styles.sponsoredImage, styles.sponsoredImageFallback]}>
        <Ionicons name="image-outline" size={28} color="#94a3b8" />
        <Text style={styles.sponsoredImageFallbackText}>Advertisement</Text>
      </View>
    );
  }

  // Poori image dikhe (crop nahi): asli ratio ke hisaab se height, contain
  return (
    <Image
      source={{ uri: imageUri }}
      style={[styles.sponsoredImage, { height: undefined, aspectRatio: ratio || 1.5, maxHeight: 420 }]}
      resizeMode="contain"
      onLoad={(e) => {
        const { width: w, height: h } = e?.nativeEvent?.source || {};
        if (w && h) setRatio(w / h);
      }}
      onError={() => setFailedToLoad(true)}
    />
  );
}

// Ek hi user ke 2+ ads: ek card ke andar prev/next se dekho (title, buttons sab ad ke saath badalte hain)
function SponsoredAdGroup({ group = [], children }) {
  const [slide, setSlide] = useState(0);
  const total = group.length;
  const safe = total ? Math.min(slide, total - 1) : 0;
  return (
    <View>
      {total > 1 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 6 }}>
          <TouchableOpacity onPress={() => setSlide((safe - 1 + total) % total)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Previous ad">
            <Ionicons name="chevron-back-circle" size={22} color="#ea580c" />
          </TouchableOpacity>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>{safe + 1} / {total}</Text>
          <TouchableOpacity onPress={() => setSlide((safe + 1) % total)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Next ad">
            <Ionicons name="chevron-forward-circle" size={22} color="#ea580c" />
          </TouchableOpacity>
        </View>
      ) : null}
      {children(group[safe])}
    </View>
  );
}

// Advertiser ka header: profile image + naam + Sponsored. Click karne par uske profile par jata hai.
function SponsoredHeader({ ad, navigation }) {
  const name = ad.owner_name || 'Advertiser';
  const handlePress = async () => {
    const email = String(ad.owner_email || '').trim().toLowerCase();
    const userId = ad.owner_id || null;
    if (!email && !userId) return;
    try {
      const me = await UserStore.getCurrentUser();
      const myEmail = String(me?.email || '').trim().toLowerCase();
      const isMe = (myEmail && email && myEmail === email) || (me?.id && userId && String(me.id) === String(userId));
      if (isMe) { navigation?.navigate?.('Profile'); return; }
    } catch { /* ignore */ }
    navigation?.navigate?.('UserPublicProfile', {
      email,
      userId,
      author: {
        name,
        email,
        profile_image: ad.owner_profile_image || '',
        avatar: ad.owner_profile_image || '',
        has_blue_tick: Boolean(ad.owner_has_blue_tick),
      },
    });
  };
  return (
    <TouchableOpacity style={styles.sponsoredHeader} activeOpacity={0.75} onPress={handlePress}>
      <ProfileAvatar uri={ad.owner_profile_image} size={36} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.sponsoredName} numberOfLines={1}>{name}</Text>
          {(ad.owner_has_blue_tick || ad.verified) ? <VerifiedBadge size={14} /> : null}
        </View>
        <Text style={styles.sponsoredSub}>Sponsored</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function RightUtilityPanel({
  navigation, trendingStories = [], onOpenDetails, ads = [], onOpenLeadForm,
  onViewMoreAds, onBackFromAds, showingAllAds = false, firstNewsStory = null,
  onViewAllTrending,
}) {
  const [desk, setDesk] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!CHIEF_EDITOR_USER_ID) return;
      try {
        const profile = await UserStore.getPublicProfileById(CHIEF_EDITOR_USER_ID);
        if (!profile || !alive) return;
        const email = String(profile.email || '').trim().toLowerCase();
        const follow = await UserStore.getFollowSummary(email, CHIEF_EDITOR_USER_ID).catch(() => null);
        if (!alive) return;
        setDesk({
          id: CHIEF_EDITOR_USER_ID,
          email,
          name: profile.name || 'Chief Editor',
          avatar: profile.avatar || profile.profile_image || '',
          handle: profile.username || (email ? email.split('@')[0] : ''),
          bio: profile.bio || profile.about || 'Chief Editor, RTI News Network',
          posts: profile.posts_count ?? profile.news_count ?? (Array.isArray(profile.posts) ? profile.posts.length : 0),
          followers: follow?.followersCount ?? profile.followers_count ?? 0,
          following: follow?.followingCount ?? profile.following_count ?? 0,
        });
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, []);

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
              <SponsoredHeader ad={ad} navigation={navigation} />
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
          {groupAdsByOwner(ads).slice(0, 3).map((group) => (
            <SponsoredAdGroup key={String(group[0].id)} group={group}>{(ad) => (
            <View key={ad.id} style={{ marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 14 }}>
              <SponsoredHeader ad={ad} navigation={navigation} />
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
          )}</SponsoredAdGroup>
          ))}
        </View>
      ) : null}

      {/* ── Trending news: compact editorial rows ── */}
      <View style={styles.card}>
        <View style={[styles.cardHeaderRow, { justifyContent: 'space-between' }]}>
          <View style={styles.trendingHeaderTitle}>
          <Ionicons name="trending-up" size={18} color="#dc2626" />
          <Text style={styles.cardTitle}>Trending News</Text>
          </View>
          <TouchableOpacity onPress={() => (onViewAllTrending ? onViewAllTrending() : navigation?.navigate?.('Home'))}><Text style={styles.viewMoreText}>See All <Ionicons name="arrow-forward" size={12} /></Text></TouchableOpacity>
        </View>
        {(latestUpdates.length ? latestUpdates : []).map((story, i) => (
          <TouchableOpacity key={story.id || i} style={styles.updateRow} activeOpacity={0.8} onPress={() => onOpenDetails?.(story)}>
            <TrendingThumb story={story} index={i} />
            <View style={{ flex: 1 }}>
              <Text style={styles.updateCategory}>{String(story.category || 'India')}</Text>
              <Text style={styles.updateTitle} numberOfLines={3}>{story.title}</Text>
              <View style={styles.updateMeta}><Ionicons name="flame" size={13} color="#ef4444" /><Text style={styles.updateTime}>{story.publishedAgo || 'Recently'}</Text><Ionicons name="eye-outline" size={13} color="#94a3b8" /><Text style={styles.updateTime}>{Number(story.views || 0).toLocaleString()} views</Text></View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

          {/* ── India Chief Editor profile card ── */}
      {desk ? (
        <View style={styles.card}>
          <View style={styles.deskHeaderRow}>
            <ProfileAvatar uri={desk.avatar} size={42} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.deskName} numberOfLines={1}>{desk.name}</Text>
                <Ionicons name="checkmark-circle" size={13} color="#2563eb" />
              </View>
              {desk.handle ? <Text style={styles.deskHandle}>@{desk.handle}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={() => navigation?.navigate?.('UserPublicProfile', {
                email: desk.email || undefined,
                userId: desk.id,
                author: { name: desk.name, profile_image: desk.avatar },
              })}
            >
              <Text style={styles.viewProfileLink}>View Profile</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.deskDesc}>{desk.bio}</Text>
          <View style={styles.deskStatsRow}>
            <View style={styles.deskStat}><Text style={styles.deskStatNum}>{formatCount(desk.posts)}</Text><Text style={styles.deskStatLabel}>Posts</Text></View>
            <View style={styles.deskStat}><Text style={styles.deskStatNum}>{formatCount(desk.followers)}</Text><Text style={styles.deskStatLabel}>Followers</Text></View>
            <View style={styles.deskStat}><Text style={styles.deskStatNum}>{formatCount(desk.following)}</Text><Text style={styles.deskStatLabel}>Following</Text></View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: '100%',
    marginLeft: 0,
    gap: 5,
  },

  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef233c' },

  cardTitle: { fontSize: 16, fontWeight: '800', color: '#172033', fontFamily: 'Roboto' },
  trendingHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },

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
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  updateThumb: {
    width: 88,
    height: 68,
    borderRadius: 7,
    backgroundColor: '#f1f5f9',
  },

  updateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#172033',
    lineHeight: 18,
    fontFamily: 'Roboto',
  },
  updateCategory: { alignSelf: 'flex-start', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: 9, fontWeight: '800', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginBottom: 4, fontFamily: 'Roboto' },
  updateMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  updateTime: {
    fontSize: 10,
    color: '#4b596d',
    fontWeight: '800',
    fontFamily: 'Roboto',
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