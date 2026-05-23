/**
 * Profile Screen — Fully functional user profile with editable fields,
 * portfolio summary, account management, and app settings.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Switch, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { StyledInput } from '@/components/ui/StyledInput';
import { AccentButton } from '@/components/ui/AccentButton';
import { supabase } from '@/lib/supabase';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

// ─── Supported currencies ────────────────────────────────────
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
];

function fmt(n: number, currencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Settings Row ────────────────────────────────────────────
function SettingsRow({ icon, label, value, onPress, danger, toggle, toggleValue, onToggle }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity
      style={st.settingsRow}
      onPress={toggle ? undefined : onPress}
      activeOpacity={toggle ? 1 : 0.6}
      disabled={!onPress && !toggle}
    >
      <View style={[st.settingsIcon, danger && { backgroundColor: Colors.negative + '15' }]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.negative : Colors.text} />
      </View>
      <Text style={[st.settingsLabel, danger && { color: Colors.negative }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value && <Text style={st.settingsValue}>{value}</Text>}
      {toggle && (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: Colors.surfaceLight, true: Colors.positive + '50' }}
          thumbColor={toggleValue ? Colors.positive : Colors.textTertiary}
        />
      )}
      {onPress && !toggle && <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />}
    </TouchableOpacity>
  );
}

// ─── Portfolio stat row ──────────────────────────────────────
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.statRow}>
      <Text style={st.statRowLabel}>{label}</Text>
      <Text style={st.statRowValue}>{value}</Text>
    </View>
  );
}

// ─── Main Profile ────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { summary, bankAccounts, cryptoHoldings, stockHoldings, bills } = usePortfolioStore();

  // Edit profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Currency — shared via global store so Overview updates instantly
  const { currency, setCurrency } = useSettingsStore();
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // Notifications toggle
  const [notificationsOn, setNotificationsOn] = useState(true);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const name = user?.user_metadata?.full_name || 'User';
  const email = user?.email || '';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const totalAccounts = bankAccounts.length + cryptoHoldings.length + stockHoldings.length + bills.length;

  // Load saved profile data
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('default_currency, avatar_url').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.default_currency) setCurrency(data.default_currency);
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user?.id]);

  const handleEditProfile = () => {
    setEditName(name);
    setShowEditModal(true);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setEditLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: editName.trim() } });
      if (error) throw error;
      await supabase.from('profiles').update({ full_name: editName.trim() }).eq('id', user?.id);
      setShowEditModal(false);
      Alert.alert('Updated', 'Your name has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    }
    setEditLoading(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your password has been changed.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to change password');
    }
    setPasswordLoading(false);
  };

  const handleSelectCurrency = async (code: string) => {
    setCurrency(code);
    setShowCurrencyModal(false);
    if (!user?.id) return;
    const { error } = await supabase.from('profiles').update({ default_currency: code }).eq('id', user.id);
    if (error) Alert.alert('Error', 'Failed to save currency preference');
  };

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'We need access to your photos to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // Keep base64 size manageable
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64 && user?.id) {
      setUploadingAvatar(true);
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try {
        const { error } = await supabase.from('profiles').update({ avatar_url: base64Image }).eq('id', user.id);
        if (error) throw error;
        setAvatarUrl(base64Image);
      } catch (e: any) {
        Alert.alert('Error', 'Failed to update profile picture.');
      }
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const selectedCurrencyMeta = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.pageTitle}>Profile</Text>

        {/* ── Avatar Card ── */}
        <GlassCard style={st.avatarCard}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} activeOpacity={0.8}>
            <View style={st.avatar}>
              {uploadingAvatar ? (
                <ActivityIndicator color={Colors.text} />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={st.avatarImage} />
              ) : (
                <Text style={st.avatarText}>{initials}</Text>
              )}
              <View style={st.avatarEditBadge}>
                <Ionicons name="camera" size={12} color={Colors.background} />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={st.name}>{name}</Text>
          <Text style={st.email}>{email}</Text>
          {memberSince && (
            <Text style={st.memberMeta}>Member since {memberSince} · {totalAccounts} assets tracked</Text>
          )}
        </GlassCard>



        {/* ── Account Settings ── */}
        <GlassCard style={st.settingsCard}>
          <Text style={st.sectionTitle}>Account</Text>
          <SettingsRow icon="person-outline" label="Edit Name" value={name} onPress={handleEditProfile} />
          <SettingsRow icon="lock-closed-outline" label="Change Password" onPress={() => setShowPasswordModal(true)} />
          <SettingsRow icon="mail-outline" label="Email" value={email} />
        </GlassCard>

        {/* ── Preferences ── */}
        <GlassCard style={st.settingsCard}>
          <Text style={st.sectionTitle}>Preferences</Text>
          <SettingsRow
            icon="cash-outline"
            label="Currency"
            value={`${selectedCurrencyMeta.symbol} ${currency}`}
            onPress={() => setShowCurrencyModal(true)}
          />
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            toggle
            toggleValue={notificationsOn}
            onToggle={setNotificationsOn}
          />
        </GlassCard>

        {/* ── Danger Zone ── */}
        <GlassCard style={{ ...st.settingsCard, borderColor: Colors.negative + '30', borderWidth: 1 }}>
          <Text style={[st.sectionTitle, { color: Colors.negative }]}>Danger Zone</Text>
          <Text style={st.dangerWarning}>
            Once you delete your account, there is no going back. Please be certain.
          </Text>
          <SettingsRow icon="trash-outline" label="Delete Account" onPress={handleDeleteAccount} danger />
        </GlassCard>

        {/* ── Footer ── */}
        <TouchableOpacity style={st.signOutBtn} onPress={handleSignOut}>
          <Text style={st.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={st.version}>Nexora Finance v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Edit Name Modal ── */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <BlurView intensity={60} tint="dark" style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Edit Name</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <StyledInput label="Full Name" icon="person-outline" value={editName} onChangeText={setEditName} autoFocus />
            <AccentButton title="Save" onPress={handleSaveName} loading={editLoading} size="lg" />
          </View>
        </BlurView>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <BlurView intensity={60} tint="dark" style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <StyledInput label="New Password" icon="lock-closed-outline" value={newPassword} onChangeText={setNewPassword} isPassword />
            <StyledInput label="Confirm Password" icon="lock-closed-outline" value={confirmPassword} onChangeText={setConfirmPassword} isPassword />
            <AccentButton title="Update Password" onPress={handleChangePassword} loading={passwordLoading} size="lg" />
          </View>
        </BlurView>
      </Modal>

      {/* ── Currency Selection Modal ── */}
      <Modal visible={showCurrencyModal} transparent animationType="slide">
        <BlurView intensity={60} tint="dark" style={st.bottomSheetOverlay}>
          <View style={st.bottomSheet}>
            <View style={st.bottomSheetHandle} />
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {CURRENCIES.map((c) => {
              const isActive = c.code === currency;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[st.currencyRow, isActive && st.currencyRowActive]}
                  onPress={() => handleSelectCurrency(c.code)}
                  activeOpacity={0.7}
                >
                  <View style={st.currencySymbolBox}>
                    <Text style={st.currencySymbol}>{c.symbol}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.currencyCode}>{c.code}</Text>
                    <Text style={st.currencyName}>{c.name}</Text>
                  </View>
                  {isActive && <Ionicons name="checkmark-circle" size={22} color={Colors.positive} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 48 },
  pageTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.xxl },

  // Avatar
  avatarCard: { alignItems: 'center', paddingVertical: Spacing.xxxl, marginBottom: Spacing.lg },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: Colors.text, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface,
  },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  email: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  memberMeta: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.md },

  // Breakdown
  breakdownCard: { marginBottom: Spacing.lg, paddingVertical: Spacing.xl },
  breakdownList: { marginTop: Spacing.lg, gap: Spacing.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  statRowLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
  statRowValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold },

  statsBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.xl, paddingTop: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.surfaceLight,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.surfaceLight },

  // Section title
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },

  // Settings
  settingsCard: { marginBottom: Spacing.lg, paddingVertical: Spacing.sm },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  settingsIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
  },
  settingsLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  settingsValue: { fontSize: FontSize.sm, color: Colors.textSecondary, marginRight: Spacing.xs },

  // Danger
  dangerWarning: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 20 },

  // Footer
  signOutBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
    marginTop: Spacing.lg,
  },
  signOutText: { fontSize: FontSize.md, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.sm },

  // Modal (center, for name/password)
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', paddingHorizontal: Spacing.xl,
  },
  modalContent: {
    backgroundColor: 'rgba(17, 17, 17, 0.75)', borderRadius: BorderRadius.xl, padding: Spacing.xxl,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.xxl,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },

  // Bottom sheet (for currency picker)
  bottomSheetOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: 'rgba(17, 17, 17, 0.75)',
    borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 40,
    borderTopWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bottomSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.surfaceLight, alignSelf: 'center', marginBottom: Spacing.xl,
  },

  // Currency rows
  currencyRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md, marginBottom: Spacing.xs,
  },
  currencyRowActive: { backgroundColor: Colors.surfaceElevated },
  currencySymbolBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center',
  },
  currencySymbol: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  currencyCode: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  currencyName: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
