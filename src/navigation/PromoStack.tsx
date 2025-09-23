import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PromoScreen from '../screens/promo/PromoScreen';
import ProductDetailScreen from '../screens/home/ProductDetailScreen';
import CartScreen from '../screens/shop/CartScreen';
import CheckoutScreen from '../screens/shop/CheckoutScreen';
import PaymentMethodScreen from '../screens/shop/PaymentMethodScreen';
import ShippingOptionsScreen from '../screens/shop/ShippingOptionsScreen';
import VoucherSelectionScreen from '../screens/shop/VoucherSelectionScreen';
import DoctorRecommendationCartScreen from '../screens/shop/DoctorRecommendationCartScreen';
import PaymentResultScreen from '../screens/shop/PaymentResultScreen';
import { PromoStackParamList } from './types';

const Stack = createStackNavigator<PromoStackParamList>();

export default function PromoStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PromoScreen" component={PromoScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
      <Stack.Screen name="ShippingOptions" component={ShippingOptionsScreen} />
      <Stack.Screen name="VoucherSelection" component={VoucherSelectionScreen} />
      <Stack.Screen name="DoctorCart" component={DoctorRecommendationCartScreen} />
      <Stack.Screen name="PaymentResult" component={PaymentResultScreen} />
    </Stack.Navigator>
  );
}