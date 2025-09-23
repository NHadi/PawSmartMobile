import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ProfileStackParamList } from '../../navigation/types';
import odooAddressService from '../../services/address/odooAddressService';
import defaultAddressService from '../../services/address/defaultAddressService';

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'MyAddress'>;

export interface Address {
  id: string;
  label?: string;
  name: string;
  phone: string;
  province?: string;
  city?: string;
  district?: string;
  subDistrict?: string;
  fullAddress: string;
  detail?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export default function ProfileAddressListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null);

  const loadAddresses = async () => {
    try {
      // Get addresses from Odoo
      const odooAddresses = await odooAddressService.getUserAddresses();
      
      // Get default address ID from local storage
      const defaultId = await defaultAddressService.getDefaultAddressId();
      setDefaultAddressId(defaultId);
      
      // Map Odoo addresses to our format
      const mappedAddresses: Address[] = odooAddresses.map(addr => ({
        id: String(addr.id),
        name: addr.name || '',
        phone: addr.phone || addr.mobile || '',
        fullAddress: addr.street || '',
        detail: addr.street2 || '',
        city: addr.city || '',
        postalCode: addr.zip || '',
        latitude: addr.partner_latitude,
        longitude: addr.partner_longitude,
        isDefault: String(addr.id) === defaultId,
        // Parse province/city/district from Odoo data if available
        province: addr.state_id ? addr.state_id[1] : '',
      }));
      
      setAddresses(mappedAddresses);
    } catch (error) {
      // Show user-friendly error
      if (!isRefreshing) {
        Alert.alert('Error', 'Gagal memuat alamat. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load addresses when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAddresses();
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      // Set as default locally
      await defaultAddressService.setDefaultAddress(addressId);
      
      // Update state
      setDefaultAddressId(addressId);
      setAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        }))
      );
      
      Alert.alert('Sukses', 'Alamat utama berhasil diubah');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengubah alamat utama');
    }
  };

  const handleEditAddress = (address: Address) => {
    navigation.navigate('AddAddress', { 
      address, 
      isEditing: true 
    } as any);
  };

  const handleDeleteAddress = async (addressId: string) => {
    Alert.alert(
      'Hapus Alamat',
      'Apakah Anda yakin ingin menghapus alamat ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await odooAddressService.deleteAddress(parseInt(addressId));
              
              // If this was the default address, clear it
              if (addressId === defaultAddressId) {
                await defaultAddressService.clearDefaultAddress();
                setDefaultAddressId(null);
              }
              
              setAddresses(prev => prev.filter(addr => addr.id !== addressId));
              Alert.alert('Sukses', 'Alamat berhasil dihapus');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus alamat');
            }
          }
        }
      ]
    );
  };

  const renderAddressCard = (address: Address) => (
    <View key={address.id} style={[
      styles.addressCard,
      address.isDefault && styles.addressCardPrimary
    ]}>
      {/* Address Header */}
      <View style={styles.addressHeader}>
        <View style={styles.addressNameContainer}>
          <Text style={styles.addressName}>{address.name}</Text>
          {address.isDefault && (
            <View style={styles.primaryBadge}>
              <MaterialIcons name="home" size={12} color={Colors.text.white} />
              <Text style={styles.primaryText}>Utama</Text>
            </View>
          )}
          {address.label && (
            <View style={styles.labelBadge}>
              <Text style={styles.labelText}>{address.label}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditAddress(address)}
        >
          <MaterialIcons name="edit" size={20} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Phone */}
      <Text style={styles.addressFullText}>{address.phone}</Text>

      {/* Full Address */}
      <Text style={styles.addressFullText}>
        {address.fullAddress}
        {address.detail ? ` ${address.detail}` : ''}
        {(address.subDistrict || address.district) ? ` Kel. ${address.subDistrict || ''}` : ''}
        {address.district ? ` Kec. ${address.district}` : ''}
        {address.city ? ` ${address.city}` : ''}
        {address.province ? ` - ${address.province}` : ''}
        {address.postalCode ? ` ${address.postalCode}` : ''}
      </Text>

      {/* Action Buttons */}
      <View style={styles.addressActions}>
        {!address.isDefault && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleSetDefault(address.id)}
          >
            <Text style={styles.actionButtonText}>Jadikan Utama</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAddress(address.id)}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alamat Saya</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Memuat alamat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alamat Saya</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddAddress')}
        >
          <MaterialIcons name="add" size={24} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary.main]}
          />
        }
      >
        {/* Address List */}
        {addresses.map(renderAddressCard)}

        {/* Empty State */}
        {addresses.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="location-off" size={64} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Belum Ada Alamat</Text>
            <Text style={styles.emptyDescription}>
              Tambahkan alamat untuk memudahkan pengiriman
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddAddress')}
            >
              <Text style={styles.emptyButtonText}>Tambah Alamat</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Address FAB */}
      {addresses.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('AddAddress')}
        >
          <MaterialIcons name="add" size={24} color={Colors.text.white} />
        </TouchableOpacity>
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
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  addButton: {
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  addressCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  addressCardPrimary: {
    borderColor: Colors.primary.main,
    borderWidth: 2,
    backgroundColor: Colors.primary.light + '08',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  addressNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  addressName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  primaryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.medium,
  },
  labelBadge: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  labelText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  editButton: {
    padding: Spacing.xs,
  },
  addressFullText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  addressActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary.main,
  },
  deleteButton: {
    borderColor: Colors.error.main,
  },
  deleteButtonText: {
    color: Colors.error.main,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});