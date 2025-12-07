require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const UserModel = require('./src/models/user-model');
const { db: { host, name, port } } = require('./src/config/config-mongodb');

const connectString = `mongodb://${host}:${port}/${name}`;

// Thông tin admin
const adminData = {
  email: 'admin@labhub.com',
  password: 'admin123', // Mật khẩu mặc định - bạn có thể đổi
  fullName: 'Administrator',
  role: 'admin',
  status: 'active',
  phoneNumber: '0123456789',
};

async function createAdmin() {
  try {
    console.log('⏳ Connecting to MongoDB...');
    console.log('Connection string:', connectString);
    await mongoose.connect(connectString);
    console.log('✅ Connected to MongoDB!\n');

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('ID:', existingAdmin._id);
      console.log('\n💡 To update password, delete the existing admin first or use update command.\n');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const passwordHash = bcryptjs.hashSync(adminData.password, 10);

    // Create admin
    const admin = await UserModel.create({
      email: adminData.email,
      passwordHash: passwordHash,
      fullName: adminData.fullName,
      role: adminData.role,
      status: adminData.status,
      phoneNumber: adminData.phoneNumber,
    });

    console.log('✅ Admin account created successfully!\n');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 Full Name:', adminData.fullName);
    console.log('🆔 ID:', admin._id);
    console.log('📊 Role:', admin.role);
    console.log('✅ Status:', admin.status);
    console.log('\n🎉 You can now login with these credentials!\n');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Email already exists in database!');
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();

