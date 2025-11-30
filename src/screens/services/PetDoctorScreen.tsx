import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'PetDoctor'>;

type ServiceType = 'walkIn' | 'homeService' | null;

// Consistent colors based on app theme
const THEME = {
  primary: Colors.primary.main, // #1C49C2 - Blue for Walk-in
  primaryLight: '#EEF2FB', // Light blue for backgrounds
  green: '#4CAF50', // Green for Home Service
  greenLight: '#E8F5E9', // Light green for backgrounds
  background: Colors.background.secondary, // #F5F5F5
  white: Colors.background.primary, // #FFFFFF
  textPrimary: Colors.text.primary, // #212121
  textSecondary: Colors.text.secondary, // #757575
  border: Colors.border.light, // #E0E0E0
};

export default function PetDoctorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedService, setSelectedService] = useState<ServiceType>('walkIn');

  const handleContinue = () => {
    if (!selectedService) return;

    if (selectedService === 'homeService') {
      navigation.navigate('DoctorHomeService');
    } else {
      navigation.navigate('DoctorWalkIn');
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.white} />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="chevron-left" size={28} color={THEME.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dokter</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stethoscope Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <FontAwesome5 name="stethoscope" size={40} color={THEME.primary} />
            </View>
          </View>

          {/* Title Text */}
          <Text style={styles.title}>
            Pilih cara yang paling nyaman untuk{'\n'}berkonsultasi dengan dokter hewan
          </Text>

          {/* Service Options */}
          <View style={styles.serviceOptions}>
            {/* Walk-in Option - Blue Theme */}
            <TouchableOpacity
              style={[
                styles.serviceCard,
                selectedService === 'walkIn' && styles.serviceCardActiveBlue
              ]}
              onPress={() => setSelectedService('walkIn')}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={[
                  styles.radioButton,
                  selectedService === 'walkIn' && styles.radioButtonActiveBlue
                ]}>
                  {selectedService === 'walkIn' && <View style={styles.radioButtonInnerBlue} />}
                </View>
                <View style={[
                  styles.serviceIconContainer,
                  { backgroundColor: THEME.primaryLight },
                  selectedService === 'walkIn' && { backgroundColor: THEME.primary }
                ]}>
                  <FontAwesome5
                    name="hospital"
                    size={18}
                    color={selectedService === 'walkIn' ? THEME.white : THEME.primary}
                  />
                </View>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>Walk-in</Text>
                  <Text style={[styles.cardSubtitle, { color: THEME.primary }]}>Kunjungi Klinik</Text>
                </View>
              </View>

              <Text style={styles.cardDescription}>
                Bawa hewan peliharaan Anda ke klinik atau rumah sakit hewan terdekat
              </Text>

              <View style={styles.tagsContainer}>
                <View style={styles.tag}>
                  <Ionicons name="time-outline" size={14} color={THEME.textSecondary} />
                  <Text style={styles.tagText}>Lebih cepat</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.dollarSign}>$</Text>
                  <Text style={styles.tagText}>Lebih murah</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Home Service Option - Green Theme */}
            <TouchableOpacity
              style={[
                styles.serviceCard,
                selectedService === 'homeService' && styles.serviceCardActiveGreen
              ]}
              onPress={() => setSelectedService('homeService')}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={[
                  styles.radioButton,
                  selectedService === 'homeService' && styles.radioButtonActiveGreen
                ]}>
                  {selectedService === 'homeService' && <View style={styles.radioButtonInnerGreen} />}
                </View>
                <View style={[
                  styles.serviceIconContainer,
                  { backgroundColor: THEME.greenLight },
                  selectedService === 'homeService' && { backgroundColor: THEME.green }
                ]}>
                  <Ionicons
                    name="home"
                    size={20}
                    color={selectedService === 'homeService' ? THEME.white : THEME.green}
                  />
                </View>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>Home Service</Text>
                  <Text style={[styles.cardSubtitle, { color: THEME.green }]}>Panggil ke Rumah</Text>
                </View>
              </View>

              <Text style={styles.cardDescription}>
                Dokter hewan akan datang ke rumah Anda untuk pemeriksaan dan perawatan
              </Text>

              <View style={styles.tagsContainer}>
                <View style={styles.tag}>
                  <Ionicons name="home-outline" size={14} color={THEME.textSecondary} />
                  <Text style={styles.tagText}>Lebih nyaman</Text>
                </View>
                <View style={styles.tag}>
                  <Ionicons name="heart-outline" size={14} color={THEME.textSecondary} />
                  <Text style={styles.tagText}>Stress-free</Text>
                </View>
              </View>
            </TouchableOpacity>
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
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Lanjutkan</Text>
            <MaterialIcons name="arrow-forward" size={20} color={THEME.white} style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: THEME.white,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  serviceOptions: {
    gap: Spacing.md,
  },
  serviceCard: {
    backgroundColor: THEME.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceCardActiveBlue: {
    borderColor: THEME.primary,
  },
  serviceCardActiveGreen: {
    borderColor: THEME.green,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioButtonActiveBlue: {
    borderColor: THEME.primary,
  },
  radioButtonActiveGreen: {
    borderColor: THEME.green,
  },
  radioButtonInnerBlue: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.primary,
  },
  radioButtonInnerGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.green,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  cardDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
    marginLeft: 38,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginLeft: 38,
    gap: Spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
  },
  dollarSign: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.textSecondary,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: THEME.background,
  },
  continueButton: {
    backgroundColor: THEME.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: THEME.white,
  },
  buttonIcon: {
    marginLeft: Spacing.sm,
  },
});
