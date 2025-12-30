
import { scriptDb } from './appsScriptService';
import { generateVerificationSMS } from '../geminiService';

/**
 * خدمة إرسال الرسائل الحقيقية عبر Apps Script (Vonage/Nexmo)
 * تم استبدال Firebase بنظام مباشر وأخف
 */
export const smsService = {
  // تخزين الكود مؤقتاً في المتصفح للتحقق (بديل لجلسة فايربيس)
  generatedCode: null as string | null,
  targetPhone: null as string | null,

  /**
   * إرسال رمز التحقق عبر سكريبت جوجل والباك اند المخصص
   */
  async sendOTP(phone: string) {
    try {
      // 1. توليد كود عشوائي من 6 أرقام
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      this.generatedCode = code;
      this.targetPhone = phone;

      // 2. استخدام Gemini لتوليد نص رسالة جذاب
      const messageText = await generateVerificationSMS("مستخدم خدماتي", code);

      // 3. الإرسال عبر الباك اند (Google Apps Script) الذي يتصل بـ Vonage
      console.log(`جاري إرسال SMS إلى ${phone} بالكود ${code}`);
      await scriptDb.postData('sendSMS', { 
        to: phone, 
        message: messageText 
      });
      
      return true;
    } catch (error: any) {
      console.error("SMS Service Error:", error);
      throw new Error("فشل إرسال كود التحقق، يرجى المحاولة لاحقاً");
    }
  },

  /**
   * التأكد من صحة الكود بمقارنته بالكود المولد
   */
  async verifyOTP(code: string) {
    if (!this.generatedCode) {
      throw new Error("لم يتم طلب كود لهذا الرقم");
    }

    if (this.generatedCode === code) {
      return { phone: this.targetPhone, verified: true };
    } else {
      throw new Error("رمز التحقق الذي أدخلته غير صحيح");
    }
  }
};