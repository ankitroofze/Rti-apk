// utils/smartBack.js
// Breadcrumb-style back: user jis page se aaya tha, back dabane par wahin wapas jaye.
// Pehle kai screens back par hamesha 'QuickMenu' / 'Home' par bhej deti thi, chahe user kahin se bhi aaya ho.
// Ab: pichli screen (navigation history) ho to wahin; warna (deep link / notification se khula) fallback screen.
export function smartGoBack(navigation, fallback = 'Home', params) {
  try {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
  } catch (_) { /* fallback neeche */ }
  try {
    if (params) navigation?.navigate?.(fallback, params);
    else navigation?.navigate?.(fallback);
  } catch (_) { /* ignore */ }
}