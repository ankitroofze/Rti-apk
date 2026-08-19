import { SIDEBAR_MENU_ITEMS, STATE_LABELS, FALLBACK_DISTRICT_MAP } from '../constants/homeData';
import { Platform } from 'react-native';

export function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const value = url.trim();
  if (!value || value === 'null' || value === 'undefined') return false;
  if (value.startsWith('http://localhost')) return false;

  // Web-picked images often come through as blob URLs and should render in-session.
  if (value.startsWith('blob:')) return true;

  // Allow local URIs on native; they don't survive web reloads and typically won't render on web.
  if (value.startsWith('file://')) return Platform.OS !== 'web';
  if (value.startsWith('content://')) return Platform.OS !== 'web';
  if (value.startsWith('ph://')) return Platform.OS !== 'web';
  if (value.startsWith('asset://')) return Platform.OS !== 'web';

  // `data:` URIs are fine (useful for web persistence).
  return true;
}

export function buildPlaceholderImage(seedKey) {
  return `https://picsum.photos/seed/${encodeURIComponent(seedKey)}/900/640`;
}

export function getMenuPresentation(menuKey) {
  return SIDEBAR_MENU_ITEMS.find((item) => item.key === menuKey) || SIDEBAR_MENU_ITEMS[0];
}

export function getMenuLabel(menuItem, commonCopy) {
  if (!menuItem) return '';
  return commonCopy?.[menuItem.labelKey] || menuItem.fallbackLabel || menuItem.labelKey;
}

export function getLocalizedCategoryLabel(categoryLabel, commonCopy) {
  const matchedMenuItem = SIDEBAR_MENU_ITEMS.find((item) => item.fallbackLabel === categoryLabel);
  if (!matchedMenuItem) return categoryLabel;
  return getMenuLabel(matchedMenuItem, commonCopy);
}

export function getLocalizedSeatLabel(seatLabel, commonCopy) {
  if (!seatLabel || seatLabel === 'Reporter') return commonCopy?.reporter || 'Reporter';
  return getLocalizedCategoryLabel(seatLabel, commonCopy) || seatLabel;
}

export function inferMenuTagsFromText(item) {
  const haystack = [item?.title, item?.category, item?.report_type, item?.description, item?.excerpt]
    .join(' ').toLowerCase();
  const tags = ['latest'];
  if (/politic|govern|minister|assembly|parliament|policy/.test(haystack)) tags.push('politics', 'latest_political');
  if (/election|poll|vote|ballot|campaign/.test(haystack)) tags.push('elections', 'politics', 'latest_political');
  if (/viral|trending|share|clip|popular/.test(haystack)) tags.push('viral');
  if (/astrology|planet|zodiac/.test(haystack)) tags.push('astrology');
  if (/horoscope|rashifal|hindi horoscope/.test(haystack)) tags.push('horoscope_hindi', 'astrology');
  if (/english horoscope/.test(haystack)) tags.push('horoscope_english', 'astrology');
  return Array.from(new Set(tags));
}

export function normalizeStoryItem(item, index = 0) {
  if (!item) return null;
  const title = String(item.title || '').trim();
  if (!title) return null;
  const rawImage =
    (Array.isArray(item.images) ? item.images.find((u) => isValidImageUrl(u)) : '') ||
    (isValidImageUrl(item.image) ? item.image : '') ||
    (isValidImageUrl(item.author_profile_image) ? item.author_profile_image : '');
  const storyImage = rawImage || buildPlaceholderImage(item.id || `story-${index}`);
  return {
    id: item.id || `story-${index}`,
    createdBy: String(item.createdBy || item.created_by || '').trim().toLowerCase(),
    title,
    excerpt: stripHtml(item.excerpt || item.subtitle || item.description || ''),
    description: stripHtml(item.description || item.subtitle || item.excerpt || ''),
    category: item.category || 'Latest News',
    language: String(item.language || item.lang || item.news_language || '').trim().toLowerCase(),
    menuTags: Array.isArray(item.menuTags) && item.menuTags.length
      ? Array.from(new Set(['latest', ...item.menuTags]))
      : inferMenuTagsFromText(item),
    state: item.state || 'National',
    district: item.district || '',
    taluka: item.taluka || '',
    author_name: item.author_name || item.author || 'RTI Desk',
    author_profile_image: item.author_profile_image || '',
    author_seat_name: item.author_seat_name || item.authorSeatName || 'Reporter',
    author_role_label: item.author_role_label || item.authorRoleLabel || '',
    author_has_blue_tick: Boolean(item.author_has_blue_tick || item.authorHasBlueTick || item.createdByBlueTick || item.has_blue_tick || false),
    author_is_premium: Boolean(item.author_is_premium || item.isPremium || false),
    author_is_subscriber: Boolean(item.author_is_subscriber || item.createdBySubscriber || false),
    image: storyImage,
    images: Array.isArray(item.images) && item.images.length
      ? item.images.filter((u) => isValidImageUrl(u))
      : [storyImage],
    video: item.video || null,
    file: item.file || null,
    mediaType: item.mediaType || (item.video ? 'Video' : 'Image'),
    date: item.date || '05 May 2026',
    publishedAgo: item.publishedAgo || 'Updated recently',
    views: Number(item.views || 0),
    likes: Number(item.likes || 0),
    comments: Number(item.comments || 0),
    shares: Number(item.shares || 0),
    liked_by: Array.isArray(item.liked_by) ? item.liked_by : [],
    bookmarked: Boolean(item.bookmarked),
    comments_list: Array.isArray(item.comments_list) ? item.comments_list : [],
  };
}

export function dedupeStories(stories) {
  return stories.filter((s, i, arr) => arr.findIndex((c) => c.id === s.id) === i);
}

export function storyMatchesMenu(story, menuKey) {
  if (!story) return false;
  if (!menuKey || menuKey === 'latest') return true;
  if (menuKey === 'states') return true;
  return Array.isArray(story.menuTags) && story.menuTags.includes(menuKey);
}

export function buildHomeStateFromParams(routeParams = {}) {
  const initialView = routeParams.initialView === 'states' ? 'states' : 'feed';
  const requestedMenuKey = routeParams.initialMenuKey || (initialView === 'states' ? 'states' : 'latest');
  const selectedMenuKey = SIDEBAR_MENU_ITEMS.some((item) => item.key === requestedMenuKey)
    ? requestedMenuKey
    : initialView === 'states' ? 'states' : 'latest';
  return {
    nextViewMode: initialView,
    nextMenuKey: selectedMenuKey,
    nextStateName: String(routeParams.initialStateName || '').trim(),
  };
}

export function buildPanelContent({ viewMode, selectedMenuKey, selectedStateName, districtCount, commonCopy, homeCopy }) {
  if (selectedStateName) {
    return {
      eyebrow: homeCopy.selectedPlaceEyebrow,
      title: `${selectedStateName} ${homeCopy.selectedPlaceTitleSuffix}`,
      subtitle: districtCount
        ? `${selectedStateName}: ${homeCopy.selectedPlaceSubtitleWithData}`
        : `${selectedStateName}: ${homeCopy.selectedPlaceSubtitleEmpty}`,
    };
  }
  if (viewMode === 'states' || selectedMenuKey === 'states') {
    return { eyebrow: homeCopy.choosePlaceEyebrow, title: homeCopy.choosePlaceTitle, subtitle: homeCopy.choosePlaceSubtitle };
  }
  if (selectedMenuKey !== 'latest') {
    const activeMenu = getMenuPresentation(selectedMenuKey);
    return { eyebrow: getMenuLabel(activeMenu, commonCopy), title: getMenuLabel(activeMenu, commonCopy), subtitle: homeCopy.focusedMenuSubtitle };
  }
  return { eyebrow: homeCopy.latestEyebrow, title: homeCopy.latestTitle, subtitle: homeCopy.latestSubtitle };
}

export function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function buildStateDistrictList(stories, stateName) {
  if (!stateName) return [];
  const normalizedState = String(stateName).trim().toLowerCase();
  const storyDistricts = stories
    .filter((s) => String(s.state || '').trim().toLowerCase() === normalizedState)
    .flatMap((s) => [s.district, s.taluka])
    .map((v) => String(v || '').trim())
    .filter(Boolean);
  const fallbackDistricts = FALLBACK_DISTRICT_MAP[stateName] || [
    `${stateName} City`, `${stateName} Central`, `${stateName} North`, `${stateName} South`, `${stateName} Rural`,
  ];
  return uniqueValues([...storyDistricts, ...fallbackDistricts]);
}

export function createTemplateStory({ storyId, menuKey, stateName, districtName, indexOffset = 0 }) {
  const menuPresentation = getMenuPresentation(menuKey);
  const cityName = districtName || 'State Desk';
  const titleMap = {
    latest: `${stateName} desk shares a fresh RTI citizen update from ${cityName}`,
    politics: `${stateName} politics tracker reviews governance files from ${cityName}`,
    elections: `${stateName} election watch opens a new transparency brief in ${cityName}`,
    viral: `${stateName} public-interest explainer from ${cityName} is being shared widely`,
    astrology: `${stateName} audience gets a fresh astrology bulletin from ${cityName}`,
    horoscope_hindi: `${stateName} Hindi horoscope readers get a new morning bulletin`,
    horoscope_english: `${stateName} English horoscope desk publishes a fresh daily roundup`,
    latest_political: `${stateName} political desk highlights new accountability questions in ${cityName}`,
  };
  const excerptMap = {
    latest: 'A quick public-interest summary is highlighting local records, pending replies, and what citizens should track next.',
    politics: 'The update follows decisions, ministerial responses, and how official files are moving through the system.',
    elections: 'Voter-facing transparency promises are being compared with on-ground documents and department replies.',
    viral: 'Community groups are rapidly circulating the story because the issue feels practical, local, and easy to follow.',
    astrology: 'This lighter-format bulletin keeps readers engaged while the news desk experiments with broader lifestyle coverage.',
    horoscope_hindi: 'The Hindi-first bulletin is pairing familiar horoscope cues with short newsroom suggestions and timely updates.',
    horoscope_english: 'The English edition mixes a quick zodiac note with a concise city briefing for returning readers.',
    latest_political: 'The roundup packages governance updates, public records access, and accountability questions in one place.',
  };
  return normalizeStoryItem({
    id: storyId,
    title: titleMap[menuKey] || titleMap.latest,
    excerpt: excerptMap[menuKey] || excerptMap.latest,
    description: `${excerptMap[menuKey] || excerptMap.latest} This placeholder card keeps every state and category view populated.`,
    category: menuPresentation.fallbackLabel,
    menuTags: ['latest', menuKey],
    state: stateName, district: districtName, taluka: cityName,
    author_name: 'RTI News Desk',
    author_profile_image: `https://i.pravatar.cc/96?u=${encodeURIComponent(storyId)}`,
    author_seat_name: menuPresentation.fallbackLabel,
    author_is_premium: indexOffset % 2 === 0,
    image: buildPlaceholderImage(storyId), images: [buildPlaceholderImage(storyId)],
    date: '05 May 2026', publishedAgo: `${12 + indexOffset * 7} min ago`,
    views: 18 + indexOffset * 11, likes: 3 + indexOffset * 2, comments: 1 + indexOffset, shares: 1 + indexOffset,
  }, indexOffset);
}

export function buildStateStories(stateName, menuKey) {
  const activeMenuKey = menuKey === 'states' ? 'latest' : menuKey;
  const fallbackDistricts = FALLBACK_DISTRICT_MAP[stateName] || [`${stateName} Central`, `${stateName} North`, `${stateName} South`];
  return fallbackDistricts.slice(0, 3).map((districtName, index) =>
    createTemplateStory({ storyId: `state-story-${stateName}-${index}-${activeMenuKey}`, menuKey: activeMenuKey, stateName, districtName, indexOffset: index })
  );
}

export function buildCategoryStories(menuKey) {
  return ['Maharashtra', 'Uttar Pradesh', 'Karnataka', 'Tamil Nadu', 'West Bengal'].map((stateName, index) =>
    createTemplateStory({ storyId: `category-story-${menuKey}-${stateName}-${index}`, menuKey, stateName, districtName: `${stateName} Bureau`, indexOffset: index })
  );
}

export function ensureStoryCount(stories, { selectedMenuKey, selectedStateName }) {
  const workingStories = [...stories];
  const safeMenuKey = selectedMenuKey === 'states' ? 'latest' : selectedMenuKey;
  if (selectedStateName) {
    workingStories.push(...buildStateStories(selectedStateName, safeMenuKey));
  } else if (safeMenuKey && safeMenuKey !== 'latest') {
    workingStories.push(...buildCategoryStories(safeMenuKey));
  }
  const dedupedStories = dedupeStories(workingStories);
  let autoFillIndex = 0;
  while (dedupedStories.length < 10) {
    const fallbackState = selectedStateName || STATE_LABELS[autoFillIndex % STATE_LABELS.length];
    dedupedStories.push(createTemplateStory({
      storyId: `autofill-story-${safeMenuKey}-${fallbackState}-${autoFillIndex}`,
      menuKey: safeMenuKey || 'latest', stateName: fallbackState,
      districtName: `${fallbackState} Desk`, indexOffset: autoFillIndex,
    }));
    autoFillIndex += 1;
  }
  return dedupeStories(dedupedStories);
}
