/**
 * Edit Asset — Edit or delete any existing asset
 * Pre-filled with current values, changes saved to Supabase
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { StyledInput } from '@/components/ui/StyledInput';
import { AccentButton } from '@/components/ui/AccentButton';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

type Category = 'bank' | 'crypto' | 'stock' | 'bill';

const TABLE_MAP: Record<Category, string> = {
  bank: 'bank_accounts',
  crypto: 'crypto_holdings',
  stock: 'stock_holdings',
  bill: 'bills',
};

export default function EditAssetScreen() {
  const { user } = useAuth();
  const store = usePortfolioStore();
  const params = useLocalSearchParams<{
    category: string;
    id: string;
    // Bank
    bank_name: string;
    account_name: string;
    balance: string;
    // Crypto
    coin_name: string;
    coin_id: string;
    coin_symbol: string;
    quantity: string;
    purchase_price: string;
    // Stock
    stock_symbol: string;
    stock_name: string;
    shares: string;
    // Bill
    bill_name: string;
    bill_amount: string;
    frequency: string;
  }>();

  const category = (params.category || 'bank') as Category;
  const assetId = params.id;

  const [loading, setLoading] = useState(false);

  // Bank fields
  const [bankName, setBankName] = useState(params.bank_name || '');
  const [accountName, setAccountName] = useState(params.account_name || '');
  const [balance, setBalance] = useState(params.balance || '');

  // Crypto fields
  const [coinName, setCoinName] = useState(params.coin_name || '');
  const [coinId, setCoinId] = useState(params.coin_id || '');
  const [coinSymbol, setCoinSymbol] = useState(params.coin_symbol || '');
  const [quantity, setQuantity] = useState(params.quantity || '');
  const [purchasePrice, setPurchasePrice] = useState(params.purchase_price || '');

  // Stock fields
  const [stockSymbol, setStockSymbol] = useState(params.stock_symbol || '');
  const [stockName, setStockName] = useState(params.stock_name || '');
  const [shares, setShares] = useState(params.shares || '');
  const [stockPurchasePrice, setStockPurchasePrice] = useState(params.purchase_price || '');

  // Bill fields
  const [billName, setBillName] = useState(params.bill_name || '');
  const [billAmount, setBillAmount] = useState(params.bill_amount || '');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'one-time'>(
    (params.frequency as any) || 'monthly'
  );

  const FREQ_OPTIONS: { key: 'monthly' | 'yearly' | 'one-time'; label: string }[] = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'one-time', label: 'One-time' },
  ];

  const categoryLabel: Record<Category, string> = {
    bank: 'Bank Account',
    crypto: 'Crypto',
    stock: 'Stock',
    bill: 'Bill',
  };

  const handleSave = async () => {
    if (!user?.id || !assetId) return;
    setLoading(true);
    try {
      switch (category) {
        case 'bank':
          if (!bankName || !balance) throw new Error('Bank name and balance are required');
          await store.updateBankAccount(user.id, assetId, {
            bank_name: bankName,
            account_name: accountName,
            balance: parseFloat(balance),
          });
          break;
        case 'crypto':
          if (!coinName || !quantity) throw new Error('Coin name and quantity are required');
          await store.updateCryptoHolding(user.id, assetId, {
            name: coinName,
            coin_id: coinId || coinName.toLowerCase(),
            symbol: coinSymbol,
            quantity: parseFloat(quantity),
            purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
          });
          break;
        case 'stock':
          if (!stockSymbol || !shares) throw new Error('Symbol and shares are required');
          await store.updateStockHolding(user.id, assetId, {
            symbol: stockSymbol.toUpperCase(),
            name: stockName || stockSymbol.toUpperCase(),
            shares: parseFloat(shares),
            purchase_price: stockPurchasePrice ? parseFloat(stockPurchasePrice) : undefined,
          });
          break;
        case 'bill':
          if (!billName || !billAmount) throw new Error('Bill name and amount are required');
          await store.updateBill(user.id, assetId, {
            name: billName,
            amount: parseFloat(billAmount),
            frequency,
          });
          break;
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save changes');
    }
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete',
      `Remove this ${categoryLabel[category]}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id || !assetId) return;
            setLoading(true);
            try {
              await store.deleteAsset(TABLE_MAP[category], assetId, user.id);
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={st.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={st.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={st.header}>
            <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={st.title}>Edit {categoryLabel[category]}</Text>
            <TouchableOpacity onPress={handleDelete} style={st.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color={Colors.negative} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={st.form}>
            {category === 'bank' && (
              <>
                <StyledInput
                  label="Bank Name"
                  icon="business-outline"
                  value={bankName}
                  onChangeText={setBankName}
                />
                <StyledInput
                  label="Account Name"
                  icon="card-outline"
                  value={accountName}
                  onChangeText={setAccountName}
                />
                <StyledInput
                  label="Balance (USD)"
                  icon="cash-outline"
                  value={balance}
                  onChangeText={setBalance}
                  keyboardType="decimal-pad"
                />
              </>
            )}

            {category === 'crypto' && (
              <>
                <StyledInput
                  label="Coin Name"
                  icon="logo-bitcoin"
                  value={coinName}
                  onChangeText={setCoinName}
                />
                <StyledInput
                  label="Coin ID (CoinGecko)"
                  icon="search-outline"
                  value={coinId}
                  onChangeText={setCoinId}
                  autoCapitalize="none"
                />
                <StyledInput
                  label="Symbol"
                  icon="pricetag-outline"
                  value={coinSymbol}
                  onChangeText={setCoinSymbol}
                  autoCapitalize="characters"
                />
                <StyledInput
                  label="Quantity"
                  icon="layers-outline"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                />
                <StyledInput
                  label="Purchase Price (USD)"
                  icon="cash-outline"
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  keyboardType="decimal-pad"
                />
              </>
            )}

            {category === 'stock' && (
              <>
                <StyledInput
                  label="Stock Symbol"
                  icon="stats-chart-outline"
                  value={stockSymbol}
                  onChangeText={setStockSymbol}
                  autoCapitalize="characters"
                />
                <StyledInput
                  label="Company Name"
                  icon="business-outline"
                  value={stockName}
                  onChangeText={setStockName}
                />
                <StyledInput
                  label="Number of Shares"
                  icon="layers-outline"
                  value={shares}
                  onChangeText={setShares}
                  keyboardType="decimal-pad"
                />
                <StyledInput
                  label="Purchase Price (USD)"
                  icon="cash-outline"
                  value={stockPurchasePrice}
                  onChangeText={setStockPurchasePrice}
                  keyboardType="decimal-pad"
                />
              </>
            )}

            {category === 'bill' && (
              <>
                <StyledInput
                  label="Bill Name"
                  icon="receipt-outline"
                  value={billName}
                  onChangeText={setBillName}
                />
                <StyledInput
                  label="Amount (USD)"
                  icon="cash-outline"
                  value={billAmount}
                  onChangeText={setBillAmount}
                  keyboardType="decimal-pad"
                />
                <Text style={st.freqLabel}>Frequency</Text>
                <View style={st.freqRow}>
                  {FREQ_OPTIONS.map((f) => (
                    <TouchableOpacity
                      key={f.key}
                      style={[st.freqBtn, frequency === f.key && st.freqBtnActive]}
                      onPress={() => setFrequency(f.key)}
                    >
                      <Text style={[st.freqText, frequency === f.key && st.freqTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          <AccentButton title="Save Changes" onPress={handleSave} loading={loading} size="lg" />

          <TouchableOpacity style={st.deleteRow} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.negative} />
            <Text style={st.deleteText}>Delete {categoryLabel[category]}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.xxxl,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.negative + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  form: { marginBottom: Spacing.xxl },
  freqLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  freqRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  freqBtn: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceElevated, alignItems: 'center',
  },
  freqBtnActive: { backgroundColor: Colors.text },
  freqText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  freqTextActive: { color: Colors.background, fontWeight: FontWeight.semibold },
  deleteRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.xl, paddingVertical: Spacing.lg,
  },
  deleteText: { fontSize: FontSize.md, color: Colors.negative, fontWeight: FontWeight.medium },
});
