import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { navigationRef } from '../services/navigationService';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import CustomTabBar from '../components/navigation/CustomTabBar';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import HomeScreen from '../screens/home/HomeScreen';
import NotificationScreen from '../screens/home/NotificationScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ServicesScreen from '../screens/services/ServicesScreen';
import PetDoctorScreen from '../screens/services/PetDoctorScreen';
import DoctorHomeServiceScreen from '../screens/services/DoctorHomeServiceScreen';
import DoctorWalkInScreen from '../screens/services/DoctorWalkInScreen';
import DoctorDetailScreen from '../screens/services/DoctorDetailScreen';
import PetSelectionScreen from '../screens/services/PetSelectionScreen';
import GroomingScreen from '../screens/services/GroomingScreen';
import GroomingWalkInScreen from '../screens/services/GroomingWalkInScreen';
import GroomingDetailScreen from '../screens/services/GroomingDetailScreen';
import GroomingHomeServiceScreen from '../screens/services/GroomingHomeServiceScreen';
import ActivityScreen from '../screens/activity/ActivityScreen';

// Pet Management Screens - Using original UI screens
import MyPetsScreen from '../screens/profile/MyPetsScreen';
import AddPetLandingScreen from '../screens/profile/AddPetLandingScreen';
import AddPetScreen from '../screens/profile/AddPetScreen';
import AddPetStepOneScreen from '../screens/profile/AddPetStepOneScreen';
import AddPetStepTwoScreen from '../screens/profile/AddPetStepTwoScreen';
import AddPetStepThreeScreen from '../screens/profile/AddPetStepThreeScreen';
import PetDetailScreen from '../screens/profile/PetDetailScreen';
import EditPetScreen from '../screens/profile/EditPetScreen';

// Address Management Screens (Profile)
import ProfileAddressListScreen from '../screens/profile/AddressListScreen';
import ProfileAddAddressScreen from '../screens/profile/AddAddressScreen';

// Address Management Screens (Shop)
import AddressListScreen from '../screens/shop/AddressListScreen';
import AddAddressScreen from '../screens/shop/AddAddressScreen';
import MapPickerScreen from '../screens/shop/MapPickerScreen';
import LocationPickerScreen from '../screens/shop/LocationPickerScreen';

// Profile Management Screens
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import FAQScreen from '../screens/profile/FAQScreen';
import TermsConditionsScreen from '../screens/profile/TermsConditionsScreen';
import AccountSettingsScreen from '../screens/profile/AccountSettingsScreen';

// Shopping Screens
import ProductDetailScreen from '../screens/home/ProductDetailScreen';
import CartScreen from '../screens/shop/CartScreen';
import CheckoutScreen from '../screens/shop/CheckoutScreen';
import PaymentMethodScreen from '../screens/shop/PaymentMethodScreen';
import ShippingOptionsScreen from '../screens/shop/ShippingOptionsScreen';
import VoucherSelectionScreen from '../screens/shop/VoucherSelectionScreen';
import DoctorRecommendationCartScreen from '../screens/shop/DoctorRecommendationCartScreen';

// Order Screens
import OrderHistoryScreen from '../screens/order/OrderHistoryScreen';
import OrderDetailScreen from '../screens/order/OrderDetailScreen';
import OrderTrackingScreen from '../screens/order/OrderTrackingScreen';
import CancelOrderScreen from '../screens/order/CancelOrderScreen';

// Payment Screens
import PaymentProcessScreen from '../screens/payment/PaymentProcessScreen';
import PaymentResultScreen from '../screens/shop/PaymentResultScreen';
import PaymentMethodSelectionScreen from '../screens/payment/PaymentMethodSelectionScreen';
import QRISPaymentScreen from '../screens/payment/QRISPaymentScreen';
import EwalletPaymentScreen from '../screens/payment/EwalletPaymentScreen';
import VirtualAccountPaymentScreen from '../screens/payment/VirtualAccountPaymentScreen';
import UniversalSuccessScreen from '../screens/payment/UniversalSuccessScreen';

// Import navigators
import PromoStack from './PromoStack';

// Navigation types
import { 
  RootStackParamList, 
  MainTabParamList, 
  AuthStackParamList,
  ProfileStackParamList,
  HomeStackParamList,
  ServicesStackParamList,
  PromoStackParamList,
  ActivityStackParamList
} from './types';

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const ServicesStack = createStackNavigator<ServicesStackParamList>();
const ActivityStack = createStackNavigator<ActivityStackParamList>();

// Placeholder screens
const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 20 }}>{title}</Text>
  </View>
);

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="OTP" component={OTPVerificationScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <ProfileStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <ProfileStack.Screen name="OTP" component={OTPVerificationScreen} />
      <ProfileStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <ProfileStack.Screen name="MyPets" component={MyPetsScreen} />
      <ProfileStack.Screen name="AddPet" component={AddPetScreen} />
      <ProfileStack.Screen name="AddPetLanding" component={AddPetLandingScreen} />
      <ProfileStack.Screen name="AddPetStepOne" component={AddPetStepOneScreen} />
      <ProfileStack.Screen name="AddPetStepTwo" component={AddPetStepTwoScreen} />
      <ProfileStack.Screen name="AddPetStepThree" component={AddPetStepThreeScreen} />
      <ProfileStack.Screen name="PetDetail" component={PetDetailScreen} />
      <ProfileStack.Screen name="EditPet" component={EditPetScreen} />
      <ProfileStack.Screen name="AddEditPet">
        {() => <PlaceholderScreen title="Add/Edit Pet" />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="AddVaccination">
        {() => <PlaceholderScreen title="Add Vaccination" />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="MyAddress" component={ProfileAddressListScreen} />
      <ProfileStack.Screen name="AddAddress" component={ProfileAddAddressScreen} />
      <ProfileStack.Screen name="EditAddress">
        {() => <PlaceholderScreen title="Edit Address" />}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="LocationPicker" component={LocationPickerScreen} />
      <ProfileStack.Screen name="MapPicker" component={MapPickerScreen} />
      <ProfileStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <ProfileStack.Screen name="FAQ" component={FAQScreen} />
      <ProfileStack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <ProfileStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <ProfileStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <ProfileStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <ProfileStack.Screen name="PaymentResult" component={PaymentResultScreen} />
      <ProfileStack.Screen name="CancelOrder" component={CancelOrderScreen} />
    </ProfileStack.Navigator>
  );
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="NotificationScreen" component={NotificationScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <HomeStack.Screen name="Cart" component={CartScreen} />
      <HomeStack.Screen name="Search">
        {() => <PlaceholderScreen title="Search" />}
      </HomeStack.Screen>
      <HomeStack.Screen name="Category">
        {() => <PlaceholderScreen title="Category" />}
      </HomeStack.Screen>
      <HomeStack.Screen name="Checkout" component={CheckoutScreen} />
      <HomeStack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
      <HomeStack.Screen name="ShippingOptions" component={ShippingOptionsScreen} />
      <HomeStack.Screen name="VoucherSelection" component={VoucherSelectionScreen} />
      <HomeStack.Screen name="DoctorCart" component={DoctorRecommendationCartScreen} />
      <HomeStack.Screen name="PaymentResult" component={PaymentResultScreen} />
      <HomeStack.Screen name="MyOrders" component={OrderHistoryScreen} />
      <HomeStack.Screen name="PaymentProcess" component={PaymentProcessScreen} />
      <HomeStack.Screen name="PaymentMethodSelection" component={PaymentMethodSelectionScreen} />
      <HomeStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <HomeStack.Screen name="CancelOrder" component={CancelOrderScreen} />
      <HomeStack.Screen name="AddressList" component={AddressListScreen} />
      <HomeStack.Screen name="AddAddress" component={AddAddressScreen} />
      <HomeStack.Screen name="MapPicker" component={MapPickerScreen} />
      <HomeStack.Screen name="LocationPicker" component={LocationPickerScreen} />
    </HomeStack.Navigator>
  );
}

function ServicesNavigator() {
  return (
    <ServicesStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ServicesStack.Screen name="ServicesHome" component={ServicesScreen} />
      <ServicesStack.Screen name="PetDoctor" component={PetDoctorScreen} />
      <ServicesStack.Screen name="DoctorHomeService" component={DoctorHomeServiceScreen} />
      <ServicesStack.Screen name="DoctorWalkIn" component={DoctorWalkInScreen} />
      <ServicesStack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
      <ServicesStack.Screen name="PetSelection" component={PetSelectionScreen} />
      <ServicesStack.Screen name="BookingDoctor">
        {() => <PlaceholderScreen title="Booking Doctor" />}
      </ServicesStack.Screen>
      <ServicesStack.Screen name="Grooming" component={GroomingScreen} />
      <ServicesStack.Screen name="GroomingWalkIn" component={GroomingWalkInScreen} />
      <ServicesStack.Screen name="GroomingHomeService" component={GroomingHomeServiceScreen} />
      <ServicesStack.Screen name="GroomingDetail" component={GroomingDetailScreen} />
      <ServicesStack.Screen name="BookingGrooming">
        {() => <PlaceholderScreen title="Booking Grooming" />}
      </ServicesStack.Screen>
    </ServicesStack.Navigator>
  );
}

function ActivityNavigator() {
  return (
    <ActivityStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ActivityStack.Screen name="ActivityScreen" component={ActivityScreen} />
      <ActivityStack.Screen name="Checkout" component={CheckoutScreen} />
      <ActivityStack.Screen name="Cart" component={CartScreen} />
      <ActivityStack.Screen name="PaymentResult" component={PaymentResultScreen} />
      <ActivityStack.Screen name="PaymentMethodSelection" component={PaymentMethodSelectionScreen} />
      <ActivityStack.Screen name="MyOrders" component={OrderHistoryScreen} />
    </ActivityStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Promo" component={PromoStack} />
      <Tab.Screen name="Services" component={ServicesNavigator} />
      <Tab.Screen name="Activity" component={ActivityNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.primary }}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={{ marginTop: 10, color: Colors.text.secondary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            {/* Payment screens as full-screen modals */}
            <Stack.Screen
              name="QRISPayment"
              component={QRISPaymentScreen}
              options={{
                presentation: 'modal',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="EwalletPayment"
              component={EwalletPaymentScreen}
              options={{
                presentation: 'modal',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="VirtualAccountPayment"
              component={VirtualAccountPaymentScreen}
              options={{
                presentation: 'modal',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="PaymentResult"
              component={PaymentResultScreen}
              options={{
                presentation: 'modal',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="UniversalSuccess"
              component={UniversalSuccessScreen}
              options={{
                presentation: 'card',
                gestureEnabled: false,
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}