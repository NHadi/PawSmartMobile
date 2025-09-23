import React, { createContext, useContext, useReducer, ReactNode, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/spacing';
import { goToCart } from '../services/navigationService';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: any;
  quantity: number;
  discount: number;
  maxQuantity?: number; // Maximum stock available
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number; maxQuantity?: number } }
  | { type: 'CLEAR_CART' };

interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'>) => boolean; // Returns false if can't add due to stock limit
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number, maxQuantity?: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: string) => number;
  canAddMore: (id: string, maxQuantity?: number) => boolean;
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Convert IDs to strings for consistent comparison
      const existingItem = state.items.find(item => item.id.toString() === action.payload.id.toString());
      
      if (existingItem) {
        // Check if adding one more would exceed max quantity
        const maxQty = action.payload.maxQuantity || existingItem.maxQuantity;
        if (maxQty && existingItem.quantity >= maxQty) {
          // Can't add more, return current state
          return state;
        }
        
        const updatedItems = state.items.map(item =>
          item.id.toString() === action.payload.id.toString()
            ? { ...item, quantity: item.quantity + 1, maxQuantity: maxQty }
            : item
        );
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return {
          items: updatedItems,
          totalItems,
          totalPrice,
        };
      } else {
        const newItem = { ...action.payload, quantity: 1 };
        const updatedItems = [...state.items, newItem];
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return {
          items: updatedItems,
          totalItems,
          totalPrice,
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id.toString() !== action.payload.toString());
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        items: updatedItems,
        totalItems,
        totalPrice,
      };
    }
    
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: action.payload.id });
      }
      
      // Check if quantity exceeds max
      const maxQty = action.payload.maxQuantity;
      const finalQuantity = maxQty ? Math.min(action.payload.quantity, maxQty) : action.payload.quantity;
      
      const updatedItems = state.items.map(item =>
        item.id.toString() === action.payload.id.toString()
          ? { ...item, quantity: finalQuantity, maxQuantity: maxQty || item.maxQuantity }
          : item
      );
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        items: updatedItems,
        totalItems,
        totalPrice,
      };
    }
    
    case 'CLEAR_CART': {
      return {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };
    }
    
    default:
      return state;
  }
};

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    const existingItem = state.items.find(i => i.id.toString() === item.id.toString());
    const maxQty = item.maxQuantity;
    
    // Check if we can add more
    if (existingItem && maxQty && existingItem.quantity >= maxQty) {
      return false; // Can't add more
    }
    
    dispatch({ type: 'ADD_ITEM', payload: item });
    // Modal notification removed per user request
    // setShowAddModal(true);
    return true; // Successfully added
  };
  
  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };
  
  const updateQuantity = (id: string, quantity: number, maxQuantity?: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity, maxQuantity } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const getItemQuantity = (id: string) => {
    const item = state.items.find(item => item.id.toString() === id.toString());
    return item ? item.quantity : 0;
  };
  
  const canAddMore = (id: string, maxQuantity?: number) => {
    const item = state.items.find(item => item.id.toString() === id.toString());
    if (!item) return true; // Not in cart yet, can add
    if (!maxQuantity) return true; // No limit
    return item.quantity < maxQuantity;
  };
  
  const contextValue: CartContextType = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    canAddMore,
    showAddModal,
    setShowAddModal,
  };
  
  return (
    <CartContext.Provider value={contextValue}>
      {children}
      
      {/* Global Add to Cart Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAddModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Image
                source={require('../../assets/Confirm Maskot.png')}
                style={styles.modalMascot}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.modalTitle}>Berhasil Ditambahkan ke Keranjang!</Text>
            <Text style={styles.modalMessage}>
              Produk berhasil ditambahkan ke keranjang belanja.
              Silakan lanjutkan belanja atau checkout sekarang.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Lanjut Belanja</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => {
                  setShowAddModal(false);
                  goToCart();
                }}
              >
                <Text style={styles.modalConfirmText}>Lihat Keranjang</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalMascot: {
    width: 80,
    height: 80,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border.main,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#00BCD4',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.white,
    fontFamily: Typography.fontFamily.semibold,
  },
});