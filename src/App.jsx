import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  List, 
  PlusCircle, 
  UploadCloud, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AddTransaction from './components/AddTransaction';
import { getTransactions, isSupabaseConfigured } from './services/db';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Load transactions on mount
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      showToast('ไม่สามารถโหลดข้อมูลธุรกรรมได้: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Toast helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Calculate yearly stats (current year)
  const currentYear = new Date().getFullYear();
  const totals = transactions.reduce((acc, t) => {
    const txYear = t.transaction_date ? Number(t.transaction_date.substring(0, 4)) : null;
    if (txYear === currentYear) {
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
    }
    return acc;
  }, { income: 0, expense: 0 });

  const balance = totals.income - totals.expense;

  const handleTransactionAdded = (newTx, isUpdate = false) => {
    fetchTransactions();
    showToast(isUpdate ? 'แก้ไขรายการสำเร็จ!' : 'บันทึกรายการสำเร็จ!', 'success');
    if (isUpdate) {
      setEditingTransaction(null);
    }
    setActiveTab('transactions');
  };

  const handleStartEdit = (tx) => {
    setEditingTransaction(tx);
    // Switch to appropriate form page based on if it has a slip or not
    if (tx.slip_image_url) {
      setActiveTab('upload-slip');
    } else {
      setActiveTab('add');
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setActiveTab('transactions');
  };

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} color="hsl(var(--income))" />
            ) : (
              <AlertCircle size={18} color="hsl(var(--expense))" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '8px' }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Header section */}
      <header>
        <div className="logo-section">
          <div className="logo-icon">
            <Wallet size={22} color="white" />
          </div>
          <div>
            <h1>Personal Expense Tracker</h1>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              ระบบบันทึกรายรับ–รายจ่ายส่วนบุคคล
            </span>
          </div>
        </div>

        {/* Database Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isSupabaseConfigured() ? (
            <span className="badge badge-income" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--income))' }}></span>
              Supabase Connected
            </span>
          ) : (
            <span className="badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))', border: '1px solid hsl(var(--warning) / 0.3)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--warning))' }}></span>
              LocalStorage Mode (Offline)
            </span>
          )}
        </div>
      </header>

      {/* KPI Cards Summary */}
      <div className="grid-cols-3 m-top-4" style={{ marginBottom: '24px' }}>
        <div className="glass-card stat-card income">
          <div className="stat-header">
            <span>รายรับปีนี้ (Yearly Income)</span>
            <div className="stat-icon">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'hsl(var(--income))' }}>
            ฿{totals.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card stat-card expense">
          <div className="stat-header">
            <span>รายจ่ายปีนี้ (Yearly Expense)</span>
            <div className="stat-icon">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'hsl(var(--expense))' }}>
            ฿{totals.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card stat-card balance">
          <div className="stat-header">
            <span>ยอดคงเหลือปีนี้ (Yearly Balance)</span>
            <div className="stat-icon">
              <Wallet size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: balance >= 0 ? 'hsl(var(--income))' : 'hsl(var(--expense))' }}>
            ฿{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dashboard'); setEditingTransaction(null); }}
        >
          <LayoutDashboard size={16} />
          แดชบอร์ดสรุป
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <List size={16} />
          รายการธุรกรรม
        </button>
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <PlusCircle size={16} />
          {editingTransaction && !editingTransaction.slip_image_url ? 'แก้ไขรายการ' : 'กรอกข้อมูลเอง'}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'upload-slip' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload-slip')}
        >
          <UploadCloud size={16} />
          {editingTransaction && editingTransaction.slip_image_url ? 'แก้ไขรายการสลิป' : 'อัปโหลดสลิป'}
        </button>
      </div>

      {/* Page Views Content */}
      <main>
        {activeTab === 'dashboard' && (
          <Dashboard 
            transactions={transactions} 
            onNavigate={(tab) => setActiveTab(tab)} 
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionList 
            transactions={transactions} 
            isLoading={isLoading} 
            onEdit={handleStartEdit} 
            onDeleted={fetchTransactions} 
            showToast={showToast}
          />
        )}

        {activeTab === 'add' && (
          <AddTransaction 
            onSave={handleTransactionAdded} 
            editingTransaction={editingTransaction}
            onCancel={handleCancelEdit}
            showToast={showToast}
            useSlip={false}
          />
        )}

        {activeTab === 'upload-slip' && (
          <AddTransaction 
            onSave={handleTransactionAdded} 
            editingTransaction={editingTransaction}
            onCancel={handleCancelEdit}
            showToast={showToast}
            useSlip={true}
          />
        )}
      </main>
    </div>
  );
}

export default App;
