
import { Product, Order, Banner, UserRole, User, Service, ChatMessage, Store, Notification } from '../types';
import { MOCK_BANNERS, MOCK_PRODUCTS, SERVICES, MOCK_STORES } from '../constants';

class LocalDatabaseManager {
  private store: any = {};

  constructor() {
    this.init();
    window.addEventListener('storage', (e) => {
      if (e.key === 'khadamati_v4_db') {
        this.init();
        window.dispatchEvent(new Event('db-update'));
      }
    });
  }

  private init() {
    const saved = localStorage.getItem('khadamati_v4_db');
    if (saved) {
      try {
        this.store = JSON.parse(saved);
        if (!this.store.messages) this.store.messages = [];
        if (!this.store.cart) this.store.cart = [];
        if (!this.store.orders) this.store.orders = [];
        if (!this.store.notifications) this.store.notifications = [];
      } catch (e) {
        this.resetToDefaults();
      }
    } else {
      this.resetToDefaults();
    }
  }

  private resetToDefaults() {
    this.store = {
      users: [
        { 
          id: 'u-customer', name: 'أحمد العميل', phone: '0500000001', password: '123', 
          role: UserRole.CUSTOMER, wallet: 500000, points: 120, level: 'BRONZE', 
          addresses: [{id: '1', label: 'المنزل', address: 'بغداد، المنصور', lat: 33.3152, lng: 44.3661}], 
          favorites: [], isVerified: true, isBanned: false, 
          avatar: 'https://i.pravatar.cc/150?u=customer' 
        },
        { 
          id: 'u-store', name: 'متجر النور', phone: '0500000002', password: '123', 
          role: UserRole.STORE_OWNER, wallet: 1000000, points: 500, level: 'SILVER', 
          addresses: [], favorites: [], isVerified: true, isBanned: false,
          avatar: 'https://i.pravatar.cc/150?u=store'
        },
        { 
          id: 'u-driver', name: 'سلطان الكابتن', phone: '0500000003', password: '123', 
          role: UserRole.DRIVER, wallet: 250000, points: 80, level: 'BRONZE', 
          addresses: [], favorites: [], isVerified: true, isBanned: false,
          avatar: 'https://i.pravatar.cc/150?u=driver'
        },
        { 
          id: 'u-admin', name: 'مدير النظام', phone: '0500000004', password: '123', 
          role: UserRole.ADMIN, wallet: 0, points: 0, level: 'GOLD', 
          addresses: [], favorites: [], isVerified: true, isBanned: false,
          avatar: 'https://i.pravatar.cc/150?u=admin'
        }
      ],
      products: MOCK_PRODUCTS,
      stores: MOCK_STORES,
      banners: MOCK_BANNERS,
      services: SERVICES.map(s => ({...s, iconName: s.iconName || 'ChefHat'})),
      orders: [],
      cart: [],
      messages: [],
      notifications: []
    };
    this.save();
  }

  private save() {
    localStorage.setItem('khadamati_v4_db', JSON.stringify(this.store));
    window.dispatchEvent(new Event('db-update'));
  }

  async addNotification(userId: string, title: string, message: string, type: Notification['type'] = 'ORDER') {
    const newNotif: Notification = {
      id: 'n-' + Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      type
    };
    if (!this.store.notifications) this.store.notifications = [];
    this.store.notifications.unshift(newNotif);
    this.save();
    
    // Trigger global notification event for Toast display
    window.dispatchEvent(new CustomEvent('new-notification-toast', { detail: newNotif }));
  }

  async getNotifications(): Promise<Notification[]> {
    const user = await this.getCurrentUser();
    if (!user) return [];
    return this.store.notifications.filter((n: Notification) => n.userId === user.id);
  }

  async markNotificationAsRead(id: string) {
    const idx = this.store.notifications.findIndex((n: Notification) => n.id === id);
    if (idx > -1) {
      this.store.notifications[idx].isRead = true;
      this.save();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const id = localStorage.getItem('active_user_id');
    return this.store.users.find((u: any) => u.id === id) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.store.users.find((u: any) => u.id === id) || null;
  }

  async updateUser(id: string, updates: Partial<User>) {
    const idx = this.store.users.findIndex((u: any) => u.id === id);
    if (idx > -1) {
      this.store.users[idx] = { ...this.store.users[idx], ...updates };
      this.save();
    }
  }

  async getStores(categoryId?: string): Promise<Store[]> {
    if (categoryId) return this.store.stores.filter((s: any) => s.categoryId === categoryId);
    return this.store.stores;
  }

  async getProducts(storeId?: string): Promise<Product[]> {
    if (storeId) return this.store.products.filter((p: any) => p.storeId === storeId);
    return this.store.products;
  }

  async getCart() { 
    return Array.isArray(this.store.cart) ? this.store.cart : []; 
  }

  async addToCart(product: Product) {
    if (!Array.isArray(this.store.cart)) this.store.cart = [];
    
    const existingIdx = this.store.cart.findIndex((item: any) => item.productId === product.id);
    if (existingIdx > -1) {
      this.store.cart[existingIdx].quantity += 1;
    } else {
      this.store.cart.push({
        id: 'ci-' + Math.random().toString(36).substr(2, 9),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        storeId: product.storeId
      });
    }
    this.save();
  }

  async updateCartQuantity(itemId: string, delta: number) {
    if (!Array.isArray(this.store.cart)) return;
    const itemIdx = this.store.cart.findIndex((i: any) => i.id === itemId);
    if (itemIdx > -1) {
      this.store.cart[itemIdx].quantity += delta;
      if (this.store.cart[itemIdx].quantity <= 0) {
        this.store.cart.splice(itemIdx, 1);
      }
      this.save();
    }
  }

  async clearCart() {
    this.store.cart = [];
    this.save();
  }

  async checkout() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');
    
    const cart = await this.getCart();
    if (cart.length === 0) throw new Error('سلة المشتريات فارغة');
    
    const total = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    if (user.wallet < total) throw new Error('رصيدك الحالي غير كافٍ، يرجى شحن المحفظة');

    const storeIds = [...new Set(cart.map((i: any) => i.storeId))];
    const newOrders: Order[] = [];
    
    for (const sId of storeIds) {
      const storeItems = cart.filter((i: any) => i.storeId === sId);
      const subTotal = storeItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      
      const order: Order = {
        id: 'ORD-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        customerId: user.id,
        storeId: sId as string,
        items: storeItems,
        status: 'PENDING',
        total: subTotal,
        timestamp: new Date().toISOString(),
        location: user.addresses[0] || { id: 'def', label: 'الموقع الافتراضي', address: 'بغداد، شارع فلسطين', lat: 33.3444, lng: 44.4361 }
      };
      newOrders.push(order);

      // Notify Store Owner
      const storeOwner = this.store.users.find((u: any) => u.role === UserRole.STORE_OWNER); // Simulation: finding a store owner
      if (storeOwner) {
        this.addNotification(storeOwner.id, 'طلب جديد!', `لقد وصل طلب جديد برقم #${order.id.slice(-4)}`);
      }
    }

    // تنفيذ الخصم وتحديث الحالة
    const userIdx = this.store.users.findIndex((u: any) => u.id === user.id);
    if (userIdx > -1) {
      this.store.users[userIdx].wallet -= total;
      this.store.users[userIdx].points += Math.floor(total / 1000); 
      this.updateUserLevel(this.store.users[userIdx]);
      
      if (!this.store.orders) this.store.orders = [];
      this.store.orders = [...newOrders, ...this.store.orders];
      this.store.cart = [];
      this.save();
    }
  }

  private updateUserLevel(user: User) {
    const pts = user.points;
    let newLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' = 'BRONZE';
    
    if (pts >= 5000) newLevel = 'DIAMOND';
    else if (pts >= 1000) newLevel = 'GOLD';
    else if (pts >= 200) newLevel = 'SILVER';
    
    user.level = newLevel;
  }

  async loginUser(phone: string, password: string): Promise<User> {
    const user = this.store.users.find((u: any) => u.phone === phone && u.password === password);
    if (!user) throw new Error('بيانات الدخول غير صحيحة');
    localStorage.setItem('active_user_id', user.id);
    return user;
  }

  async registerUser(userData: any): Promise<User> {
    const newUser = { 
      ...userData, 
      id: 'u-' + Date.now(), 
      wallet: 0, 
      points: 0, 
      level: 'BRONZE', 
      addresses: [{id: '1', label: 'المنزل', address: 'بغداد، الكرادة', lat: 33.3012, lng: 44.4250}], 
      favorites: [], 
      isVerified: true, 
      isBanned: false, 
      avatar: `https://i.pravatar.cc/150?u=${Date.now()}` 
    };
    this.store.users.push(newUser);
    this.save();
    localStorage.setItem('active_user_id', newUser.id);
    return newUser as User;
  }

  async getAllUsers() { return this.store.users; }
  async getServices(): Promise<Service[]> { return this.store.services; }
  async getBanners() { return this.store.banners; }
  async getOrders() { return Array.isArray(this.store.orders) ? this.store.orders : []; }

  async updateOrderStatus(id: string, status: string, driverId?: string) {
    const order = this.store.orders.find((o: any) => o.id === id);
    if (order) {
      const oldStatus = order.status;
      order.status = status as any;
      if (driverId) order.driverId = driverId;

      this.save();

      // Notifications logic
      if (status === 'ACCEPTED') {
        this.addNotification(order.customerId, 'تم قبول طلبك!', `المتجر وافق على طلبك #${id.slice(-4)} وهو قيد التجهيز الآن.`);
      } else if (status === 'ON_WAY') {
        this.addNotification(order.customerId, 'الطلب في الطريق!', `كابتن التوصيل استلم طلبك وهو في الطريق إليك.`);
        if (order.driverId) {
          this.addNotification(order.driverId, 'مهمة جديدة', `لقد بدأت رحلة توصيل الطلب #${id.slice(-4)}.`);
        }
      } else if (status === 'DELIVERED') {
        this.addNotification(order.customerId, 'تم التوصيل!', 'شكراً لتعاملك معنا، نتمنى أن تكون الوجبة أعجبتك.');
        if (order.driverId) {
          const driverIdx = this.store.users.findIndex((u: any) => u.id === order.driverId);
          if (driverIdx > -1) {
            this.store.users[driverIdx].points += 20;
            this.updateUserLevel(this.store.users[driverIdx]);
            this.addNotification(order.driverId, 'عمل رائع!', 'تم تسليم الطلب بنجاح وحصلت على 20 نقطة ولاء.');
          }
        }
      }
    }
  }

  async toggleFavorite(productId: string) {
    const user = await this.getCurrentUser();
    if (!user) return;
    const userIdx = this.store.users.findIndex((u: any) => u.id === user.id);
    if (userIdx > -1) {
      const favorites = this.store.users[userIdx].favorites || [];
      if (favorites.includes(productId)) {
        this.store.users[userIdx].favorites = favorites.filter((id: string) => id !== productId);
      } else {
        this.store.users[userIdx].favorites.push(productId);
      }
      this.save();
    }
  }

  async updateWallet(amount: number) {
    const user = await this.getCurrentUser();
    if (user) {
      const idx = this.store.users.findIndex((u: any) => u.id === user.id);
      if (idx > -1) {
        this.store.users[idx].wallet += amount;
        this.save();
        this.addNotification(user.id, 'تم شحن المحفظة', `لقد تم إضافة ${amount.toLocaleString('ar-IQ')} د.ع إلى محفظتك بنجاح.`, 'WALLET');
      }
    }
  }

  async getChatMessages(orderId: string): Promise<ChatMessage[]> {
    if (!this.store.messages) this.store.messages = [];
    return this.store.messages.filter((m: any) => m.orderId === orderId);
  }

  async sendMessage(orderId: string, msg: any) {
    if (!this.store.messages) this.store.messages = [];
    const newMsg = { 
      ...msg, 
      id: 'm-' + Math.random().toString(36).substr(2, 9), 
      orderId,
      timestamp: new Date().toISOString() 
    };
    this.store.messages.push(newMsg);
    this.save();
  }

  async addProduct(product: any) {
    this.store.products.push({ ...product, id: 'p-' + Date.now() });
    this.save();
  }

  async updateProduct(id: string, updates: any) {
    const idx = this.store.products.findIndex((p: any) => p.id === id);
    if (idx > -1) {
      this.store.products[idx] = { ...this.store.products[idx], ...updates };
      this.save();
    }
  }

  async deleteProduct(id: string) {
    this.store.products = this.store.products.filter((p: any) => p.id !== id);
    this.save();
  }

  async setUserBan(userId: string, hours: number | 'PERMANENT' | null) {
    const idx = this.store.users.findIndex((u: any) => u.id === userId);
    if (idx > -1) {
      if (hours === null) {
        this.store.users[idx].isBanned = false;
        this.store.users[idx].banUntil = undefined;
      } else if (hours === 'PERMANENT') {
        this.store.users[idx].isBanned = true;
        this.store.users[idx].banUntil = undefined;
      } else {
        this.store.users[idx].isBanned = true;
        const banUntil = new Date();
        banUntil.setHours(banUntil.getHours() + hours);
        this.store.users[idx].banUntil = banUntil.toISOString();
      }
      this.save();
    }
  }

  async addService(service: any) {
    const newService = {
      ...service,
      id: 's-' + Date.now(),
      iconName: service.iconName || 'Layers'
    };
    this.store.services.push(newService);
    this.save();
  }

  async deleteService(id: string) {
    this.store.services = this.store.services.filter((s: any) => s.id !== id);
    this.save();
  }

  async addBanner(banner: any) {
    const newBanner = {
      ...banner,
      id: 'b-' + Date.now()
    };
    this.store.banners.push(newBanner);
    this.save();
  }

  async deleteBanner(id: string) {
    this.store.banners = this.store.banners.filter((b: any) => b.id !== id);
    this.save();
  }

  logout() {
    localStorage.removeItem('active_user_id');
    window.dispatchEvent(new Event('db-update'));
  }
}

export const db = new LocalDatabaseManager();
