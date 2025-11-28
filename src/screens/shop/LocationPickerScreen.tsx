import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
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
import { coverageApiService, CoverageProvince, CoverageCity, CoverageDistrict, CoverageSubDistrict } from '../../services/location/coverageApiService';
import { localLocationAPI } from '../../services/location/localLocationService';
import { Province, City, District, SubDistrict, LocationSelection } from '../../types/location';
import { LocationListSkeleton } from '../../components/LoadingSkeletons/LocationSkeleton';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'LocationPicker'>;
type RouteProps = RouteProp<HomeStackParamList, 'LocationPicker'>;

type SelectionStep = 'province' | 'city' | 'district' | 'subDistrict' | 'postalCode';

export default function LocationPickerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  // Get route params
  const { onLocationSelected, selectedLocation } = route.params || {};

  const [selection, setSelection] = useState<LocationSelection>({});
  const [searchText, setSearchText] = useState('');
  const [currentStep, setCurrentStep] = useState<SelectionStep>('province');
  const [postalCode, setPostalCode] = useState('');

  // API data states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [postalCodes, setPostalCodes] = useState<{code: string, area: string}[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProvinceSelect = async (province: Province) => {
    setSelection({ province: { id: province.id, name: province.name } });
    setPostalCode('');
    setSearchText(''); // Clear search filter
    setCities([]);
    setDistricts([]);
    setSubDistricts([]);
    setPostalCodes([]);
    setCurrentStep('city');

    // Load cities for selected province using Coverage API
    await loadCities(Number(province.id));
  };

  const handleCitySelect = async (city: City) => {
    setSelection(prev => ({ ...prev, city: { id: city.id, name: city.name } }));
    setPostalCode('');
    setSearchText(''); // Clear search filter
    setDistricts([]);
    setSubDistricts([]);
    setPostalCodes([]);

    // Load districts using Coverage API
    await loadDistricts(Number(city.id));
    setCurrentStep('district');
  };

  const handleDistrictSelect = async (district: District) => {
    setSelection(prev => ({ ...prev, district: { id: district.id, name: district.name } }));
    setPostalCode('');
    setSearchText(''); // Clear search filter
    setSubDistricts([]);
    setPostalCodes([]);

    // Load sub-districts using Coverage API
    await loadSubDistricts(Number(district.id));
    setCurrentStep('subDistrict');
  };

  const handleSubDistrictSelect = async (subDistrict: SubDistrict) => {
    setSelection(prev => ({ ...prev, subDistrict: { id: subDistrict.id, name: subDistrict.name } }));
    setPostalCode('');
    setSearchText(''); // Clear search filter
    setCurrentStep('postalCode');

    // Load postal codes using local data (kodepos.json)
    await loadPostalCodes(subDistrict.name, selection.city?.name);
  };

  const handlePostalCodeSelect = async (code: string) => {
    setPostalCode(code);
    const finalSelection = {
      ...selection,
      postalCode: code,
    };

    console.log('Final selection before navigation:', finalSelection);

    // Build location data with IDs from Coverage API selection
    const locationData = {
      province: finalSelection.province?.name,
      city: finalSelection.city?.name,
      district: finalSelection.district?.name,
      subDistrict: finalSelection.subDistrict?.name,
      postalCode: code,
      fullAddress: finalSelection.subDistrict
        ? `${finalSelection.subDistrict.name}, ${finalSelection.district?.name}, ${finalSelection.city?.name}`
        : finalSelection.district
        ? `${finalSelection.district.name}, ${finalSelection.city?.name}`
        : finalSelection.city?.name,
      // IDs from Coverage API selection (already numeric)
      province_id: finalSelection.province?.id?.toString(),
      city_id: finalSelection.city?.id?.toString(),
      district_id: finalSelection.district?.id?.toString(),
      subdistrict_id: finalSelection.subDistrict?.id?.toString(),
    };

    console.log('Location data with Coverage API IDs:', locationData);

    // Use callback if provided, otherwise navigate back to AddAddress
    if (onLocationSelected) {
      onLocationSelected(locationData);
      navigation.goBack();
    } else {
      navigation.navigate('AddAddress' as any, {
        selectedLocation: locationData
      });
    }
  };

  // Loading functions using Coverage API
  const loadProvinces = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await coverageApiService.getProvinces();
      setProvinces(result.data);
      if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load provinces');
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (provinsiId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coverageApiService.getCities(provinsiId);
      setCities(result.data);
      if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (kabupatenId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coverageApiService.getDistricts(kabupatenId);
      setDistricts(result.data);
      if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load districts');
    } finally {
      setLoading(false);
    }
  };

  const loadSubDistricts = async (kecamatanId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coverageApiService.getSubDistricts(kecamatanId);
      setSubDistricts(result.data);
      if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sub-districts');
    } finally {
      setLoading(false);
    }
  };

  const loadPostalCodes = async (locationName: string, cityName?: string) => {
    console.log('Loading postal codes for:', locationName, 'in city:', cityName);
    setLoading(true);
    setError(null);
    try {
      const result = await localLocationAPI.getPostalCodesForDistrict(locationName, cityName);
      console.log('Postal codes result:', result.data);
      setPostalCodes(result.data);
      if (result.error) {
        console.log('Postal codes error:', result.error);
        setError(result.error);
      }
    } catch (err: any) {
      console.log('Postal codes exception:', err);
      setError(err.message || 'Failed to load postal codes');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill existing location data
  const loadExistingLocation = async () => {
    if (!selectedLocation || provinces.length === 0) return;

    console.log('Loading existing location data:', selectedLocation);

    try {
      let currentSelection: LocationSelection = {};

      // Find and select province
      if (selectedLocation.province) {
        const province = provinces.find(p => p.name === selectedLocation.province);
        if (province) {
          console.log('Auto-filling province:', province.name);
          currentSelection.province = { id: province.id, name: province.name };
          setSelection(currentSelection);

          // Load cities for the province using Coverage API
          const citiesResult = await coverageApiService.getCities(Number(province.id));
          if (citiesResult.data && citiesResult.data.length > 0) {
            setCities(citiesResult.data);

            // Find and select city
            if (selectedLocation.city) {
              const city = citiesResult.data.find(c => c.name === selectedLocation.city);
              if (city) {
                console.log('Auto-filling city:', city.name);
                currentSelection.city = { id: city.id, name: city.name };
                setSelection({...currentSelection});

                // Load districts for the city using Coverage API
                const districtsResult = await coverageApiService.getDistricts(Number(city.id));
                if (districtsResult.data && districtsResult.data.length > 0) {
                  setDistricts(districtsResult.data);

                  // Find and select district
                  if (selectedLocation.district) {
                    const district = districtsResult.data.find(d => d.name === selectedLocation.district);
                    if (district) {
                      console.log('Auto-filling district:', district.name);
                      currentSelection.district = { id: district.id, name: district.name };
                      setSelection({...currentSelection});

                      // Load sub-districts for the district using Coverage API
                      const subDistrictsResult = await coverageApiService.getSubDistricts(Number(district.id));
                      if (subDistrictsResult.data && subDistrictsResult.data.length > 0) {
                        setSubDistricts(subDistrictsResult.data);

                        // Find and select sub-district
                        if (selectedLocation.subDistrict) {
                          const subDistrict = subDistrictsResult.data.find(sd => sd.name === selectedLocation.subDistrict);
                          if (subDistrict) {
                            console.log('Auto-filling sub-district:', subDistrict.name);
                            currentSelection.subDistrict = { id: subDistrict.id, name: subDistrict.name };
                            setSelection({...currentSelection});

                            // Load postal codes
                            await loadPostalCodes(subDistrict.name, city.name);
                            setCurrentStep('postalCode');
                          } else {
                            setCurrentStep('subDistrict');
                          }
                        } else {
                          setCurrentStep('subDistrict');
                        }
                      } else {
                        setCurrentStep('subDistrict');
                      }
                    } else {
                      setCurrentStep('district');
                    }
                  } else {
                    setCurrentStep('district');
                  }
                } else {
                  setCurrentStep('district');
                }
              } else {
                setCurrentStep('city');
              }
            } else {
              setCurrentStep('city');
            }
          } else {
            setCurrentStep('city');
          }
        } else {
          setCurrentStep('province');
        }
      }

      // Set postal code if available
      if (selectedLocation.postalCode) {
        setPostalCode(selectedLocation.postalCode);
      }
    } catch (error) {
      console.error('Failed to load existing location:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    loadProvinces();
  }, []);

  // Auto-fill existing location when selectedLocation is provided
  useEffect(() => {
    if (selectedLocation && provinces.length > 0) {
      loadExistingLocation();
    }
  }, [selectedLocation, provinces.length]);

  const handleBack = () => {
    setSearchText(''); // Clear search filter when going back
    if (currentStep === 'province') {
      navigation.goBack();
    } else if (currentStep === 'city') {
      setCurrentStep('province');
    } else if (currentStep === 'district') {
      setCurrentStep('city');
    } else if (currentStep === 'subDistrict') {
      setCurrentStep('district');
    } else if (currentStep === 'postalCode') {
      setCurrentStep('subDistrict');
    }
  };

  const handleMapSelection = () => {
    // Navigate to map picker screen
    navigation.navigate('MapPicker' as any);
  };

  const getCurrentStepData = () => {
    let data: any[] = [];
    switch (currentStep) {
      case 'province':
        data = provinces;
        break;
      case 'city':
        data = cities;
        break;
      case 'district':
        data = districts;
        break;
      case 'subDistrict':
        data = subDistricts;
        break;
      case 'postalCode':
        // If no postal codes from API, provide fallback
        if (postalCodes.length === 0) {
          const fallbackCodes = ['10110', '10220', '10330', '10440', '10550'];
          data = fallbackCodes.map(code => ({ name: code, id: code }));
          console.log('Using fallback postal codes:', fallbackCodes);
        } else {
          // Display "Area Code" format but use just code as ID
          data = postalCodes.map(item => ({
            name: `${item.area} ${item.code}`,
            id: item.code
          }));
        }
        break;
      default:
        data = [];
    }

    // Filter based on search text
    if (searchText.trim()) {
      return data.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return data;
  };

  const getCurrentStepTitle = () => {
    switch (currentStep) {
      case 'province':
        return 'Provinsi';
      case 'city':
        return 'Kabupaten Kota';
      case 'district':
        return 'Kecamatan';
      case 'subDistrict':
        return 'Kelurahan';
      case 'postalCode':
        return 'Kode Pos';
      default:
        return '';
    }
  };

  const getSelectedValue = () => {
    switch (currentStep) {
      case 'province':
        return selection.province?.name;
      case 'city':
        return selection.city?.name;
      case 'district':
        return selection.district?.name;
      case 'subDistrict':
        return selection.subDistrict?.name;
      case 'postalCode':
        return postalCode;
      default:
        return '';
    }
  };

  const handleItemSelect = (item: any) => {
    switch (currentStep) {
      case 'province':
        handleProvinceSelect(item as Province);
        break;
      case 'city':
        handleCitySelect(item as City);
        break;
      case 'district':
        handleDistrictSelect(item as District);
        break;
      case 'subDistrict':
        handleSubDistrictSelect(item as SubDistrict);
        break;
      case 'postalCode':
        // Use item.id which contains just the postal code (e.g., "45252")
        // item.name contains display format like "Pamayahan 45252"
        handlePostalCodeSelect(item.id);
        break;
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari Kota, Kecamatan, atau Kode Pos"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={Colors.text.tertiary}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map Option - Only show on first step */}
      {currentStep === 'province' && (
        <TouchableOpacity style={styles.mapOption} onPress={handleMapSelection}>
          <Ionicons name="location-outline" size={24} color={Colors.primary.main} />
          <Text style={styles.mapOptionText}>Pilih Berdasarkan Map</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary.main} />
        </TouchableOpacity>
      )}

      {/* Breadcrumb */}
      {(currentStep !== 'province' || selection.province) && (
        <View style={styles.breadcrumbContainer}>
          {selection.province && (
            <TouchableOpacity
              style={styles.breadcrumbItem}
              onPress={() => {
                setSearchText(''); // Clear search
                setCurrentStep('province');
              }}
            >
              <View style={styles.sectionIndicator} />
              <View style={styles.breadcrumbContent}>
                <Text style={styles.breadcrumbLabel}>Provinsi</Text>
                <Text style={styles.breadcrumbValue}>{selection.province.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
          {selection.city && currentStep !== 'city' && (
            <TouchableOpacity
              style={styles.breadcrumbItem}
              onPress={() => {
                setSearchText(''); // Clear search
                setCurrentStep('city');
              }}
            >
              <View style={styles.sectionIndicator} />
              <View style={styles.breadcrumbContent}>
                <Text style={styles.breadcrumbLabel}>Kabupaten Kota</Text>
                <Text style={styles.breadcrumbValue}>{selection.city.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
          {selection.district && (currentStep === 'subDistrict' || currentStep === 'postalCode') && (
            <TouchableOpacity
              style={styles.breadcrumbItem}
              onPress={() => {
                setSearchText(''); // Clear search
                setCurrentStep('district');
              }}
            >
              <View style={styles.sectionIndicator} />
              <View style={styles.breadcrumbContent}>
                <Text style={styles.breadcrumbLabel}>Kecamatan</Text>
                <Text style={styles.breadcrumbValue}>{selection.district.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
          {selection.subDistrict && currentStep === 'postalCode' && (
            <TouchableOpacity
              style={styles.breadcrumbItem}
              onPress={() => {
                setSearchText(''); // Clear search
                setCurrentStep('subDistrict');
              }}
            >
              <View style={styles.sectionIndicator} />
              <View style={styles.breadcrumbContent}>
                <Text style={styles.breadcrumbLabel}>Kelurahan</Text>
                <Text style={styles.breadcrumbValue}>{selection.subDistrict.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Current Step Section */}
      <View style={styles.currentStepHeader}>
        <View style={styles.sectionIndicator} />
        <Text style={styles.currentStepTitle}>{getCurrentStepTitle()}</Text>
      </View>

      {/* Options List */}
      {loading ? (
        <LocationListSkeleton count={8} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            switch (currentStep) {
              case 'province':
                loadProvinces();
                break;
              case 'city':
                if (selection.province) loadCities(Number(selection.province.id));
                break;
              case 'district':
                if (selection.city) loadDistricts(Number(selection.city.id));
                break;
              case 'subDistrict':
                if (selection.district) loadSubDistricts(Number(selection.district.id));
                break;
              case 'postalCode':
                if (selection.subDistrict) {
                  loadPostalCodes(selection.subDistrict.name, selection.city?.name);
                } else if (selection.district) {
                  loadPostalCodes(selection.district.name, selection.city?.name);
                }
                break;
            }
          }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={getCurrentStepData()}
          style={styles.optionsList}
          keyExtractor={(item) => String(item.id) || item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleItemSelect(item)}
            >
              <Text style={styles.optionText}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchText ? 'No results found' : 'No data available'}
              </Text>
            </View>
          )}
        />
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
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  mapOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  mapOptionText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: Spacing.sm,
  },
  breadcrumbContainer: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  breadcrumbContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breadcrumbLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  breadcrumbValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  currentStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  currentStepTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    backgroundColor: '#00BCD4',
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  optionsList: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  optionItem: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  optionText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginHorizontal: Spacing.base,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});