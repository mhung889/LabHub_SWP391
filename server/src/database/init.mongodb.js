const mongoose = require("mongoose");

const { db: { host, name, port }, atlas } = require('../config/config-mongodb');

// const connectString = `mongodb://${host}:${port}/${name}`;

const connectString = atlas;

console.log(atlas);

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
      .then((_) => console.log("Connected Mongodb success "))
      .catch((err) => console.log("Error connect!"));
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
