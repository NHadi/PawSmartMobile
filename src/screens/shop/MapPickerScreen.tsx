import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { localLocationAPI } from '../../services/location/localLocationService';
import { poiService, INDONESIAN_POI_CATEGORIES } from '../../services/location/poiService';
import { POI, POICategory, POISearchResult } from '../../types/poi';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';

const { height: screenHeight } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<HomeStackParamList, 'MapPicker'>;
type RouteProps = RouteProp<HomeStackParamList, 'MapPicker'>;

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  province?: string;
  city?: string;
  district?: string;
  subDistrict?: string;
  postalCode?: string;
  street?: string;
  rtRw?: string;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  country?: string;
  countryCode?: string;
  formattedForOdoo?: {
    name: string;
    street: string;
    street2: string;
    city: string;
    state_id: string;
    zip: string;
    country_id: string;
    partner_latitude: number;
    partner_longitude: number;
  };
}

interface NearbyLocation {
  id: string;
  name: string;
  address: string;
  distance: string;
  latitude: number;
  longitude: number;
  type: 'current' | 'suggestion' | 'poi';
  category?: POICategory;
  fullAddressData?: {
    province: string;
    city: string;
    district: string;
    postalCode: string;
  };
}

interface SearchSuggestion {
  id: string;
  title: string;
  address: string;
  type: 'postal' | 'poi' | 'general';
  latitude?: number;
  longitude?: number;
  category?: string;
  distance?: string;
  postalCode?: string;
  province?: string;
  city?: string;
  district?: string;
  village?: string;
}

// Enhanced HTML content with Google Maps integration for better accuracy
const generateMapHTML = (lat: number, lng: number, useGoogleMaps: boolean = false) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { height: 100vh; width: 100vw; }
    .search-container {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      z-index: 1000;
      background: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      display: none;
    }
    .search-input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${lat}, ${lng}], 15);
    
    // Use OpenStreetMap tiles (free, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    
    // Add a draggable marker for current selection
    var marker = L.marker([${lat}, ${lng}], {draggable: true}).addTo(map);

    // Array to store POI markers
    var poiMarkers = [];

    // Function to create custom POI marker icon
    function createPOIIcon(category, color) {
      return L.divIcon({
        html: '<div style="background-color: ' + color + '; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 14px; color: white;">🏢</div>',
        className: 'poi-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
    }

    // Function to get category emoji

    // Function to add POI markers to map
    function addPOIMarkers(pois) {
      // Clear existing POI markers
      poiMarkers.forEach(marker => map.removeLayer(marker));
      poiMarkers = [];

      // Add new POI markers
      pois.forEach(poi => {
        const iconName = getCategoryIcon(poi.categoryId);
        const color = poi.color || '#6C7B7F';

        const icon = L.divIcon({
          html: '<div style="background-color: ' + color + '; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          className: 'poi-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const poiMarker = L.marker([poi.lat, poi.lng], {icon: icon}).addTo(map);

        // Add popup with POI information
        poiMarker.bindPopup('<b>' + poi.name + '</b><br>' + poi.address + '<br><small>' + poi.distance + '</small>');

        // Handle POI marker click
        poiMarker.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'poi_selected',
            poi: poi
          }));
        });

        poiMarkers.push(poiMarker);
      });
    }
    
    // Function to reverse geocode using Nominatim (OpenStreetMap's free geocoding service)
    async function reverseGeocode(lat, lng) {
      try {
        // API call with proper headers
        const response = await fetch(
          'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1',
          {
            headers: {
              'User-Agent': 'PawSmartApp/1.0'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Geocoding failed');
        }
        
        const data = await response.json();
        const addr = data.address || {};
        
        // Build address from components
        let addressParts = [];
        if (addr.road) addressParts.push(addr.road);
        if (addr.house_number) addressParts.push('No. ' + addr.house_number);
        if (addr.neighbourhood) addressParts.push(addr.neighbourhood);
        if (addr.suburb) addressParts.push(addr.suburb);
        if (addr.city_district) addressParts.push(addr.city_district);
        if (addr.city || addr.town || addr.village) {
          addressParts.push(addr.city || addr.town || addr.village);
        }
        if (addr.state) addressParts.push(addr.state);
        
        const formattedAddress = addressParts.length > 0 
          ? addressParts.join(', ')
          : data.display_name || 'Lat: ' + lat.toFixed(6) + ', Lng: ' + lng.toFixed(6);
        
        // Send data back to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'location_selected',
          latitude: lat,
          longitude: lng,
          address: formattedAddress,
          province: addr.state || '',
          city: addr.city || addr.town || addr.village || '',
          district: addr.city_district || addr.suburb || '',
          subDistrict: addr.neighbourhood || addr.hamlet || '',
          postalCode: addr.postcode || ''
        }));
      } catch (error) {
        // Send coordinates only if geocoding fails
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'location_selected',
          latitude: lat,
          longitude: lng,
          address: 'Lat: ' + lat.toFixed(6) + ', Lng: ' + lng.toFixed(6),
          province: '',
          city: '',
          district: '',
          subDistrict: '',
          postalCode: ''
        }));
      }
    }
    
    // Handle marker drag
    marker.on('dragend', function(e) {
      var position = marker.getLatLng();
      reverseGeocode(position.lat, position.lng);
    });
    
    // Handle map click
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
    
    // Notify React Native that map is ready
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'map_ready',
      latitude: ${lat},
      longitude: ${lng}
    }));

    // Don't send initial location_selected - wait for user to select location or GPS
    // This prevents race conditions with real GPS data
    
    // Accuracy circle for showing GPS accuracy
    var accuracyCircle = null;
    
    // Function to handle React Native messages
    function handleReactNativeMessage(data) {
      if (data.type === 'update_pois') {
        // Update POI markers on map
        addPOIMarkers(data.pois);

        // Send confirmation back to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'pois_updated',
          count: data.pois.length
        }));
      } else if (data.type === 'update_position') {
        // Update map position from React Native
        const lat = data.latitude;
        const lng = data.longitude;
        const animate = data.animate !== false;

        if (animate) {
          map.flyTo([lat, lng], 16, {
            duration: 1.5,
            easeLinearity: 0.25
          });
        } else {
          map.setView([lat, lng], 16);
        }
        marker.setLatLng([lat, lng]);

        // Send confirmation back to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'map_updated',
          latitude: lat,
          longitude: lng
        }));
      } else if (data.type === 'update_position_with_accuracy') {
        // Update position with accuracy circle
        const lat = data.latitude;
        const lng = data.longitude;
        const accuracy = data.accuracy || 50;

        map.flyTo([lat, lng], 17, {
          duration: 1.5,
          easeLinearity: 0.25
        });
        marker.setLatLng([lat, lng]);

        // Remove old accuracy circle if exists
        if (accuracyCircle) {
          map.removeLayer(accuracyCircle);
        }

        // Add new accuracy circle
        accuracyCircle = L.circle([lat, lng], {
          radius: accuracy,
          color: '#4285F4',
          fillColor: '#4285F4',
          fillOpacity: 0.15,
          weight: 2
        }).addTo(map);

        // Send confirmation back to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'map_updated',
          latitude: lat,
          longitude: lng,
          accuracy: accuracy
        }));

        // Auto reverse geocode the new position
        reverseGeocode(lat, lng);
      }
    }

    // Listen for messages from React Native (WebView uses window.ReactNativeWebView)
    window.addEventListener('message', function(e) {
      try {
        const data = JSON.parse(e.data);
        handleReactNativeMessage(data);
      } catch (error) {
        console.error('Error parsing WebView message:', error);
        // Send error back to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: 'Failed to parse message: ' + error.message
        }));
      }
    });

    // Also listen for document messages (backup method)
    document.addEventListener('message', function(e) {
      try {
        const data = JSON.parse(e.data);
        handleReactNativeMessage(data);
      } catch (error) {
        console.error('Error parsing document message:', error);
      }
    });
  </script>
</body>
</html>
`;

export default function MapPickerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const webViewRef = useRef<WebView>(null);

  // Default to Jakarta location
  const [region] = useState({
    latitude: -6.2088,
    longitude: 106.8456,
  });
  
  // Add state to track if WebView is ready
  const [isMapReady, setIsMapReady] = useState(false);
  const [useSimpleMode, setUseSimpleMode] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [fallbackTimeoutRef, setFallbackTimeoutRef] = useState<NodeJS.Timeout | null>(null);

  // Search suggestions state
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const selectedLocationRef = useRef<LocationData | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  // POI-related states
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [poiLoading, setPOILoading] = useState(false);
  const [lastPOIFetch, setLastPOIFetch] = useState<{lat: number, lng: number} | null>(null);
  const [showLocationList, setShowLocationList] = useState(false);
  const [userHasSelectedLocation, setUserHasSelectedLocation] = useState(false);

  // Simple mode states
  const [manualAddress, setManualAddress] = useState('');

  // Helper function to update both state and ref
  const updateSelectedLocation = (location: LocationData | null) => {
    setSelectedLocation(location);
    selectedLocationRef.current = location;
  };

  // Cleanup fallback timeout on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef) {
        clearTimeout(fallbackTimeoutRef);
      }
    };
  }, [fallbackTimeoutRef]);

  // Cleanup search requests and timeouts on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending search requests
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
        searchAbortControllerRef.current = null;
      }

      // Clear any pending search debounce timeout
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
        setSearchDebounceTimeout(null);
      }
    };
  }, [searchDebounceTimeout]);

  // Fetch nearby POIs using the POI service
  const fetchNearbyPOIs = async (centerLat: number, centerLng: number): Promise<NearbyLocation[]> => {
    try {
      setPOILoading(true);

      // Check if we already fetched for this location to avoid unnecessary requests
      if (lastPOIFetch &&
          Math.abs(lastPOIFetch.lat - centerLat) < 0.001 &&
          Math.abs(lastPOIFetch.lng - centerLng) < 0.001) {
        setPOILoading(false);
        return nearbyLocations.filter(loc => loc.type === 'poi');
      }

      const result = await poiService.getNearbyPOIs(centerLat, centerLng, {
        radius: 1000, // 1km radius
        categories: ['all'], // Show all categories
        limit: 10,
        includeDistance: true
      });

      const poiLocations: NearbyLocation[] = result.pois.map((poi: POI) => ({
        id: poi.id,
        name: poi.name,
        address: poi.address || `${poi.category.name} di ${poi.latitude.toFixed(4)}, ${poi.longitude.toFixed(4)}`,
        distance: poi.distance || '0m',
        latitude: poi.latitude,
        longitude: poi.longitude,
        type: 'poi' as const,
        category: poi.category,
      }));

      setLastPOIFetch({ lat: centerLat, lng: centerLng });
      setPOILoading(false);
      return poiLocations;
    } catch (error) {
      console.error('Error fetching POIs:', error);
      setPOILoading(false);

      // Fallback to hardcoded suggestions if POI service fails
      return generateFallbackLocations(centerLat, centerLng);
    }
  };

  // Fallback locations when POI service is unavailable
  const generateFallbackLocations = (centerLat: number, centerLng: number): NearbyLocation[] => {
    const baseLocations = [
      {
        name: 'Plaza Indonesia',
        address: 'Jl. M.H. Thamrin No.28-30, Menteng, Jakarta Pusat',
        fullAddress: { province: 'DKI Jakarta', city: 'Jakarta Pusat', district: 'Menteng', postalCode: '10310' },
        offsetLat: 0.001, offsetLng: 0.001
      },
      {
        name: 'Grand Indonesia',
        address: 'Jl. M.H. Thamrin No.1, Menteng, Jakarta Pusat',
        fullAddress: { province: 'DKI Jakarta', city: 'Jakarta Pusat', district: 'Menteng', postalCode: '10310' },
        offsetLat: -0.0015, offsetLng: 0.0008
      },
      {
        name: 'Bundaran HI',
        address: 'Jl. M.H. Thamrin, Menteng, Jakarta Pusat',
        fullAddress: { province: 'DKI Jakarta', city: 'Jakarta Pusat', district: 'Menteng', postalCode: '10310' },
        offsetLat: 0.0008, offsetLng: -0.0012
      },
    ];

    return baseLocations.map((loc, index) => {
      const lat = centerLat + loc.offsetLat;
      const lng = centerLng + loc.offsetLng;
      const distance = Math.floor(Math.random() * 500 + 50);

      return {
        id: `fallback_${index}`,
        name: loc.name,
        address: loc.address,
        distance: `${distance}m`,
        latitude: lat,
        longitude: lng,
        type: 'suggestion' as const,
        fullAddressData: loc.fullAddress,
      };
    }).slice(0, 3);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    let newCategories: string[];

    if (categoryId === 'all') {
      newCategories = ['all'];
    } else {
      // Remove 'all' if selecting specific category
      const filteredCategories = selectedCategories.filter(id => id !== 'all');

      if (filteredCategories.includes(categoryId)) {
        // Remove category if already selected
        newCategories = filteredCategories.filter(id => id !== categoryId);
        // If no categories selected, select 'all'
        if (newCategories.length === 0) {
          newCategories = ['all'];
        }
      } else {
        // Add category
        newCategories = [...filteredCategories, categoryId];
      }
    }

    setSelectedCategories(newCategories);

    // Refresh POI data if we have a location
    if (selectedLocation) {
      setLastPOIFetch(null); // Reset cache
      updateNearbyLocationsWithPOI(selectedLocation.latitude, selectedLocation.longitude);
    }
  };

  // Update nearby locations with POI data
  const updateNearbyLocationsWithPOI = async (lat: number, lng: number) => {
    const currentLocation: NearbyLocation = {
      id: 'current',
      name: 'Lokasi Dipilih',
      address: selectedLocation?.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      distance: '0m',
      latitude: lat,
      longitude: lng,
      type: 'current',
    };

    // Fetch POI data
    const poiLocations = await fetchNearbyPOIs(lat, lng);
    setNearbyLocations([currentLocation, ...poiLocations]);

    // Send POI data to WebView for map markers
    if (webViewRef.current && poiLocations.length > 0) {
      const poiData = poiLocations.map(poi => ({
        name: poi.name,
        address: poi.address,
        distance: poi.distance,
        lat: poi.latitude,
        lng: poi.longitude,
        categoryId: poi.category?.id || 'all',
        color: poi.category?.color || '#6C7B7F'
      }));

      webViewRef.current.postMessage(JSON.stringify({
        type: 'update_pois',
        pois: poiData
      }));
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (location: NearbyLocation) => {
    setMapLoading(true);

    try {
      // Update map position
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'update_position',
        latitude: location.latitude,
        longitude: location.longitude,
        animate: true
      }));

      // Parse location data from address if POI doesn't have explicit location fields
      let parsedCity = location.fullAddressData?.city || location.city || '';
      let parsedProvince = location.fullAddressData?.province || location.province || '';
      let parsedDistrict = location.fullAddressData?.district || location.district || '';

      // If POI doesn't have location data, try to parse from address or use coordinates
      if (!parsedCity && location.address) {
        const addressLower = location.address.toLowerCase();

        // Jakarta area detection
        if (addressLower.includes('jakarta')) {
          parsedCity = 'Jakarta';
          parsedProvince = 'DKI Jakarta';
        }
        // West Java cities
        else if (addressLower.includes('depok')) {
          parsedCity = 'Depok';
          parsedProvince = 'Jawa Barat';
        } else if (addressLower.includes('bogor')) {
          parsedCity = 'Bogor';
          parsedProvince = 'Jawa Barat';
        } else if (addressLower.includes('bandung')) {
          parsedCity = 'Bandung';
          parsedProvince = 'Jawa Barat';
        } else if (addressLower.includes('bekasi')) {
          parsedCity = 'Bekasi';
          parsedProvince = 'Jawa Barat';
        }
        // Central Java
        else if (addressLower.includes('semarang')) {
          parsedCity = 'Semarang';
          parsedProvince = 'Jawa Tengah';
        }
        // East Java
        else if (addressLower.includes('surabaya')) {
          parsedCity = 'Surabaya';
          parsedProvince = 'Jawa Timur';
        }
        // If no city found in address, we'll rely on coordinate-based lookup
      }

      // Update selected location with POI or location data - preserve original data without hardcoded fallbacks
      const completeLocationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.type === 'poi' ? `${location.name} - ${location.address}` : location.address,
        province: parsedProvince,
        city: parsedCity,
        district: parsedDistrict,
        subDistrict: location.fullAddressData?.subDistrict || location.subDistrict || '',
        postalCode: location.fullAddressData?.postalCode || location.postalCode || '',
        street: location.type === 'poi' ? location.name : (location.address.includes('Jl.') ? location.address.split(',')[0] : ''),
        rtRw: '',
        // Add POI specific data if it's a POI
        ...(location.type === 'poi' && {
          poiName: location.name,
          poiCategory: location.category?.name,
          poiType: location.category?.id,
        }),
      };

      updateSelectedLocation(completeLocationData);

      // Fallback: Clear loading state after animation time
      setTimeout(() => {
        setMapLoading(false);
      }, 1500); // Reduced timeout
    } catch (error) {
      console.error('Error updating map for suggestion:', error);
      setMapLoading(false);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'map_ready') {
        setIsMapReady(true);

        // Set default location to enable the button - use empty fallbacks instead of hardcoded Jakarta
        if (!selectedLocation) {
          const defaultLocation = {
            latitude: data.latitude || region.latitude,
            longitude: data.longitude || region.longitude,
            address: 'Lokasi Saat Ini',
            province: '',
            city: '',
            district: '',
            subDistrict: '',
            postalCode: '',
            street: '',
            rtRw: '',
          };
          updateSelectedLocation(defaultLocation);
        }
      } else if (data.type === 'location_selected') {
        const locationData = {
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address || `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
          province: data.province,
          city: data.city,
          district: data.district,
          subDistrict: data.subDistrict,
          postalCode: data.postalCode,
        };

        updateSelectedLocation(locationData);
        setUserHasSelectedLocation(true);

        // For manual selection, don't show the location list - just set the location
        setShowLocationList(false);

        // Generate nearby locations when user selects a location (but don't show the list)
        updateNearbyLocationsWithPOI(data.latitude, data.longitude);
        return; // Early return to avoid setting nearbyLocations twice
        // This will be handled by updateNearbyLocationsWithPOI above
        setIsLoading(false);
        setMapLoading(false);
      } else if (data.type === 'map_updated') {
        setMapLoading(false);

        // Clear fallback timeout since we got valid map update
        if (fallbackTimeoutRef) {
          clearTimeout(fallbackTimeoutRef);
          setFallbackTimeoutRef(null);
        }
      } else if (data.type === 'poi_selected') {
        // Handle POI selection from map
        const poi = data.poi;
        const poiLocation: NearbyLocation = {
          id: `poi_${poi.lat}_${poi.lng}`,
          name: poi.name,
          address: poi.address,
          distance: poi.distance,
          latitude: poi.lat,
          longitude: poi.lng,
          type: 'poi',
        };
        handleSuggestionSelect(poiLocation);
      } else if (data.type === 'pois_updated') {
        // POI markers updated on map
        console.log(`Updated ${data.count} POI markers on map`);
      } else if (data.type === 'error') {
        console.error('WebView error:', data.message);
        Alert.alert('Error', data.message);
        setIsLoading(false);
        setMapLoading(false);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      setIsLoading(false);
      setMapLoading(false);
    }
  };

  const handleSelectLocation = async () => {
    console.log('🔎 DEBUG - selectedLocation:', selectedLocation);
    console.log('🔎 DEBUG - region:', region);

    // Use selected location or default to current map center
    const locationToUse = selectedLocation || {
      latitude: region.latitude,
      longitude: region.longitude,
      address: 'Lokasi Saat Ini',
      province: '',
      city: '',
      district: '',
      subDistrict: '',
      postalCode: '',
      street: '',
      rtRw: '',
    };

    console.log('🔎 DEBUG - locationToUse (final):', locationToUse);
    console.log('🔎 DEBUG - locationToUse.city:', locationToUse.city);
    console.log('🔎 DEBUG - locationToUse.province:', locationToUse.province);
    console.log('🔎 DEBUG - locationToUse.district:', locationToUse.district);

    try {
      // Use postal service to enhance POI data with detailed location info
      let locationData = null;

      try {
        console.log('🔍 Searching postal service for detailed location data...');
        const results = await localLocationAPI.searchByCoordinates(
          locationToUse.latitude,
          locationToUse.longitude,
          5 // 5km radius
        );

        if (results && results.length > 0) {
          locationData = results[0];
          console.log('✅ Found postal service data:', locationData);
        } else {
          console.log('⚠️ No postal service data found for coordinates');
        }
      } catch (error) {
        console.log('⚠️ Postal service search failed:', error);
      }

      // Enhanced location data - preserve POI data and enhance with postal service
      const enhancedLocationData = {
        latitude: locationToUse.latitude,
        longitude: locationToUse.longitude,
        fullAddress: locationToUse.address,

        // Preserve POI data first, enhance with postal service data
        province: locationToUse.province || locationData?.province || '',
        city: locationToUse.city || locationData?.regency || '',
        district: locationToUse.district || locationData?.district || '',
        subDistrict: locationToUse.subDistrict || locationData?.village || '',
        postalCode: locationToUse.postalCode || locationData?.code?.toString() || '',

        // Additional address components (keep original format)
        street: locationToUse.street || '',
        rtRw: locationToUse.rtRw || '',
        accuracy: locationToUse.accuracy
      };

      console.log('🎯 Final location data being sent to AddAddress:', enhancedLocationData);


      // Navigate back with enhanced location data
      // Preserve any existing parameters (like isEditing, addressId, etc.)
      navigation.navigate('AddAddress' as any, {
        ...route.params, // Preserve original parameters from AddAddress
        selectedLocation: enhancedLocationData
      });

    } catch (error) {
      console.error('Error processing location data:', error);

      // Navigate to AddAddress with original location data
      navigation.navigate('AddAddress' as any, {
        ...route.params, // Preserve original parameters from AddAddress
        selectedLocation: {
          latitude: locationToUse.latitude,
          longitude: locationToUse.longitude,
          fullAddress: locationToUse.address,
          province: locationToUse.province || '',
          city: locationToUse.city || '',
          district: locationToUse.district || '',
          subDistrict: locationToUse.subDistrict || '',
          postalCode: locationToUse.postalCode || '',
          street: locationToUse.street || '',
          rtRw: locationToUse.rtRw || '',
          accuracy: locationToUse.accuracy,
          formattedAddress: {
            province: locationToUse.province || '',
            city: locationToUse.city || '',
            district: locationToUse.district || '',
            subDistrict: locationToUse.subDistrict || '',
            postalCode: locationToUse.postalCode || '',
            streetAddress: locationToUse.street || '',
            rtRw: locationToUse.rtRw || '',
            fullText: locationToUse.address
          }
        }
      });
    }
  };

  // Real-time search with debouncing for suggestions
  const handleSearchInput = (text: string) => {
    setSearchText(text);

    // Clear existing timeout
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }

    // Hide suggestions if search is empty
    if (!text.trim()) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      setSearchLoading(false); // Stop loading if clearing search
      return;
    }

    // Show suggestions immediately for fast response
    setShowSearchSuggestions(true);

    // Set new debounced timeout
    const timeout = setTimeout(async () => {
      // Double-check the search text hasn't changed
      if (text.trim() === searchText.trim()) {
        await performSuggestionSearch(text.trim());
      }
    }, 300); // Reduced delay for faster response

    setSearchDebounceTimeout(timeout);
  };

  // Helper function to get business category label
  const getBusinessCategory = (result: any): string => {
    if (result.type === 'restaurant' || result.name?.toLowerCase().includes('restaurant')) {
      return '🍽️ Restaurant';
    }
    if (result.type === 'bank' || result.name?.toLowerCase().includes('bank') || result.name?.toLowerCase().includes('bca')) {
      return '🏦 Bank';
    }
    if (result.type === 'atm' || result.name?.toLowerCase().includes('atm')) {
      return '🏧 ATM';
    }
    if (result.type === 'hotel' || result.name?.toLowerCase().includes('hotel')) {
      return '🏨 Hotel';
    }
    if (result.class === 'shop' || result.type === 'shop') {
      return '🛍️ Shop';
    }
    if (result.type === 'fuel' || result.name?.toLowerCase().includes('pertamina') || result.name?.toLowerCase().includes('shell')) {
      return '⛽ Gas Station';
    }
    return '📍 Place';
  };

  // Perform location-filtered search (near current location)
  const performLocationFilteredSearch = async (query: string) => {
    if (!selectedLocation) return;

    // Cancel previous search if exists
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;

    setSearchLoading(true);
    const suggestions: SearchSuggestion[] = [];

    try {
      console.log(`🌍 Location-filtered search for "${query}" near ${selectedLocation.latitude}, ${selectedLocation.longitude}`);

      // Search within 10km radius of current location
      const bbox = calculateBoundingBox(selectedLocation.latitude, selectedLocation.longitude, 10); // 10km radius

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&bounded=1&viewbox=${bbox.west},${bbox.south},${bbox.east},${bbox.north}&limit=10&accept-language=id&countrycodes=id`,
        {
          signal: abortController.signal,
          headers: { 'User-Agent': 'PawSmartApp/1.0' }
        }
      );

      if (response.ok) {
        const results = await response.json();
        console.log(`🌍 Location-filtered search returned ${results.length} results near current location`);

        results.forEach((result: any, index: number) => {
          const addressParts = result.display_name.split(',');
          const title = addressParts[0]?.trim() || query;
          const categoryLabel = getBusinessCategory(result);

          let address = result.display_name;
          if (categoryLabel) {
            address = `${categoryLabel} • ${address}`;
          }

          suggestions.push({
            id: `nearby_${index}`,
            title: title,
            address: address,
            type: 'general',
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            category: categoryLabel || undefined,
          });
        });
      }

      // Only update state if not aborted
      if (!abortController.signal.aborted) {
        console.log(`🌍 Setting ${suggestions.length} nearby search suggestions`);
        setSearchSuggestions(suggestions.slice(0, 8));
        setShowSearchSuggestions(true);
      }

    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error('Location-filtered search error:', error);
      }
    } finally {
      if (searchAbortControllerRef.current === abortController) {
        setSearchLoading(false);
        searchAbortControllerRef.current = null;
      }
    }
  };

  // Calculate bounding box for location filtering
  const calculateBoundingBox = (lat: number, lng: number, radiusKm: number) => {
    const latDegPerKm = 1 / 111.32;
    const lngDegPerKm = 1 / (111.32 * Math.cos(lat * Math.PI / 180));

    return {
      north: lat + (radiusKm * latDegPerKm),
      south: lat - (radiusKm * latDegPerKm),
      east: lng + (radiusKm * lngDegPerKm),
      west: lng - (radiusKm * lngDegPerKm)
    };
  };

  // Perform suggestion search across multiple sources (Google Maps-like)
  const performSuggestionSearch = async (query: string) => {
    // Cancel previous search if exists
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;

    setSearchLoading(true);
    const suggestions: SearchSuggestion[] = [];

    try {
      // Check if already aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Strategy 1: General location search FIRST (like Google Maps)
      // This handles specific building names, addresses, and landmarks
      try {
        // First try: Specific search
        let response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Indonesia')}&limit=5&accept-language=id&countrycodes=id`,
          {
            signal: abortController.signal,
            headers: {
              'User-Agent': 'PawSmartApp/1.0'
            }
          }
        );

        if (response.ok) {
          const results = await response.json();
          console.log(`🔍 General search returned ${results.length} results for "${query}"`);

          // Categorize results by type for better user experience
          const categorizedResults = {
            areas: [] as any[],
            businesses: [] as any[],
            amenities: [] as any[]
          };

          results.forEach((result: any) => {
            console.log(`🔍 Processing result: ${result.name} | type: ${result.type} | class: ${result.class} | addresstype: ${result.addresstype}`);

            // Area-level results (highest priority)
            const areaTypes = [
              'village', 'town', 'city', 'suburb', 'district',
              'neighbourhood', 'quarter', 'hamlet', 'place'
            ];

            if (areaTypes.includes(result.type) ||
                areaTypes.includes(result.addresstype)) {
              console.log(`✅ Added to areas: ${result.name}`);
              categorizedResults.areas.push(result);
              return;
            }

            // Business/commercial places
            const businessTypes = ['shop', 'restaurant', 'hotel', 'bank', 'atm'];
            const businessClasses = ['shop', 'amenity'];

            const isBusinessType = businessTypes.includes(result.type);
            const isBusinessClass = businessClasses.includes(result.class);

            console.log(`🔍 Business check for ${result.name}: type match=${isBusinessType}, class match=${isBusinessClass}`);

            if (isBusinessType || isBusinessClass) {
              // Add category label for businesses
              const categoryLabel = getBusinessCategory(result);
              result.categoryLabel = categoryLabel;
              console.log(`✅ Added to businesses: ${result.name} with category: ${categoryLabel}`);
              categorizedResults.businesses.push(result);
              return;
            }

            // Other amenities and buildings
            console.log(`➡️ Added to amenities: ${result.name}`);
            categorizedResults.amenities.push(result);
          });

          // Combine results with priority: areas first, then businesses, then amenities
          const prioritizedResults = [
            ...categorizedResults.areas.slice(0, 2),      // Max 2 area results
            ...categorizedResults.businesses.slice(0, 4),  // Max 4 business results
            ...categorizedResults.amenities.slice(0, 2)   // Max 2 other results
          ];

          // Process prioritized results
          prioritizedResults.forEach((result: any, index: number) => {
            // Extract meaningful title from display_name
            const addressParts = result.display_name.split(',');
            const title = addressParts[0]?.trim() || query;
            let address = result.display_name;

            // Add category prefix for businesses
            if (result.categoryLabel) {
              address = `${result.categoryLabel} • ${address}`;
            }

            suggestions.push({
              id: `general_${index}`,
              title: title,
              address: address,
              type: 'general',
              latitude: parseFloat(result.lat),
              longitude: parseFloat(result.lon),
              category: result.categoryLabel || undefined,
            });
          });

          // Log what we found for debugging
          console.log(`🔍 Search "${query}": Found ${categorizedResults.areas.length} areas, ${categorizedResults.businesses.length} businesses, ${categorizedResults.amenities.length} amenities. Using ${prioritizedResults.length} results.`);
        }
      } catch (error) {
        console.log('General search failed:', error);
      }

      // Strategy 2: Search local postal codes (for area names)
      try {
        const postalResults = await localLocationAPI.searchPostalCodes(query);
        if (postalResults.data && postalResults.data.length > 0) {
          postalResults.data.slice(0, 3).forEach((result, index) => {
            suggestions.push({
              id: `postal_${index}`,
              title: `${result.village}, ${result.district}`,
              address: `${result.regency}, ${result.province} ${result.postal_code}`,
              type: 'postal',
              latitude: undefined, // Will be enhanced with coordinates
              longitude: undefined,
              postalCode: result.postal_code,
              province: result.province,
              city: result.regency,
              district: result.district,
              village: result.village,
            });
          });
        }
      } catch (error) {
        console.log('Postal search failed:', error);
      }

      // Strategy 3: Search POIs (for nearby places, but with timeout handling)
      if (selectedLocation && suggestions.length < 6) {
        try {
          // Check if already aborted
          if (abortController.signal.aborted) {
            return;
          }

          // Use shorter timeout and smaller radius for responsiveness
          const searchLat = selectedLocation.latitude;
          const searchLng = selectedLocation.longitude;

          // Add timeout to POI search with abort signal
          const timeoutPromise = new Promise((_, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('POI search timeout'));
            }, 3000);

            // Cancel timeout if aborted
            abortController.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              reject(new Error('POI search aborted'));
            });
          });

          const poiPromise = poiService.searchPOIs(query, searchLat, searchLng, 3000);
          const poiResults = await Promise.race([poiPromise, timeoutPromise]) as any[];

          // Check if aborted before processing results
          if (abortController.signal.aborted) {
            return;
          }

          if (poiResults && poiResults.length > 0) {
            poiResults.slice(0, 2).forEach((poi, index) => {
              suggestions.push({
                id: `poi_${index}`,
                title: poi.name,
                address: `${poi.category.name} - ${poi.distance || 'Nearby'}`,
                type: 'poi',
                latitude: poi.latitude,
                longitude: poi.longitude,
                category: poi.category.name,
                distance: poi.distance,
              });
            });
          }
        } catch (error) {
          // Only log if not aborted
          if (!abortController.signal.aborted) {
            console.log('POI search failed (timeout or error):', error);
          }
          // Don't block the search if POI fails
        }
      }

      // Sort suggestions: general first (for building names), then postal, then POI
      suggestions.sort((a, b) => {
        const typeOrder = { general: 0, postal: 1, poi: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      // Only update state if not aborted
      if (!abortController.signal.aborted) {
        console.log(`🔍 Setting ${suggestions.length} search suggestions, showing: ${suggestions.length > 0}`);
        setSearchSuggestions(suggestions.slice(0, 8)); // Limit to 8 suggestions
        setShowSearchSuggestions(true); // Always show when search is performed

        // Hide suggestions after 10 seconds if no interaction
        setTimeout(() => {
          if (suggestions.length === 0) {
            setShowSearchSuggestions(false);
          }
        }, 10000);
      }

    } catch (error) {
      // Only log error if not aborted
      if (!abortController.signal.aborted) {
        console.error('Search suggestions error:', error);
      }
    } finally {
      // Only clear loading if this is the current search
      if (searchAbortControllerRef.current === abortController) {
        setSearchLoading(false);
        searchAbortControllerRef.current = null;
      }
    }
  };

  // Handle search suggestion selection with enhanced location processing
  const handleSearchSuggestionSelect = async (suggestion: SearchSuggestion) => {
    setSearchText(suggestion.title);
    setShowSearchSuggestions(false);
    setIsLoading(true);

    try {
      let finalLat = suggestion.latitude;
      let finalLng = suggestion.longitude;

      // For postal suggestions without coordinates, find them using coordinate search
      if (!finalLat || !finalLng) {
        try {
          // Search for coordinates using the postal code/location info
          const searchQuery = suggestion.type === 'postal'
            ? `${suggestion.village}, ${suggestion.district}, ${suggestion.city}, ${suggestion.province}`
            : suggestion.address;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=id&countrycodes=id`,
            {
              headers: {
                'User-Agent': 'PawSmartApp/1.0'
              }
            }
          );

          if (response.ok) {
            const results = await response.json();
            if (results && results.length > 0) {
              finalLat = parseFloat(results[0].lat);
              finalLng = parseFloat(results[0].lon);
            }
          }
        } catch (error) {
          console.log('Failed to get coordinates for suggestion:', error);
        }
      }

      if (!finalLat || !finalLng) {
        Alert.alert('Error', 'Gagal mendapatkan koordinat lokasi');
        setIsLoading(false);
        return;
      }

      // Update map position first
      setMapLoading(true);
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'update_position',
        latitude: finalLat,
        longitude: finalLng,
        animate: true
      }));

      // Create initial location data
      const locationToUse = {
        latitude: finalLat,
        longitude: finalLng,
        address: suggestion.address,
        province: suggestion.province || '',
        city: suggestion.city || '',
        district: suggestion.district || '',
        subDistrict: suggestion.village || '',
        postalCode: suggestion.postalCode || '',
        street: suggestion.title,
        rtRw: '',
        accuracy: undefined
      };

      // Apply the same enhanced location processing as POI selection
      try {
        console.log('🔍 Enhancing search result with coordinate-based location data...');
        const results = await localLocationAPI.searchByCoordinates(
          finalLat,
          finalLng,
          5 // 5km radius
        );

        let locationData = null;
        if (results && results.length > 0) {
          locationData = results[0];
          console.log('✅ Found postal service data for search result:', locationData);
        }

        // Enhanced location data - preserve suggestion data and enhance with postal service
        const enhancedLocationData = {
          latitude: finalLat,
          longitude: finalLng,
          fullAddress: suggestion.address,

          // Preserve suggestion data first, enhance with postal service data
          province: locationToUse.province || locationData?.province || '',
          city: locationToUse.city || locationData?.regency || '',
          district: locationToUse.district || locationData?.district || '',
          subDistrict: locationToUse.subDistrict || locationData?.village || '',
          postalCode: locationToUse.postalCode || locationData?.code?.toString() || '',

          // Additional address components
          street: locationToUse.street || '',
          rtRw: locationToUse.rtRw || '',
          accuracy: locationToUse.accuracy
        };

        console.log('🎯 Final enhanced search result data:', enhancedLocationData);
        updateSelectedLocation(enhancedLocationData);
        setUserHasSelectedLocation(true);

        // Don't navigate immediately - let user see the map and decide
        console.log('📍 Location updated on map. User can now choose "Pilih Lokasi Ini" if satisfied.');

      } catch (error) {
        console.log('⚠️ Postal service enhancement failed for search result:', error);
        // Fallback to original suggestion data
        updateSelectedLocation(locationToUse);
        setUserHasSelectedLocation(true);

        console.log('📍 Fallback location updated on map. User can now choose "Pilih Lokasi Ini" if satisfied.');
      }

    } catch (error) {
      console.error('Suggestion selection error:', error);
      Alert.alert('Error', 'Gagal memilih lokasi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;

    // Hide suggestions when performing direct search
    setShowSearchSuggestions(false);
    setIsLoading(true);

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Timeout', 'Pencarian memakan waktu terlalu lama. Silakan coba lagi.');
    }, 15000);

    try {
      // Use the same strategy as suggestions: General location search FIRST
      let searchResults = null;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText + ' Indonesia')}&limit=1&accept-language=id&countrycodes=id`,
          {
            headers: {
              'User-Agent': 'PawSmartApp/1.0'
            }
          }
        );

        if (response.ok) {
          const results = await response.json();
          if (results && results.length > 0) {
            searchResults = results[0];
            console.log('✅ Found general search result:', searchResults);
          }
        }
      } catch (error) {
        console.log('General search failed:', error);
      }

      // If general search found results, use them
      if (searchResults) {
        clearTimeout(timeout);
        const lat = parseFloat(searchResults.lat);
        const lng = parseFloat(searchResults.lon);

        // Update map position
        setMapLoading(true);
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'update_position',
          latitude: lat,
          longitude: lng,
          animate: true
        }));

        // Create initial location data
        const addressParts = searchResults.display_name.split(',');
        const initialLocationData = {
          latitude: lat,
          longitude: lng,
          address: searchResults.display_name,
          province: '',
          city: '',
          district: '',
          subDistrict: '',
          postalCode: '',
          street: addressParts[0]?.trim() || searchText,
          rtRw: '',
        };

        // Apply coordinate-based enhancement
        try {
          console.log('🔍 Enhancing search result with coordinate-based location data...');
          const results = await localLocationAPI.searchByCoordinates(
            lat,
            lng,
            5 // 5km radius
          );

          let locationData = null;
          if (results && results.length > 0) {
            locationData = results[0];
            console.log('✅ Found postal service data for search result:', locationData);
          }

          const enhancedLocationData = {
            ...initialLocationData,
            fullAddress: initialLocationData.address,
            province: initialLocationData.province || locationData?.province || '',
            city: initialLocationData.city || locationData?.regency || '',
            district: initialLocationData.district || locationData?.district || '',
            subDistrict: initialLocationData.subDistrict || locationData?.village || '',
            postalCode: initialLocationData.postalCode || locationData?.code?.toString() || '',
          };

          console.log('🎯 Enhanced search result:', enhancedLocationData);
          updateSelectedLocation(enhancedLocationData);
        } catch (error) {
          console.log('⚠️ Search enhancement failed:', error);
          updateSelectedLocation(initialLocationData);
        }

        // Update nearby locations
        updateNearbyLocationsWithPOI(lat, lng).catch(error => {
          console.error('Error updating POI locations for search:', error);
        });
        setIsLoading(false);
        return;
      }

      // If no results found, show not found message
      clearTimeout(timeout);
      Alert.alert('Tidak Ditemukan', 'Lokasi tidak ditemukan. Coba kata kunci lain.');

      setIsLoading(false);

    } catch (error) {
      clearTimeout(timeout);
      console.error('Search error:', error);
      Alert.alert('Error', 'Gagal mencari lokasi. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    
    // Add timeout with longer duration for high accuracy
    const timeout = setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Timeout', 
        'Tidak dapat mendapatkan lokasi akurat. Pastikan GPS aktif dan Anda berada di area terbuka.',
        [
          { text: 'Coba Lagi', onPress: () => handleGetCurrentLocation() },
          { text: 'Batal', style: 'cancel' }
        ]
      );
    }, 30000); // Increased timeout for better accuracy
    
    try {
      // Request permission with clear explanation
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        clearTimeout(timeout);
        setIsLoading(false);
        Alert.alert(
          'Izin Lokasi Diperlukan',
          'Aplikasi memerlukan akses lokasi untuk menentukan posisi Anda dengan akurat. Silakan aktifkan izin lokasi di pengaturan.',
          [
            { text: 'Buka Pengaturan', onPress: () => Location.requestForegroundPermissionsAsync() },
            { text: 'Batal', style: 'cancel' }
          ]
        );
        return;
      }
      
      // Check if location services are enabled
      const locationServicesEnabled = await Location.hasServicesEnabledAsync();
      if (!locationServicesEnabled) {
        clearTimeout(timeout);
        setIsLoading(false);
        Alert.alert(
          'GPS Tidak Aktif',
          'Silakan aktifkan GPS/Location Services di pengaturan perangkat Anda untuk mendapatkan lokasi yang akurat.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Enhanced location accuracy with multiple attempts and progressive improvement
      let bestLocation = null;
      let bestAccuracy = Infinity;
      const maxAttempts = 5; // Increased attempts for better accuracy
      const accuracyThreshold = 20; // Target accuracy in meters (improved from 50)
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          // Use highest accuracy settings with timeout per attempt
          const locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 0,
            timeInterval: 0,
            mayShowUserSettingsDialog: true, // Prompt user to enable high accuracy if needed
          });
          
          // Timeout per attempt to avoid hanging
          const attemptTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Attempt timeout')), 6000)
          );
          
          const location = await Promise.race([locationPromise, attemptTimeout]) as Location.LocationObject;
          
          // Track best location based on accuracy
          if (location.coords.accuracy && location.coords.accuracy < bestAccuracy) {
            bestLocation = location;
            bestAccuracy = location.coords.accuracy;
            
            // If we achieve target accuracy, stop trying
            if (bestAccuracy <= accuracyThreshold) {
              break;
            }
          }
          
          // Wait a bit before next attempt to allow GPS to stabilize
          if (attempt < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (e) {
          // Continue to next attempt
          if (attempt === maxAttempts - 1 && !bestLocation) {
            throw new Error('Failed to get location after all attempts');
          }
        }
      }
      
      if (!bestLocation) {
        throw new Error('Unable to determine location');
      }
      
      const location = bestLocation
      
      clearTimeout(timeout);
      const { latitude, longitude, accuracy, altitude, altitudeAccuracy } = location.coords;
      
      // Show accuracy indicator to user
      const accuracyText = accuracy ? `(Akurasi: ±${Math.round(accuracy)}m)` : '';
      
      // Update map position with accuracy circle
      setMapLoading(true);
      try {
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'update_position_with_accuracy',
          latitude,
          longitude,
          accuracy: accuracy || 50
        }));


        // Clear any existing fallback timeout
        if (fallbackTimeoutRef) {
          clearTimeout(fallbackTimeoutRef);
          setFallbackTimeoutRef(null);
        }

        // Fallback: Clear loading state and update UI anyway if no response
        const timeoutId = setTimeout(() => {
          setMapLoading(false);
          setFallbackTimeoutRef(null); // Clear the reference since timeout ran

          // Direct fallback: Only update if we don't have valid location data from WebView
          // Check if we have proper address data (not just coordinates) - if so, WebView worked
          const currentLocation = selectedLocationRef.current;
          const coordinateString = `${currentLocation?.latitude?.toFixed(6)}, ${currentLocation?.longitude?.toFixed(6)}`;

          const hasValidWebViewData = currentLocation &&
            currentLocation.address &&
            currentLocation.address !== coordinateString &&
            (currentLocation.province || currentLocation.city);

          if (!hasValidWebViewData) {

            const fallbackLocation = {
              latitude,
              longitude,
              address: `Lokasi Saat Ini - ${accuracy ? 'Akurasi ±' + Math.round(accuracy) + 'm' : 'GPS Location'}`,
              province: '',
              city: '',
              district: '',
              subDistrict: '',
              postalCode: '',
              street: '',
              rtRw: '',
              accuracy: accuracy,
            };

            setSelectedLocation(fallbackLocation);

            updateNearbyLocationsWithPOI(latitude, longitude).catch(error => {
              console.error('Error updating POI locations in fallback:', error);
            });

          } else {
          }
        }, 2000); // Reduced timeout to 2 seconds

        // Store timeout reference so we can clear it if WebView responds
        setFallbackTimeoutRef(timeoutId);
      } catch (error) {
        console.error('Error sending message to WebView:', error);
        setMapLoading(false);
      }
      
      // Set location immediately with coordinates and accuracy info
      const initialLocation = {
        latitude,
        longitude,
        address: `Lokasi Saat Ini ${accuracyText}`,
        province: '',
        city: '',
        district: '',
        subDistrict: '',
        postalCode: '',
        street: '',
        rtRw: '',
        accuracy: accuracy,
        altitude: altitude,
        altitudeAccuracy: altitudeAccuracy
      };
      
      setSelectedLocation(initialLocation);
      setIsLoading(false);
      
      // Enhanced geocoding with multiple services for better accuracy
      try {
        // Try Google Maps Geocoding first if available (requires API key)
        // For now, use enhanced Nominatim with better parsing
        const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=id&countrycodes=id`;
        
        const response = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'PawSmartApp/1.0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const addr = data.address || {};
          
          // Enhanced Indonesian address component extraction
          // Better mapping for Indonesian administrative divisions
          const street = addr.road || addr.pedestrian || addr.footway || '';
          const houseNumber = addr.house_number || '';
          
          // RT/RW extraction from neighbourhood or display name
          let rtRw = addr.neighbourhood || '';
          if (!rtRw && data.display_name) {
            const rtRwMatch = data.display_name.match(/RT\s*\d+\/RW\s*\d+/i);
            if (rtRwMatch) rtRw = rtRwMatch[0];
          }
          
          // Indonesian administrative hierarchy
          const kelurahan = addr.suburb || addr.village || addr.hamlet || '';
          const kecamatan = addr.city_district || addr.county || addr.municipality || '';
          const kota = addr.city || addr.town || addr.regency || '';
          const provinsi = addr.state || addr.province || '';
          const kodePos = addr.postcode || '';
          
          // Build formatted address with proper Indonesian format
          let addressParts = [];
          if (street) {
            addressParts.push(street);
            if (houseNumber) addressParts[0] = `${street} No. ${houseNumber}`;
          }
          if (rtRw) addressParts.push(rtRw);
          if (kelurahan) addressParts.push(`Kel. ${kelurahan}`);
          if (kecamatan) addressParts.push(`Kec. ${kecamatan}`);
          if (kota) addressParts.push(kota);
          if (provinsi) addressParts.push(provinsi);
          if (kodePos) addressParts.push(kodePos);
          
          const formattedAddress = addressParts.length > 0 
            ? addressParts.join(', ')
            : data.display_name || initialLocation.address;
          
          // Prepare complete location data for Odoo integration
          const updatedLocation = {
            latitude,
            longitude,
            address: formattedAddress,
            province: provinsi || '', // No default - preserve original data
            city: kota || '',
            district: kecamatan,
            subDistrict: kelurahan,
            postalCode: kodePos || '', // No default - preserve original data
            street: street + (houseNumber ? ` No. ${houseNumber}` : ''),
            rtRw: rtRw,
            accuracy: accuracy,
            // Additional fields for Odoo
            country: 'Indonesia',
            countryCode: 'ID',
            formattedForOdoo: {
              name: formattedAddress,
              street: street + (houseNumber ? ` No. ${houseNumber}` : ''),
              street2: rtRw ? `${rtRw}${kelurahan ? ', Kel. ' + kelurahan : ''}` : '',
              city: kota || '',
              state_id: provinsi || '',
              zip: kodePos || '',
              country_id: 'Indonesia',
              partner_latitude: latitude,
              partner_longitude: longitude
            }
          };
          
          setSelectedLocation(updatedLocation);

          // Generate nearby locations for current position
          updateNearbyLocationsWithPOI(latitude, longitude).catch(error => {
            console.error('Error updating POI locations for current position:', error);
          });
          // Show location list when GPS location is obtained
          setShowLocationList(true);
          setUserHasSelectedLocation(true);
        }
      } catch (geocodeError) {
        // Fallback: Use coordinates with basic formatting for Odoo
        const fallbackLocation = {
          ...initialLocation,
          address: `Lokasi: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} ${accuracyText}`,
          formattedForOdoo: {
            name: `Lokasi GPS ${accuracyText}`,
            street: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
            street2: '',
            city: '',
            state_id: '',
            zip: '',
            country_id: 'Indonesia',
            partner_latitude: latitude,
            partner_longitude: longitude
          }
        };
        setSelectedLocation(fallbackLocation);

        // Generate nearby locations for fallback
        updateNearbyLocationsWithPOI(latitude, longitude).catch(error => {
          console.error('Error updating POI locations for fallback:', error);
        });
        // Show location list when GPS fallback is used
        setShowLocationList(true);
        setUserHasSelectedLocation(true);
      }
      
    } catch (error) {
      clearTimeout(timeout);
      Alert.alert(
        'Error Mendapatkan Lokasi',
        'Tidak dapat menentukan lokasi Anda. Pastikan:\n\n' +
        '1. GPS/Location Services aktif\n' +
        '2. Anda berada di area dengan sinyal yang baik\n' +
        '3. Aplikasi memiliki izin lokasi\n\n' +
        'Coba lagi atau pilih lokasi manual di peta.',
        [
          { text: 'Coba Lagi', onPress: () => handleGetCurrentLocation() },
          { text: 'Pilih Manual', style: 'cancel' }
        ]
      );
      setIsLoading(false);
    }
  };
  
  const handleSimpleModeSubmit = () => {
    if (!manualAddress.trim()) {
      Alert.alert('Error', 'Silakan masukkan alamat');
      return;
    }
    
    // Navigate back with manually entered address and defaults
    const manualLocationData = {
      latitude: region.latitude,
      longitude: region.longitude,
      fullAddress: manualAddress,
      province: '',
      city: '',
      district: '',
      subDistrict: '',
      postalCode: '',
      street: manualAddress,
      rtRw: '',
      formattedAddress: {
        province: '',
        city: '',
        district: '',
        subDistrict: '',
        postalCode: '',
        streetAddress: manualAddress,
        rtRw: '',
        fullText: manualAddress
      }
    };

    navigation.navigate('AddAddress' as any, {
      selectedLocation: manualLocationData
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alamat - Map</Text>
        <TouchableOpacity onPress={() => setUseSimpleMode(!useSimpleMode)}>
          <MaterialIcons
            name={useSimpleMode ? "map" : "edit-location"}
            size={24}
            color={Colors.primary.main}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar - Only show in map mode */}
      {!useSimpleMode && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={Colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari alamat atau tempat"
              value={searchText}
              onChangeText={handleSearchInput}
              onSubmitEditing={() => {
                // Filter by current location when Enter is pressed
                if (searchText.trim() && selectedLocation) {
                  performLocationFilteredSearch(searchText.trim());
                } else if (searchText.trim()) {
                  performSuggestionSearch(searchText.trim());
                }
              }}
              placeholderTextColor={Colors.text.tertiary}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchText('');
                setSearchSuggestions([]);
                setShowSearchSuggestions(false);
                if (searchDebounceTimeout) {
                  clearTimeout(searchDebounceTimeout);
                }
              }}>
                <MaterialIcons name="close" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>


          {/* Search Suggestions Dropdown */}
          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <View style={styles.searchSuggestionsContainer}>
              {searchLoading && (
                <View style={styles.searchLoadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary.main} />
                  <Text style={styles.searchLoadingText}>Mencari...</Text>
                </View>
              )}

              <FlatList
                data={searchSuggestions}
                keyExtractor={(item) => item.id}
                style={styles.suggestionsList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSearchSuggestionSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionIcon}>
                      {/* Show category-specific icons */}
                      {item.category?.includes('Restaurant') && (
                        <MaterialIcons name="restaurant" size={20} color="#FF6B35" />
                      )}
                      {item.category?.includes('Bank') && (
                        <MaterialIcons name="account-balance" size={20} color="#2E7D32" />
                      )}
                      {item.category?.includes('ATM') && (
                        <MaterialIcons name="atm" size={20} color="#1976D2" />
                      )}
                      {item.category?.includes('Hotel') && (
                        <MaterialIcons name="hotel" size={20} color="#7B1FA2" />
                      )}
                      {item.category?.includes('Shop') && (
                        <MaterialIcons name="shopping-bag" size={20} color="#F57C00" />
                      )}
                      {item.category?.includes('Gas Station') && (
                        <MaterialIcons name="local-gas-station" size={20} color="#D32F2F" />
                      )}
                      {/* Default icons for other types */}
                      {!item.category && item.type === 'general' && (
                        <MaterialIcons name="business" size={20} color={Colors.primary.main} />
                      )}
                      {item.type === 'postal' && (
                        <MaterialIcons name="location-on" size={20} color={Colors.secondary.main} />
                      )}
                      {item.type === 'poi' && (
                        <MaterialIcons name="place" size={20} color={Colors.text.secondary} />
                      )}
                      {item.category?.includes('Place') && (
                        <MaterialIcons name="place" size={20} color={Colors.primary.main} />
                      )}
                    </View>
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.suggestionAddress} numberOfLines={3}>
                        {item.address}
                      </Text>
                      {item.distance && (
                        <Text style={styles.suggestionDistance}>
                          {item.distance}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              />
            </View>
          )}

          {/* POI Loading Indicator */}
          {poiLoading && (
            <View style={styles.poiLoadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary.main} />
              <Text style={styles.poiLoadingText}>Mencari tempat...</Text>
            </View>
          )}
        </View>
      )}

      {/* Map or Simple Mode */}
      {useSimpleMode ? (
        // Simple manual address input mode
        <View style={styles.simpleContainer}>
          <View style={styles.simpleCard}>
            <MaterialIcons name="location-on" size={48} color={Colors.primary.main} />
            <Text style={styles.simpleTitle}>Masukkan Alamat Manual</Text>
            <Text style={styles.simpleDescription}>
              Ketik alamat lengkap Anda di bawah ini
            </Text>

            <TextInput
              style={styles.simpleTextArea}
              placeholder="Contoh: Jl. Sudirman No. 123, RT 001/RW 002, Kelurahan Senayan, Kecamatan Kebayoran Baru, Jakarta Selatan 12190"
              value={manualAddress}
              onChangeText={setManualAddress}
              multiline
              numberOfLines={4}
              placeholderTextColor={Colors.text.tertiary}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.simpleSubmitButton,
                !manualAddress.trim() && styles.simpleSubmitButtonDisabled
              ]}
              onPress={handleSimpleModeSubmit}
              disabled={!manualAddress.trim()}
            >
              <Text style={styles.simpleSubmitButtonText}>Gunakan Alamat Ini</Text>
            </TouchableOpacity>

            <Text style={styles.simpleTip}>
              💡 Tip: Anda bisa beralih ke mode peta dengan menekan ikon di pojok kanan atas
            </Text>
          </View>
        </View>
      ) : (
        // Map mode with split layout
        <>
          {/* Map Container - Dynamic height based on location list visibility */}
          <View style={[
            styles.mapContainer,
            showLocationList ? styles.mapContainerWithList : styles.mapContainerFullScreen
          ]}>
            <WebView
              ref={webViewRef}
              source={{ html: generateMapHTML(region.latitude, region.longitude) }}
              style={styles.map}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              onLoad={() => {
                // Don't set isMapReady here, wait for map_ready message from WebView
              }}
              onError={(error) => {
                Alert.alert('Error', 'Failed to load map. Please try again.');
              }}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary.main} />
                  <Text style={styles.loadingText}>Memuat peta...</Text>
                </View>
              )}
              originWhitelist={['*']}
              mixedContentMode="compatibility"
              allowsInlineMediaPlayback={true}
            />

            {/* Current Location Button */}
            <TouchableOpacity
              style={[
                styles.currentLocationButton,
                isLoading && styles.currentLocationButtonLoading
              ]}
              onPress={handleGetCurrentLocation}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size={20} color={Colors.primary.main} />
              ) : (
                <MaterialIcons name="my-location" size={24} color={Colors.primary.main} />
              )}
            </TouchableOpacity>

            {/* Map Loading Overlay */}
            {mapLoading && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary.main} />
              </View>
            )}
          </View>

          {/* Button for manual selections (when location is selected but list is not shown) */}
          {userHasSelectedLocation && selectedLocation && !showLocationList && (
            <View style={styles.floatingButtonContainer}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#00BCD4',
                  paddingVertical: 14,
                  marginHorizontal: 16,
                  marginBottom: 20,
                  borderRadius: 8,
                  alignItems: 'center',
                  minHeight: 48,
                  elevation: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                }}
                onPress={() => {
                  console.log('🔴 FLOATING BUTTON PRESSED!');
                  handleSelectLocation();
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                }}>Pilih Lokasi Ini</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Sheet - Show only when we need to display the location list */}
          {userHasSelectedLocation && showLocationList && (
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHandle} />

              {/* Only show button when user has actively selected a location */}
              {userHasSelectedLocation && selectedLocation && (
                <TouchableOpacity
                style={{
                  backgroundColor: '#00BCD4',
                  paddingVertical: 14,
                  marginHorizontal: 0, // No horizontal margin for full width
                  marginTop: 6,
                  marginBottom: 12,
                  borderRadius: 0, // No border radius for full width like reference
                  alignItems: 'center',
                  minHeight: 48, // Good height for full width button
                  width: '100%', // Explicitly full width
                }}
                onPress={() => {
                  console.log('🔴 COMPACT BUTTON PRESSED!');
                  handleSelectLocation();
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 15, // Smaller font
                  fontWeight: '600',
                }}>Pilih Lokasi Ini</Text>
              </TouchableOpacity>
              )}

              {/* Nearby Locations List */}
              {showLocationList && (
              <View style={styles.locationsContainer}>
              <FlatList
                data={nearbyLocations}
                style={styles.locationsList}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.locationItem,
                      selectedLocation?.latitude === item.latitude &&
                      selectedLocation?.longitude === item.longitude &&
                      styles.locationItemSelected
                    ]}
                    onPress={() => handleSuggestionSelect(item)}
                  >
                    <View style={[
                      styles.locationIcon,
                      item.type === 'current' && styles.locationIconCurrent,
                      item.type === 'poi' && styles.locationIconPOI
                    ]}>
                      <MaterialIcons
                        name={
                          item.type === 'current'
                            ? 'my-location'
                            : item.category?.icon || 'location-on'
                        }
                        size={20}
                        color={Colors.background.primary}
                      />
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{item.name}</Text>
                      <Text style={styles.locationAddress} numberOfLines={2}>{item.address}</Text>
                    </View>
                    <Text style={styles.locationDistance}>{item.distance}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.emptyLocations}>
                    <MaterialIcons name="location-searching" size={48} color={Colors.text.tertiary} />
                    <Text style={styles.emptyLocationsText}>Pilih lokasi di peta untuk melihat saran lokasi terdekat</Text>
                  </View>
                )}
              />
              </View>
              )}
            </View>
          )}
        </>
      )}


      {/* Global Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Mendapatkan alamat...</Text>
        </View>
      )}
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
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  poiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  poiLoadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  mapContainer: {
    position: 'relative',
  },
  mapContainerWithList: {
    height: screenHeight * 0.4, // 40% when location list is shown
  },
  mapContainerFullScreen: {
    flex: 1, // Take all available space when no location list
  },
  map: {
    flex: 1,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10, // Higher elevation to stay above floating button
    zIndex: 1001, // Higher z-index than floating button
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  currentLocationButtonLoading: {
    opacity: 0.7,
    backgroundColor: Colors.background.secondary,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  bottomSheet: {
    height: screenHeight * 0.6, // Increased to 60% for more space
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.xs, // Reduced margin
    marginBottom: Spacing.xs, // Reduced margin
  },
  locationsContainer: {
    flex: 1, // Use all available space in bottomSheet
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    flexDirection: 'column', // Ensure column layout
  },
  locationsList: {
    height: screenHeight * 0.32, // Reduced to 32% to leave space for bottom button
    marginBottom: Spacing.sm,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md, // Increased back to md for better size
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm, // Increased margin for better spacing
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    elevation: 2,
    minHeight: 72, // Increased height for better visibility
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationItemSelected: {
    backgroundColor: '#E3F2FD', // Light blue background for better contrast
    borderWidth: 2,
    borderColor: '#2196F3', // Brighter blue border
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  locationIconCurrent: {
    backgroundColor: Colors.success.main,
  },
  locationIconPOI: {
    backgroundColor: Colors.secondary.main,
  },
  locationInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  locationName: {
    fontSize: Typography.fontSize.sm, // Smaller font size
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs / 2, // Reduced margin
  },
  locationAddress: {
    fontSize: Typography.fontSize.xs, // Smaller font size
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    lineHeight: 16, // Reduced line height
  },
  locationDistance: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.tertiary,
  },
  emptyLocations: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyLocationsText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  bottomSheetFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
    minHeight: 80,
    justifyContent: 'center',
  },
  selectLocationButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minHeight: 50, // Slightly larger for better visibility
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectLocationButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
    opacity: 0.5,
  },
  selectLocationButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  simpleContainer: {
    flex: 1,
    padding: Spacing.base,
    backgroundColor: Colors.background.secondary,
  },
  simpleCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  simpleTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  simpleDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  simpleTextArea: {
    width: '100%',
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    marginBottom: Spacing.lg,
  },
  simpleSubmitButton: {
    width: '100%',
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  simpleSubmitButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
    opacity: 0.5,
  },
  simpleSubmitButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  simpleTip: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Search suggestions styles
  searchSuggestionsContainer: {
    position: 'absolute',
    top: 55, // Position below search bar
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    maxHeight: 300, // Limit height to prevent overflow
    zIndex: 9999, // Higher z-index
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchLoadingText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  suggestionsList: {
    maxHeight: 280,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  suggestionContent: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  suggestionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  suggestionAddress: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  suggestionDistance: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
});