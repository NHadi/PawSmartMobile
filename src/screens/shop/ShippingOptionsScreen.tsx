import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

type NavigationProp = StackNavigationProp<HomeStackParamList, 'ShippingOptions'>;
type RoutePropType = RouteProp<HomeStackParamList, 'ShippingOptions'>;

interface ShippingService {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

interface ShippingProvider {
  id: string;
  name: string;
  services: ShippingService[];
}

const shippingProviders: ShippingProvider[] = [
  {
    id: 'regular',
    name: 'Reguler',
    services: [
      {
        id: 'jne-regular',
        name: 'JNE Reguler',
        price: 12000,
        estimatedDays: '2-3 hari',
      },
      {
        id: 'sicepat-regular',
        name: 'SiCepat Reguler',
        price: 12000,
        estimatedDays: '2-3 hari',
      },
      {
        id: 'spx-standard',
        name: 'SPX Standard',
        price: 12000,
        estimatedDays: '2-3 hari',
      },
    ],
  },
  {
    id: 'hemat',
    name: 'Hemat Kargo',
    services: [
      {
        id: 'jne-trucking',
        name: 'JNE Trucking',
        price: 22000,
        estimatedDays: '5-7 hari',
      },
      {
        id: 'sicepat-gokil',
        name: 'SiCepat GOKIL',
        price: 20000,
        estimatedDays: '5-7 hari',
      },
    ],
  },
];

export default function ShippingOptionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  
  // Get the currently selected shipping from route params
  const currentShipping = route.params?.selectedShipping;
  
  // Initialize with current selection or defaults
  const [selectedProvider, setSelectedProvider] = useState<ShippingProvider>(() => {
    if (currentShipping) {
      const provider = shippingProviders.find(p => 
        p.services.some(s => s.id === currentShipping.id)
      );
      return provider || shippingProviders[0];
    }
    return shippingProviders[0];
  });
  
  const [selectedService, setSelectedService] = useState<ShippingService>(() => {
    if (currentShipping) {
      const service = selectedProvider.services.find(s => s.id === currentShipping.id);
      return service || selectedProvider.services[0];
    }
    return selectedProvider.services[0];
  });
  const [showServiceModal, setShowServiceModal] = useState(false);

  const handleSelectProvider = (provider: ShippingProvider) => {
    setSelectedProvider(provider);
    setShowServiceModal(true);
  };

  const handleSelectService = (service: ShippingService) => {
    setSelectedService(service);
    setShowServiceModal(false);
  };

  const handleConfirm = () => {
    // Navigate back to checkout with selected shipping option and preserve payment method
    navigation.navigate('Checkout', {
      selectedShipping: {
        id: selectedService.id,
        name: selectedService.name,
        service: selectedService.name,
        price: selectedService.price,
        estimatedDays: selectedService.estimatedDays,
      },
      selectedPayment: route.params?.selectedPayment, // Preserve payment selection
    } as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Jasa Pengiriman</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Provider Selection */}
        <View style={styles.providerSection}>
          {shippingProviders.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              style={[
                styles.providerCard,
                selectedProvider.id === provider.id && styles.providerCardSelected,
              ]}
              onPress={() => handleSelectProvider(provider)}
            >
              <View style={styles.providerContent}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerPrice}>
                  Rp{provider.services[0].price.toLocaleString('id-ID')}
                </Text>
                {selectedProvider.id === provider.id && (
                  <TouchableOpacity 
                    style={styles.providerExpand}
                    onPress={() => setShowServiceModal(true)}
                  >
                    <Text style={styles.expandText}>{selectedService.name}</Text>
                    <MaterialIcons name="expand-more" size={20} color={Colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.radioButton}>
                {selectedProvider.id === provider.id ? (
                  <View style={styles.radioButtonSelected} />
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Service Selection Modal */}
      <Modal
        visible={showServiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServiceModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowServiceModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedProvider.name}</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {selectedProvider.services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceOption}
                onPress={() => handleSelectService(service)}
              >
                <View style={styles.serviceRadio}>
                  {selectedService.id === service.id ? (
                    <View style={styles.serviceRadioSelected} />
                  ) : null}
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceEstimate}>
                    Estimasi: {service.estimatedDays}
                  </Text>
                </View>
                <Text style={styles.servicePrice}>
                  Rp{service.price.toLocaleString('id-ID')}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowServiceModal(false)}
            >
              <Text style={styles.modalButtonText}>Konfirmasi</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Confirm Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Konfirmasi</Text>
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
  providerSection: {
    padding: Spacing.base,
  },
  providerCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  providerCardSelected: {
    borderColor: Colors.primary.main,
  },
  providerContent: {
    flex: 1,
  },
  providerName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  providerPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  providerExpand: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
  },
  expandText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginRight: Spacing.xs,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary.main,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  serviceRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  serviceRadioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary.main,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  serviceEstimate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  servicePrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  modalButton: {
    backgroundColor: Colors.primary.main,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  
  // Bottom Container
  bottomContainer: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  confirmButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});