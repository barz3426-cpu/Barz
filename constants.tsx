
import React from 'react';
import { 
  ShoppingBag, 
  Truck, 
  Wrench, 
  Scissors, 
  Stethoscope, 
  ChefHat,
  Monitor,
  Brush,
  Car,
  Lightbulb
} from 'lucide-react';
import { Service, Product, Store, SubCategory } from './types';

export const SERVICES: Service[] = [
  { id: '1', title: 'توصيل طعام', icon: <ChefHat />, color: 'bg-orange-500', iconName: 'ChefHat' },
  { id: '2', title: 'سوبر ماركت', icon: <ShoppingBag />, color: 'bg-green-500', iconName: 'ShoppingBag' },
  { id: '3', title: 'فني صيانة', icon: <Wrench />, color: 'bg-blue-600', iconName: 'Wrench' },
  { id: '4', title: 'نظافة منزلية', icon: <Brush />, color: 'bg-purple-500', iconName: 'Brush' },
  { id: '5', title: 'تقنية وإلكترونيات', icon: <Monitor />, color: 'bg-slate-800', iconName: 'Monitor' },
  { id: '6', title: 'صالون وحلاقة', icon: <Scissors />, color: 'bg-pink-500', iconName: 'Scissors' },
  { id: '7', title: 'غسيل سيارات', icon: <Car />, color: 'bg-sky-500', iconName: 'Car' },
  { id: '8', title: 'كهرباء وسباكة', icon: <Lightbulb />, color: 'bg-yellow-500', iconName: 'Lightbulb' },
];

export const MOCK_SUBCATEGORIES: SubCategory[] = [
  // Food Delivery Subcategories
  { id: 'sub1-1', categoryId: '1', title: 'برجر وساندويتش', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
  { id: 'sub1-2', categoryId: '1', title: 'بيتزا ومعجنات', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500' },
  { id: 'sub1-3', categoryId: '1', title: 'أكلات شرقية', image: 'https://images.unsplash.com/photo-1544681280-d2dc712d93e2?w=500' },
  { id: 'sub1-4', categoryId: '1', title: 'حلويات وقهوة', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500' },

  // Supermarket Subcategories
  { id: 'sub2-1', categoryId: '2', title: 'خضار وفواكه', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500' },
  { id: 'sub2-2', categoryId: '2', title: 'لحوم وأسماك', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500' },
  
  // Maintenance Subcategories
  { id: 'sub3-1', categoryId: '3', title: 'تأسيسات', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500' },
  { id: 'sub3-2', categoryId: '3', title: 'صيانة مكيفات', image: 'https://images.unsplash.com/photo-1621905476059-5f8df79a8411?w=500' },
];

export const MOCK_STORES: Store[] = [
  { id: 's1', name: 'بيتزا هت', categoryId: '1', subCategoryId: 'sub1-2', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500', rating: 4.5, deliveryTime: '٣٠-٤٠ دقيقة', description: 'أفضل بيتزا إيطالية في المدينة', isOpen: true },
  { id: 's2', name: 'برجر كنج', categoryId: '1', subCategoryId: 'sub1-1', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', rating: 4.2, deliveryTime: '٢٥-٣٥ دقيقة', description: 'البرجر المشوي على اللهب', isOpen: true },
  { id: 's3', name: 'بنده سوبر ماركت', categoryId: '2', subCategoryId: 'sub2-1', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500', rating: 4.8, deliveryTime: '٤٠-٦٠ دقيقة', description: 'كل احتياجات منزلك في مكان واحد', isOpen: true },
  { id: 's4', name: 'صيانة تك', categoryId: '3', subCategoryId: 'sub3-2', image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?w=500', rating: 4.9, deliveryTime: 'حسب الموعد', description: 'خبراء الصيانة المنزلية والكهرباء', isOpen: true },
  { id: 's5', name: 'مطعم السفرة', categoryId: '1', subCategoryId: 'sub1-3', image: 'https://images.unsplash.com/photo-1544681280-d2dc712d93e2?w=500', rating: 4.7, deliveryTime: '45 دقيقة', description: 'أشهى المأكولات الشرقية', isOpen: true },
];

export const MOCK_BANNERS = [
  { 
    id: 'b1', 
    title: 'خصم 50% على أول طلب طعام', 
    subtitle: 'استخدم الكود: FIRST50 واستمتع بوجبتك المفضلة',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  },
  { 
    id: 'b2', 
    title: 'نظافة منزلك تهمنا', 
    subtitle: 'باقات تنظيف شهرية تبدأ من 250,000 د.ع فقط',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=800',
  }
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', storeId: 's1', name: 'بيتزا مارغريتا', description: 'جبنة موزاريلا فاخرة وصلصة طماطم سرية', price: 15000, category: '1', image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?w=500', stock: 50, rating: 4.8, reviewCount: 120, discount: 10 },
  { id: 'p2', storeId: 's1', name: 'بيتزا خضار', description: 'مزيج من الخضروات الطازجة والجبنة', price: 12000, category: '1', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500', stock: 100, rating: 4.5, reviewCount: 85 },
  { id: 'p3', storeId: 's2', name: 'وجبة وابر كلاسيك', description: 'برجر لحم مشوي مع بطاطس بيبسي', price: 9500, category: '1', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', stock: 30, rating: 4.4, reviewCount: 200 },
];
