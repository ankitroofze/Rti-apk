import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Linking, Platform, Pressable } from 'react-native';

type Props = Omit<ComponentProps<typeof Pressable>, 'onPress'> & { href: string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      accessibilityRole="link"
      onPress={async () => {
        if (Platform.OS === 'web') {
          await Linking.openURL(href);
          return;
        }

        await openBrowserAsync(href, {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });
      }}
    />
  );
}
