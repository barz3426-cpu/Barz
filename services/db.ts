
import { Product, Order, Banner, UserRole, User, Service, ChatMessage, Store, Notification, SubCategory } from '../types';
import { MOCK_BANNERS, MOCK_PRODUCTS, SERVICES, MOCK_STORES, MOCK_SUBCATEGORIES } from '../constants';

// Declare sql.js types for TypeScript
declare global {
  interface Window {
    initSqlJs: (config: any) => Promise<any>;
  }
}

class SQLiteDatabaseManager {
  private db: any = null;
  private dbName = 'khadamati_sqlite.db';
  private isReady = false;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();
  }

  // --- Initialization & Persistence ---

  private async init() {
    try {
      let attempts = 0;
      while (!window.initSqlJs && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      if (!window.initSqlJs) {
        console.error("SQL.js not loaded");
        return;
      }

      const SQL = await window.initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      });

      const savedData = await this.loadFromIndexedDB();
      
      if (savedData) {
        try {
          this.db = new SQL.Database(new Uint8Array(savedData));
          this.migrate();
        } catch (e) {
          console.error("Failed to load saved DB, creating new one", e);
          this.db = new SQL.Database();
          this.createTables();
          this.seedData();
        }
      } else {
        this.db = new SQL.Database();
        this.createTables();
        this.seedData();
      }

      this.ensureDemoUsers();

      this.isReady = true;
      window.dispatchEvent(new Event('db-update'));
      console.log("SQLite Database Initialized & Ready");

    } catch (err) {
      console.error("Failed to init SQLite:", err);
    }
  }

  private async waitForDB() {
    if (this.isReady && this.db) return;
    await this.initPromise;
  }

  private save() {
    if (!this.db) return;
    const data = this.db.export();
    this.saveToIndexedDB(data);
    window.dispatchEvent(new Event('db-update'));
  }

  private async saveToIndexedDB(data: Uint8Array) {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('KhadamatiDB', 1);
      request.onupgradeneeded = (e: any) => {
        e.target.result.createObjectStore('sqlite_store');
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(['sqlite_store'], 'readwrite');
        const store = tx.objectStore('sqlite_store');
        store.put(data, 'db_file');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
  }

  private async loadFromIndexedDB(): Promise<ArrayBuffer | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('KhadamatiDB', 1);
      request.onupgradeneeded = (e: any) => {
        e.target.result.createObjectStore('sqlite_store');
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(['sqlite_store'], 'readonly');
        const store = tx.objectStore('sqlite_store');
        const req = store.get('db_file');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  }

  // --- Schema & Seeding ---

  private createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, phone TEXT, password TEXT, role TEXT, data TEXT);`,
      `CREATE TABLE IF NOT EXISTS services (id TEXT PRIMARY KEY, title TEXT, data TEXT);`,
      `CREATE TABLE IF NOT EXISTS sub_categories (id TEXT PRIMARY KEY, category_id TEXT, data TEXT);`,
      `CREATE TABLE IF NOT EXISTS stores (id TEXT PRIMARY KEY, category_id TEXT, sub_category_id TEXT, data TEXT);`,
      `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, store_id TEXT, category_id TEXT, sub_category_id TEXT, data TEXT);`,
      `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_id TEXT, driver_id TEXT, store_id TEXT, status TEXT, timestamp TEXT, data TEXT);`,
      `CREATE TABLE IF NOT EXISTS banners (id TEXT PRIMARY KEY, data TEXT);`,
      `CREATE TABLE IF NOT EXISTS cart (id TEXT PRIMARY KEY, product_id TEXT, user_id TEXT, data TEXT);`,
      `CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT, timestamp TEXT, is_read INTEGER, data TEXT);`,
      `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, order_id TEXT, timestamp TEXT, data TEXT);`
    ];

    tables.forEach(sql => this.db.run(sql));
    this.save();
  }

  private migrate() {
    try {
      const res = this.db.exec("PRAGMA table_info(users)");
      if (res.length > 0) {
        const columns = res[0].values.map((v: any) => v[1]);
        let needsUpdate = false;
        
        if (!columns.includes('phone')) {
           this.db.run("ALTER TABLE users ADD COLUMN phone TEXT");
           needsUpdate = true;
        }
        if (!columns.includes('password')) {
           this.db.run("ALTER TABLE users ADD COLUMN password TEXT");
           needsUpdate = true;
        }

        if (needsUpdate) {
           const stmt = this.db.prepare("SELECT id, data FROM users");
           while(stmt.step()) {
             const row = stmt.getAsObject();
             if (row.data) {
                try {
                  const u = JSON.parse(row.data as string);
                  this.db.run("UPDATE users SET phone = ?, password = ? WHERE id = ?", [u.phone, u.password, u.id]);
                } catch(e) {}
             }
           }
           stmt.free();
           this.save();
        }
      }
    } catch(e) {
      console.warn("Migration warning:", e);
    }
  }

  private seedData() {
    SERVICES.forEach(s => this.insert('services', s));
    MOCK_SUBCATEGORIES.forEach(s => this.insert('sub_categories', s, { category_id: s.categoryId }));
    MOCK_STORES.forEach(s => this.insert('stores', s, { category_id: s.categoryId, sub_category_id: s.subCategoryId }));
    
    MOCK_PRODUCTS.forEach(p => {
       const subCatId = (p as any).subCategoryId || null; 
       this.insert('products', p, { 
        store_id: p.storeId, 
        category_id: p.category, 
        sub_category_id: subCatId 
      });
    });

    MOCK_BANNERS.forEach(b => this.insert('banners', b));
    this.ensureDemoUsers();
    this.save();
  }

  private ensureDemoUsers() {
    const demoUsers = [
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
    ];

    demoUsers.forEach(u => {
      this.db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, phone TEXT, password TEXT, role TEXT, data TEXT);`);
      this.db.run(`INSERT OR IGNORE INTO users (id, phone, password, role, data) VALUES (?, ?, ?, ?, ?)`, 
        [u.id, u.phone, u.password, u.role, JSON.stringify(u)]
      );
    });
    this.save();
  }

  // --- Helper Methods ---

  private insert(table: string, obj: any, extraCols: any = {}) {
    const cols = ['id', 'data', ...Object.keys(extraCols)];
    const placeholders = cols.map(() => '?').join(',');
    const values = [obj.id, JSON.stringify(obj), ...Object.values(extraCols)].map(val => val === undefined ? null : val);
    
    this.db.run(`INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`, values);
  }

  private query<T>(sql: string, params: any[] = []): T[] {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const results: T[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        if (row.data) {
          const parsed = JSON.parse(row.data as string);
          results.push(parsed);
        }
      }
      stmt.free();
      return results;
    } catch (e) {
      console.error("SQL Error:", e);
      return [];
    }
  }

  // --- Public API ---

  async getAllUsers() { 
    await this.waitForDB();
    return this.query<User>(`SELECT data FROM users`); 
  }
  
  async getUserById(id: string): Promise<User | null> {
    await this.waitForDB();
    const users = this.query<User>(`SELECT data FROM users WHERE id = ?`, [id]);
    return users[0] || null;
  }

  async getCurrentUser(): Promise<User | null> {
    await this.waitForDB();
    const id = localStorage.getItem('active_user_id');
    if (!id) return null;
    return this.getUserById(id);
  }

  async loginUser(phone: string, password: string): Promise<User> {
    await this.waitForDB();
    const users = this.query<User>(`SELECT data FROM users WHERE phone = ? AND password = ?`, [phone, password]);
    if (users.length === 0) throw new Error('بيانات الدخول غير صحيحة');
    const user = users[0];
    localStorage.setItem('active_user_id', user.id);
    return user;
  }

  async registerUser(userData: any): Promise<User> {
    await this.waitForDB();
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
    
    this.db.run(`INSERT INTO users (id, phone, password, role, data) VALUES (?, ?, ?, ?, ?)`, 
      [newUser.id, newUser.phone, newUser.password, UserRole.CUSTOMER, JSON.stringify(newUser)]
    );
    this.save();
    localStorage.setItem('active_user_id', newUser.id);
    return newUser as User;
  }

  async updateUser(id: string, updates: Partial<User>) {
    await this.waitForDB();
    const user = await this.getUserById(id);
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    
    this.db.run(`UPDATE users SET data = ?, phone = ?, password = ? WHERE id = ?`, 
      [JSON.stringify(updatedUser), updatedUser.phone, updatedUser.password, id]
    );
    this.save();
  }

  async setUserBan(userId: string, hours: number | 'PERMANENT' | null) {
    await this.waitForDB();
    const user = await this.getUserById(userId);
    if(!user) return;
    
    let banUntil = undefined;
    let isBanned = false;

    if (hours === 'PERMANENT') {
      isBanned = true;
    } else if (hours !== null) {
      isBanned = true;
      const d = new Date();
      d.setHours(d.getHours() + (hours as number));
      banUntil = d.toISOString();
    }

    await this.updateUser(userId, { isBanned, banUntil });
  }

  // --- Services, Categories, Stores ---

  async getServices(): Promise<Service[]> { await this.waitForDB(); return this.query<Service>(`SELECT data FROM services`); }

  async addService(service: any) {
    await this.waitForDB();
    const newService = { ...service, id: 's-' + Date.now(), iconName: service.iconName || 'Layers' };
    this.insert('services', newService);
    this.save();
  }

  async deleteService(id: string) {
    await this.waitForDB();
    this.db.run(`DELETE FROM services WHERE id = ?`, [id]);
    this.db.run(`DELETE FROM sub_categories WHERE category_id = ?`, [id]);
    this.save();
  }

  async getSubCategories(categoryId?: string): Promise<SubCategory[]> {
    await this.waitForDB();
    if (categoryId) {
      return this.query<SubCategory>(`SELECT data FROM sub_categories WHERE category_id = ?`, [categoryId]);
    }
    return this.query<SubCategory>(`SELECT data FROM sub_categories`);
  }

  async addSubCategory(sub: any) {
    await this.waitForDB();
    const newSub = { ...sub, id: 'sub-' + Date.now() };
    this.insert('sub_categories', newSub, { category_id: sub.categoryId });
    this.save();
    return newSub;
  }

  async deleteSubCategory(id: string) {
    await this.waitForDB();
    this.db.run(`DELETE FROM sub_categories WHERE id = ?`, [id]);
    this.save();
  }

  async getStores(categoryId?: string, subCategoryId?: string): Promise<Store[]> {
    await this.waitForDB();
    let sql = `SELECT data FROM stores WHERE 1=1`;
    const params = [];
    if (categoryId) { sql += ` AND category_id = ?`; params.push(categoryId); }
    if (subCategoryId) { sql += ` AND sub_category_id = ?`; params.push(subCategoryId); }
    return this.query<Store>(sql, params);
  }

  async addStore(store: any) {
    await this.waitForDB();
    const newStore = { 
        ...store, 
        id: 's-' + Date.now(), 
        rating: 5.0, 
        isOpen: true 
    };
    this.insert('stores', newStore, { category_id: store.categoryId, sub_category_id: store.subCategoryId });
    this.save();
  }

  async deleteStore(id: string) {
    await this.waitForDB();
    this.db.run(`DELETE FROM stores WHERE id = ?`, [id]);
    // Optionally delete products associated with store
    this.db.run(`DELETE FROM products WHERE store_id = ?`, [id]);
    this.save();
  }

  // --- Products ---

  async getProducts(storeId?: string): Promise<Product[]> {
    await this.waitForDB();
    if (storeId) {
      return this.query<Product>(`SELECT data FROM products WHERE store_id = ?`, [storeId]);
    }
    return this.query<Product>(`SELECT data FROM products`);
  }

  async addProduct(product: any) {
    await this.waitForDB();
    const newProduct = { ...product, id: 'p-' + Date.now() };
    this.insert('products', newProduct, { 
      store_id: product.storeId, 
      category_id: product.category, 
      sub_category_id: (product as any).subCategoryId || null
    });
    this.save();
  }

  async updateProduct(id: string, updates: any) {
    await this.waitForDB();
    const p = (await this.query<Product>(`SELECT data FROM products WHERE id = ?`, [id]))[0];
    if(!p) return;
    const updated = { ...p, ...updates };
    this.insert('products', updated, { 
      store_id: updated.storeId, 
      category_id: updated.category, 
      sub_category_id: (updated as any).subCategoryId || null
    });
    this.save();
  }

  async deleteProduct(id: string) {
    await this.waitForDB();
    this.db.run(`DELETE FROM products WHERE id = ?`, [id]);
    this.save();
  }

  async toggleFavorite(productId: string) {
    await this.waitForDB();
    const user = await this.getCurrentUser();
    if (!user) return;
    let favorites = user.favorites || [];
    if (favorites.includes(productId)) {
      favorites = favorites.filter(id => id !== productId);
    } else {
      favorites.push(productId);
    }
    await this.updateUser(user.id, { favorites });
  }

  // --- Cart & Orders ---

  async getCart() { await this.waitForDB(); return this.query<any>(`SELECT data FROM cart`); }

  async addToCart(product: Product) {
    await this.waitForDB();
    const cart = await this.getCart();
    const existing = cart.find((i: any) => i.productId === product.id);
    if (existing) {
      existing.quantity += 1;
      this.insert('cart', existing, { product_id: product.id });
    } else {
      const newItem = { id: 'ci-' + Date.now(), productId: product.id, name: product.name, price: product.price, quantity: 1, image: product.image, storeId: product.storeId };
      this.insert('cart', newItem, { product_id: product.id });
    }
    this.save();
  }

  async updateCartQuantity(itemId: string, delta: number) {
    await this.waitForDB();
    const item = (await this.query<any>(`SELECT data FROM cart WHERE id = ?`, [itemId]))[0];
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) this.db.run(`DELETE FROM cart WHERE id = ?`, [itemId]);
      else this.insert('cart', item, { product_id: item.productId });
      this.save();
    }
  }

  async clearCart() { await this.waitForDB(); this.db.run(`DELETE FROM cart`); this.save(); }

  async getOrders() { await this.waitForDB(); return this.query<Order>(`SELECT data FROM orders ORDER BY timestamp DESC`); }

  async checkout() {
    await this.waitForDB();
    const user = await this.getCurrentUser();
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');
    
    const cart = await this.getCart();
    if (cart.length === 0) throw new Error('سلة المشتريات فارغة');
    
    const total = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    if (user.wallet < total) throw new Error('رصيدك الحالي غير كافٍ');

    const storeIds = [...new Set(cart.map((i: any) => i.storeId))];
    for (const sId of storeIds) {
      const storeItems = cart.filter((i: any) => i.storeId === sId);
      const subTotal = storeItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const order: Order = {
        id: 'ORD-' + Date.now() + Math.floor(Math.random() * 100),
        customerId: user.id, storeId: sId as string, items: storeItems, status: 'PENDING', total: subTotal,
        timestamp: new Date().toISOString(), location: user.addresses[0] || { id: 'def', label: 'الموقع', address: 'بغداد', lat: 33.3, lng: 44.4 }
      };
      this.insert('orders', order, { customer_id: user.id, store_id: sId, status: 'PENDING', timestamp: order.timestamp });
    }
    await this.updateUser(user.id, { wallet: user.wallet - total, points: user.points + Math.floor(total/1000) });
    await this.clearCart();
    this.save();
  }

  async updateOrderStatus(id: string, status: string, driverId?: string) {
    await this.waitForDB();
    const order = (await this.query<Order>(`SELECT data FROM orders WHERE id = ?`, [id]))[0];
    if(order) {
      order.status = status as any;
      if (driverId) order.driverId = driverId;
      this.insert('orders', order, { customer_id: order.customerId, driver_id: driverId, store_id: order.storeId, status: status, timestamp: order.timestamp });
      this.save();
    }
  }

  // --- Banners & Misc ---

  async getBanners() { await this.waitForDB(); return this.query<Banner>(`SELECT data FROM banners`); }
  async addBanner(banner: any) { await this.waitForDB(); this.insert('banners', { ...banner, id: 'b-' + Date.now() }); this.save(); }
  async deleteBanner(id: string) { await this.waitForDB(); this.db.run(`DELETE FROM banners WHERE id = ?`, [id]); this.save(); }
  
  async updateWallet(amount: number) {
    await this.waitForDB();
    const user = await this.getCurrentUser();
    if (user) {
      await this.updateUser(user.id, { wallet: user.wallet + amount });
      await this.addNotification(user.id, 'شحن الرصيد', `تم إضافة ${amount}`);
    }
  }

  async addNotification(userId: string, title: string, message: string, type: Notification['type'] = 'ORDER') {
    await this.waitForDB();
    const n = { id: 'n-' + Date.now(), userId, title, message, type, timestamp: new Date().toISOString(), isRead: false };
    this.insert('notifications', n, { user_id: userId, timestamp: n.timestamp, is_read: 0 });
    window.dispatchEvent(new CustomEvent('new-notification-toast', { detail: n }));
    this.save();
  }

  async getNotifications() { await this.waitForDB(); const u = await this.getCurrentUser(); return u ? this.query<Notification>(`SELECT data FROM notifications WHERE user_id = ? ORDER BY timestamp DESC`, [u.id]) : []; }

  async getChatMessages(orderId: string) { await this.waitForDB(); return this.query<ChatMessage>(`SELECT data FROM messages WHERE order_id = ? ORDER BY timestamp ASC`, [orderId]); }
  
  async sendMessage(orderId: string, msg: any) {
    await this.waitForDB();
    const newMsg = { ...msg, id: 'm-' + Date.now(), orderId, timestamp: new Date().toISOString() };
    this.insert('messages', newMsg, { order_id: orderId, timestamp: newMsg.timestamp });
    this.save();
  }

  logout() { localStorage.removeItem('active_user_id'); window.dispatchEvent(new Event('db-update')); }
}

export const db = new SQLiteDatabaseManager();
