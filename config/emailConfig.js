const nodemailer = require('nodemailer');
const { createLogger, format, transports } = require('winston');

// Cấu hình logger
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/email-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/email.log' })
  ]
});

// Tạo transporter với connection pool
const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // Sử dụng connection pool
  maxConnections: 5, // Số lượng connection tối đa
  maxMessages: 100, // Số lượng message tối đa cho mỗi connection
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Queue để xử lý email
const emailQueue = [];
let isProcessing = false;

// Hàm xử lý queue
async function processEmailQueue() {
  if (isProcessing || emailQueue.length === 0) return;
  
  isProcessing = true;
  const { email, otp, resolve, reject } = emailQueue.shift();
  
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Mã xác thực đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Yêu cầu đặt lại mật khẩu</h2>
          <p>Xin chào,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
          <p>Mã xác thực của bạn là: <strong style="font-size: 20px; color: #ff4d4f;">${otp}</strong></p>
          <p>Mã này sẽ hết hạn sau 5 phút.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { email });
    resolve(true);
  } catch (error) {
    logger.error('Error sending email', { email, error: error.message });
    reject(error);
  } finally {
    isProcessing = false;
    // Xử lý email tiếp theo trong queue
    processEmailQueue();
  }
}

// Hàm gửi email OTP
const sendOTPEmail = async (email, otp) => {
  return new Promise((resolve, reject) => {
    // Thêm vào queue
    emailQueue.push({ email, otp, resolve, reject });
    // Bắt đầu xử lý queue nếu chưa có
    processEmailQueue();
  });
};

// Kiểm tra kết nối email
transporter.verify((error, success) => {
  if (error) {
    logger.error('Email service connection error:', error);
  } else {
    logger.info('Email service is ready to send messages');
  }
});

module.exports = {
  sendOTPEmail,
  logger
}; 