import React, { useEffect, useState } from 'react';
import { Image, Platform, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { isIdbMediaUri, resolveIdbMediaUriToObjectUrl } from '../utils/webMediaStore';

function normalizeUri(value) {
  const uri = String(value || '').trim();
  if (!uri || uri === 'null' || uri === 'undefined') return '';
  return uri;
}

export default function ProfileAvatar({
  uri,
  size = 40,
  style,
  imageStyle,
  placeholderStyle,
  iconSize,
  iconColor = '#94a3b8',
  backgroundColor = '#f8fafc',
  borderWidth = 0,
  borderColor = 'transparent',
  resizeMode = 'cover',
  onError,
}) {
  const rawUri = normalizeUri(uri);
  const [resolvedUri, setResolvedUri] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let objectUrl = null;

    setFailed(false);

    if (!rawUri) {
      setResolvedUri(null);
      return () => {
        alive = false;
      };
    }

    if (Platform.OS === 'web' && isIdbMediaUri(rawUri)) {
      resolveIdbMediaUriToObjectUrl(rawUri)
        .then((next) => {
          if (!alive) { if (next) { try { URL.revokeObjectURL(next); } catch {} } return; }
          objectUrl = next;
          setResolvedUri(next || null);
        })
        .catch(() => {
          if (alive) setResolvedUri(null);
        });
    } else {
      setResolvedUri(rawUri);
    }

    return () => {
      alive = false;
      try {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      } catch {}
    };
  }, [rawUri]);

  const baseStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
    borderWidth,
    borderColor,
  };

  if (resolvedUri && !failed) {
    return (
      <Image
        source={{ uri: resolvedUri }}
        style={[baseStyle, style, imageStyle]}
        resizeMode={resizeMode}
        onError={(event) => {
          setFailed(true);
          onError?.(event);
        }}
      />
    );
  }

  return (
    <View style={[baseStyle, style, placeholderStyle]}>
      <Feather name="user" size={iconSize || Math.max(14, Math.round(size * 0.45))} color={iconColor} />
    </View>
  );
}