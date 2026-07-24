const connectDB = require('./config/db');
const User = require('./models/User');
require('dotenv').config();

async function test() {
  await connectDB();
  const user = await User.findOne({ email: 'admin@shareshelf.app ' }).select('+passwordHash');
  console.log("User with space:", user ? "Found" : "Not Found");
  process.exit(0);
}
test();
