import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';

interface AutoKirimModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (config: AutoKirimConfig) => void;
  productName: string;
}

interface AutoKirimConfig {
  period: number;
  unit: 'minggu' | 'bulan';
  startDate: Date;
  duration?: number;
  durationUnit?: 'minggu' | 'bulan';
}

const periodOptions = [
  { value: 2, unit: 'minggu' as const, label: '2 minggu' },
  { value: 1, unit: 'bulan' as const, label: '1 bulan' },
  { value: 2, unit: 'bulan' as const, label: '2 bulan' },
  { value: 3, unit: 'bulan' as const, label: '3 bulan' },
];

const durationOptions = [
  { value: 1, unit: 'bulan' as const, label: '1 bulan' },
  { value: 2, unit: 'bulan' as const, label: '2 bulan' },
  { value: 3, unit: 'bulan' as const, label: '3 bulan' },
  { value: 6, unit: 'bulan' as const, label: '6 bulan' },
  { value: 12, unit: 'bulan' as const, label: '1 tahun' },
  { value: null, unit: null, label: 'Tidak terbatas' },
];

export default function AutoKirimModal({
  visible,
  onClose,
  onConfirm,
  productName,
}: AutoKirimModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(periodOptions[0]);
  const [selectedDuration, setSelectedDuration] = useState(durationOptions[2]); // Default to 3 months
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [durationMode, setDurationMode] = useState<'limited' | 'unlimited'>('limited');

  const handleConfirm = () => {
    const config: AutoKirimConfig = {
      period: selectedPeriod.value,
      unit: selectedPeriod.unit,
      startDate: startDate,
    };

    if (durationMode === 'limited' && selectedDuration.value) {
      config.duration = selectedDuration.value;
      config.durationUnit = selectedDuration.unit || 'bulan';
    }

    onConfirm(config);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const calculateDeliverySchedule = () => {
    const schedules = [];
    const currentDate = new Date(startDate);
    
    // Calculate first 3 deliveries
    for (let i = 0; i < 3; i++) {
      if (selectedPeriod.unit === 'minggu') {
        currentDate.setDate(currentDate.getDate() + (selectedPeriod.value * 7));
      } else {
        currentDate.setMonth(currentDate.getMonth() + selectedPeriod.value);
      }
      schedules.push(new Date(currentDate));
    }
    
    return schedules;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Pengaturan AutoKirim</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Product Info */}
              <View style={styles.productInfo}>
                <MaterialIcons name="info-outline" size={20} color={Colors.primary.main} />
                <Text style={styles.productName}>{productName}</Text>
              </View>

              {/* Delivery Mode Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pengaturan berkesinambungan</Text>
                <Text style={styles.sectionDescription}>
                  Kirim terus hingga Anda menghentikan
                </Text>
                
                <View style={styles.modeSelection}>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      durationMode === 'limited' && styles.modeButtonActive
                    ]}
                    onPress={() => setDurationMode('limited')}
                  >
                    <MaterialIcons 
                      name={durationMode === 'limited' ? "radio-button-checked" : "radio-button-unchecked"} 
                      size={20} 
                      color={durationMode === 'limited' ? Colors.primary.main : Colors.text.tertiary} 
                    />
                    <Text style={[
                      styles.modeText,
                      durationMode === 'limited' && styles.modeTextActive
                    ]}>
                      Langganan dengan durasi
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      durationMode === 'unlimited' && styles.modeButtonActive
                    ]}
                    onPress={() => setDurationMode('unlimited')}
                  >
                    <MaterialIcons 
                      name={durationMode === 'unlimited' ? "radio-button-checked" : "radio-button-unchecked"} 
                      size={20} 
                      color={durationMode === 'unlimited' ? Colors.primary.main : Colors.text.tertiary} 
                    />
                    <Text style={[
                      styles.modeText,
                      durationMode === 'unlimited' && styles.modeTextActive
                    ]}>
                      Langganan berkelanjutan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Delivery Period */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Periode pengantaran</Text>
                <View style={styles.periodGrid}>
                  {periodOptions.map((option) => (
                    <TouchableOpacity
                      key={`${option.value}-${option.unit}`}
                      style={[
                        styles.periodButton,
                        selectedPeriod.value === option.value && 
                        selectedPeriod.unit === option.unit && 
                        styles.periodButtonActive
                      ]}
                      onPress={() => setSelectedPeriod(option)}
                    >
                      <Text style={[
                        styles.periodText,
                        selectedPeriod.value === option.value && 
                        selectedPeriod.unit === option.unit && 
                        styles.periodTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Duration Selection (if limited mode) */}
              {durationMode === 'limited' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Lama berlangganan</Text>
                  <View style={styles.durationGrid}>
                    {durationOptions.filter(opt => opt.value !== null).map((option) => (
                      <TouchableOpacity
                        key={`${option.value}-${option.unit}`}
                        style={[
                          styles.durationButton,
                          selectedDuration.value === option.value && 
                          selectedDuration.unit === option.unit && 
                          styles.durationButtonActive
                        ]}
                        onPress={() => setSelectedDuration(option)}
                      >
                        <Text style={[
                          styles.durationText,
                          selectedDuration.value === option.value && 
                          selectedDuration.unit === option.unit && 
                          styles.durationTextActive
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Start Date Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tanggal mulai pengiriman</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={20} color={Colors.primary.main} />
                  <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setStartDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              {/* Delivery Schedule Preview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Jadwal pengiriman</Text>
                <View style={styles.schedulePreview}>
                  <Text style={styles.scheduleText}>Pengiriman pertama:</Text>
                  <Text style={styles.scheduleDate}>{formatDate(startDate)}</Text>
                  
                  <Text style={styles.scheduleText}>Pengiriman berikutnya:</Text>
                  {calculateDeliverySchedule().slice(0, 2).map((date, index) => (
                    <Text key={index} style={styles.scheduleDate}>
                      • {formatDate(date)}
                    </Text>
                  ))}
                  
                  {durationMode === 'limited' && selectedDuration.value && (
                    <View style={styles.endDateContainer}>
                      <Text style={styles.scheduleText}>Berakhir pada:</Text>
                      <Text style={styles.endDate}>
                        {formatDate((() => {
                          const endDate = new Date(startDate);
                          if (selectedDuration.unit === 'bulan') {
                            endDate.setMonth(endDate.getMonth() + selectedDuration.value);
                          } else {
                            endDate.setDate(endDate.getDate() + (selectedDuration.value * 7));
                          }
                          return endDate;
                        })())}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Batalkan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.base,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.light + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  productName: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  modeSelection: {
    gap: Spacing.sm,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: Spacing.sm,
  },
  modeButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light + '10',
  },
  modeText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  modeTextActive: {
    color: Colors.primary.main,
    fontFamily: Typography.fontFamily.medium,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  periodButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
  },
  periodButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main,
  },
  periodText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  periodTextActive: {
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.medium,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  durationButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
  },
  durationButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main,
  },
  durationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  durationTextActive: {
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.medium,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginTop: Spacing.sm,
  },
  dateText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  schedulePreview: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  scheduleText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  scheduleDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  endDateContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  endDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning.main,
    fontFamily: Typography.fontFamily.medium,
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  confirmButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.semibold,
  },
});