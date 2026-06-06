import React, { useState } from 'react';
import { Database, Table, Key, Link2, Copy, Check } from 'lucide-react';

function DatabaseSchemaView() {
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- 1. สร้างตาราง Users (สำหรับระบบจัดการสมาชิก)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- เก็บแฮชรหัสผ่าน
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. สร้างตาราง Categories (สำหรับหมวดหมู่รายรับ-รายจ่าย)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL หากเป็นหมวดหมู่เริ่มต้นจากระบบ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. สร้างตาราง Transactions (สำหรับบันทึกรายรับ-รายจ่าย)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- เชื่อมกับเจ้าของรายการ
    type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
    amount NUMERIC(12, 2) CHECK (amount >= 0) NOT NULL,
    category VARCHAR(100) NOT NULL, -- หรือสามารถเชื่อมโยง Foreign Key ไปยัง Categories.id
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    merchant VARCHAR(150),
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'transfer', 'promptpay', 'e-wallet')) NOT NULL,
    slip_image_url TEXT, -- ลิงก์เก็บรูปภาพสลิปใน Storage (เช่น Supabase Storage)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. การสร้าง Indexes เพื่อเพิ่มประสิทธิภาพการสอบถามข้อมูล (Optimization)
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);

-- 5. บันทึกข้อมูลหมวดหมู่เริ่มต้น (Seed Default Categories)
INSERT INTO categories (name, type) VALUES
('อาหารและเครื่องดื่ม', 'expense'),
('เดินทาง', 'expense'),
('การเรียน', 'expense'),
('ช้อปปิ้ง', 'expense'),
('บิลและค่าสาธารณูปโภค', 'expense'),
('สุขภาพ', 'expense'),
('ความบันเทิง', 'expense'),
('รายรับหลัก', 'income'),
('รายรับอื่น ๆ', 'income'),
('อื่น ๆ', 'expense');`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card" style={{ padding: '28px' }}>
      <div className="flex-between" style={{ marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={24} color="hsl(var(--primary))" />
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>การออกแบบโครงสร้างฐานข้อมูล (Database Schema)</h2>
        </div>
        <button className="btn btn-secondary" onClick={handleCopy} style={{ padding: '6px 12px', fontSize: '12px' }}>
          {copied ? <Check size={14} color="hsl(var(--income))" /> : <Copy size={14} />}
          {copied ? 'คัดลอกแล้ว!' : 'คัดลอก SQL Code'}
        </button>
      </div>

      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
        โครงสร้างฐานข้อมูลแบบ Relational Database ออกแบบขึ้นสำหรับโปรเจกต์ <strong>Personal Expense Tracker</strong>
        โดยอิงฟิลด์จากข้อกำหนด SRS และใช้ <strong>Supabase (PostgreSQL)</strong> ในการทำระบบจริง มีความสัมพันธ์ของข้อมูลดังต่อไปนี้:
      </p>

      {/* Relations Cards Grid */}
      <div className="grid-cols-3" style={{ gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--primary))', marginBottom: '10px' }}>
            <Table size={18} />
            <h3 style={{ fontSize: '15px', fontWeight: '600' }}>ตาราง Users</h3>
          </div>
          <ul style={{ fontSize: '13px', color: 'var(--color-text-secondary)', paddingLeft: '16px', lineHeight: '1.8' }}>
            <li><code>id</code> (UUID PK) - ไอดีผู้ใช้</li>
            <li><code>name</code> (VARCHAR) - ชื่อผู้ใช้</li>
            <li><code>email</code> (VARCHAR UNIQUE) - อีเมล</li>
            <li><code>password</code> (VARCHAR) - รหัสผ่าน</li>
          </ul>
        </div>

        <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--income))', marginBottom: '10px' }}>
            <Table size={18} />
            <h3 style={{ fontSize: '15px', fontWeight: '600' }}>ตาราง Categories</h3>
          </div>
          <ul style={{ fontSize: '13px', color: 'var(--color-text-secondary)', paddingLeft: '16px', lineHeight: '1.8' }}>
            <li><code>id</code> (UUID PK) - ไอดีหมวดหมู่</li>
            <li><code>name</code> (VARCHAR) - ชื่อหมวดหมู่</li>
            <li><code>type</code> (income / expense) - ประเภท</li>
            <li><code>user_id</code> (UUID FK) {"->"} <code>users.id</code></li>
          </ul>
        </div>

        <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--expense))', marginBottom: '10px' }}>
            <Table size={18} />
            <h3 style={{ fontSize: '15px', fontWeight: '600' }}>ตาราง Transactions</h3>
          </div>
          <ul style={{ fontSize: '13px', color: 'var(--color-text-secondary)', paddingLeft: '16px', lineHeight: '1.8' }}>
            <li><code>id</code> (UUID PK) - ไอดีรายการ</li>
            <li><code>user_id</code> (UUID FK) {"->"} <code>users.id</code></li>
            <li><code>type</code> (income / expense)</li>
            <li><code>amount</code> (NUMERIC) - จำนวนเงิน</li>
            <li><code>category</code> (VARCHAR) - หมวดหมู่</li>
            <li><code>slip_image_url</code> (TEXT) - ลิงก์สลิป</li>
          </ul>
        </div>
      </div>

      {/* Relationships Explanatory Box */}
      <div className="glass-card" style={{ border: '1px dashed hsl(var(--primary) / 0.3)', background: 'hsl(var(--primary) / 0.02)', padding: '18px', borderRadius: '12px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Link2 size={16} color="hsl(var(--primary))" />
          ความสัมพันธ์ของข้อมูล (Data Relationships)
        </h4>
        <ul style={{ fontSize: '13px', color: 'var(--color-text-secondary)', paddingLeft: '16px', lineHeight: '1.8' }}>
          <li>
            <strong>Users to Transactions (One-to-Many):</strong> ผู้ใช้งาน 1 คน สามารถมีรายการธุรกรรมได้หลายรายการ เชื่อมต่อกันผ่านคอลัมน์ <code>user_id</code> ในตาราง <code>transactions</code>
          </li>
          <li>
            <strong>Users to Categories (One-to-Many):</strong> ผู้ใช้งานสามารถสร้างหมวดหมู่ใช้เองได้ โดยเชื่อมโยงผ่าน <code>user_id</code> ในตาราง <code>categories</code> (หาก <code>user_id</code> เป็น <code>NULL</code> หมายถึงหมวดหมู่เริ่มต้นจากระบบที่เปิดให้ผู้ใช้ทุกคนเห็นร่วมกัน)
          </li>
          <li>
            <strong>Categories to Transactions (One-to-Many):</strong> แต่ละรายการธุรกรรมจัดอยู่ในหมวดหมู่หนึ่ง ๆ โดยอิงชื่อหมวดหมู่ตามข้อกำหนด (หรือสามารถดีไซน์ให้เก็บไอดีหมวดหมู่ <code>category_id</code> เชื่อมไปยังตาราง <code>categories</code>)
          </li>
        </ul>
      </div>

      {/* DDL Code Block */}
      <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Database size={16} />
        SQL DDL Scripts (สำหรับสร้างตารางใน PostgreSQL / Supabase SQL Editor)
      </h3>
      <pre style={{
        background: '#040711',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '12.5px',
        color: '#a5b4fc',
        overflowX: 'auto',
        fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
        lineHeight: '1.5',
        maxHeight: '400px'
      }}>
        <code>{sqlCode}</code>
      </pre>
    </div>
  );
}

export default DatabaseSchemaView;
