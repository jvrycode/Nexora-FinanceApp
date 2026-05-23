/**
 * Add Asset Modal — Add bank accounts, crypto, stocks, or bills
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { StyledInput } from '@/components/ui/StyledInput';
import { CoinPicker, CoinOption } from '@/components/ui/CoinPicker';
import { AccentButton } from '@/components/ui/AccentButton';
import { AssetCategory } from '@/types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

const CATEGORIES: { key: AssetCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'bank', label: 'Bank', icon: 'business-outline', color: Colors.text },
  { key: 'crypto', label: 'Crypto', icon: 'logo-bitcoin', color: Colors.text },
  { key: 'stock', label: 'Stock', icon: 'stats-chart-outline', color: Colors.text },
  { key: 'bill', label: 'Bill', icon: 'receipt-outline', color: Colors.textSecondary },
];

export default function AddAssetScreen() {
  const { category: initialCat } = useLocalSearchParams<{ category: string }>();
  const { user } = useAuth();
  const store = usePortfolioStore();
  const [category, setCategory] = useState<AssetCategory>((initialCat as AssetCategory) || 'bank');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [balance, setBalance] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<CoinOption | null>(null);
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [stockSymbol, setStockSymbol] = useState('');
  const [stockName, setStockName] = useState('');
  const [shares, setShares] = useState('');
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'one-time'>('monthly');

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      switch (category) {
        case 'bank':
          if (!bankName || !balance) throw new Error('Fill in bank name and balance');
          await store.addBankAccount(user.id, { bank_name: bankName, account_name: accountName || bankName, balance: parseFloat(balance) });
          break;
        case 'crypto':
          if (!selectedCoin?.name || !quantity) throw new Error('Select a coin and enter quantity');
          await store.addCryptoHolding(user.id, { coin_id: selectedCoin.coinId, symbol: selectedCoin.symbol, name: selectedCoin.name, quantity: parseFloat(quantity), purchase_price: purchasePrice ? parseFloat(purchasePrice) : null });
          break;
        case 'stock':
          if (!stockSymbol || !shares) throw new Error('Fill in stock symbol and shares');
          await store.addStockHolding(user.id, { symbol: stockSymbol.toUpperCase(), name: stockName || stockSymbol.toUpperCase(), shares: parseFloat(shares), purchase_price: purchasePrice ? parseFloat(purchasePrice) : null });
          break;
        case 'bill':
          if (!billName || !billAmount) throw new Error('Fill in bill name and amount');
          await store.addBill(user.id, { name: billName, amount: parseFloat(billAmount), frequency, is_liability: true });
          break;
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add asset');
    }
    setLoading(false);
  };

  const FREQ_OPTIONS: { key: 'monthly' | 'yearly' | 'one-time'; label: string }[] = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'one-time', label: 'One-time' },
  ];

  return (
    <SafeAreaView style={st.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={st.header}>
            <TouchableOpacity onPress={() => router.back()} style={st.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={st.title}>Add Asset</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Category Selector */}
          <View style={st.categories}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[st.catBtn, category === c.key && st.catBtnActive]}
                onPress={() => setCategory(c.key)}
              >
                <View style={[st.catIcon, { backgroundColor: c.color + '15' }, category === c.key && { backgroundColor: c.color + '30' }]}>
                  <Ionicons name={c.icon} size={20} color={c.color} />
                </View>
                <Text style={[st.catLabel, category === c.key && st.catLabelActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form Fields per category */}
          <View style={st.form}>
            {category === 'bank' && (
              <>
                <StyledInput label="Bank Name" icon="business-outline" value={bankName} onChangeText={setBankName} placeholder="e.g. Chase, BPI" />
                <StyledInput label="Account Name" icon="card-outline" value={accountName} onChangeText={setAccountName} placeholder="e.g. Savings, Checking" />
                <StyledInput label="Balance" icon="cash-outline" value={balance} onChangeText={setBalance} keyboardType="decimal-pad" placeholder="0.00" />
              </>
            )}
            {category === 'crypto' && (
              <>
                <CoinPicker selected={selectedCoin} onSelect={setSelectedCoin} />
                <StyledInput label="Quantity" icon="layers-outline" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholder="0.00" />
                <StyledInput label="Purchase Price (USD)" icon="cash-outline" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" placeholder="Optional" />
              </>
            )}
            {category === 'stock' && (
              <>
                <StyledInput label="Stock Symbol" icon="stats-chart-outline" value={stockSymbol} onChangeText={setStockSymbol} placeholder="e.g. AAPL" autoCapitalize="characters" />
                <StyledInput label="Company Name" icon="business-outline" value={stockName} onChangeText={setStockName} placeholder="e.g. Apple Inc." />
                <StyledInput label="Number of Shares" icon="layers-outline" value={shares} onChangeText={setShares} keyboardType="decimal-pad" placeholder="0" />
                <StyledInput label="Purchase Price (USD)" icon="cash-outline" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" placeholder="Optional" />
              </>
            )}
            {category === 'bill' && (
              <>
                <StyledInput label="Bill Name" icon="receipt-outline" value={billName} onChangeText={setBillName} placeholder="e.g. Netflix, Rent" />
                <StyledInput label="Amount" icon="cash-outline" value={billAmount} onChangeText={setBillAmount} keyboardType="decimal-pad" placeholder="0.00" />
                <Text style={st.freqLabel}>Frequency</Text>
                <View style={st.freqRow}>
                  {FREQ_OPTIONS.map((f) => (
                    <TouchableOpacity key={f.key} style={[st.freqBtn, frequency === f.key && st.freqBtnActive]} onPress={() => setFrequency(f.key)}>
                      <Text style={[st.freqText, frequency === f.key && st.freqTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          <AccentButton title="Save" onPress={handleSave} loading={loading} size="lg" style={st.saveBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xxl },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  categories: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xxl },
  catBtn: { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  catBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '08' },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  catLabelActive: { color: Colors.accent },
  form: { marginBottom: Spacing.xxl },
  freqLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  freqRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  freqBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  freqBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
  freqText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  freqTextActive: { color: Colors.accent },
  saveBtn: { marginTop: Spacing.md },
});
