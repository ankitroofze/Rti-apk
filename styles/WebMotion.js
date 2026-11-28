import React from 'react';
import { Platform, View } from 'react-native';

const motionCss = `
  @media (prefers-reduced-motion: no-preference) {
    @keyframes rti-page-enter {
      from { opacity: 0.8; }
      to { opacity: 1; }
    }

    [data-rti-page] {
      animation: rti-page-enter 180ms ease-out;
    }

    [data-rti-product-card] {
      transition-property: opacity, translate, box-shadow;
      /* TouchableOpacity sets its opacity duration inline. */
      transition-duration: 250ms, 180ms, 180ms !important;
      transition-timing-function: ease-out;
    }

    :where([data-rti-page] :is(button, a[href], [role="button"]):not(:disabled, [aria-disabled="true"])) {
      transition: background-color 150ms ease-out, color 150ms ease-out, filter 150ms ease-out;
    }

    @media (hover: hover) and (pointer: fine) {
      :where([data-rti-page] :is(button, a[href], [role="button"]):not(:disabled, [aria-disabled="true"])):hover {
        filter: brightness(0.96);
      }

      [data-rti-product-card]:hover {
        translate: 0 -3px;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.14);
      }
    }

    [data-rti-product-card]:active {
      translate: 0 0;
      transition-duration: 0ms, 180ms, 180ms !important;
    }
  }
`;

export function WebMotionStyles() {
  return Platform.OS === 'web' ? <style>{motionCss}</style> : null;
}

export function webScreenLayout({ children }) {
  return <View dataSet={{ rtiPage: '' }} style={{ flex: 1 }}>{children}</View>;
}
