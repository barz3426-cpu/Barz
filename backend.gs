
/**
 * تطبيق "خدماتي" - محرك الرسائل الحقيقية (بديل Twilio)
 */

const ss = SpreadsheetApp.getActiveSpreadsheet();

// إعدادات Vonage (Nexmo) - سجل في vonage.com للحصول عليها
const VONAGE_API_KEY = 'ضع_هنا_API_KEY'; 
const VONAGE_API_SECRET = 'ضع_هنا_API_SECRET';
const SENDER_NAME = 'Khadamati'; // اسم المرسل (يظهر للمستلم)

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const data = request.data;
    
    switch(action) {
      case 'sendSMS':
        return sendSmsViaVonage(data.to, data.message);
        
      case 'sendEmail': 
        MailApp.sendEmail({
          to: data.to,
          subject: data.subject,
          htmlBody: data.body
        });
        return createJsonResponse({success: true, message: 'Email sent'});

      default: 
        return createJsonResponse({error: 'Unknown action'});
    }
  } catch(err) {
    return createJsonResponse({error: err.toString()});
  }
}

/**
 * إرسال رسالة SMS حقيقية عبر بوابة Vonage
 */
function sendSmsViaVonage(to, message) {
  // سجل الرسالة في جدول البيانات كنسخة احتياطية دائماً
  logSms(to, message);

  if (VONAGE_API_KEY === 'ضع_هنا_API_KEY') {
    return createJsonResponse({
      success: true, 
      message: 'تم حفظ الرسالة في السجل (يرجى إدخال مفتاح Vonage للإرسال الحقيقي)'
    });
  }

  const url = "https://rest.nexmo.com/sms/json";
  
  const payload = {
    "api_key": VONAGE_API_KEY,
    "api_secret": VONAGE_API_SECRET,
    "to": formatPhoneNumber(to),
    "from": SENDER_NAME,
    "text": message,
    "type": "unicode" // ضروري لدعم اللغة العربية
  };

  const options = {
    "method": "post",
    "contentType": "application/x-www-form-urlencoded",
    "payload": payload,
    "muteHttpExceptions": true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.messages && result.messages[0].status === "0") {
      return createJsonResponse({success: true, message: 'SMS sent via Vonage'});
    } else {
      const errorMsg = result.messages ? result.messages[0]['error-text'] : 'Unknown error';
      return createJsonResponse({success: false, error: errorMsg});
    }
  } catch (e) {
    return createJsonResponse({success: false, error: e.toString()});
  }
}

/**
 * تنسيق رقم الهاتف ليكون دولياً (بدون + أو أصفار زائدة)
 */
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, ''); // حذف أي رمز غير رقمي
  if (cleaned.startsWith('00')) cleaned = cleaned.substring(2);
  return cleaned;
}

/**
 * تسجيل الرسائل في جدول بيانات جوجل لمتابعة ما يتم إرساله
 */
function logSms(to, message) {
  const sheet = ss.getSheetByName('SMS_History') || ss.insertSheet('SMS_History');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['التاريخ', 'رقم الهاتف', 'نص الرسالة', 'الحالة']);
  }
  sheet.appendRow([new Date(), to, message, 'SENT_REQUEST']);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
