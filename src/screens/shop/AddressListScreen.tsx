import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';
import standaloneAddressService, { Address as StandaloneAddress } from '../../services/address/standaloneAddressService';

// Map standalone address to our Address interface
export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  fullAddress: string;
  detail: string;
  postalCode: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
  province?: string;
  city?: string;
  district?: string;
  subDistrict?: string;
  // KiriminAja location IDs for shipping
  province_id?: string;
  city_id?: string;
  district_id?: string | number;
  subdistrict_id?: string | number;
}

type NavigationProp = StackNavigationProp<HomeStackParamList, 'AddressList'>;
type RouteProps = RouteProp<HomeStackParamList, 'AddressList'>;

export default function AddressListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const isSelecting = route.params?.isSelecting || false;

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const addresses = await standaloneAddressService.getAddresses();

      // Convert standalone addresses to our format
      const convertedAddresses: Address[] = addresses.map(addr => {
        return {
          id: addr.id.toString(),
          label: addr.label || 'Rumah',
          name: addr.recipient_name,
          phone: addr.phone || '',
          fullAddress: addr.address_line1,
          detail: addr.address_line2 || '',
          postalCode: addr.postal_code,
          isDefault: addr.is_default,
          latitude: addr.latitude,
          longitude: addr.longitude,
          province: addr.state,
          city: addr.city,
          district: addr.district,
          subDistrict: addr.subdistrict,
          // Include KiriminAja IDs for shipping (if available in notes)
          province_id: undefined,
          city_id: undefined,
          district_id: undefined,
          subdistrict_id: undefined,
        };
      });

      setAddresses(convertedAddresses);

      // Set default selected address only if not already selected
      // This preserves user selection when returning to this screen
      if (!selectedAddressId) {
        const defaultAddress = convertedAddresses.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (convertedAddresses.length > 0) {
          // If no default, select first address
          setSelectedAddressId(convertedAddresses[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const handleSelectAddress = (address: Address) => {
    if (isSelecting) {
      // Return selected address to checkout screen
      navigation.navigate('Checkout', { selectedAddress: address });
    } else {
      setSelectedAddressId(address.id);
    }
  };

  const handleAddAddress = () => {
    navigation.navigate('AddAddress' as any);
  };

  const handleEditAddress = (address: Address) => {
    navigation.navigate('AddAddress' as any, { address, isEditing: true });
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Hapus Alamat',
      'Apakah Anda yakin ingin menghapus alamat ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await odooAddressService.deleteAddress(parseInt(addressId));
            await loadAddresses(); // Reload addresses after deletion
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../../../assets/Market Maskot.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Belum ada alamat</Text>
      <Text style={styles.emptySubtitle}>
        Tambahkan alamat pengiriman untuk mulai belanja
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddAddress}
      >
        <Text style={styles.addButtonText}>Tambah alamat baru</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddressItem = (address: Address) => (
    <TouchableOpacity
      key={address.id}
      style={[
        styles.addressCard,
        selectedAddressId === address.id && styles.addressCardSelected
      ]}
      onPress={() => handleSelectAddress(address)}
    >
      <View style={styles.addressHeader}>
        <View style={styles.radioContainer}>
          <View style={[
            styles.radioButton,
            selectedAddressId === address.id && styles.radioButtonSelected
          ]}>
            {selectedAddressId === address.id && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
        </View>
        
        <View style={styles.addressContent}>
          <View style={styles.addressTitleRow}>
            <Text style={styles.addressName}>{address.name}</Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Utama</Text>
              </View>
            )}
          </View>
          <Text style={styles.addressFullText}>{address.phone}</Text>
          <Text style={styles.addressFullText}>
            {address.fullAddress}
            {address.detail ? ` ${address.detail}` : ''}
            {(address.subDistrict || address.district) ? ` Kel. ${address.subDistrict || ''}` : ''}
            {address.district ? ` Kec. ${address.district}` : ''}
            {address.city ? ` ${address.city}` : ''}
            {address.province ? ` - ${address.province}` : ''}
            {address.postalCode ? ` ${address.postalCode}` : ''}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditAddress(address)}
        >
          <MaterialIcons name="edit" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Alamat</Text>
        <TouchableOpacity onPress={handleAddAddress}>
          <Ionicons name="add" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {addresses.length === 0 ? renderEmptyState() : addresses.map(renderAddressItem)}
      </ScrollView>

      {/* Bottom Action Button */}
      {isSelecting && addresses.length > 0 && (
        <View style={styles.bottomActionContainer}>
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => {
              const selected = addresses.find(addr => addr.id === selectedAddressId);
              if (selected) {
                handleSelectAddress(selected);
              }
            }}
          >
            <Text style={styles.selectButtonText}>Gunakan Alamat Ini</Text>
          </TouchableOpacity>
        </View>
      )}
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
    padding: Spacing.base,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl * 2,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFA500', // Orange color to match the design
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: '#00BCD4', // Cyan color to match the design
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    width: '100%',
    maxWidth: 280,
  },
  addButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    textAlign: 'center',
  },
  
  // Address Card
  addressCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  addressCardSelected: {
    borderColor: Colors.primary.main,
    borderWidth: 2,
    backgroundColor: Colors.primary.light + '08',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioContainer: {
    paddingTop: Spacing.xs,
    marginRight: Spacing.md,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
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
  addressContent: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  addressName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  defaultBadge: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  defaultText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  addressFullText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  editButton: {
    padding: Spacing.xs,
  },
  
  // Bottom Action
  bottomActionContainer: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  selectButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  selectButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});