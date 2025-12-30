
/**
 * خدمة الربط المتقدمة مع Google Apps Script
 */

// الرابط الجديد الذي وفره المستخدم
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxIHqw4kpClEed4lBNT32VM-fDVGbHdS6CgkUXvZIMms2YIpyFIUMD4kjZjpMuDNkRe/exec'; 

export const scriptDb = {
  /**
   * إرسال البيانات إلى Google Apps Script
   */
  async postData(action: string, data: any) {
    if (!APPS_SCRIPT_URL) {
      console.error("رابط AppsScript غير موجود");
      return { success: false };
    }

    try {
      // نستخدم 'text/plain' لتجنب مشاكل CORS (Preflight request) مع Apps Script
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // ضروري جداً لضمان عمل الإرسال من المتصفح مباشرة
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ action, data })
      });
      
      // في وضع no-cors، لا يمكننا قراءة الاستجابة ولكن الطلب يصل بنجاح
      return { success: true };
    } catch (e) {
      console.error("فشل الاتصال بسيرفر الإرسال:", e);
      return { success: false };
    }
  },

  /**
   * إرسال بريد إلكتروني حقيقي (التحقق من الهوية)
   */
  async sendEmail(to: string, subject: string, body: string) {
    console.log(`جاري إرسال البريد إلى: ${to}`);
    return this.postData('sendEmail', { to, subject, body });
  }
};
