/**
 * Rule-based category recommendation system.
 * Matches keywords (case-insensitive) in transaction details
 * and returns the recommended category name.
 */

export const categoryRules = [
  {
    category: 'อาหารและเครื่องดื่ม',
    keywords: [
      '7-eleven', '711', 'seven', 'lotus', 'big c', 'cafe', 'food', 'restaurant', 'coffee', 'starbucks', 'kfc', 'mcdonald', 
      'อาหาร', 'กาแฟ', 'ชา', 'ส้มตำ', 'ก๋วยเตี๋ยว', 'ข้าว', 'เครื่องดื่ม', 'ชาไข่มุก', 'หมูกระทะ', 'ชาบู', 'บุฟเฟต์', 'เบเกอรี่', 
      'ของหวาน', 'ผลไม้', 'สตรีทฟู้ด', 'lineman', 'foodpanda', 'grabfood', 'robinhood'
    ]
  },
  {
    category: 'เดินทาง',
    keywords: [
      'grab', 'bolt', 'bts', 'mrt', 'bus', 'taxi', 'fuel', 'gas', 'esso', 'ptt', 'shell', 'caltex', 'เดินทาง', 'รถเมล์', 
      'รถไฟฟ้า', 'เติมน้ำมัน', 'น้ำมัน', 'วินมอเตอร์ไซค์', 'ทางด่วน', 'ค่าจอดรถ', 'ตั๋วรถไฟ', 'รถทัวร์', 'สายการบิน', 'แอร์เอเชีย'
    ]
  },
  {
    category: 'การเรียน',
    keywords: [
      'book', 'course', 'tuition', 'stationery', 'school', 'university', 'pen', 'pencil', 'udemy', 'coursera', 
      'เรียน', 'หนังสือ', 'ปากกา', 'ค่าเทอม', 'เครื่องเขียน', 'อบรม', 'สัมมนา', 'คอร์ส', 'ชีทสรุป', 'ข้อสอบ'
    ]
  },
  {
    category: 'ช้อปปิ้ง',
    keywords: [
      'shopee', 'lazada', 'shopping', 'mall', 'store', 'amazon', 'aliexpress', 'clothes', 'shoes', 'ช้อปปิ้ง', 'ซื้อของ', 
      'เสื้อผ้า', 'รองเท้า', 'ห้าง', 'แฟชั่น', 'tiktok shop', 'กล่องสุ่ม', 'ของแต่งห้อง', 'เครื่องสำอาง', 'น้ำหอม', 'สกินแคร์'
    ]
  },
  {
    category: 'บิลและค่าสาธารณูปโภค',
    keywords: [
      'electric', 'water', 'internet', 'phone', 'mobile', 'netflix', 'spotify', 'youtube premium', 'bill', 'ไฟ', 'น้ำ', 
      'อินเทอร์เน็ต', 'มือถือ', 'โทรศัพท์', 'บิล', 'ค่าไฟ', 'ค่าน้ำ', 'ประปา', 'ไฟฟ้า', 'ค่าเน็ต', 'ค่าห้อง', 'ค่าหอ'
    ]
  },
  {
    category: 'สุขภาพ',
    keywords: [
      'hospital', 'clinic', 'medicine', 'pharmacy', 'doctor', 'supplement', 'vitamin', 'dentist', 'หมอ', 'โรงพยาบาล', 
      'คลินิก', 'ยา', 'วิตามิน', 'ทำฟัน', 'รักษา', 'ค่ายา', 'ตรวจสุขภาพ', 'แว่นตา', 'คอนแทคเลนส์'
    ]
  },
  {
    category: 'ความบันเทิง',
    keywords: [
      'movie', 'game', 'music', 'cinema', 'steam', 'playstation', 'nintendo', 'concert', 'karaoke', 'เที่ยว', 'หนัง', 
      'เกม', 'เพลง', 'คอนเสิร์ต', 'คาราโอเกะ', 'ปาร์ตี้', 'ผับ', 'บาร์', 'เมเจอร์', 'เอสเอฟ', 'ตั๋วหนัง'
    ]
  }
];

/**
 * Recommends a category based on the text input (merchant, description, etc.).
 * Returns the category name if a match is found, otherwise null.
 * 
 * @param {string} text - The input text to analyze
 * @returns {string|null} - Recommended category name or null
 */
export function recommendCategory(text) {
  if (!text || typeof text !== 'string') return null;
  
  const normalizedText = text.toLowerCase().trim();
  
  for (const rule of categoryRules) {
    for (const keyword of rule.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        return rule.category;
      }
    }
  }
  
  return null;
}
