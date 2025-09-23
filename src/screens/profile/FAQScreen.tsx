import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Bagaimana cara saya melengkapi data pribadi saya?',
    answer: 'Lorem ipsum dolor sit amet consectetur. Sit gravida risus pellentesque magna laoreet arcu est. Morbi tellus volutpat amet quam ullamcorper nulla nunc aliquam nulla.',
  },
  {
    id: '2',
    question: 'Bagaimana cara saya melengkapi data pribadi saya?',
    answer: 'Untuk melengkapi data pribadi, buka menu Profile > Edit Profile. Isi semua field yang diperlukan seperti nama lengkap, email, nomor telepon, dan alamat. Pastikan data yang Anda masukkan benar dan valid.',
  },
  {
    id: '3',
    question: 'Bagaimana cara saya melengkapi data pribadi saya?',
    answer: 'Anda dapat melengkapi data pribadi dengan mengakses halaman pengaturan akun. Di sana Anda akan menemukan formulir untuk mengisi informasi personal Anda.',
  },
  {
    id: '4',
    question: 'Bagaimana cara saya melengkapi data pribadi saya?',
    answer: 'Data pribadi dapat dilengkapi melalui menu Profile. Klik Edit Profile dan lengkapi semua informasi yang diperlukan untuk memaksimalkan pengalaman Anda menggunakan aplikasi.',
  },
  {
    id: '5',
    question: 'Bagaimana cara saya melengkapi data pribadi saya?',
    answer: 'Silakan akses menu Profile, kemudian pilih Edit Profile. Isi semua data yang diperlukan dan simpan perubahan Anda.',
  },
  {
    id: '6',
    question: 'Bagaimana cara saya melengkapi data pribadi saya?',
    answer: 'Untuk melengkapi data pribadi, navigasi ke Profile > Edit Profile dan isi semua field yang tersedia.',
  },
];

export default function FAQScreen() {
  const navigation = useNavigation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const isExpanded = (id: string) => expandedItems.includes(id);

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
        <Text style={styles.headerTitle}>Pengaduan</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Title */}
        <Text style={styles.sectionTitle}>FAQ</Text>

        {/* FAQ Items */}
        <View style={styles.faqList}>
          {faqData.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.faqItem,
                index === 0 && styles.firstItem,
                index === faqData.length - 1 && styles.lastItem,
              ]}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>{item.question}</Text>
                <MaterialIcons
                  name={isExpanded(item.id) ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  size={24}
                  color={Colors.text.tertiary}
                />
              </View>
              {isExpanded(item.id) && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{item.answer}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
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
    backgroundColor: Colors.background.secondary,
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
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  faqList: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  faqItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  firstItem: {
    paddingTop: Spacing.lg,
  },
  lastItem: {
    borderBottomWidth: 0,
    paddingBottom: Spacing.lg,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
    lineHeight: 22,
  },
  answerContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  answerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});