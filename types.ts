
import React from 'react';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STORE_OWNER = 'STORE_OWNER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN'
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'ORDER' | 'WALLET' | 'SYSTEM';
}

export interface Store {
  id: string;
  name: string;
  categoryId: string;
  image: string;
  rating: number;
  deliveryTime: string;
  description: string;
  isOpen: boolean;
}

export interface Address {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Service {
  id: string;
  title: string;
  iconName: string; 
  icon?: React.ReactNode; 
  color: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  password: string;
  role: UserRole;
  avatar?: string;
  wallet: number;
  points: number;
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  addresses: Address[];
  favorites: string[]; 
  isBanned: boolean;
  banUntil?: string; 
  isVerified: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  discount?: number;
  stock: number;
  rating: number;
  reviewCount: number;
}

export interface Order {
  id: string;
  customerId: string;
  storeId: string;
  driverId?: string;
  items: any[];
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'ON_WAY' | 'DELIVERED' | 'CANCELLED';
  total: number;
  timestamp: string;
  location: any;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
}
