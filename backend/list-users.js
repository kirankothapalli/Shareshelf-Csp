const connectDB = require('./config/db');
const User = require('./models/User');
require('dotenv').config();

async function listUsers() {
  await connectDB();
  const users = await User.find({}, 'name email role verification.status');
  console.log("Current Users in DB:");
  console.table(users.map(u => ({
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.verification.status
  })));
  process.exit(0);
}
listUsers();
