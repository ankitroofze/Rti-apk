import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

// Web par ye plain TextInput hai, isliye HTML (<div>..</div>, <br/>, &amp; ...) ko seedha plain text banakar dikhate hain.
// Warna edit karte waqt field me tags dikhte the.
const htmlToDisplayText = (html) => {
  const str = String(html || '');
  if (!/<[a-z!/][^>]*>|&(nbsp|amp|lt|gt|quot|#39);/i.test(str)) return str;
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|h[1-6])>\s*<(div|p|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .trim();
};

const WebRichEditor = forwardRef(function WebRichEditor(
  { value = '', initialHtml = '', onChange, placeholder = '', style },
  ref
) {
  const inputRef = useRef(null);
  const [text, setText] = useState(htmlToDisplayText(value || initialHtml || ''));

  useEffect(() => {
    if (value) setText(htmlToDisplayText(value));
  }, [value]);

  const updateText = (nextValue) => {
    setText(nextValue);
    if (onChange) onChange(nextValue);
  };

  useImperativeHandle(ref, () => ({
    setContentHTML: (nextValue = '') => {
      const normalized = typeof nextValue === 'string' ? htmlToDisplayText(nextValue) : '';
      updateText(normalized);
    },
    getContentHtml: () => text,
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  return (
    <View style={styles.wrap}>
      <TextInput
        ref={inputRef}
        style={[styles.input, style]}
        multiline
        value={text}
        onChangeText={updateText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        textAlignVertical="top"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  input: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
  },
});

export default WebRichEditor;