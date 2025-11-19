# Gemini Financial Analyst 📊

Web Application สำหรับวิเคราะห์ข้อมูล CSV ทางการเงินด้วย Natural Language Query (ภาษาไทย) ขับเคลื่อนด้วย Google Gemini API

## 🚀 Features
- **Smart Parsing:** รองรับการอ่านไฟล์ CSV ขนาดใหญ่ (Client-side)
- **AI Analysis:** ตอบคำถาม "สรุปยอดรวม", "หาค่าเฉลี่ย", "เปรียบเทียบ BA" ได้ทันที
- **Markdown Reports:** แสดงผลในรูปแบบตารางและกราฟข้อความที่สวยงาม

## 🛠️ Setup & Run (Local)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variable**
   สร้างไฟล์ `.env` และใส่ API Key ของคุณ:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

3. **Start Server**
   ```bash
   npm run dev
   ```

## ☁️ Deploy on Vercel

โปรเจกต์นี้พร้อมสำหรับ Vercel ทันที:

1. Push code ขึ้น **GitHub**
2. Import Project ใน **Vercel Dashboard**
3. ในหน้าตั้งค่า **Environment Variables**:
   - ชื่อ: `API_KEY`
   - ค่า: ใส่ Gemini API Key ของคุณ
4. กด **Deploy**

> **หมายเหตุ:** เนื่องจากเป็น Client-side App, API Key จะถูก Bundle เข้าไปในโค้ด (ผ่าน `vite.config.ts`) กรุณาจำกัดสิทธิ์การใช้งาน API Key ใน Google Cloud Console (เช่น จำกัด HTTP Referrer) เพื่อความปลอดภัย

## 🐳 Deploy with Docker

1. **Build Image** (ต้องส่ง API Key ขณะ Build)
   ```bash
   docker build --build-arg API_KEY=your_key_here -t gemini-analyst .
   ```

2. **Run Container**
   ```bash
   docker run -p 8080:80 gemini-analyst
   ```
   เข้าใช้งานได้ที่ `http://localhost:8080`