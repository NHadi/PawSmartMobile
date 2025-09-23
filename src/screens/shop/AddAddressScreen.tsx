import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';
import odooAddressService from '../../services/address/odooAddressService';
import defaultAddressService from '../../services/address/defaultAddressService';
import { Address } from './AddressListScreen';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'AddAddress'>;
type RouteProps = RouteProp<HomeStackParamList, 'AddAddress'>;

export default function AddAddressScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const isEditing = route.params?.isEditing || false;
  const existingAddress = route.params?.address;

  const [formData, setFormData] = useState<Partial<Address>>({
    label: existingAddress?.label || '',
    name: existingAddress?.name || '',
    phone: existingAddress?.phone || '',
    province: existingAddress?.province || '',
    city: existingAddress?.city || '',
    district: existingAddress?.district || '',
    subDistrict: existingAddress?.subDistrict || '',
    fullAddress: existingAddress?.fullAddress || '',
    detail: existingAddress?.detail || '',
    postalCode: existingAddress?.postalCode || '',
    isDefault: existingAddress?.isDefault || false,
  });

  // Use ref to persist form data across navigation
  const persistedFormDataRef = useRef(formData);
  const FORM_STORAGE_KEY = 'ADD_ADDRESS_FORM_DATA';

  // Load persisted form data on component mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(FORM_STORAGE_KEY);
        if (savedData && !isEditing) {
          const parsedData = JSON.parse(savedData);
          setFormData(parsedData);
          persistedFormDataRef.current = parsedData;
        }
      } catch (error) {
        console.log('Error loading persisted form data:', error);
      }
    };
    loadPersistedData();
  }, []);

  const handleInputChange = async (field: keyof Address, value: string | boolean) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    persistedFormDataRef.current = newFormData;

    // Save to AsyncStorage immediately
    try {
      await AsyncStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(newFormData));
    } catch (error) {
      console.log('Error saving form data:', error);
    }
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      Alert.alert('Error', 'Nama lengkap harus diisi');
      return false;
    }
    if (!formData.phone?.trim()) {
      Alert.alert('Error', 'Nomor telepon harus diisi');
      return false;
    }
    if (!formData.province?.trim() || !formData.city?.trim()) {
      Alert.alert('Error', 'Provinsi dan Kota harus diisi');
      return false;
    }
    if (!formData.fullAddress?.trim()) {
      Alert.alert('Error', 'Alamat lengkap harus diisi');
      return false;
    }
    if (!formData.postalCode?.trim()) {
      Alert.alert('Error', 'Kode pos harus diisi');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      let addressId: number | string;
      
      if (isEditing && existingAddress) {
        // Update existing address in Odoo
        await odooAddressService.updateAddress(parseInt(existingAddress.id), {
          name: formData.name!,
          phone: formData.phone!,
          street: formData.fullAddress!,
          street2: formData.detail || '',
          city: formData.city || '',
          zip: formData.postalCode!,
          partner_latitude: formData.latitude,
          partner_longitude: formData.longitude,
        });
        addressId = existingAddress.id;
      } else {
        // Create new address in Odoo
        const newAddress = await odooAddressService.createAddress({
          name: formData.name!,
          phone: formData.phone!,
          street: formData.fullAddress!,
          street2: formData.detail || '',
          city: formData.city || '',
          zip: formData.postalCode!,
          latitude: formData.latitude,
          longitude: formData.longitude,
        });
        addressId = newAddress.id;
      }
      
      // Handle default address locally
      if (formData.isDefault) {
        await defaultAddressService.setDefaultAddress(addressId);
      }
      
      // Clear the form storage since save was successful
      try {
        await AsyncStorage.removeItem(FORM_STORAGE_KEY);
      } catch (error) {
        console.log('Error clearing form storage:', error);
      }

      Alert.alert('Sukses', isEditing ? 'Alamat berhasil diperbarui' : 'Alamat berhasil ditambahkan', [
        { text: 'OK', onPress: () => {
          // Navigate to unified address list in Profile instead of order-specific AddressList
          navigation.navigate('Profile' as any, {
            screen: 'MyAddress'
          });
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan alamat');
    }
  };

  const handleChooseLocation = async () => {
    // Store current form data before navigation
    persistedFormDataRef.current = formData;
    try {
      await AsyncStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.log('Error saving form data before navigation:', error);
    }
    // Navigate to location picker screen
    // Will handle location selection via route params on return
    navigation.navigate('LocationPicker' as any);
  };

  const handleChooseFromMap = () => {
    // Navigate to map picker screen
    // Will handle location selection via route params on return
    navigation.navigate('MapPicker' as any);
  };

  // Handle location data when returning from location/map picker screens
  useEffect(() => {
    const handleLocationReturn = async () => {
      if (route.params?.selectedLocation) {
        const location = route.params.selectedLocation;

        // Load the most recent form data from storage
        let persistedData = persistedFormDataRef.current;
        try {
          const savedData = await AsyncStorage.getItem(FORM_STORAGE_KEY);
          if (savedData) {
            persistedData = JSON.parse(savedData);
          }
        } catch (error) {
          console.log('Error loading persisted form data:', error);
        }

        const newFormData = {
          // Use persisted data as base to preserve all user input
          ...persistedData,
          // Update only location-related fields
          province: location.province || persistedData.province,
          city: location.city || persistedData.city,
          district: location.district || persistedData.district,
          subDistrict: location.subDistrict || persistedData.subDistrict,
          postalCode: location.postalCode || persistedData.postalCode,
          fullAddress: location.fullAddress || persistedData.fullAddress,
          latitude: location.latitude,
          longitude: location.longitude,
          street: location.street || persistedData.street,
        };

        setFormData(newFormData);
        persistedFormDataRef.current = newFormData;

        // Save updated data back to storage
        try {
          await AsyncStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(newFormData));
        } catch (error) {
          console.log('Error saving updated form data:', error);
        }

        // Clear the param to avoid re-processing
        navigation.setParams({ selectedLocation: undefined } as any);
      }
    };

    handleLocationReturn();
  }, [route.params?.selectedLocation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Alamat' : 'Tambah Alamat'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Form Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>Alamat</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nama Lengkap"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholderTextColor={Colors.text.tertiary}
            />

            <TextInput
              style={styles.input}
              placeholder="Nomor Telepon"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.text.tertiary}
            />

            {/* Location Selection */}
            <TouchableOpacity
              style={styles.locationSelector}
              onPress={handleChooseLocation}
            >
              <Text style={[
                styles.locationText,
                (formData.province && formData.city) && styles.locationTextSelected
              ]}>
                {formData.province && formData.city && formData.district && formData.postalCode
                  ? `${formData.province}\n${formData.city}\n${formData.district} ${formData.postalCode}`
                  : 'Provinsi, Kota, Kecamatan, Kode Pos'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Nama Jalan, Gedung, No. Rumah"
              value={formData.fullAddress}
              onChangeText={(text) => handleInputChange('fullAddress', text)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              placeholderTextColor={Colors.text.tertiary}
            />

            <TextInput
              style={[styles.input, styles.textArea, { marginBottom: 0 }]}
              placeholder="Detail Lainnya (Cth: Blok/ Unit No., Patokan)"
              value={formData.detail}
              onChangeText={(text) => handleInputChange('detail', text)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Simpan</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  },
  formSection: {
    backgroundColor: Colors.background.primary,
    marginTop: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    backgroundColor: Colors.background.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  textArea: {
    minHeight: 60,
    paddingTop: Spacing.md,
  },
  locationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    backgroundColor: Colors.background.primary,
    minHeight: 52,
  },
  locationText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
  },
  locationTextSelected: {
    color: Colors.text.primary,
  },
  footer: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  saveButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  saveButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});