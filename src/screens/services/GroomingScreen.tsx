import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'Grooming'>;

type ServiceType = 'walkIn' | 'homeService' | null;

export default function GroomingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedService, setSelectedService] = useState<ServiceType>(null);

  const handleContinue = () => {
    if (!selectedService) return;
    
    if (selectedService === 'homeService') {
      navigation.navigate('GroomingHomeService');
    } else {
      navigation.navigate('GroomingWalkIn');
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#FFCC00" />
      <LinearGradient
        colors={['#FFCC00', '#FFD700']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color={Colors.text.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Salon</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Pattern Background */}
            <View style={styles.patternContainer}>
              {[...Array(15)].map((_, i) => (
                <Ionicons
                  key={i}
                  name="paw"
                  size={40}
                  color="rgba(255,255,255,0.1)"
                  style={[
                    styles.patternIcon,
                    {
                      top: Math.random() * 400,
                      left: Math.random() * 400,
                      transform: [{ rotate: `${Math.random() * 360}deg` }],
                    },
                  ]}
                />
              ))}
            </View>

            {/* Mascot Section */}
            <View style={styles.mascotSection}>
              <Image
                source={require('../../../assets/Grooming Maskot.png')}
                style={styles.mascotImage}
                resizeMode="contain"
              />
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
              <Text style={styles.title}>Pilih Jenis Layanan</Text>
              <Text style={styles.subtitle}>
                Silakan pilih cara yang paling nyaman untuk grooming hewan peliharaan Anda.
              </Text>

              {/* Service Options */}
              <View style={styles.serviceOptions}>
            {/* Walk-in Option */}
            <TouchableOpacity
              style={[
                styles.serviceOption,
                selectedService === 'walkIn' && styles.serviceOptionActive
              ]}
              onPress={() => setSelectedService('walkIn')}
            >
              <View style={styles.serviceOptionHeader}>
                <View style={[
                  styles.radioButton,
                  selectedService === 'walkIn' && styles.radioButtonActive
                ]}>
                  {selectedService === 'walkIn' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={styles.serviceOptionContent}>
                  <Text style={[
                    styles.serviceOptionTitle,
                    selectedService === 'walkIn' && styles.serviceOptionTitleActive
                  ]}>
                    Walk-in
                  </Text>
                  <Text style={styles.serviceOptionDescription}>
                    Kamu menjadwalkan mau datang ke salon.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Home Service Option */}
            <TouchableOpacity
              style={[
                styles.serviceOption,
                selectedService === 'homeService' && styles.serviceOptionActive
              ]}
              onPress={() => setSelectedService('homeService')}
            >
              <View style={styles.serviceOptionHeader}>
                <View style={[
                  styles.radioButton,
                  selectedService === 'homeService' && styles.radioButtonActive
                ]}>
                  {selectedService === 'homeService' && <View style={styles.radioButtonInner} />}
                </View>
                <View style={styles.serviceOptionContent}>
                  <Text style={[
                    styles.serviceOptionTitle,
                    selectedService === 'homeService' && styles.serviceOptionTitleActive
                  ]}>
                    Home Service
                  </Text>
                  <Text style={styles.serviceOptionDescription}>
                    Kamu menjadwalkan groomer datang ke rumah.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedService && styles.continueButtonDisabled
              ]}
              onPress={handleContinue}
              disabled={!selectedService}
            >
              <Text style={styles.continueButtonText}>Selanjutnya</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    overflow: 'hidden',
  },
  patternIcon: {
    position: 'absolute',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  mascotSection: {
    alignItems: 'center',
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
    zIndex: 2,
  },
  mascotImage: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 250,
    maxHeight: 250,
  },
  contentSection: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    marginTop: -BorderRadius['2xl'],
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    minHeight: 400,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  serviceOptions: {
    gap: Spacing.md,
  },
  serviceOption: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.primary,
    overflow: 'hidden',
  },
  serviceOptionActive: {
    borderColor: '#00BCD4',
    backgroundColor: '#E0F7FA',
  },
  serviceOptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  radioButtonActive: {
    borderColor: '#00BCD4',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: '#00BCD4',
  },
  serviceOptionContent: {
    flex: 1,
  },
  serviceOptionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  serviceOptionTitleActive: {
    color: '#00BCD4',
  },
  serviceOptionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
  },
  continueButton: {
    backgroundColor: '#00BCD4',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.white,
  },
});