# Personal Expense Tracker Web App (with Slip-Based Input)

ระบบบันทึกรายรับ–รายจ่ายส่วนบุคคล พร้อมระบบอัปโหลดรูปภาพสลิปและระบบแนะนำหมวดหมู่อัตโนมัติ (Rule-based Recommendation) 

โปรเจกต์นี้ถูกออกแบบและพัฒนาขึ้นด้วย **Vite + React + Vanilla CSS** เพื่อให้สามารถใช้งานได้อย่างสะดวก รวดเร็ว และรองรับการทำงานในแบบ **Offline-First (ด้วย LocalStorage)** และเชื่อมต่อกับ **Online Database (ด้วย Supabase)** ได้ทันทีโดยไม่จำเป็นต้องติดตั้งฐานข้อมูลเองก่อน

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

*   **Frontend**: React (v18) + JavaScript (ES6+)
*   **Styling**: Vanilla CSS (ออกแบบด้วยแนวทาง Glassmorphism, ระบบ HSL Colors, Grid & Flexbox Layout, Responsive Design)
*   **Build Tool**: Vite (v5)
*   **Database**:
    *   **LocalStorage Mode**: บันทึกข้อมูลบนบราวเซอร์ พร้อมจัดเก็บรูปสลิปในรูปแบบ Base64 Data URL สำหรับรันแอปพลิเคชันแบบ Local ทันที
    *   **Supabase Mode**: เชื่อมต่อกับ PostgreSQL ฐานข้อมูลเชิงสัมพันธ์และ Supabase Storage สำหรับการจัดเก็บไฟล์สลิปจริง
*   **Data Visualization**: Chart.js (แสดงผล Pie Chart สรุปรายจ่ายแยกตามหมวดหมู่)
*   **Icons**: Lucide React

---

## 💾 โครงสร้างฐานข้อมูล (Database Schema)

ระบบใช้งานโครงสร้างข้อมูลเชิงสัมพันธ์ (Relational Schema) โดยออกแบบบน PostgreSQL / Supabase ดังนี้:

```
                  +-------------------+
                  |       users       |
                  +-------------------+
                  | id (UUID - PK)    | <---------+
                  | name (VARCHAR)    |           |
                  | email (VARCHAR)   |           |
                  | password (VARCHAR)|           |
                  +-------------------+           |
                            |                     |
                            | (1:N)               | (1:N)
                            v                     |
                  +-------------------+           |
                  |    categories     |           |
                  +-------------------+           |
                  | id (UUID - PK)    |           |
                  | name (VARCHAR)    |           |
                  | type (income/exp) |           |
                  | user_id (UUID-FK) |           |
                  +-------------------+           |
                            |                     |
                            | (1:N)               |
                            v                     |
                  +-------------------+           |
                  |   transactions    |           |
                  +-------------------+           |
                  | id (UUID - PK)    |           |
                  | user_id (UUID-FK) |-----------+
                  | type (income/exp) |
                  | amount (NUMERIC)  |
                  | category (VARCHAR)|
                  | transaction_date  |
                  | description (TEXT)|
                  | merchant (VARCHAR)|
                  | payment_method    |
                  | slip_image_url    |
                  +-------------------+
```

### คำสั่ง SQL สำหรับสร้างตาราง (DDL Script)
ดูคำสั่ง SQL สำหรับใช้บน Supabase SQL Editor ได้จากแท็บ **"โครงสร้าง Database (Task 1)"** ในตัวแอปพลิเคชัน หรืออ่านในไฟล์ [DatabaseSchemaView.jsx](src/components/DatabaseSchemaView.jsx)

---

## 🧠 ระบบแนะนำหมวดหมู่อัตโนมัติ (Rule-based Recommendation)

แอปพลิเคชันมีระบบตรวจหาคำสำคัญ (Keywords) ในช่อง **ชื่อร้านค้า (Merchant)** และ **รายละเอียดรายการ (Description)** เพื่อแนะนำหมวดหมู่การใช้จ่ายโดยอัตโนมัติ ตามเงื่อนไขดังนี้:

| คำสำคัญที่ตรวจพบ (Keywords) | หมวดหมู่ที่แนะนำ (Recommended Category) |
| :--- | :--- |
| `7-Eleven`, `Lotus`, `Big C`, `Cafe`, `Food`, `Restaurant`, `Coffee`, `อาหาร`, `กาแฟ` | **อาหารและเครื่องดื่ม** |
| `Grab`, `Bolt`, `Bus`, `Taxi`, `Fuel`, `Gas`, `เติมน้ำมัน`, `รถไฟฟ้า`, `เดินทาง` | **เดินทาง** |
| `Book`, `Course`, `Tuition`, `Stationery`, `เรียน`, `หนังสือ`, `เครื่องเขียน` | **การเรียน** |
| `Shopee`, `Lazada`, `Shopping`, `Mall`, `เสื้อผ้า`, `ซื้อของ` | **ช้อปปิ้ง** |
| `Electric`, `Water`, `Internet`, `Phone`, `Netflix`, `บิล`, `ค่าไฟ`, `ค่าน้ำ` | **บิลและค่าสาธารณูปโภค** |
| `Hospital`, `Clinic`, `Medicine`, `หมอ`, `ยา`, `คลินิก` | **สุขภาพ** |
| `Movie`, `Game`, `Music`, `Steam`, `คอนเสิร์ต`, `หนัง`, `เกม` | **ความบันเทิง** |

---

## 💻 วิธีการติดตั้ง (Installation)

โปรเจกต์นี้สามารถรันได้ทันทีโดยการติดตั้ง Node.js บนเครื่องของคุณ ตามขั้นตอนดังนี้:

1.  **โคลนโปรเจกต์หรือดาวน์โหลดโฟลเดอร์**:
    นำไฟล์ทั้งหมดไปไว้ในโฟลเดอร์ทำงานของคุณ
2.  **เปิด Terminal และเข้าไปในโฟลเดอร์**:
    ```bash
    cd miniproject
    ```
3.  **ติดตั้ง Dependencies**:
    ```bash
    npm install
    ```
4.  **รันเซิร์ฟเวอร์สำหรับพัฒนา (Development Server)**:
    ```bash
    npm run dev
    ```
5.  **เปิดเบราว์เซอร์ใช้งาน**:
    เข้าสูู่หน้าเว็บที่ยูอาร์แอล [http://localhost:3000](http://localhost:3000)

*(ทางเลือก: ในกรณีต้องการเชื่อมต่อ Supabase ให้สร้างไฟล์ `.env` ที่ root directory แล้วใส่ค่า `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` แอปพลิเคชันจะสลับไปบันทึกบน Supabase และ Supabase Storage ทันที หากไม่ได้ระบุ แอปพลิเคชันจะรันในโหมด LocalStorage ออฟไลน์ทดลองใช้ได้ทันที)*

---

## 🚀 วิธีการใช้งาน (Usage)

1.  **แดชบอร์ดสรุป (Dashboard)**: แสดงสัดส่วนรายรับ รายจ่าย และยอดคงเหลือปัจจุบัน พร้อม Pie Chart สีสันสวยงามสรุปสัดส่วนรายจ่ายแยกตามหมวดหมู่แบบไดนามิกจากข้อมูลจริง
2.  **กรอกข้อมูลรายรับ-รายจ่าย**:
    *   **โหมดกรอกข้อมูลเอง**: เลือกประเภทธุรกรรม กรอกจำนวนเงิน ชื่อร้าน รายละเอียด และคลิกปุ่มบันทึก
    *   **โหมดอัปโหลดสลิป**: ลากรูปภาพสลิปโอนเงินมาวาง ระบบจะทำพรีวิวรูปสลิปให้ผู้ใช้ดูขนานไปกับการกรอกค่า วันที่, ยอดเงิน, และชื่อร้านค้า
3.  **ระบบแนะนำหมวดหมู่**: ขณะพิมพ์คำอธิบาย เช่น กรอกชื่อร้านค้าเป็น "7-Eleven" ระบบจะขึ้นแบนเนอร์แนะนำหมวดหมู่เป็น "อาหารและเครื่องดื่ม" สีเหลืองทองสวยงามให้กด "ยินยอมเปลี่ยน" เพื่อความรวดเร็ว
4.  **รายการธุรกรรมทั้งหมด**: ตารางแสดงข้อมูลอย่างละเอียด สามารถค้นหาด้วยคำสำคัญ (Search Bar), ตัวกรองประเภท (รายรับ/รายจ่าย), ตัวกรองหมวดหมู่ และตัวกรองช่วงวันที่ พร้อมฟังก์ชัน **แก้ไข (Edit)** และ **ลบ (Delete)** รายการ และสามารถกดดูรูปสลิปขยายใหญ่ในแบบ Modal Lightbox ได้อีกด้วย
5.  **Responsive Layout**: หน้าจอปรับขนาดสวยงามอัตโนมัติเมื่อดูผ่านโทรศัพท์มือถือ แท็บเล็ต หรือหน้าจอคอมพิวเตอร์ตามข้อกำหนด NFR-01 และ NFR-02

---

## 🤖 สรุปการใช้ AI Tools ในการช่วยพัฒนา (AI Assistance Summary)

ในการพัฒนาโปรเจกต์นี้ มีการนำ **Antigravity (AI Coding Assistant)** มาใช้ในการช่วยงานในแต่ละขั้นตอนดังนี้:
1.  **การออกแบบ Database Schema**: ใช้ AI ในการวิเคราะห์ฟิลด์ข้อมูลตามข้อกำหนดของระบบ ออกแบบความสัมพันธ์ระหว่างตาราง (Users, Categories, Transactions) และให้เขียน SQL DDL ที่มีระบบ Index และ Check Constraint ครบถ้วน
2.  **การพัฒนา UI & Component (React)**: ใช้ AI สร้างโครงสร้างโปรเจกต์ Vite + React แยกระบบ Component แบบโมดูลาร์ (เช่น AddTransaction, TransactionList, Dashboard)
3.  **การเขียนฟังก์ชัน CRUD**: ใช้ AI ร่างฟังก์ชัน CRUD เชื่อมต่อกับ Supabase Client API และเขียน fallback ไปยัง LocalStorage พร้อมกับแปลงไฟล์รูปสลิปเป็น Base64 Data URL เพื่อประยุกต์ให้รันโดยไม่มีเซิร์ฟเวอร์จริงได้
4.  **ระบบแนะนำหมวดหมู่ (Rule-based)**: ใช้ AI ในการจัดทำ Regex / Keyword Mapping เพื่อสร้างความคล่องตัวให้ฝั่ง UX สามารถเลือกหมวดหมู่ที่เหมาะสมได้ทันทีขณะพิมพ์
5.  **Dashboard & Charts**: ใช้ AI แนะนำวิธีการติดตั้งและเรียกใช้งาน Chart.js ด้วยเทคนิค `useRef` + `canvas` ดึงข้อมูลมาจับกลุ่มหมวดหมู่คำนวณสัดส่วนแบบเรียลไทม์
6.  **การออกแบบ CSS แบบพรีเมียม**: ใช้ AI ในการเขียนระบบสี HSL, เอฟเฟกต์เบลอหลังกระจก (Glassmorphic Backdrop Filter) และ CSS Table Responsive เพื่อรองรับการทำงานในมือถือแบบ 100%
