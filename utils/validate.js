// Kiểm tra định dạng số điện thoại Việt Nam
function isValidPhoneNumber(phone) {
  phone = phone.trim();

  const phoneRegex = /^(03|05|07|08|09|01[2689])[0-9]{8}$/;
  return phoneRegex.test(phone);
}

// Kiểm tra định dạng tên (chỉ chứa chữ cái và dấu cách, hỗ trợ tiếng Việt)
function isValidName(name) {
  const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
  return nameRegex.test(name);
}

// Kiểm tra định dạng mật khẩu (ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt)
function isValidPassword(password) {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Xuất các hàm để sử dụng ở các file khác
module.exports = {
  isValidPhoneNumber,
  isValidName,
  isValidPassword,
};
