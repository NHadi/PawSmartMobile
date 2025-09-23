import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'CancelOrder'>;
type RouteProps = RouteProp<ProfileStackParamList, 'CancelOrder'>;

interface CancelReason {
  id: string;
  label: string;
}

const cancelReasons: CancelReason[] = [
  { id: '1', label: 'Salah memilih produk' },
  { id: '2', label: 'Perubahan rencana / tidak jadi beli' },
  { id: '3', label: 'Ingin mengubah metode pembayaran' },
  { id: '4', label: 'Menemukan harga yang lebih murah' },
  { id: '5', label: 'Lainnya' },
];

export default function CancelOrderScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { orderId } = route.params;

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  const handleSubmitCancellation = () => {
    // In a real app, you would submit the cancellation request
    // Navigate back to order history or show success message
    navigation.navigate('OrderHistory');
  };

  const isFormValid = selectedReason !== '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancel Pesanan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form Title and Description */}
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Form Cancel Pemesanan</Text>
          <Text style={styles.formDescription}>
            Pembatalan pesanan membutuhkan beberapa informasi tambahan untuk proses verifikasi dan pencatatan. Mohon lengkapi data di bawah ini dengan benar.
          </Text>
        </View>

        {/* Cancel Reasons */}
        <View style={styles.reasonSection}>
          <Text style={styles.sectionTitle}>Alasan Pembatalan</Text>
          
          <View style={styles.reasonsList}>
            {cancelReasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={styles.reasonOption}
                onPress={() => setSelectedReason(reason.id)}
              >
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radioButton,
                      selectedReason === reason.id && styles.radioButtonSelected,
                    ]}
                  >
                    {selectedReason === reason.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
                <Text style={styles.reasonLabel}>{reason.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Catatan tambahan</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="berikan catatan tambahan"
            placeholderTextColor={Colors.text.tertiary}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Process Information */}
        <View style={styles.processSection}>
          <Text style={styles.processTitle}>Proses Pengembalian</Text>
          <Text style={styles.processDescription}>
            Refund akan dikembalikan ke rekening bank, dan membutuhkan waktu sekitar 1-3 hari kerja.
          </Text>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            Dengan klik "Submit Form" saya telah menyetujui{' '}
            <Text style={styles.termsLink}>Syarat & Ketentuan Cancel pesanan</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            !isFormValid && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitCancellation}
          disabled={!isFormValid}
        >
          <Text style={[
            styles.submitButtonText,
            !isFormValid && styles.submitButtonTextDisabled,
          ]}>
            Submit Form
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },
  formHeader: {
    marginBottom: Spacing.xl,
  },
  formTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  formDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  reasonSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  reasonsList: {
    gap: Spacing.base,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
  },
  radioContainer: {
    marginRight: Spacing.md,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary.main,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary.main,
  },
  reasonLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    flex: 1,
  },
  notesSection: {
    marginBottom: Spacing.xl,
  },
  notesInput: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    minHeight: 100,
  },
  processSection: {
    marginBottom: Spacing.xl,
  },
  processTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  processDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  termsSection: {
    marginBottom: Spacing.xl,
  },
  termsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  termsLink: {
    color: Colors.primary.main,
    textDecorationLine: 'underline',
  },
  submitContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  submitButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.background.tertiary,
  },
  submitButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  submitButtonTextDisabled: {
    color: Colors.text.tertiary,
  },
});