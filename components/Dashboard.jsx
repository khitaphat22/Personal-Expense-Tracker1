import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { ArrowRight, Plus, UploadCloud, TrendingUp, Sparkles, PieChart as PieIcon, ListCollapse } from 'lucide-react';

function Dashboard({ transactions, onNavigate }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Filter only expense transactions
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Group expenses by category
  const categorySummary = expenses.reduce((acc, t) => {
    const amount = Number(t.amount) || 0;
    if (acc[t.category]) {
      acc[t.category] += amount;
    } else {
      acc[t.category] = amount;
    }
    return acc;
  }, {});

  // Sort categories by amount descending
  const sortedCategories = Object.keys(categorySummary)
    .map(key => ({
      name: key,
      value: categorySummary[key],
      percentage: totalExpense > 0 ? (categorySummary[key] / totalExpense) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);

  // Recent transactions (last 4)
  const recentTransactions = transactions.slice(0, 4);

  // Chart colors mapping
  const chartColors = [
    'rgba(79, 70, 229, 0.75)',   // Indigo
    'rgba(244, 63, 94, 0.75)',   // Rose
    'rgba(16, 185, 129, 0.75)',  // Emerald
    'rgba(245, 158, 11, 0.75)',  // Amber
    'rgba(59, 130, 246, 0.75)',  // Blue
    'rgba(139, 92, 246, 0.75)',  // Purple
    'rgba(236, 72, 153, 0.75)',  // Pink
    'rgba(14, 165, 233, 0.75)',  // Sky
    'rgba(107, 114, 128, 0.75)'  // Gray / Other
  ];

  const borderColors = chartColors.map(c => c.replace('0.75', '1'));

  useEffect(() => {
    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (chartRef.current && sortedCategories.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: sortedCategories.map(c => c.name),
          datasets: [{
            data: sortedCategories.map(c => c.value),
            backgroundColor: chartColors.slice(0, sortedCategories.length),
            borderColor: borderColors.slice(0, sortedCategories.length),
            borderWidth: 1.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#f3f4f6',
                font: {
                  family: 'Outfit, Sarabun, sans-serif',
                  size: 11
                },
                padding: 16
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const percentage = totalExpense > 0 ? ((value / totalExpense) * 100).toFixed(1) : 0;
                  return ` ${label}: ฿${value.toLocaleString()} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [transactions]);

  // Helper to format YYYY-MM-DD in local time
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const todayStr = getLocalDateString(now);

  // Start of current week (Monday)
  const startOfWeek = new Date(now);
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
  startOfWeek.setDate(now.getDate() - distanceToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // End of current week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Start of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  // End of current month
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  // Calculate daily, weekly, monthly income/expense
  const dailyStats = transactions.reduce((acc, t) => {
    if (t.transaction_date === todayStr) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') acc.income += amt;
      else acc.expense += amt;
    }
    return acc;
  }, { income: 0, expense: 0 });

  const weeklyStats = transactions.reduce((acc, t) => {
    const txDate = new Date(t.transaction_date + 'T00:00:00');
    if (txDate >= startOfWeek && txDate <= endOfWeek) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') acc.income += amt;
      else acc.expense += amt;
    }
    return acc;
  }, { income: 0, expense: 0 });

  const monthlyStats = transactions.reduce((acc, t) => {
    const txDate = new Date(t.transaction_date + 'T00:00:00');
    if (txDate >= startOfMonth && txDate <= endOfMonth) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') acc.income += amt;
      else acc.expense += amt;
    }
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <div>
      {/* Quick Action Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div 
          className="glass-card" 
          style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '20px' }}
          onClick={() => onNavigate('add')}
        >
          <div style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', padding: '12px', borderRadius: '10px' }}>
            <Plus size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600' }}>กรอกข้อมูลรายการเอง</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>ป้อนรายรับ-รายจ่าย รายละเอียด และร้านค้าด้วยตนเอง</p>
          </div>
          <ArrowRight size={16} color="var(--color-text-muted)" />
        </div>

        <div 
          className="glass-card" 
          style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', padding: '20px' }}
          onClick={() => onNavigate('upload-slip')}
        >
          <div style={{ background: 'hsl(var(--income) / 0.12)', color: 'hsl(var(--income))', padding: '12px', borderRadius: '10px' }}>
            <UploadCloud size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600' }}>อัปโหลดสลิปโอนเงิน</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>อัปโหลดสลิปเพื่อดูพรีวิวและกรอกรายละเอียดข้อมูลรายการ</p>
          </div>
          <ArrowRight size={16} color="var(--color-text-muted)" />
        </div>
      </div>

      {/* Periodic stats grid (Daily, Weekly, Monthly) */}
      <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
        {/* Daily card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary))' }}></span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--primary))' }}>รายวัน ณ ปัจจุบัน (Daily)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="flex-between" style={{ fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>รายรับ:</span>
              <span style={{ fontWeight: '600', color: 'hsl(var(--income))' }}>+฿{dailyStats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex-between" style={{ fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>รายจ่าย:</span>
              <span style={{ fontWeight: '600', color: 'hsl(var(--expense))' }}>-฿{dailyStats.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex-between" style={{ fontSize: '13.5px', fontWeight: '700', marginTop: '4px', borderTop: '1px dashed var(--glass-border)', paddingTop: '6px' }}>
              <span>สุทธิ:</span>
              <span style={{ color: (dailyStats.income - dailyStats.expense) >= 0 ? 'hsl(var(--income))' : 'hsl(var(--expense))' }}>
                ฿{(dailyStats.income - dailyStats.expense).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--warning))' }}></span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--warning))' }}>รายสัปดาห์ปัจจุบัน (Weekly)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="flex-between" style={{ fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>รายรับ:</span>
              <span style={{ fontWeight: '600', color: 'hsl(var(--income))' }}>+฿{weeklyStats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex-between" style={{ fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>รายจ่าย:</span>
              <span style={{ fontWeight: '600', color: 'hsl(var(--expense))' }}>-฿{weeklyStats.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex-between" style={{ fontSize: '13.5px', fontWeight: '700', marginTop: '4px', borderTop: '1px dashed var(--glass-border)', paddingTop: '6px' }}>
              <span>สุทธิ:</span>
              <span style={{ color: (weeklyStats.income - weeklyStats.expense) >= 0 ? 'hsl(var(--income))' : 'hsl(var(--expense))' }}>
                ฿{(weeklyStats.income - weeklyStats.expense).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--income))' }}></span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--income))' }}>รายเดือนปัจจุบัน (Monthly)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="flex-between" style={{ fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>รายรับ:</span>
              <span style={{ fontWeight: '600', color: 'hsl(var(--income))' }}>+฿{monthlyStats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex-between" style={{ fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>รายจ่าย:</span>
              <span style={{ fontWeight: '600', color: 'hsl(var(--expense))' }}>-฿{monthlyStats.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex-between" style={{ fontSize: '13.5px', fontWeight: '700', marginTop: '4px', borderTop: '1px dashed var(--glass-border)', paddingTop: '6px' }}>
              <span>สุทธิ:</span>
              <span style={{ color: (monthlyStats.income - monthlyStats.expense) >= 0 ? 'hsl(var(--income))' : 'hsl(var(--expense))' }}>
                ฿{(monthlyStats.income - monthlyStats.expense).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Panel */}
      <div className="grid-dashboard">
        {/* Left Side: Category Summaries Table */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <ListCollapse size={18} color="hsl(var(--primary))" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>ค่าใช้จ่ายรายหมวดหมู่ (Expense by Category)</h3>
          </div>

          {sortedCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              ยังไม่มีข้อมูลการใช้จ่ายในระบบ กรุณาเพิ่มธุรกรรมประเภทรายจ่ายเพื่อแสดงสถิติ
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {sortedCategories.map((cat, idx) => (
                <div key={cat.name}>
                  <div className="flex-between" style={{ fontSize: '13.5px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        backgroundColor: chartColors[idx % chartColors.length] 
                      }}></span>
                      <span style={{ fontWeight: '500' }}>{cat.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <span style={{ fontWeight: '700' }}>
                      ฿{cat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {/* Glass progress bar */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${cat.percentage}%`, 
                      height: '100%', 
                      background: chartColors[idx % chartColors.length],
                      borderRadius: '10px'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Pie Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="flex-between" style={{ width: '100%', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PieIcon size={18} color="hsl(var(--expense))" />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>สัดส่วนรายจ่าย (Expense Chart.js)</h3>
            </div>
          </div>

          {sortedCategories.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', padding: '50px 20px', fontSize: '14px', textAlign: 'center' }}>
              ไม่พบรายการค่าใช้จ่าย
            </div>
          ) : (
            <div style={{ width: '100%', height: '280px', position: 'relative', margin: 'auto' }}>
              <canvas ref={chartRef}></canvas>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="glass-card" style={{ marginTop: '24px' }}>
        <div className="flex-between" style={{ marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={18} color="hsl(var(--income))" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>กิจกรรมล่าสุด (Recent Transactions)</h3>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={() => onNavigate('transactions')}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            ดูรายการทั้งหมด
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            ไม่มีรายการเคลื่อนไหวล่าสุด
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentTransactions.map(tx => (
              <div 
                key={tx.id} 
                className="glass-card" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  padding: '12px 18px', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255,255,255,0.04)' 
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`} style={{ padding: '2px 6px', fontSize: '9px' }}>
                      {tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{tx.merchant || tx.category}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {tx.transaction_date} &bull; {tx.description || tx.category}
                  </div>
                </div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: tx.type === 'income' ? 'hsl(var(--income))' : 'var(--color-text-primary)' }}>
                  {tx.type === 'income' ? '+' : '-'}฿{Number(tx.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
