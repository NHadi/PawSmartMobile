import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

export default function TermsConditionsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Syarat dan Ketentuan</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <Text style={styles.title}>Syarat dan Ketentuan</Text>

        {/* Introduction */}
        <Text style={styles.paragraph}>
          Harap baca Syarat dan Ketentuan ini ("Ketentuan") dengan seksama sebelum menggunakan aplikasi nexus.
        </Text>
        <Text style={styles.paragraph}>
          Dengan mendaftar dan menggunakan Aplikasi, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat dengan Ketentuan ini.
        </Text>

        {/* Section 1 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>1.</Text>
            <Text style={styles.sectionTitle}>Layanan Kami</Text>
          </View>
          <Text style={styles.sectionContent}>
            Peta aplikasi Nexus yang menyediakan platform untuk:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Menemukan pasangan atau teman bermain untuk hewan peliharaan.</Text>
            <Text style={styles.bulletItem}>• Mengatur janji temu dengan hewan lain.</Text>
            <Text style={styles.bulletItem}>• Mengatur playdate, adopsi, atau pertemanan hewan.</Text>
            <Text style={styles.bulletItem}>• Berkomunikasi dengan pemilik hewan lain.</Text>
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>2.</Text>
            <Text style={styles.sectionTitle}>Akun Pengguna</Text>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Anda harus berusia minimal 18 tahun untuk menggunakan aplikasi ini.</Text>
            <Text style={styles.bulletItem}>• Semua informasi profil yang Anda berikan harus akurat dan terkini dan segala aktivitas yang terjadi di dalamnya.</Text>
            <Text style={styles.bulletItem}>• Bertanggung jawab untuk menjaga kerahasiaan akun Anda dan segala aktivitas yang terjadi di dalamnya.</Text>
          </View>
        </View>

        {/* Section 3 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>3.</Text>
            <Text style={styles.sectionTitle}>Profil Hewan</Text>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Setiap pengguna boleh membuat profil satu atau lebih hewan peliharaan.</Text>
            <Text style={styles.bulletItem}>• Informasi tentang hewan, termasuk nama, usia, jenis, ras (jika diketahui), status vaksinasi, dan foto.</Text>
            <Text style={styles.bulletItem}>• Hewan yang dimasukkan ke dalam aplikasi harus merupakan hewan yang Anda berada dalam kepemilikan jangka lama.</Text>
          </View>
        </View>

        {/* Section 4 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>4.</Text>
            <Text style={styles.sectionTitle}>Interaksi & Pertemuan</Text>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Semua pertemuan atau interaksi antar pengguna harus dilakukan dengan persetujuan kedua belah pihak.</Text>
            <Text style={styles.bulletItem}>• Kami menyarankan agar pertemuan dilakukan di tempat umum yang aman.</Text>
            <Text style={styles.bulletItem}>• Pengguna bertanggung jawab atas kejadian yang timbul akibat interaksi fisik.</Text>
          </View>
        </View>

        {/* Section 5 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>5.</Text>
            <Text style={styles.sectionTitle}>Larangan</Text>
          </View>
          <Text style={styles.sectionContent}>
            Pengguna tidak diperbolehkan untuk:
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  paragraph: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  section: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  sectionNumber: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    flex: 1,
  },
  sectionContent: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  bulletList: {
    marginTop: Spacing.sm,
  },
  bulletItem: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  bottomSpacing: {
    height: 100,
  },
});