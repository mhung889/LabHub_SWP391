// Script để hash lại password cho các user có passwordHash là plain text
require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const UserModel = require('./models/user-model');
const { db: { host, name, port }, atlas } = require('./config/config-mongodb');

// Sử dụng local MongoDB nếu atlas không được cấu hình hoặc là "LOI"
const connectString = (atlas && atlas !== 'LOI') 
  ? atlas 
  : `mongodb://${host}:${port}/${name}`;

async function fixPasswords() {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(connectString);
    console.log('✅ Connected to MongoDB!');

    // Lấy tất cả users
    const users = await UserModel.find({});
    console.log(`\n📋 Tìm thấy ${users.length} users trong database\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      const passwordHash = user.passwordHash;
      
      // Kiểm tra xem passwordHash có phải là bcrypt hash không
     
      const isBcryptHash = passwordHash && (
        passwordHash.startsWith('$2a$') || 
        passwordHash.startsWith('$2b$') || 
        passwordHash.startsWith('$2y$')
      ) && passwordHash.length === 60;

      if (!isBcryptHash) {
        console.log(`⚠️  User ${user.email} có passwordHash không hợp lệ: "${passwordHash}"`);
        console.log(`   Giả sử password gốc là: "${passwordHash}"`);
        
        // Hash password
        const hashedPassword = bcryptjs.hashSync(passwordHash, 10);
        
        // Cập nhật user
        await UserModel.findByIdAndUpdate(user._id, {
          passwordHash: hashedPassword
        });
        
        console.log(`   ✅ Đã hash và cập nhật password cho ${user.email}`);
        console.log(`   📝 Password mới (hash): ${hashedPassword.substring(0, 30)}...\n`);
        fixedCount++;
      } else {
        console.log(`✓ User ${user.email} đã có passwordHash hợp lệ\n`);
        skippedCount++;
      }
    }

    console.log(`
    🎉 HOÀN TẤT! 🎉
    
    ➤ Đã sửa: ${fixedCount} users
    ➤ Đã bỏ qua: ${skippedCount} users (đã có hash hợp lệ)
    
    ⚠️  LƯU Ý QUAN TRỌNG:
    - Các password đã được hash từ plain text ban đầu
    - Để đăng nhập, sử dụng password gốc (plain text) trước khi hash
    - Ví dụ: Nếu passwordHash cũ là "123456", thì password để đăng nhập vẫn là "123456"
    `);

  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixPasswords();

