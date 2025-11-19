import { GoogleGenAI } from "@google/genai";
import { FinancialRecord } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("Error: API_KEY is not defined. Please check your environment variables.");
}

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const analyzeData = async (
  data: FinancialRecord[],
  userQuery: string
): Promise<string> => {
  try {
    // 1. Prepare Context (Data Truncation to fit Token Limits)
    // Limit rows to prevent payload too large error (approx 8000 rows is safe for Flash)
    const MAX_ROWS = 8000;
    const slicedData = data.slice(0, MAX_ROWS);
    
    const csvContent = [
      "BA,monthly,actCode,amount", // Explicit Header
      ...slicedData.map(row => `${row.BA},${row.monthly},${row.actCode},${row.amount}`)
    ].join("\n");

    const isTruncated = data.length > MAX_ROWS;
    
    // 2. Construct Prompt
    const promptText = `
Data Context (CSV Format${isTruncated ? `, First ${MAX_ROWS} rows` : ''}):
\`\`\`csv
${csvContent}
\`\`\`

User Question: "${userQuery}"

Please analyze the data above to answer the user's question.
    `;

    // 3. Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: promptText }],
      config: {
        systemInstruction: `
คุณคือ "AI Financial Analyst" ผู้เชี่ยวชาญด้านการวิเคราะห์ข้อมูลการเงิน
หน้าที่ของคุณคือ:
1. ตอบคำถามจากข้อมูล CSV ที่ได้รับเท่านั้น ห้ามสร้างข้อมูลเท็จ (Hallucination)
2. หากต้องคำนวณ ให้แสดงตัวเลขที่ชัดเจน (เช่น ยอดรวม, ค่าเฉลี่ย)
3. หากพบข้อมูลที่น่าสนใจ (Insight) ให้ระบุเพิ่มเติม
4. ใช้ภาษาไทยในการตอบโต้ทั้งหมด
5. จัดรูปแบบคำตอบเป็น **Markdown** ให้อ่านง่าย (ใช้ Bullet point, Table, Bold text)
6. ถ้าข้อมูลถูกตัดทอน (Truncated) ให้ระบุในหมายเหตุว่า "วิเคราะห์จากข้อมูล ${MAX_ROWS} รายการแรก"
        `,
        temperature: 0.2, // Low temperature for factual accuracy
        topP: 0.8,
      }
    });

    return response.text || "ไม่สามารถสร้างคำตอบได้ในขณะนี้";

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI (API Error)");
  }
};