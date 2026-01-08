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
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { ServicesStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<ServicesStackParamList, 'Grooming'>;

type ServiceType = 'walkIn' | 'homeService' | null;

import { THEME } from '../../constants/theme';

export default function GroomingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedService, setSelectedService] = useState<ServiceType>('walkIn');

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
          <Text style={styles.headerTitle}>Salon</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Icon Section */}
          <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="content-cut" size={48} color={THEME.yellow} />
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Pilih cara terbaik untuk merawat</Text>
            <Text style={styles.title}>hewan kesayangan Anda</Text>
          </View>

          {/* Service Options */}
          <View style={styles.serviceOptions}>
            {/* Walk-in Option */}
            <TouchableOpacity
              style={[
                styles.serviceCard,
                selectedService === 'walkIn' && styles.serviceCardSelected,
              ]}
              onPress={() => setSelectedService('walkIn')}
              activeOpacity={0.7}
            >
              <View style={styles.serviceCardContent}>
                <View style={styles.radioContainer}>
                  <View style={[
                    styles.radioButton,
                    selectedService === 'walkIn' && styles.radioButtonSelected,
                  ]}>
                    {selectedService === 'walkIn' && <View style={styles.radioButtonInner} />}
                  </View>
                </View>

                <View style={styles.serviceIconContainer}>
                  <View style={[styles.serviceIcon, { backgroundColor: '#E3F2FD' }]}>
                    <MaterialIcons name="store" size={24} color={THEME.blue} />
                  </View>
                </View>

                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>Walk-in</Text>
                  <Text style={styles.serviceSubtitle}>Kunjungi Salon</Text>
                  <Text style={styles.serviceDescription}>
                    Datang langsung ke salon kami untuk pengalaman grooming lengkap
                  </Text>
                  <View style={styles.serviceTags}>
                    <View style={styles.tag}>
                      <MaterialIcons name="schedule" size={12} color={THEME.textSecondary} />
                      <Text style={styles.tagText}>Lebih cepat</Text>
                    </View>
                    <View style={styles.tag}>
                      <MaterialIcons name="attach-money" size={12} color={THEME.textSecondary} />
                      <Text style={styles.tagText}>Lebih murah</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Home Service Option */}
            <TouchableOpacity
              style={[
                styles.serviceCard,
                selectedService === 'homeService' && styles.serviceCardSelected,
              ]}
              onPress={() => setSelectedService('homeService')}
              activeOpacity={0.7}
            >
              <View style={styles.serviceCardContent}>
                <View style={styles.radioContainer}>
                  <View style={[
                    styles.radioButton,
                    selectedService === 'homeService' && styles.radioButtonSelected,
                  ]}>
                    {selectedService === 'homeService' && <View style={styles.radioButtonInner} />}
                  </View>
                </View>

                <View style={styles.serviceIconContainer}>
                  <View style={[styles.serviceIcon, { backgroundColor: '#E8F5E9' }]}>
                    <MaterialIcons name="home" size={24} color={THEME.green} />
                  </View>
                </View>

                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>Home Service</Text>
                  <Text style={styles.serviceSubtitle}>Panggil ke Rumah</Text>
                  <Text style={styles.serviceDescription}>
                    Groomer profesional datang ke rumah Anda dengan peralatan lengkap
                  </Text>
                  <View style={styles.serviceTags}>
                    <View style={styles.tag}>
                      <MaterialIcons name="home" size={12} color={THEME.textSecondary} />
                      <Text style={styles.tagText}>Lebih nyaman</Text>
                    </View>
                    <View style={styles.tag}>
                      <MaterialIcons name="spa" size={12} color={THEME.textSecondary} />
                      <Text style={styles.tagText}>Stress-free</Text>
                    </View>
                  </View>
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
              !selectedService && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedService}
          >
            <Text style={styles.continueButtonText}>Lanjutkan</Text>
            <MaterialIcons name="arrow-forward" size={20} color={THEME.white} />
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
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
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
    paddingBottom: 100,
  },
  iconSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl * 2,
    paddingBottom: Spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  serviceOptions: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  serviceCard: {
    backgroundColor: THEME.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: THEME.border,
    overflow: 'hidden',
  },
  serviceCardSelected: {
    borderColor: THEME.primary,
  },
  serviceCardContent: {
    flexDirection: 'row',
    padding: Spacing.lg,
  },
  radioContainer: {
    paddingTop: Spacing.xs,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: THEME.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.primary,
  },
  serviceIconContainer: {
    marginLeft: Spacing.md,
    marginRight: Spacing.md,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  serviceSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: THEME.yellow,
    marginBottom: Spacing.sm,
  },
  serviceDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: THEME.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  serviceTags: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
    gap: Spacing.sm,
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
});
