import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Modal: undefined;
  QRISPayment: {
    paymentData: any;
    orderInfo: {
      orderId: string | number;
      orderName: string;
      totalAmount: number;
    };
  };
  EwalletPayment: {
    paymentData: any;
    orderInfo: {
      orderId: string | number;
      orderName: string;
      totalAmount: number;
    };
    paymentMethod?: {
      id: string;
      name: string;
      channelCode?: string;
      icon?: any;
    };
  };
  VirtualAccountPayment: {
    paymentData: any;
    orderInfo: {
      orderId: string | number;
      orderName: string;
      totalAmount: number;
    };
  };
  PaymentResult: {
    status: 'success' | 'failed' | 'cancelled';
    paymentDetails?: {
      transactionId: string;
      transactionType: string;
      timestamp: string;
      amount: number;
      orderId?: string | number;
      orderName?: string;
    };
  };
  UniversalSuccess: {
    orderId?: string | number;
    orderName?: string;
    totalAmount?: number;
    transactionId?: string;
    transactionType?: string;
    timestamp?: string;
  };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OTP: { 
    phoneNumber: string;
    registrationData?: {
      username: string;
      password: string;
      email: string;
      name: string;
      phone: string;
    };
    mode?: 'register' | 'forgot-password';
  };
  ForgotPassword: undefined;
  ResetPassword: {
    phoneNumber: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Promo: undefined;
  Services: undefined;
  Activity: undefined;
  Profile: undefined;
};

export type ActivityStackParamList = {
  ActivityScreen: undefined;
  Checkout: { orderId?: string; orderName?: string } | undefined;
  Cart: undefined;
  PaymentMethodSelection: {
    orderId: string | number;
    orderName: string;
    totalAmount: number;
    customerInfo?: {
      name: string;
      email?: string;
      phone?: string;
      items?: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
    };
  };
  MyOrders: { orderId?: string };
};

export type PromoStackParamList = {
  PromoScreen: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: { orderId?: string; orderName?: string } | undefined;
  PaymentMethod: undefined;
  ShippingOptions: undefined;
  VoucherSelection: undefined;
  DoctorCart: undefined;
  PaymentResult: {
    status: 'success' | 'failed' | 'cancelled';
    paymentDetails?: {
      transactionId: string;
      transactionType: string;
      timestamp: string;
      amount: number;
      orderId?: string | number;
      orderName?: string;
    };
  };
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  NotificationScreen: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Search: undefined;
  Category: { categoryId: string };
  Checkout: {
    orderId?: string;
    orderName?: string;
    selectedAddress?: any;
  } | undefined;
  PaymentMethod: undefined;
  ShippingOptions: {
    deliveryAddress?: any; // Selected delivery address from checkout
    selectedShipping?: any;
    selectedPayment?: any;
  };
  VoucherSelection: undefined;
  DoctorCart: undefined;
  MyOrders: { orderId?: string };
  AddressList: { isSelecting?: boolean };
  AddAddress: { 
    address?: any; 
    isEditing?: boolean;
  };
  LocationPicker: {
    onLocationSelected?: (location: any) => void;
  };
  MapPicker: {
    onLocationSelected?: (location: any) => void;
  };
  PaymentProcess: { 
    orderId: string | number; 
    orderName: string; 
    totalAmount: number; 
    paymentMethod: any;
  };
  PaymentMethodSelection: {
    orderId: string | number;
    orderName: string;
    totalAmount: number;
    customerInfo?: {
      name: string;
      email?: string;
      phone?: string;
      items?: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
    };
  };
  OrderDetail: { orderId: string };
  CancelOrder: { orderId: string };
  OrderSummary: { 
    orderId?: string;
    items?: any[];
    address?: any;
    shipping?: any;
    voucher?: any;
    payment?: any;
    total?: number;
  };
};

export type ServicesStackParamList = {
  ServicesHome: undefined;
  PetDoctor: undefined;
  DoctorHomeService: undefined;
  DoctorWalkIn: undefined;
  DoctorDetail: { doctorId: string };
  PetSelection: undefined;
  BookingDoctor: { doctorId: string; serviceType: 'homeService' | 'walkIn' };
  Grooming: undefined;
  GroomingWalkIn: undefined;
  GroomingHomeService: undefined;
  GroomingDetail: { groomingId: string };
  BookingGrooming: { groomingId: string; serviceType: 'homeService' | 'walkIn' };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  ForgotPassword: undefined;
  OTP: {
    phoneNumber: string;
    mode?: 'register' | 'forgot-password';
    registrationData?: {
      username: string;
      password: string;
      email: string;
      name: string;
      phone: string;
    };
  };
  ResetPassword: {
    phoneNumber: string;
  };
  MyPets: undefined;
  AddPet: undefined;
  AddPetLanding: undefined;
  AddPetStepOne: undefined;
  AddPetStepTwo: { stepOneData?: any };
  AddPetStepThree: { stepOneData?: any; stepTwoData?: any };
  PetDetail: { petId: string };
  EditPet: { petId: string };
  MyAddress: undefined;
  AddAddress: { 
    address?: any; 
    isEditing?: boolean;
    selectedLocation?: any;
  };
  EditAddress: { addressId: string };
  LocationPicker: {
    onLocationSelected?: (location: any) => void;
    selectedLocation?: any;
  };
  MapPicker: {
    onLocationSelected?: (location: any) => void;
    selectedLocation?: any;
  };
  AccountSettings: undefined;
  FAQ: undefined;
  TermsConditions: undefined;
  OrderHistory: undefined;
  OrderDetail: { orderId: string };
  OrderTracking: { orderId: string };
  CancelOrder: { orderId: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    StackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;