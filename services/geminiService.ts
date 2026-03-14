import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const suggestFilenameWithAI = async (filenames: string[]): Promise<string> => {
  const client = getClient();
  if (!client) return "merged_code.ts";

  try {
    const fileListString = filenames.slice(0, 50).join(", ");
    const prompt = `
      Tôi có một danh sách các file mã nguồn TypeScript (.ts).
      Hãy phân tích tên của chúng và đề xuất MỘT tên file duy nhất (snake_case hoặc camelCase) đại diện cho module hoặc chức năng tổng hợp của chúng.
      Nếu tên file có chứa số thứ tự (part1, part2...), hãy loại bỏ số đó để tạo tên chung.
      Chỉ trả về duy nhất chuỗi tên file (bao gồm đuôi .ts). Không giải thích gì thêm.
      
      Danh sách file: ${fileListString}
    `;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text;
    if (!text) return "merged_code.ts";
    
    let cleanName = text.replace(/```/g, '').trim();
    if (!cleanName.endsWith('.ts')) {
      cleanName += '.ts';
    }
    return cleanName;
  } catch (error) {
    console.error("Gemini suggestion error:", error);
    return "merged_code.ts";
  }
};