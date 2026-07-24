const connectDB = require('./config/db');
const User = require('./models/User');
require('dotenv').config();

async function approveUser() {
  await connectDB();
  const email = 'chandrakiranbabu7777@gmail.com';
  const user = await User.findOneAndUpdate(
    { email: email },
    { $set: { 'verification.status': 'approved' } },
    { new: true }
  );
  
  if (user) {
    console.log("User verified successfully:", user.name, user.email, user.verification.status);
  } else {
    console.log("User not found with email:", email);
  }
  process.exit(0);
}
approveUser();
