
import { generateVerificationMessage } from '../geminiService';
import { scriptDb } from './appsScriptService';

/**
 * خدمة إرسال البريد الإلكتروني المجانية
 * تعتمد على Google Apps Script (GmailApp)
 */
export const emailService = {
  async sendOTP(to: string, userName: string, code: string) {
    try {
      // استخدام Gemini لتوليد نص الرسالة بشكل احترافي
      const aiContent = await generateVerificationMessage(userName, code);
      
      const htmlBody = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #2563eb; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900;">خدماتي</h1>
          </div>
          <div style="padding: 40px 30px; color: #1e293b; line-height: 1.6;">
            <h2 style="color: #0f172a; margin-bottom: 20px;">مرحباً ${userName}،</h2>
            <p style="font-size: 16px;">${aiContent}</p>
            
            <div style="margin: 40px 0; text-align: center;">
              <div style="display: inline-block; padding: 20px 40px; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px;">
                <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #2563eb;">${code}</span>
              </div>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 15px;">هذا الكود صالح لمدة 15 دقيقة فقط.</p>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد الإلكتروني بأمان.</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} تطبيق خدماتي - المنصة الذكية للخدمات
          </div>
        </div>
      `;

      // إرسال عبر سيرفر Google المجاني
      await scriptDb.sendEmail(to, 'رمز التحقق الخاص بك - خدماتي', htmlBody);
      return true;
    } catch (error) {
      console.error("Email Service Error:", error);
      return false;
    }
  }
};
