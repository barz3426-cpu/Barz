
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// generateProductDescription: generates marketing descriptions for products
export const generateProductDescription = async (productName: string, category: string) => {
  try {
    // Initializing GoogleGenAI inside the function to ensure it always uses the most up-to-date API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `اكتب وصفاً تسويقياً جذاباً ومختصراً باللغة العربية لمنتج اسمه "${productName}" في تصنيف "${category}". اجعله مناسباً لتطبيق خدمات وتوصيل.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "وصف المنتج الافتراضي الجميل والمميز لتطبيق خدماتي.";
  }
};

// generateVerificationMessage: generates professional email content for verification
export const generateVerificationMessage = async (userName: string, code: string) => {
  try {
    // Initializing GoogleGenAI inside the function to ensure it always uses the most up-to-date API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `أنت مساعد ذكي لتطبيق "خدماتي". اكتب رسالة ترحيب وتأكيد هوية احترافية للمستخدم "${userName}" تحتوي على كود التحقق "${code}". يجب أن تكون الرسالة باللغة العربية بأسلوب راقٍ ومناسب لبريد إلكتروني.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return `مرحباً بك في خدماتي. رمز التحقق الخاص بك هو: ${code}`;
  }
};

// generateVerificationSMS: generates short SMS content for verification
export const generateVerificationSMS = async (userName: string, code: string) => {
  try {
    // Initializing GoogleGenAI inside the function to ensure it always uses the most up-to-date API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `أنت مساعد ذكي لتطبيق "خدماتي". صغ رسالة SMS قصيرة جداً للمستخدم "${userName}" تحتوي على كود التحقق "${code}". يجب أن تكون الرسالة باللغة العربية ومباشرة جداً.`,
    });
    return response.text;
  } catch (error) {
    return `رمز التحقق الخاص بك في خدماتي هو: ${code}`;
  }
};
