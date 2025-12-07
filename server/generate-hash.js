const bcryptjs = require('bcryptjs');

const password = 'password123';
const hash = bcryptjs.hashSync(password, 10);

console.log('\n🔐 PASSWORD HASH GENERATOR\n');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\n📝 MongoDB Insert Command:\n');
console.log(`db.Users.insertOne({
  email: "student@lab.com",
  passwordHash: "${hash}",
  fullName: "Test Student",
  role: "student",
  status: "active"
})`);
console.log('\n');
