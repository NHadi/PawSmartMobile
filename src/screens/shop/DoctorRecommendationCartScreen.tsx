import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { HomeStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<HomeStackParamList, 'Cart'>;

interface RecommendedItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: any;
  selected: boolean;
}

export default function DoctorRecommendationCartScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  const [recommendedItems, setRecommendedItems] = useState<RecommendedItem[]>([
    {
      id: '1',
      name: 'Royal Care Cat',
      description: 'Obat Cacing',
      price: 30000,
      quantity: 1,
      image: require('../../../assets/product-placeholder.jpg'),
      selected: true,
    },
  ]);

  const calculateTotal = () => {
    return recommendedItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getSelectedItemsCount = () => {
    return recommendedItems.filter(item => item.selected).length;
  };

  const updateQuantity = (itemId: string, change: number) => {
    setRecommendedItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const toggleItemSelection = (itemId: string) => {
    setRecommendedItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    Alert.alert(
      'Hapus Produk',
      'Apakah Anda yakin ingin menghapus produk ini dari rekomendasi?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            setRecommendedItems(prevItems => prevItems.filter(item => item.id !== itemId));
          },
        },
      ]
    );
  };

  const addToCart = () => {
    Alert.alert(
      'Tambah ke Keranjang',
      'Produk rekomendasi dokter berhasil ditambahkan ke keranjang',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Cart'),
        },
      ]
    );
  };

  const total = calculateTotal();
  const selectedCount = getSelectedItemsCount();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rekomendasi Dokter</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Recommended Items */}
        <View style={styles.itemsContainer}>
          {recommendedItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => toggleItemSelection(item.id)}
              >
                {item.selected ? (
                  <MaterialIcons name="check-box" size={24} color={Colors.primary.main} />
                ) : (
                  <MaterialIcons name="check-box-outline-blank" size={24} color={Colors.text.tertiary} />
                )}
              </TouchableOpacity>

              <Image source={item.image} style={styles.itemImage} resizeMode="cover" />
              
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>- {item.description}</Text>
                <Text style={styles.itemPrice}>Rp{item.price.toLocaleString('id-ID')}</Text>
              </View>

              <View style={styles.quantityContainer}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  <MaterialIcons name="remove" size={20} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <MaterialIcons name="add" size={20} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => removeItem(item.id)}
              >
                <MaterialIcons name="delete-outline" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Summary */}
      <View style={styles.bottomContainer}>
        <View style={styles.summaryContainer}>
          <Text style={styles.selectedItemsText}>
            Item dipilih ({selectedCount})
          </Text>
          <Text style={styles.totalText}>
            Total : Rp {total.toLocaleString('id-ID')}
          </Text>
        </View>

        <TouchableOpacity 
          style={[
            styles.addToCartButton,
            selectedCount === 0 && styles.addToCartButtonDisabled
          ]}
          disabled={selectedCount === 0}
          onPress={addToCart}
        >
          <Text style={styles.addToCartButtonText}>Masukan Ke Keranjang</Text>
        </TouchableOpacity>
      </View>
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
  itemsContainer: {
    backgroundColor: Colors.background.primary,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  checkbox: {
    marginRight: Spacing.md,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  itemDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  itemPrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  quantityButton: {
    padding: Spacing.xs,
  },
  quantityText: {
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  bottomContainer: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  selectedItemsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  totalText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary.main,
  },
  addToCartButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  addToCartButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
  },
  addToCartButtonText: {
    color: Colors.text.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});