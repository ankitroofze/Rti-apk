import { useEffect } from 'react';
import { Platform } from 'react-native';

// Desktop web par Profile / Notifications KABHI bina sidebar ke nahi khulne chahiye.
// Agar ye screen "standalone" route se khuli (QuickMenu ke andar embed nahi hai) to
// seedha QuickMenu (sidebar wala shell) me wahi screen khol do.
// Return true => redirect ho raha hai, screen ko `null` render karna chahiye.
export const isDesktopWeb = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth > 760;

export function useQuickMenuRedirect(navigation, screenName) {
  const shouldRedirect = isDesktopWeb() && !navigation?.isQuickMenuEmbedded;
  useEffect(() => {
    if (!shouldRedirect) return;
    try {
      (navigation?.replace || navigation?.navigate)?.call(navigation, 'QuickMenu', { initialScreen: screenName, ts: Date.now() });
    } catch (_) { /* ignore */ }
  }, [shouldRedirect]); // eslint-disable-line react-hooks/exhaustive-deps
  return shouldRedirect;
}

// Navbar / header se: desktop web par sidebar wale shell me kholo, baaki jagah normal screen.
export function openWithSidebar(navigation, screenName) {
  if (isDesktopWeb()) navigation?.navigate?.('QuickMenu', { initialScreen: screenName, ts: Date.now() });
  else navigation?.navigate?.(screenName);
}