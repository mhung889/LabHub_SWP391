const mongoose = require("mongoose");

const { db: { host, name, port }, atlas } = require('../config/config-mongodb');

// Sử dụng local MongoDB nếu atlas không được cấu hình hoặc là "LOI"
const connectString = (atlas && atlas !== 'LOI') 
  ? atlas 
  : `mongodb://${host}:${port}/${name}`;

console.log('MongoDB Connection String:', connectString === atlas ? 'Using Atlas' : 'Using Local MongoDB');

class Database {
  constructor() {
    this.connect();
  }

  connect(type = "mongodb") {
    if (1 === 1) {
      mongoose.set("debug", true);
      mongoose.set("debug", { color: true });
    }

    mongoose
      .connect(connectString)
      .then((_) => console.log("✅ Connected Mongodb success"))
      .catch((err) => {
        console.error("❌ Error connecting to MongoDB:");
        console.error("   Connection String:", connectString);
        console.error("   Error Message:", err.message);
        if (atlas === 'LOI' || !atlas) {
          console.error("   ⚠️  DEV_ATLAS không được cấu hình trong .env");
          console.error("   💡 Đang thử kết nối với MongoDB local...");
        }
      });
  }
  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();
module.exports = instanceMongodb;
