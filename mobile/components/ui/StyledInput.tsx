/**
 * StyledInput — Dark-themed text input with clean placeholder label
 * No floating animation — simple, clean approach matching monochrome design
 */
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface StyledInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function StyledInput({
  label,
  error,
  icon,
  isPassword,
  value,
  onFocus,
  onBlur,
  placeholder,
  ...props
}: StyledInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: any) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          focused && styles.focused,
          error && styles.errorBorder,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? Colors.text : Colors.textTertiary}
            style={styles.icon}
          />
        )}
        <TextInput
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          placeholder={label}
          placeholderTextColor={Colors.textTertiary}
          style={styles.input}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  focused: {
    backgroundColor: Colors.surfaceLight,
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: Colors.negative,
  },
  icon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  eyeIcon: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.negative,
    marginTop: Spacing.xs,
    marginLeft: Spacing.lg,
  },
});
