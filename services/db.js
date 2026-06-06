import { createClient } from '@supabase/supabase-js';

// Get Supabase keys from environment variables (Vite-style)
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase client if credentials are provided
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Default categories as per SRS Section 11
export const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'อาหารและเครื่องดื่ม', type: 'expense' },
  { id: 'cat-2', name: 'เดินทาง', type: 'expense' },
  { id: 'cat-3', name: 'การเรียน', type: 'expense' },
  { id: 'cat-4', name: 'ช้อปปิ้ง', type: 'expense' },
  { id: 'cat-5', name: 'บิลและค่าสาธารณูปโภค', type: 'expense' },
  { id: 'cat-6', name: 'สุขภาพ', type: 'expense' },
  { id: 'cat-7', name: 'ความบันเทิง', type: 'expense' },
  { id: 'cat-8', name: 'รายรับหลัก', type: 'income' },
  { id: 'cat-9', name: 'รายรับอื่น ๆ', type: 'income' },
  { id: 'cat-10', name: 'อื่น ๆ', type: 'expense' }
];

// Helper to check if Supabase is active
export const isSupabaseConfigured = () => !!supabase;

/* ==========================================
   SUPABASE IMPLEMENTATION
   ========================================== */

const supabaseDB = {
  async getTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createTransaction(transaction) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async updateTransaction(id, updates) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async deleteTransaction(id) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  async uploadSlip(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `slips/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('slips-bucket')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('slips-bucket')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};

/* ==========================================
   LOCALSTORAGE IMPLEMENTATION (FALLBACK)
   ========================================== */

const localStorageDB = {
  getTransactions() {
    const data = localStorage.getItem('transactions');
    if (!data) {
      // Seed with some mock data for a good initial experience
      const mockData = [
        {
          id: 'mock-1',
          type: 'expense',
          amount: 150,
          category: 'อาหารและเครื่องดื่ม',
          transaction_date: new Date(Date.now() - 3600000 * 2).toISOString().split('T')[0],
          description: 'ซื้อข้าวเที่ยงและน้ำหวาน',
          merchant: '7-Eleven',
          payment_method: 'promptpay',
          slip_image_url: null,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'mock-2',
          type: 'income',
          amount: 15000,
          category: 'รายรับหลัก',
          transaction_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
          description: 'เงินเดือนพาร์ทไทม์',
          merchant: 'บริษัท เทค จำกัด',
          payment_method: 'transfer',
          slip_image_url: null,
          created_at: new Date(Date.now() - 86400000 * 3).toISOString()
        },
        {
          id: 'mock-3',
          type: 'expense',
          amount: 85,
          category: 'เดินทาง',
          transaction_date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
          description: 'เดินทางไปเรียน',
          merchant: 'Grab Taxi',
          payment_method: 'promptpay',
          slip_image_url: null,
          created_at: new Date(Date.now() - 86400000 * 1).toISOString()
        },
        {
          id: 'mock-4',
          type: 'expense',
          amount: 450,
          category: 'ช้อปปิ้ง',
          transaction_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
          description: 'หูฟังบลูทูธรุ่นประหยัด',
          merchant: 'Shopee',
          payment_method: 'e-wallet',
          slip_image_url: null,
          created_at: new Date(Date.now() - 86400000 * 4).toISOString()
        }
      ];
      localStorage.setItem('transactions', JSON.stringify(mockData));
      return mockData;
    }
    return JSON.parse(data);
  },

  createTransaction(transaction) {
    const list = this.getTransactions();
    const newTransaction = {
      ...transaction,
      id: transaction.id || `local-${Math.random().toString(36).substring(2)}-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    list.unshift(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(list));
    return newTransaction;
  },

  updateTransaction(id, updates) {
    const list = this.getTransactions();
    const index = list.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found');
    
    list[index] = { ...list[index], ...updates };
    localStorage.setItem('transactions', JSON.stringify(list));
    return list[index];
  },

  deleteTransaction(id) {
    const list = this.getTransactions();
    const filtered = list.filter(t => t.id !== id);
    localStorage.setItem('transactions', JSON.stringify(filtered));
    return true;
  },

  // Store file as Base64 in LocalStorage for demonstration purposes
  uploadSlip(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result); // Base64 data URL
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }
};

/* ==========================================
   UNIFIED EXPORTS
   ========================================== */

const db = isSupabaseConfigured() ? supabaseDB : localStorageDB;

export const getTransactions = () => db.getTransactions();
export const createTransaction = (t) => db.createTransaction(t);
export const updateTransaction = (id, updates) => db.updateTransaction(id, updates);
export const deleteTransaction = (id) => db.deleteTransaction(id);
export const uploadSlip = (file) => db.uploadSlip(file);
export default db;
