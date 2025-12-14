const bcryptjs = require('bcryptjs');

// Thông tin admin
const adminData = {
  email: 'admin@labhub.com',
  password: 'admin123', // Mật khẩu mặc định
  fullName: 'Administrator',
  role: 'admin',
  status: 'active',
  phoneNumber: '0123456789',
};

// Hash password
const passwordHash = bcryptjs.hashSync(adminData.password, 10);

console.log('\n🔐 ADMIN ACCOUNT GENERATOR\n');
console.log('📧 Email:', adminData.email);
console.log('🔑 Password:', adminData.password);
console.log('👤 Full Name:', adminData.fullName);
console.log('🔒 Password Hash:', passwordHash);
console.log('\n');

// MongoDB Insert Command
console.log('📝 MongoDB Insert Command:\n');
console.log(`db.Users.insertOne({
  email: "${adminData.email}",
  passwordHash: "${passwordHash}",
  fullName: "${adminData.fullName}",
  role: "${adminData.role}",
  status: "${adminData.status}",
  phoneNumber: "${adminData.phoneNumber}",
  createdAt: new Date(),
  updatedAt: new Date()
})`);

console.log('\n');

// MongoDB JSON format (for import)
console.log('📄 MongoDB JSON Format (for mongoimport):\n');
const jsonDoc = {
  email: adminData.email,
  passwordHash: passwordHash,
  fullName: adminData.fullName,
  role: adminData.role,
  status: adminData.status,
  phoneNumber: adminData.phoneNumber,
  createdAt: new Date(),
  updatedAt: new Date()
};
console.log(JSON.stringify(jsonDoc, null, 2));

console.log('\n✅ Copy và paste vào MongoDB để tạo admin account!\n');

