import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';
import kiriminAjaService, { ShippingService as KiriminAjaShippingService } from '../../services/shipping/kiriminAjaService';
import addressServiceAPI, { Address } from '../../services/addressServiceAPI';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'ShippingOptions'>;
type RoutePropType = RouteProp<HomeStackParamList, 'ShippingOptions'>;

interface ShippingService {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  apiService?: KiriminAjaShippingService; // Store original API response
}

interface CourierOption {
  code: string;
  name: string;
  type: 'Express' | 'Instant';
  services: ShippingService[];
  available: boolean;
}

interface CourierGroup {
  type: 'Express' | 'Instant';
  couriers: CourierOption[];
}

// Warehouse/Origin Address Configuration
// TODO: Move this to environment config or database
const WAREHOUSE_ADDRESS: Address = {
  id: 'warehouse-1',
  label: 'Warehouse Utama',
  name: 'PawSmart Warehouse',
  phone: '+62 21 1234567',
  full_address: 'Jl. Warehouse No. 1, Jakarta Pusat',
  postal_code: '10110',
  is_default: true,
  latitude: -6.2088,
  longitude: 106.8456,
  province: 'DKI Jakarta',
  city: 'Jakarta Pusat',
  district: 'Menteng',
  province_id: '31',
  city_id: '3171',
  district_id: 151, // Jakarta Pusat district ID for KiriminAja
};

export default function ShippingOptionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();

  // Get params from navigation
  const currentShipping = route.params?.selectedShipping;
  const deliveryAddress = route.params?.deliveryAddress; // Get address from checkout

  const [courierGroups, setCourierGroups] = useState<CourierGroup[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<CourierOption | null>(null);
  const [selectedService, setSelectedService] = useState<ShippingService | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available couriers and shipping rates
  useEffect(() => {
    if (deliveryAddress) {
      fetchCourierOptions();
    }
  }, [deliveryAddress]);

  const fetchCourierOptions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get delivery address
      let customerAddress = deliveryAddress;
      if (!customerAddress) {
        console.log('No address passed, trying to get default address...');
        customerAddress = await addressServiceAPI.getDefaultAddress();
      }

      if (!customerAddress) {
        setError('Pilih alamat pengiriman terlebih dahulu di halaman checkout');
        setLoading(false);
        return;
      }

      // Fetch available couriers
      const courierResponse = await kiriminAjaService.getAvailableCouriers();
      console.log('Available couriers:', courierResponse.datas);

      // TODO: Calculate actual weight from cart items
      const totalWeight = 1000; // Default 1kg for demo

      // Check what shipping data we have available
      let hasDistrictId = !!customerAddress.district_id;
      const hasCoordinates = !!(customerAddress.latitude && customerAddress.longitude);

      if (!hasDistrictId && !hasCoordinates) {
        console.warn('Delivery address missing both district_id and coordinates:', customerAddress);
        setError('Alamat pengiriman tidak lengkap. Silakan lengkapi data lokasi (koordinat atau kecamatan).');
        setLoading(false);
        return;
      }

      // If we don't have district_id but have district/city names, try to look it up
      if (!hasDistrictId && customerAddress.district && customerAddress.city) {
        console.log('🔍 Attempting to lookup district_id for:', customerAddress.district, customerAddress.city);

        // Hardcoded fallback district IDs for common areas (temporary solution)
        const FALLBACK_DISTRICT_IDS: { [key: string]: number } = {
          'cilodong_depok': 456, // Cilodong, Kota Depok, Jawa Barat
          'beji_depok': 457,
          'pancoran mas_depok': 458,
          'sukmajaya_depok': 459,
          'cimanggis_depok': 460,
          'limo_depok': 461,
          'cinere_depok': 462,
          'sawangan_depok': 463,
          'bojongsari_depok': 464,
          'cipayung_depok': 465,
          'tapos_depok': 466,
        };

        try {
          // Try district name first (most specific)
          let searchQuery = customerAddress.district;
          let locationResults = await kiriminAjaService.searchLocation(searchQuery);

          // If multiple results or no results, try with city for better matching
          if (!locationResults.status || !locationResults.results?.length) {
            console.log('⚠️ No results with district only, trying with city...');
            searchQuery = `${customerAddress.district}, ${customerAddress.city}`;
            locationResults = await kiriminAjaService.searchLocation(searchQuery);
          }

          if (locationResults.status && locationResults.results?.length > 0) {
            // Find best match by comparing city and province names
            let match = locationResults.results[0];

            // If multiple results, try to find exact match
            if (locationResults.results.length > 1) {
              const exactMatch = locationResults.results.find(r =>
                r.city_name?.toLowerCase().includes(customerAddress.city?.toLowerCase() || '') &&
                (customerAddress.province ?
                  r.province_name?.toLowerCase().includes(customerAddress.province?.toLowerCase()) : true)
              );
              if (exactMatch) match = exactMatch;
            }

            console.log('✅ Found KiriminAja location via lazy lookup:', match);

            // Update the customerAddress with found IDs
            customerAddress.province_id = match.province_id?.toString();
            customerAddress.city_id = match.city_id?.toString();
            customerAddress.district_id = match.district_id;
            customerAddress.subdistrict_id = match.subdistrict_id;

            // Update hasDistrictId flag
            hasDistrictId = !!customerAddress.district_id;
          }
        } catch (error) {
          console.log('⚠️ KiriminAja lazy location search failed:', error);
        }

        // If still no district_id, try fallback mapping
        if (!hasDistrictId) {
          const fallbackKey = `${customerAddress.district?.toLowerCase()}_${customerAddress.city?.toLowerCase()}`.replace(/\s+/g, ' ');
          const fallbackId = FALLBACK_DISTRICT_IDS[fallbackKey];

          if (fallbackId) {
            console.log('✅ Using fallback district_id:', fallbackId, 'for', fallbackKey);
            customerAddress.district_id = fallbackId;
            hasDistrictId = true;
          }
        }
      }

      const promises: Promise<any>[] = [];

      // Fetch Express shipping ONLY if we have district_id
      if (hasDistrictId) {
        console.log('Fetching express rates from:', WAREHOUSE_ADDRESS.district, 'to:', customerAddress.district);
        const shippingRequest = {
          origin: Number(WAREHOUSE_ADDRESS.district_id),
          destination: Number(customerAddress.district_id),
          weight: totalWeight,
          insurance: 0 as 0 | 1,
        };
        promises.push(kiriminAjaService.getShippingRates(shippingRequest));
      } else {
        console.log('Skipping express rates - no district_id');
        promises.push(Promise.resolve({ status: false, results: [] }));
      }

      // Fetch Instant shipping ONLY if we have coordinates
      if (hasCoordinates) {
        console.log('Fetching instant rates with coordinates');
        console.log('Origin coordinates:', WAREHOUSE_ADDRESS.latitude, WAREHOUSE_ADDRESS.longitude);
        console.log('Destination coordinates:', customerAddress.latitude, customerAddress.longitude);
        const instantRequest = {
          origin: {
            lat: WAREHOUSE_ADDRESS.latitude!,
            long: WAREHOUSE_ADDRESS.longitude!,
          },
          destination: {
            lat: customerAddress.latitude!,
            long: customerAddress.longitude!,
          },
          weight: totalWeight,
          timezone: 'WIB', // Use WIB timezone abbreviation
        };
        promises.push(kiriminAjaService.getInstantRates(instantRequest));
      } else {
        console.log('Skipping instant rates - no coordinates');
        console.log('Customer address has coordinates:', !!(customerAddress.latitude && customerAddress.longitude));
        if (customerAddress.latitude) console.log('Customer lat:', customerAddress.latitude);
        if (customerAddress.longitude) console.log('Customer long:', customerAddress.longitude);
        promises.push(Promise.resolve({ status: false, results: [] }));
      }

      // Fetch available shipping options
      const [expressResponse, instantResponse] = await Promise.allSettled(promises);

      // Group couriers by type
      const groups: CourierGroup[] = [];
      const expressCouriers: CourierOption[] = [];
      const instantCouriers: CourierOption[] = [];

      // Create courier options from API data
      if (courierResponse.status && courierResponse.datas) {
        courierResponse.datas.forEach(courier => {
          const courierOption: CourierOption = {
            code: courier.code,
            name: courier.name,
            type: courier.type,
            services: [],
            available: false,
          };

          if (courier.type === 'Express') {
            expressCouriers.push(courierOption);
          } else if (courier.type === 'Instant') {
            instantCouriers.push(courierOption);
          }
        });
      }

      // Process Express response and map to couriers
      let expressServices: KiriminAjaShippingService[] = [];
      if (expressResponse.status === 'fulfilled' && expressResponse.value.status) {
        const realExpressServices = kiriminAjaService.filterRealServices(expressResponse.value.results);
        expressServices = kiriminAjaService.filterByGroup(realExpressServices, 'regular');
        console.log('Express services found:', expressServices.length);
      }

      // Map services to couriers
      expressServices.forEach(service => {
        const courier = expressCouriers.find(c => c.code === service.service);
        if (courier) {
          courier.services.push({
            id: service.service_type,
            name: service.service_name,
            price: parseInt(service.cost),
            estimatedDays: `${service.etd} hari`,
            apiService: service,
          });
          courier.available = true;
        }
      });

      // Process Instant response and map to couriers
      let instantServices: KiriminAjaShippingService[] = [];
      if (instantResponse.status === 'fulfilled' && instantResponse.value.status) {
        instantServices = kiriminAjaService.filterRealServices(instantResponse.value.results);
        console.log('Instant services found:', instantServices.length);
      }

      // Map services to couriers
      instantServices.forEach(service => {
        const courier = instantCouriers.find(c => c.code === service.service);
        if (courier) {
          courier.services.push({
            id: service.service_type,
            name: service.service_name,
            price: parseInt(service.cost),
            estimatedDays: `${service.etd} hari`,
            apiService: service,
          });
          courier.available = true;
        }
      });

      // Create groups
      if (expressCouriers.length > 0) {
        groups.push({
          type: 'Express',
          couriers: expressCouriers,
        });
      }

      if (instantCouriers.length > 0) {
        groups.push({
          type: 'Instant',
          couriers: instantCouriers,
        });
      }

      console.log('=== FINAL COURIER GROUPS ===');
      groups.forEach(group => {
        console.log(`${group.type} group: ${group.couriers.length} couriers`);
        group.couriers.forEach(courier => {
          console.log(`  - ${courier.name}: ${courier.services.length} services, available: ${courier.available}`);
        });
      });

      setCourierGroups(groups);

      // Set default selection
      if (groups.length > 0 && groups[0].couriers.length > 0) {
        const firstAvailableCourier = groups[0].couriers.find(c => c.available) || groups[0].couriers[0];
        setSelectedCourier(firstAvailableCourier);
        if (firstAvailableCourier.services.length > 0) {
          setSelectedService(firstAvailableCourier.services[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch shipping rates:', err);
      setError('Gagal memuat opsi pengiriman. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourier = (courier: CourierOption) => {
    if (!courier.available) {
      // Show message that this courier is not available for the route
      setError(`${courier.name} tidak tersedia untuk rute ini. Silakan pilih kurir lain.`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    setSelectedCourier(courier);
    setShowServiceModal(true);
  };

  const handleSelectService = (service: ShippingService) => {
    setSelectedService(service);
    setShowServiceModal(false);
  };

  const handleConfirm = () => {
    if (!selectedService) return;

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Memuat opsi pengiriman...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Colors.error.main} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCourierOptions}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {courierGroups.map((group) => (
            <View key={group.type} style={styles.groupSection}>
              <Text style={styles.groupTitle}>{group.type}</Text>
              {group.couriers.map((courier) => (
                <TouchableOpacity
                  key={courier.code}
                  style={[
                    styles.courierCard,
                    selectedCourier?.code === courier.code && styles.courierCardSelected,
                    !courier.available && styles.courierCardDisabled,
                  ]}
                  onPress={() => handleSelectCourier(courier)}
                  disabled={!courier.available}
                >
                  <View style={styles.courierContent}>
                    <Text style={[
                      styles.courierName,
                      !courier.available && styles.courierNameDisabled
                    ]}>
                      {courier.name}
                    </Text>
                    <Text style={[
                      styles.courierPrice,
                      !courier.available && styles.courierPriceDisabled
                    ]}>
                      {courier.available && courier.services.length > 0
                        ? `Mulai dari Rp${Math.min(...courier.services.map(s => s.price)).toLocaleString('id-ID')}`
                        : courier.available
                        ? 'Tersedia'
                        : 'Tidak tersedia untuk rute ini'
                      }
                    </Text>
                    {selectedCourier?.code === courier.code && selectedService && (
                      <TouchableOpacity
                        style={styles.courierExpand}
                        onPress={() => setShowServiceModal(true)}
                      >
                        <Text style={styles.expandText}>{selectedService.name}</Text>
                        <MaterialIcons name="expand-more" size={20} color={Colors.text.secondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={[
                    styles.radioButton,
                    !courier.available && styles.radioButtonDisabled
                  ]}>
                    {selectedCourier?.code === courier.code ? (
                      <View style={[
                        styles.radioButtonSelected,
                        !courier.available && styles.radioButtonSelectedDisabled
                      ]} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

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
              <Text style={styles.modalTitle}>{selectedCourier?.name || 'Pilih Layanan'}</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {selectedCourier?.services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceOption}
                onPress={() => handleSelectService(service)}
              >
                <View style={styles.serviceRadio}>
                  {selectedService?.id === service.id ? (
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
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedService || !selectedCourier?.available) && styles.confirmButtonDisabled
          ]}
          onPress={handleConfirm}
          disabled={!selectedService || !selectedCourier?.available}
        >
          <Text style={[
            styles.confirmButtonText,
            (!selectedService || !selectedCourier?.available) && styles.confirmButtonTextDisabled
          ]}>
            Konfirmasi
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
  groupSection: {
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary.main,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  courierCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  courierCardSelected: {
    borderColor: Colors.primary.main,
  },
  courierCardDisabled: {
    borderColor: Colors.border.light,
    opacity: 0.6,
  },
  courierContent: {
    flex: 1,
  },
  courierName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  courierNameDisabled: {
    color: Colors.text.disabled,
  },
  courierPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  courierPriceDisabled: {
    color: Colors.text.disabled,
  },
  courierExpand: {
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
  radioButtonDisabled: {
    borderColor: Colors.border.light,
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary.main,
  },
  radioButtonSelectedDisabled: {
    backgroundColor: Colors.border.light,
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
  confirmButtonDisabled: {
    backgroundColor: Colors.border.light,
  },
  confirmButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  confirmButtonTextDisabled: {
    color: Colors.text.disabled,
  },
  // Loading and error styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl * 2,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  retryButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});