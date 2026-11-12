import React, { useEffect } from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { useFonts } from 'expo-font';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Roboto_900Black } from '@expo-google-fonts/roboto';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import './components/initFontDefaults';
import AppNavigator from './navigation/AppNavigator';
import { ToastProvider } from './components/ui/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import PushNotificationBootstrap from './components/Pushnotificationbootstrap';
import { isMobileWebDevice } from './utils/webDevice';


SplashScreen.preventAutoHideAsync().catch(() => {});

const DEFAULT_FONT = Platform.OS === 'web' ? 'Roboto, sans-serif' : 'Roboto_400Regular';

// One typography baseline for every screen. Individual bold/black styles may
// still choose a weight, but every unstyled Text/TextInput now matches Ads.
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: DEFAULT_FONT }, Text.defaultProps.style];
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [
  { fontFamily: DEFAULT_FONT },
  Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0 } : null,
  TextInput.defaultProps.style,
];

if (typeof document !== 'undefined') {
  if (!document.getElementById('google-roboto-link')) {
    const linkEl = document.createElement('link');
    linkEl.id = 'google-roboto-link';
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap';
    document.head.appendChild(linkEl);
  }

  if (!document.getElementById('app-global-roboto-font')) {
    const fontEl = document.createElement('style');
    fontEl.id = 'app-global-roboto-font';
    fontEl.textContent = `
      html, body, #root, [data-reactroot], input, textarea, select, button {
        font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }

      @font-face {
        font-family: 'Roboto';
        src: local('Roboto'), local('Roboto-Regular');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'Roboto_400Regular';
        src: local('Roboto'), local('Roboto-Regular');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'Roboto_500Medium';
        src: local('Roboto Medium'), local('Roboto-Medium');
        font-weight: 500;
        font-style: normal;
      }
      @font-face {
        font-family: 'Roboto_700Bold';
        src: local('Roboto Bold'), local('Roboto-Bold');
        font-weight: 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Roboto_900Black';
        src: local('Roboto Black'), local('Roboto-Black');
        font-weight: 900;
        font-style: normal;
      }
    `;
    document.head.appendChild(fontEl);
  }

  if (!document.getElementById('app-global-textbox-focus')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'app-global-textbox-focus';
    styleEl.textContent = `
      /* 1. Andar ke input text par KUCH BHI border/outline/box NAHI rahega */
      input, textarea, select, [contenteditable="true"] {
        border: none !important;
        border-width: 0 !important;
        outline: none !important;
        outline-style: none !important;
        outline-width: 0 !important;
        box-shadow: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      input:focus, textarea:focus, select:focus, [contenteditable="true"]:focus {
        border: none !important;
        border-width: 0 !important;
        outline: none !important;
        outline-style: none !important;
        outline-width: 0 !important;
        box-shadow: none !important;
      }

      /* 2. React Native Web inner wrapper divs par koi border/shadow nahi */
      [data-focusable="true"],
      div:has(> input),
      div:has(> textarea) {
        outline: none !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  const observer = new MutationObserver(() => {
    document.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
      if (el.contains(document.activeElement)) {
        el.removeAttribute('aria-hidden');
      }
    });
  });
  observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['aria-hidden'] });
}

// Debug-only: production APK me console.error ko wrap/log nahi karte (startup + runtime dono halka rehta hai)
if (__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Text strings must be rendered')) {
      console.log('\n🔴🔴🔴 TEXT ERROR CAUGHT! 🔴🔴🔴');
      console.log('ARG1:', args[1]);
      console.log('ARG2:', args[2]);
      console.log('ARG3:', JSON.stringify(args[3]));
    }
    originalConsoleError(...args);
  };
}

// ✅ SPEED: Android/iOS par icon fonts (Ionicons, FontAwesome, ...) app.json ke
// "expo-font" plugin se APK ke andar hi embedded hain — unhe runtime par dobara
// load karke splash rokne ki zarurat nahi.
// Web par sirf CRITICAL icon fonts (Ionicons + Feather) ko startup me load karo,
// baaki secondary fonts background me load hote hain bina render roke.
const ICON_FONTS = Platform.OS === 'web'
  ? {
      'Ionicons': require('./public/fonts/Ionicons.ttf'),
      'Feather':  require('./public/fonts/Feather.ttf'),
    }
  : {};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ...ICON_FONTS,
    Roboto: Roboto_400Regular,
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
    'Roboto-Black': Roboto_900Black,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // ✅ Non-blocking background loader for secondary icon fonts on web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const timer = setTimeout(() => {
      import('expo-font').then((Font) => {
        Font.loadAsync({
          'MaterialIcons':          require('./public/fonts/MaterialIcons.ttf'),
          'FontAwesome':            require('./public/fonts/FontAwesome.ttf'),
          'FontAwesome5_Regular':   require('./public/fonts/FontAwesome5_Regular.ttf'),
          'FontAwesome5_Solid':     require('./public/fonts/FontAwesome5_Solid.ttf'),
          'FontAwesome5_Brands':    require('./public/fonts/FontAwesome5_Brands.ttf'),
          'MaterialCommunityIcons': require('./public/fonts/MaterialCommunityIcons.ttf'),
          'AntDesign':              require('./public/fonts/AntDesign.ttf'),
        }).catch(() => {});
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return; // expo-navigation-bar sirf Android par kaam karta hai
    NavigationBar.setBackgroundColorAsync('#b91c1c');
    NavigationBar.setButtonStyleAsync('light');
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlHeight = document.documentElement.style.height;
    const originalBodyHeight = document.body.style.height;

    try {
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
      document.body.style.width = '100%';

      if (isMobileWebDevice()) {
        document.body.style.overflow = 'auto';
        document.body.style.position = 'static';
      } else {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
      }
    } catch {}
    return () => {
      try {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.width = originalBodyWidth;
        document.documentElement.style.height = originalHtmlHeight;
        document.body.style.height = originalBodyHeight;
      } catch {}
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <ErrorBoundary>
            <ToastProvider>
              {/* ✅ Push notifications: login par token register + foreground/tap handling */}
              <PushNotificationBootstrap />
              <AppNavigator />
            </ToastProvider>
          </ErrorBoundary>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}