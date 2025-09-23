import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';
import orderService from '../../services/order/orderService';
import QRCode from 'react-native-qrcode-svg';

type PaymentRouteProp = RouteProp<HomeStackParamList, 'PaymentProcess'>;
type NavigationProp = StackNavigationProp<HomeStackParamList, 'PaymentProcess'>;

interface PaymentMethod {
  id: string;
  name: string;
  type: 'ewallet' | 'qris' | 'va' | 'cod';
  icon?: any;
  phoneNumber?: string;
}

export default function PaymentProcessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentRouteProp>();
  
  const { orderId, orderName, totalAmount, paymentMethod } = route.params || {};
  
  const [timeRemaining, setTimeRemaining] = useState(24 * 60 * 60); // 24 hours in seconds
  const [showInstructions, setShowInstructions] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'checking' | 'success' | 'failed'>('waiting');
  const intervalRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Start countdown timer
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(intervalRef.current);
          handlePaymentTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate payment checking (in production, this would poll the payment gateway)
    const checkPaymentInterval = setInterval(() => {
      checkPaymentStatus();
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(checkPaymentInterval);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')} jam ${minutes
      .toString()
      .padStart(2, '0')} menit ${secs.toString().padStart(2, '0')} detik`;
  };

  const handlePaymentTimeout = () => {
    Alert.alert(
      'Waktu Pembayaran Habis',
      'Pesanan Anda telah dibatalkan karena melewati batas waktu pembayaran.',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home' as any, { screen: 'HomeScreen' }),
        },
      ]
    );
  };

  const checkPaymentStatus = async () => {
    // In production, this would check with the payment gateway
    // For demo, we'll randomly simulate success after some time
    if (Math.random() > 0.95) {
      setPaymentStatus('success');
      handlePaymentSuccess();
    }
  };

  const handlePaymentSuccess = () => {
    clearInterval(intervalRef.current);

    // Update order status in Odoo
    if (orderId) {
      orderService.updateOrderStatus(orderId, 'payment_confirmed').catch(() => {
        // Error updating order status
      });
    }

    navigation.replace('UniversalSuccess', {
      orderId,
      orderName,
      totalAmount: totalAmount || 0,
      transactionType: paymentMethod?.type === 'qris' ? 'QRIS' : paymentMethod?.name || 'E-Wallet',
      timestamp: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB',
    });
  };

  const handleCancel = () => {
    Alert.alert(
      'Batalkan Pembayaran?',
      'Apa kamu yakin untuk membatalkan pembayaran ini?',
      [
        {
          text: 'Tidak',
          style: 'cancel',
        },
        {
          text: 'Batalkan',
          style: 'destructive',
          onPress: async () => {
            try {
              if (orderId) {
                await orderService.cancelOrder(orderId);
              }
              navigation.navigate('Home' as any, { screen: 'HomeScreen' });
            } catch (error) {
              }
          },
        },
      ]
    );
  };

  const renderQRIS = () => (
    <View style={styles.paymentContent}>
      <View style={styles.qrContainer}>
        <QRCode
          value={`QRIS_PAYMENT_${orderName}_${totalAmount}`}
          size={250}
          backgroundColor="white"
          color="black"
        />
      </View>
      
      <Text style={styles.qrInstruction}>
        Proses verifikasi kurang dari 10 menit setelah pembayaran berhasil
      </Text>
      
      <TouchableOpacity 
        style={styles.instructionButton}
        onPress={() => setShowInstructions(true)}
      >
        <Text style={styles.instructionButtonText}>Petunjuk Pembayaran QRIS</Text>
        <MaterialIcons name="chevron-right" size={20} color={Colors.primary.main} />
      </TouchableOpacity>
    </View>
  );

  const renderEWallet = () => {
    const phoneNumber = paymentMethod?.phoneNumber || '+62 812345678XX';
    
    return (
      <View style={styles.paymentContent}>
        <View style={styles.ewalletContainer}>
          <Text style={styles.ewalletLabel}>No {paymentMethod?.name || 'Dana'}</Text>
          <View style={styles.phoneNumberBox}>
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
            <TouchableOpacity style={styles.copyButton}>
              <MaterialIcons name="content-copy" size={20} color={Colors.primary.main} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.ewalletNote}>
            Masukkan nomor HP dulu sebelum melakukan pembayaran ke Dana agar nomor tetap sama.
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.instructionButton}
          onPress={() => setShowInstructions(true)}
        >
          <Text style={styles.instructionButtonText}>
            Petunjuk Pembayaran {paymentMethod?.name || 'Dana'}
          </Text>
          <MaterialIcons name="chevron-right" size={20} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {paymentStatus === 'waiting' ? 'Menunggu Pembayaran' : 'Pembayaran'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Mohon bayar sebesar</Text>
          <Text style={styles.amountValue}>Rp {totalAmount?.toLocaleString('id-ID')}</Text>
          <Text style={styles.timerLabel}>sebelum {formatTime(timeRemaining)}.</Text>
        </View>

        <Text style={styles.infoText}>
          Lihat Pesanan Saya untuk informasi lebih lanjut
        </Text>

        {/* Payment Method Content */}
        {paymentMethod?.type === 'qris' ? renderQRIS() : renderEWallet()}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Batalkan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Activity' as any, {
              screen: 'MyOrders',
              params: { orderId: orderId?.toString() }
            })}
          >
            <Text style={styles.primaryButtonText}>Pesanan Saya</Text>
          </TouchableOpacity>
        </View>

        {/* Product Recommendations */}
        <View style={styles.recommendationSection}>
          <Text style={styles.recommendationTitle}>Mungkin kamu suka</Text>
          {/* Add product recommendations here */}
        </View>
      </ScrollView>

      {/* Instructions Modal */}
      <Modal
        visible={showInstructions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInstructions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Petunjuk Pembayaran {paymentMethod?.name || 'QRIS'}
              </Text>
              <TouchableOpacity onPress={() => setShowInstructions(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {paymentMethod?.type === 'qris' ? (
                <>
                  <Text style={styles.instructionStep}>1. Buka aplikasi e-wallet Anda</Text>
                  <Text style={styles.instructionStep}>2. Pilih menu Scan QR</Text>
                  <Text style={styles.instructionStep}>3. Scan kode QR yang ditampilkan</Text>
                  <Text style={styles.instructionStep}>4. Periksa detail pembayaran</Text>
                  <Text style={styles.instructionStep}>5. Konfirmasi pembayaran</Text>
                  <Text style={styles.instructionStep}>6. Simpan bukti pembayaran</Text>
                </>
              ) : (
                <>
                  <Text style={styles.instructionStep}>1. Buka aplikasi {paymentMethod?.name}</Text>
                  <Text style={styles.instructionStep}>2. Pilih menu Kirim/Transfer</Text>
                  <Text style={styles.instructionStep}>3. Masukkan nomor tujuan</Text>
                  <Text style={styles.instructionStep}>4. Masukkan jumlah pembayaran</Text>
                  <Text style={styles.instructionStep}>5. Konfirmasi pembayaran</Text>
                  <Text style={styles.instructionStep}>6. Simpan bukti pembayaran</Text>
                </>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  
  // Amount Section
  amountSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.background.secondary,
  },
  amountLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  amountValue: {
    fontSize: Typography.fontSize.xxxl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
    marginBottom: Spacing.sm,
  },
  timerLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error.main,
  },
  infoText: {
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  
  // Payment Content
  paymentContent: {
    padding: Spacing.base,
  },
  
  // QRIS
  qrContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  qrInstruction: {
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  
  // E-Wallet
  ewalletContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  ewalletLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  phoneNumberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  phoneNumber: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  copyButton: {
    padding: Spacing.xs,
  },
  ewalletNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    lineHeight: 18,
  },
  
  // Instructions
  instructionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  instructionButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
  },
  
  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.error.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.error.main,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  
  // Recommendations
  recommendationSection: {
    padding: Spacing.base,
  },
  recommendationTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  modalBody: {
    padding: Spacing.base,
    maxHeight: 400,
  },
  instructionStep: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: Colors.primary.main,
    margin: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
});