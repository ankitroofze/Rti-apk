// components/PriceRangeSlider.js
// Dual-thumb "line type" price range slider — web + Android + iOS (sirf PanResponder, koi extra package nahi).
//
//  <PriceRangeSlider min={0} max={10000} step={100} low={0} high={10000} onChange={(lo, hi) => ...} />
//
//  Thumbs ko drag karo: left = minimum price, right = maximum price.
import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, StyleSheet, TextInput, View } from 'react-native';
import Text from './RobotoText';

const THUMB = 22;      // thumb ka dikhne wala size
const HIT = 36;        // thumb ka touch area (bada, taaki pakadna aasan ho)
const TRACK_H = 5;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const formatRupees = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

// Typed price box: tap karke apni price likh sakte ho (sirf numbers).
// Likhte waqt slider live move hota hai; blur / Enter par value min..max ke andar fix ho jaati hai.
function PriceBox({ value, suffix = '', label, onLive, onCommit }) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState('');
  const shown = focused ? text : `${formatRupees(value)}${suffix}`;
  return (
    <View style={styles.pill}>
      <TextInput
        value={shown}
        onFocus={() => { setText(String(Math.round(Number(value) || 0))); setFocused(true); }}
        onChangeText={(t) => {
          const digits = String(t).replace(/[^0-9]/g, '').slice(0, 9);
          setText(digits);
          onLive?.(digits === '' ? null : Number(digits));
        }}
        onBlur={() => { setFocused(false); onCommit?.(text === '' ? null : Number(text)); }}
        onSubmitEditing={() => { setFocused(false); onCommit?.(text === '' ? null : Number(text)); }}
        keyboardType="number-pad"
        inputMode="numeric"
        returnKeyType="done"
        selectTextOnFocus
        accessibilityLabel={label}
        placeholder="0"
        placeholderTextColor="#94a3b8"
        style={styles.pillInput}
      />
    </View>
  );
}

export default function PriceRangeSlider({
  min = 0,
  max = 10000,
  step = 100,
  low,
  high,
  onChange,
  activeColor = '#dc2626',
  trackColor = '#e2e8f0',
  showLabels = true,
}) {
  const lo = clamp(Number.isFinite(low) ? low : min, min, max);
  const hi = clamp(Number.isFinite(high) ? high : max, min, max);

  const [trackW, setTrackW] = useState(0);

  // PanResponder sirf ek baar banta hai, isliye latest values refs me rakhte hain
  const live = useRef({});
  live.current = { min, max, step, lo, hi, trackW, onChange };
  const startRef = useRef({ lo: 0, hi: 0 });

  const snap = (v) => {
    const { min: mn, max: mx, step: st } = live.current;
    const snapped = Math.round((v - mn) / st) * st + mn;
    return clamp(snapped, mn, mx);
  };

  const makeResponder = (which) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startRef.current = { lo: live.current.lo, hi: live.current.hi };
      },
      onPanResponderMove: (_e, g) => {
        const { min: mn, max: mx, step: st, trackW: w, onChange: cb } = live.current;
        if (!w || !cb) return;
        const delta = (g.dx / w) * (mx - mn);
        if (which === 'low') {
          const next = clamp(snap(startRef.current.lo + delta), mn, live.current.hi - st);
          if (next !== live.current.lo) cb(next, live.current.hi);
        } else {
          const next = clamp(snap(startRef.current.hi + delta), live.current.lo + st, mx);
          if (next !== live.current.hi) cb(live.current.lo, next);
        }
      },
    });

  const lowResponder = useMemo(() => makeResponder('low'), []); // eslint-disable-line react-hooks/exhaustive-deps
  const highResponder = useMemo(() => makeResponder('high'), []); // eslint-disable-line react-hooks/exhaustive-deps

  const range = Math.max(1, max - min);
  const pos = (v) => ((v - min) / range) * trackW;
  const lowX = pos(lo);
  const highX = pos(hi);

  const webTouch = Platform.OS === 'web' ? { touchAction: 'none', userSelect: 'none', cursor: 'grab' } : null;

  return (
    <View>
      {showLabels ? (
        <View style={styles.labelRow}>
          <PriceBox
            value={lo}
            label="Minimum price"
            onLive={(n) => { if (n !== null && n <= hi && onChange) onChange(clamp(n, min, max), hi); }}
            onCommit={(n) => { if (onChange) onChange(clamp(n === null ? min : n, min, hi), hi); }}
          />
          <Text style={styles.dash}>–</Text>
          <PriceBox
            value={hi}
            suffix={hi >= max ? '+' : ''}
            label="Maximum price"
            onLive={(n) => { if (n !== null && n >= lo && onChange) onChange(lo, clamp(n, min, max)); }}
            onCommit={(n) => { if (onChange) onChange(lo, clamp(n === null ? max : n, lo, max)); }}
          />
        </View>
      ) : null}

      <View
        style={styles.sliderArea}
        onLayout={(e) => setTrackW(Math.max(0, e.nativeEvent.layout.width - THUMB))}
      >
        {/* grey line */}
        <View style={[styles.track, { backgroundColor: trackColor }]} />
        {/* selected (coloured) part of the line */}
        <View style={[styles.trackActive, { backgroundColor: activeColor, left: THUMB / 2 + lowX, width: Math.max(0, highX - lowX) }]} />

        {/* thumbs */}
        <View
          {...lowResponder.panHandlers}
          style={[styles.hit, { left: THUMB / 2 + lowX - HIT / 2 }, webTouch]}
          accessibilityRole="adjustable"
          accessibilityLabel="Minimum price"
        >
          <View style={[styles.thumb, { borderColor: activeColor }]} />
        </View>
        <View
          {...highResponder.panHandlers}
          style={[styles.hit, { left: THUMB / 2 + highX - HIT / 2 }, webTouch]}
          accessibilityRole="adjustable"
          accessibilityLabel="Maximum price"
        >
          <View style={[styles.thumb, { borderColor: activeColor }]} />
        </View>
      </View>

      <View style={styles.edgeRow}>
        <Text style={styles.edgeText}>{formatRupees(min)}</Text>
        <Text style={styles.edgeText}>{formatRupees(max)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  pill: {
    flex: 1, alignItems: 'center', borderRadius: 8,
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
  },
  pillInput: {
    width: '100%', textAlign: 'center', paddingVertical: 7, paddingHorizontal: 6,
    fontSize: 13, fontWeight: '500', color: '#0f172a',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0, backgroundColor: 'transparent' } : null),
  },
  pillText: { fontSize: 13, fontWeight: '500', color: '#0f172a' },
  dash: { color: '#94a3b8', fontSize: 14 },
  sliderArea: { height: HIT, justifyContent: 'center' },
  track: {
    position: 'absolute', left: THUMB / 2, right: THUMB / 2,
    height: TRACK_H, borderRadius: TRACK_H / 2, top: (HIT - TRACK_H) / 2,
  },
  trackActive: {
    position: 'absolute',
    height: TRACK_H, borderRadius: TRACK_H / 2, top: (HIT - TRACK_H) / 2,
  },
  hit: { position: 'absolute', top: 0, width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
  thumb: {
    width: THUMB, height: THUMB, borderRadius: THUMB / 2,
    backgroundColor: '#ffffff', borderWidth: 3,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 4px rgba(15,23,42,0.3)' }
      : { elevation: 3, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }),
  },
  edgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 0 },
  edgeText: { fontSize: 11.5, color: '#94a3b8' },
});