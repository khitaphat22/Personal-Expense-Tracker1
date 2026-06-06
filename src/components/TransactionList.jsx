import React, { useState } from 'react';
import { Search, Filter, Calendar, Edit2, Trash2, Image, FileText, X, RefreshCw } from 'lucide-react';
import { deleteTransaction, DEFAULT_CATEGORIES } from '../services/db';

function TransactionList({ transactions, isLoading, onEdit, onDeleted, showToast }) {
  // Search and filter states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Slip Modal Preview State
  const [previewSlipUrl, setPreviewSlipUrl] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      try {
        await deleteTransaction(id);
        showToast('ลบรายการธุรกรรมเรียบร้อยแล้ว', 'success');
        onDeleted();
      } catch (err) {
        showToast('ไม่สามารถลบรายการได้: ' + err.message, 'error');
      }
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterCategory('all');
    setStartDate('');
    setEndDate('');
  };

  // Filtered transactions logic
  const filteredTransactions = transactions.filter(t => {
    // 1. Search text filter
    const matchesSearch = 
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.merchant && t.merchant.toLowerCase().includes(search.toLowerCase())) ||
      (t.category && t.category.toLowerCase().includes(search.toLowerCase()));

    // 2. Type filter
    const matchesType = filterType === 'all' || t.type === filterType;

    // 3. Category filter
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

    // 4. Date range filter
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && t.transaction_date >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && t.transaction_date <= endDate;
    }

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'promptpay': return 'พร้อมเพย์';
      case 'transfer': return 'โอนเงิน';
      case 'cash': return 'เงินสด';
      case 'e-wallet': return 'e-Wallet';
      default: return method;
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
        รายการธุรกรรมทั้งหมด ({filteredTransactions.length})
      </h2>

      {/* Search and Filters Bar */}
      <div className="glass-card" style={{ background: 'rgba(10, 14, 26, 0.4)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
        <div className="search-filter-bar">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">ค้นหารายการ (Search)</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px' }}
                placeholder="ค้นหาร้านค้า, รายละเอียด หรือหมวดหมู่..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">ประเภท (Type)</span>
            <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">ทั้งหมด (All Types)</option>
              <option value="income">รายรับ (Income)</option>
              <option value="expense">รายจ่าย (Expense)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">หมวดหมู่ (Category)</span>
            <select className="form-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">ทั้งหมด (All Categories)</option>
              {Array.from(new Set(DEFAULT_CATEGORIES.map(c => c.name))).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginTop: '12px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">ตั้งแต่วันที่ (Start Date)</span>
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">ถึงวันที่ (End Date)</span>
            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleClearFilters}
            style={{ height: '45px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* Loading & Empty State */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
          กำลังโหลดข้อมูล...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--color-text-secondary)', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
          <FileText size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ fontWeight: '500' }}>ไม่พบรายการธุรกรรมที่ตรงกับเงื่อนไข</p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>ลองเปลี่ยนคำค้นหาหรือตัวกรองข้อมูล</p>
        </div>
      ) : (
        /* Transactions Table */
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>วันที่ทำรายการ</th>
                <th>ประเภท</th>
                <th>หมวดหมู่</th>
                <th>ร้านค้า / แหล่งที่มา</th>
                <th>รายละเอียดรายการ</th>
                <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
                <th>การชำระเงิน</th>
                <th>สลิป</th>
                <th style={{ textAlign: 'center' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => (
                <tr key={tx.id}>
                  <td data-label="วันที่ทำรายการ" style={{ whiteSpace: 'nowrap' }}>
                    {tx.transaction_date}
                  </td>
                  <td data-label="ประเภท">
                    <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                      {tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                  </td>
                  <td data-label="หมวดหมู่" style={{ fontWeight: '500' }}>
                    {tx.category}
                  </td>
                  <td data-label="ร้านค้า / แหล่งที่มา">
                    {tx.merchant || '-'}
                  </td>
                  <td data-label="รายละเอียดรายการ" style={{ color: 'var(--color-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.description || '-'}
                  </td>
                  <td data-label="จำนวนเงิน" style={{ textAlign: 'right', fontWeight: '700', color: tx.type === 'income' ? 'hsl(var(--income))' : 'hsl(var(--color-text-primary))' }}>
                    {tx.type === 'income' ? '+' : '-'}฿{Number(tx.amount).toFixed(2)}
                  </td>
                  <td data-label="การชำระเงิน">
                    {getPaymentMethodLabel(tx.payment_method)}
                  </td>
                  <td data-label="สลิป">
                    {tx.slip_image_url ? (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setPreviewSlipUrl(tx.slip_image_url)}
                        style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Image size={14} color="hsl(var(--primary))" />
                      </button>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>ไม่มี</span>
                    )}
                  </td>
                  <td data-label="การจัดการ">
                    <div className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => onEdit(tx)}
                        style={{ padding: '6px 10px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleDelete(tx.id)}
                        style={{ padding: '6px 10px', borderColor: 'hsl(var(--expense) / 0.3)' }}
                      >
                        <Trash2 size={13} color="hsl(var(--expense))" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slip Preview Modal (Lightbox) */}
      {previewSlipUrl && (
        <div className="modal-overlay" onClick={() => setPreviewSlipUrl(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '20px', position: 'relative' }}>
            <button className="remove-upload" onClick={() => setPreviewSlipUrl(null)} style={{ background: '#374151' }}>
              <X size={14} />
            </button>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px', textAlign: 'center' }}>หลักฐานการโอนเงิน (Slip Preview)</h3>
            <img 
              src={previewSlipUrl} 
              alt="Uploaded Slip" 
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--glass-border)' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionList;
