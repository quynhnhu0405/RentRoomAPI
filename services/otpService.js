// Lưu trữ OTP trong bộ nhớ
const otpStore = new Map();
const requestLimitStore = new Map();

const OTP_EXPIRY = 5 * 60; // 5 phút
const REQUEST_LIMIT = 5; // Số lần yêu cầu tối đa
const REQUEST_WINDOW = 3600; // Thời gian cửa sổ (1 giờ)

class OTPService {
  // Tạo OTP mới
  static async generateOTP(email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${email}`;
    
    // Lưu OTP vào Map với thời gian hết hạn
    otpStore.set(key, {
      otp,
      expiry: Date.now() + OTP_EXPIRY * 1000
    });
    
    return otp;
  }

  // Kiểm tra OTP
  static async verifyOTP(email, otp) {
    const key = `otp:${email}`;
    const otpData = otpStore.get(key);
    
    if (!otpData) {
      return { valid: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn' };
    }
    
    if (Date.now() > otpData.expiry) {
      otpStore.delete(key);
      return { valid: false, message: 'Mã xác thực đã hết hạn' };
    }
    
    if (otpData.otp !== otp) {
      return { valid: false, message: 'Mã xác thực không đúng' };
    }
    
    // Xóa OTP sau khi xác thực thành công
    otpStore.delete(key);
    return { valid: true };
  }

  // Kiểm tra số lần yêu cầu OTP
  static async checkRequestLimit(email) {
    const key = `otp:limit:${email}`;
    const now = Date.now();
    const limitData = requestLimitStore.get(key) || { count: 0, resetTime: now + REQUEST_WINDOW * 1000 };
    
    // Reset counter nếu đã hết thời gian cửa sổ
    if (now > limitData.resetTime) {
      limitData.count = 0;
      limitData.resetTime = now + REQUEST_WINDOW * 1000;
    }
    
    limitData.count++;
    requestLimitStore.set(key, limitData);
    
    if (limitData.count > REQUEST_LIMIT) {
      return { 
        allowed: false, 
        message: 'Bạn đã yêu cầu quá nhiều mã xác thực. Vui lòng thử lại sau 1 giờ.' 
      };
    }
    
    return { allowed: true };
  }

  // Dọn dẹp OTP và request limit hết hạn (chạy định kỳ)
  static cleanup() {
    const now = Date.now();
    
    // Dọn OTP hết hạn
    for (const [key, data] of otpStore.entries()) {
      if (now > data.expiry) {
        otpStore.delete(key);
      }
    }
    
    // Dọn request limit hết hạn
    for (const [key, data] of requestLimitStore.entries()) {
      if (now > data.resetTime) {
        requestLimitStore.delete(key);
      }
    }
  }
}

// Chạy cleanup mỗi phút
setInterval(() => OTPService.cleanup(), 60000);

module.exports = OTPService; 