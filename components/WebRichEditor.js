import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

const WebRichEditor = forwardRef(function WebRichEditor(
  { value = '', onChange, placeholder = '', style },
  ref
) {
  const inputRef = useRef(null);
  const [text, setText] = useState(value || '');

  useEffect(() => {
    setText(value || '');
  }, [value]);

  const updateText = (nextValue) => {
    setText(nextValue);
    if (onChange) onChange(nextValue);
  };

  useImperativeHandle(ref, () => ({
    setContentHTML: (nextValue = '') => {
      const normalized = typeof nextValue === 'string' ? nextValue : '';
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
