import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Check, X, ArrowLeftRight, CreditCard, ShoppingBag, Loader2 } from 'lucide-react';
import SlipUploadZone from './SlipUploadZone';
import { recommendCategory } from '../services/categoryRules';
import { DEFAULT_CATEGORIES, createTransaction, updateTransaction, uploadSlip } from '../services/db';
import { createWorker } from 'tesseract.js';

function AddTransaction({ onSave, editingTransaction, onCancel, showToast, useSlip }) {
  const isEditMode = !!editingTransaction;
  
  // Form states
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('promptpay');
  const [slipImage, setSlipImage] = useState(null);
  const [slipImageUrl, setSlipImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // Category recommendation state
  const [recommended, setRecommended] = useState(null);

  // Initialize form if editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || 'expense');
      setAmount(editingTransaction.amount || '');
      setCategory(editingTransaction.category || '');
      setTransactionDate(editingTransaction.transaction_date || new Date().toISOString().split('T')[0]);
      setDescription(editingTransaction.description || '');
      setMerchant(editingTransaction.merchant || '');
      setPaymentMethod(editingTransaction.payment_method || 'promptpay');
      setSlipImageUrl(editingTransaction.slip_image_url || '');
    } else {
      // Set defaults for new transaction
      setType('expense');
      setAmount('');
      setCategory('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setMerchant('');
      setPaymentMethod(useSlip ? 'transfer' : 'promptpay');
      setSlipImage(null);
      setSlipImageUrl('');
    }
    setRecommended(null);
  }, [editingTransaction, useSlip]);

  // Set default category when type changes
  useEffect(() => {
    if (!category && !isEditMode) {
      const filtered = DEFAULT_CATEGORIES.filter(c => c.type === type);
      if (filtered.length > 0) {
        setCategory(filtered[0].name);
      }
    }
  }, [type, category, isEditMode]);

  // OCR Processing and Parsing Logic
  const processSlipOCR = async (file) => {
    try {
      setIsOcrProcessing(true);
      showToast('กำลังวิเคราะห์ข้อความจากสลิปด้วย AI...', 'info');

      // Create a web worker for OCR (loading English and Thai languages)
      const worker = await createWorker('tha+eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      console.log('Recognized text:', text);
      parseAndAutofill(text);
    } catch (err) {
      showToast('ไม่สามารถสแกนสลิปได้ (กรุณากรอกข้อมูลเอง): ' + err.message, 'error');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const parseAndAutofill = (text) => {
    if (!text) return;

    // Preprocess text:
    // 1. Remove spaces between digits and separators (e.g. 29 , 750 -> 29,750 or 150 . 00 -> 150.00)
    let preprocessedText = text.replace(/(\d+)\s*([\.,])\s*(\d+)/g, '$1$2$3');
    
    // 2. Replace periods that act as thousands separators (e.g. 29.750 -> 29750)
    preprocessedText = preprocessedText.replace(/(\d{1,3})\.(\d{3})(?!\d)/g, '$1$2');

    // 3. Fix common OCR letter confusion (e.g., 'o'/'O' -> '0', 'l'/'I' -> '1' when adjacent to numbers)
    preprocessedText = preprocessedText
      .replace(/(\d+)[oO]/g, '$10')
      .replace(/[oO](\d+)/g, '0$1')
      .replace(/(\d+)[lI]/g, '$11')
      .replace(/[lI](\d+)/g, '1$1');

    const lowerText = preprocessedText.toLowerCase();

    // 0. Detect Transaction Type (Income vs Expense)
    // Common keywords found in salary slips, payslips, or incoming deposit/transfer notifications
    const incomeKeywords = ['เงินเดือน', 'salary', 'payslip', 'paycheck', 'สลิปเงินเดือน', 'โบนัส', 'bonus', 'รายได้', 'ค่าจ้าง', 'earnings', 'net pay', 'เงินเข้า', 'รับโอน', 'received', 'deposit', 'credited'];
    const isIncome = incomeKeywords.some(keyword => lowerText.includes(keyword));

    if (isIncome) {
      setType('income');
      if (lowerText.includes('เงินเดือน') || lowerText.includes('salary') || lowerText.includes('payslip') || lowerText.includes('paycheck') || lowerText.includes('ค่าจ้าง')) {
        setCategory('รายรับหลัก');
        setDescription('เงินเดือน / รายได้หลัก (สแกนจากสลิป)');
      } else {
        setCategory('รายรับอื่น ๆ');
        setDescription('รายรับอื่น ๆ (สแกนจากสลิป)');
      }
    } else {
      setType('expense');
      setDescription('นำเข้าข้อมูลอัตโนมัติผ่านรูปภาพสลิป');
    }

    // 1. Detect Amount
    let detectedAmount = '';
    const priorityKeywords = [
      'เงินสุทธิ', 'คงเหลือสุทธิ', 'เงินรับสุทธิ', 'สุทธิ', 'net pay', 
      'total earnings', 'จำนวนเงิน', 'จํานวนเงิน', 'ยอดโอน', 'ยอดรวม', 'รวม'
    ];

    // Priority 1: Check priority keywords (most accurate for net salary/transfer amount)
    for (const kw of priorityKeywords) {
      const index = lowerText.indexOf(kw.toLowerCase());
      if (index !== -1) {
        const sub = preprocessedText.substring(index + kw.length, index + kw.length + 100);
        // Match numbers with commas/decimals or just plain integers - with word boundaries \b
        const match = sub.match(/\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/);
        if (match && match[1]) {
          const val = match[1].replace(/,/g, '');
          if (parseFloat(val) > 10) {
            detectedAmount = val;
            break;
          }
        }
      }
    }

    // Priority 2: Baht unit (e.g. 2,000.00 บาท) - with word boundaries \b
    if (!detectedAmount) {
      const bahtRegex = /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:บาท|baht|thb)\b/i;
      const bahtMatch = preprocessedText.match(bahtRegex);
      if (bahtMatch && bahtMatch[1]) {
        detectedAmount = bahtMatch[1].replace(/,/g, '');
      }
    }

    // Priority 3: Fallback checking amount keywords with decimals - with word boundaries \b
    if (!detectedAmount) {
      const amountKeywords = /(?:จำนวนเงิน|ยอดโอน|สุทธิ|net pay|total earnings|salary|เงินเดือน|เงินรับสุทธิ|ยอดสุทธิ|คงเหลือสุทธิ|amount|total|sum|baht|thb|บาท)\s*[:\-]?\s*\b(\d{1,3}(?:,\d{3})*(?:\.\d{2}))\b/i;
      const kwMatch = preprocessedText.match(amountKeywords);
      if (kwMatch && kwMatch[1]) {
        detectedAmount = kwMatch[1].replace(/,/g, '');
      } else {
        const decimalRegex = /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})\b/g;
        const allDecimals = preprocessedText.match(decimalRegex);
        if (allDecimals) {
          const numbers = allDecimals.map(n => parseFloat(n.replace(/,/g, '')));
          const realisticNumbers = numbers.filter(num => num > 0 && num < 1000000);
          if (realisticNumbers.length > 0) {
            detectedAmount = Math.max(...realisticNumbers).toString();
          }
        }
      }
    }

    // Priority 4: Search for any formatted numbers with commas (e.g. 30,000)
    if (!detectedAmount) {
      const commaNumbers = preprocessedText.match(/\b\d{1,3}(?:,\d{3})+(?:\.\d{2})?\b/g);
      if (commaNumbers) {
        const numbers = commaNumbers.map(n => parseFloat(n.replace(/,/g, '')));
        const validNumbers = numbers.filter(num => num > 100 && num < 1000000);
        if (validNumbers.length > 0) {
          detectedAmount = Math.max(...validNumbers).toString();
        }
      }
    }

    if (detectedAmount) {
      setAmount(detectedAmount);
    }

    // 2. Detect Date
    let detectedDate = '';
    // Format 1: DD/MM/YYYY or DD-MM-YYYY
    const slashDateRegex = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/;
    const slashMatch = preprocessedText.match(slashDateRegex);
    
    if (slashMatch) {
      let day = slashMatch[1].padStart(2, '0');
      let month = slashMatch[2].padStart(2, '0');
      let year = slashMatch[3];
      if (year.length === 2) year = '20' + year;
      if (parseInt(year) > 2400) {
        year = (parseInt(year) - 543).toString(); // Convert Buddhist Era to CE
      }
      detectedDate = `${year}-${month}-${day}`;
    } else {
      // Format 2: Thai Month Name (e.g. 04 มิ.ย. 69, 4 มิถุนายน 2569)
      const thaiMonths = {
        'ม.ค.': '01', 'มกราคม': '01',
        'ก.พ.': '02', 'กุมภาพันธ์': '02',
        'มี.ค.': '03', 'มีนาคม': '03',
        'เม.ย.': '04', 'เมษายน': '04',
        'พ.ค.': '05', 'พฤษภาคม': '05',
        'มิ.ย.': '06', 'มิถุนายน': '06',
        'ก.ค.': '07', 'กรกฎาคม': '07',
        'ส.ค.': '08', 'สิงหาคม': '08',
        'ก.ย.': '09', 'กันยายน': '09',
        'ต.ค.': '10', 'ตุลาคม': '10',
        'พ.ย.': '11', 'พฤศจิกายน': '11',
        'ธ.ค.': '12', 'ธันวาคม': '12'
      };
      
      const thaiMonthPattern = new RegExp(`(\\d{1,2})\\s*(${Object.keys(thaiMonths).join('|').replace(/\./g, '\\.')})\\s*(\\d{2,4})`, 'i');
      const thaiMonthMatch = preprocessedText.match(thaiMonthPattern);
      
      if (thaiMonthMatch) {
        const day = thaiMonthMatch[1].padStart(2, '0');
        const month = thaiMonths[thaiMonthMatch[2]];
        let year = thaiMonthMatch[3];
        if (year.length === 2) year = '20' + year;
        if (parseInt(year) > 2400) {
          year = (parseInt(year) - 543).toString();
        }
        detectedDate = `${year}-${month}-${day}`;
      } else {
        // Format 3: Month + Year (e.g. มกราคม 2567) without day
        const monthYearPattern = new RegExp(`(${Object.keys(thaiMonths).join('|').replace(/\./g, '\\.')})\\s*(\\d{4})`, 'i');
        const monthYearMatch = preprocessedText.match(monthYearPattern);
        if (monthYearMatch) {
          const month = thaiMonths[monthYearMatch[1]];
          let year = monthYearMatch[2];
          if (parseInt(year) > 2400) {
            year = (parseInt(year) - 543).toString();
          }
          detectedDate = `${year}-${month}-01`; // Default to 1st of that month
        }
      }
    }

    if (detectedDate) {
      setTransactionDate(detectedDate);
    }

    // 3. Detect Merchant / Receiver name
    const merchantKeywords = {
      '7-Eleven': ['7-eleven', 'seven', 'เซเว่น', 'เคาน์เตอร์เซอร์วิส'],
      'Lotus': ['lotus', 'โลตัส'],
      'Big C': ['big c', 'บิ๊กซี'],
      'Grab': ['grab', 'แกร็บ'],
      'Bolt': ['bolt', 'โบลท์'],
      'Shopee': ['shopee', 'ช้อปปี้'],
      'Lazada': ['lazada', 'ลาซาด้า'],
      'Netflix': ['netflix', 'เน็ตฟลิกซ์'],
      'Spotify': ['spotify', 'สปอติฟาย'],
      'BTS': ['bts', 'บีทีเอส'],
      'MRT': ['mrt', 'เอ็มอาร์ที']
    };

    let detectedMerchant = '';
    for (const [merch, keywords] of Object.entries(merchantKeywords)) {
      for (const kw of keywords) {
        if (lowerText.includes(kw)) {
          detectedMerchant = merch;
          break;
        }
      }
      if (detectedMerchant) break;
    }

    // Fallback: search for lines containing "ไปยัง" or "To" or employer details
    if (!detectedMerchant) {
      const toRegex = /(?:ไปยัง|to|ผู้รับโอน|transfer to|receiver|payee|บริษัท|company|employer|ผู้จ่ายเงิน)\s*[:\-]?\s*([^\n\r]+)/i;
      const toMatch = preprocessedText.match(toRegex);
      if (toMatch && toMatch[1]) {
        detectedMerchant = toMatch[1].replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, '').trim().slice(0, 30);
      }
    }

    if (detectedMerchant) {
      setMerchant(detectedMerchant);
    }

    // 5. Trigger category recommendation (only for expenses to avoid overwriting income values)
    if (!isIncome) {
      const bestCategory = recommendCategory(preprocessedText) || recommendCategory(detectedMerchant || 'สแกนจากสลิป');
      if (bestCategory) {
        setCategory(bestCategory);
      }
    }

    showToast('สแกนสลิปสำเร็จ! ทำการกรอกฟอร์มให้อัตโนมัติ', 'success');
  };

  const handleFileSelected = (file) => {
    setSlipImage(file);
    processSlipOCR(file);
  };

  // Handle recommendation checking on merchant/description changes
  const checkRecommendation = (merchantText, descText) => {
    const recMerchant = recommendCategory(merchantText);
    const recDesc = recommendCategory(descText);
    
    const bestRecommendation = recMerchant || recDesc;

    if (bestRecommendation && bestRecommendation !== category) {
      setRecommended(bestRecommendation);
    } else {
      setRecommended(null);
    }
  };

  const handleMerchantChange = (e) => {
    const value = e.target.value;
    setMerchant(value);
    checkRecommendation(value, description);
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    checkRecommendation(merchant, value);
  };

  const handleApplyRecommendation = () => {
    if (recommended) {
      setCategory(recommended);
      setRecommended(null);
      showToast(`ปรับหมวดหมู่เป็น "${recommended}" เรียบร้อยแล้ว`, 'success');
    }
  };

  const handleRemoveSlip = () => {
    setSlipImage(null);
    setSlipImageUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || Number(amount) <= 0) {
      showToast('กรุณากรอกจำนวนเงินให้ถูกต้อง', 'error');
      return;
    }
    if (!category) {
      showToast('กรุณาเลือกหมวดหมู่', 'error');
      return;
    }
    if (!transactionDate) {
      showToast('กรุณาเลือกวันที่รายการ', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      let finalSlipUrl = slipImageUrl;

      // Upload file if new one is selected
      if (slipImage) {
        showToast('กำลังอัปโหลดรูปภาพสลิป...', 'info');
        finalSlipUrl = await uploadSlip(slipImage);
      }

      const transactionData = {
        type,
        amount: parseFloat(amount),
        category,
        transaction_date: transactionDate,
        description,
        merchant,
        payment_method: paymentMethod,
        slip_image_url: finalSlipUrl || null
      };

      if (isEditMode) {
        await updateTransaction(editingTransaction.id, transactionData);
        onSave(editingTransaction, true);
      } else {
        await createTransaction(transactionData);
        onSave(transactionData, false);
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoriesToRender = DEFAULT_CATEGORIES.filter(c => c.type === type);

  return (
    <div className="glass-card" style={{ maxWidth: '640px', margin: '0 auto', padding: '28px' }}>
      <div className="flex-between" style={{ marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>
          {isEditMode ? 'แก้ไขรายการธุรกรรม' : useSlip ? 'เพิ่มรายการด้วยสลิปโอนเงิน' : 'กรอกรายละเอียดรายการ'}
        </h2>
        {isEditMode && (
          <button className="btn btn-secondary" onClick={onCancel} style={{ padding: '6px 12px', fontSize: '12px' }}>
            <X size={14} /> ยกเลิก
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Toggle Income / Expense */}
        <div className="form-group">
          <span className="form-label">ประเภทธุรกรรม (Transaction Type)</span>
          <div className="segmented-control">
            <button
              type="button"
              className={`segment-btn ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => {
                setType('expense');
                setCategory(''); // clear category to reapply defaults
              }}
            >
              รายจ่าย (Expense)
            </button>
            <button
              type="button"
              className={`segment-btn ${type === 'income' ? 'active income' : ''}`}
              onClick={() => {
                setType('income');
                setCategory(''); // clear category to reapply defaults
              }}
            >
              รายรับ (Income)
            </button>
          </div>
        </div>

        {/* Upload Slip Zone if tab is Upload Slip */}
        {(useSlip || slipImageUrl || slipImage) && (
          <SlipUploadZone 
            onFileSelected={handleFileSelected}
            selectedFile={slipImage}
            existingImageUrl={slipImageUrl}
            onRemoveFile={handleRemoveSlip}
          />
        )}

        {isOcrProcessing && (
          <div className="recommendation-banner" style={{ background: 'rgba(79, 70, 229, 0.08)', borderColor: 'rgba(79, 70, 229, 0.25)', color: '#c7d2fe' }}>
            <Loader2 style={{ animation: 'spin 1.2s linear infinite' }} size={16} />
            <span>กำลังสแกนอ่านข้อมูลวันที่ จำนวนเงิน และชื่อร้านค้าจากสลิปอัตโนมัติ...</span>
          </div>
        )}

        {/* Amount */}
        <div className="form-group">
          <span className="form-label">จำนวนเงิน (Amount - THB) *</span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>฿</span>
            <input
              type="number"
              className="form-control"
              style={{ paddingLeft: '32px', fontSize: '16px', fontWeight: '600' }}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Merchant */}
        <div className="form-group">
          <span className="form-label">ร้านค้า / ผู้รับโอน (Merchant / Receiver)</span>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="เช่น 7-Eleven, Grab, Shopee, BTS"
              value={merchant}
              onChange={handleMerchantChange}
            />
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <span className="form-label">รายละเอียดรายการ (Description)</span>
          <input
            type="text"
            className="form-control"
            placeholder="เช่น ซื้อข้าวเที่ยง, ค่ารถไฟ, เติมน้ำมันรถยนต์"
            value={description}
            onChange={handleDescriptionChange}
          />
        </div>

        {/* Category Recommendation Alert (Task 4 UI integration) */}
        {recommended && (
          <div className="recommendation-banner">
            <Sparkles size={16} color="#f59e0b" />
            <span>
              แนะนำหมวดหมู่: <strong>{recommended}</strong> จากคำสำคัญที่ตรวจพบ
            </span>
            <button
              type="button"
              className="recommendation-action"
              onClick={handleApplyRecommendation}
            >
              ยินยอมเปลี่ยน
            </button>
          </div>
        )}

        {/* Grid for Date, Category & Payment Method */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div className="form-group">
            <span className="form-label">หมวดหมู่ (Category) *</span>
            <select
              className="form-select"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="" disabled>เลือกหมวดหมู่</option>
              {categoriesToRender.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <span className="form-label">วิธีการชำระเงิน (Payment Method) *</span>
            <select
              className="form-select"
              required
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="promptpay">พร้อมเพย์ (PromptPay)</option>
              <option value="transfer">โอนเงินผ่านธนาคาร</option>
              <option value="cash">เงินสด (Cash)</option>
              <option value="e-wallet">e-Wallet (TrueMoney/Rabbit)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <span className="form-label">วันที่ทำรายการ (Transaction Date) *</span>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              className="form-control"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex-gap-2 m-top-4" style={{ justifyContent: 'flex-end', marginTop: '32px' }}>
          {isEditMode && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              ยกเลิก
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ minWidth: '120px' }}
          >
            {isSubmitting ? 'กำลังบันทึก...' : isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTransaction;
