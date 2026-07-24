require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Listing = require('../models/Listing');
const MeetupPoint = require('../models/MeetupPoint');
const Request = require('../models/Request');

async function seed() {
  await connectDB();
  console.log('[seed] Clearing existing demo data...');
  await Promise.all([
    User.deleteMany({}),
    Listing.deleteMany({}),
    MeetupPoint.deleteMany({}),
    Request.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('Passw0rd!', 10);

  const admin = await User.create({
    name: 'Kiran (Admin)',
    email: process.env.ADMIN_EMAIL || 'admin@shareshelf.app',
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 10),
    role: 'admin',
    verification: { status: 'approved' },
    location: { type: 'Point', coordinates: [81.5212, 16.5449], areaLabel: 'Bhimavaram - Town Center' },
  });

  const rohan = await User.create({
    name: 'Rohan Mehta',
    email: 'rohan@example.com',
    passwordHash,
    role: 'student',
    verification: { status: 'approved', docType: 'id_card', reviewedBy: admin._id, reviewedAt: new Date() },
    location: { type: 'Point', coordinates: [81.5228, 16.5460], areaLabel: 'Bhimavaram - MG Road' },
    rating: { avg: 4.6, count: 12 },
  });

  const priya = await User.create({
    name: 'Priya Sharma',
    email: 'priya@example.com',
    passwordHash,
    role: 'student',
    verification: { status: 'pending', docType: 'fee_receipt' },
    location: { type: 'Point', coordinates: [81.5195, 16.5430], areaLabel: 'Bhimavaram - Station Road' },
  });

  const school = await User.create({
    name: 'Green Valley School',
    email: 'admin@greenvalley.example.com',
    passwordHash,
    role: 'school',
    verification: { status: 'approved', docType: 'institution_doc', reviewedBy: admin._id, reviewedAt: new Date() },
    location: { type: 'Point', coordinates: [81.5250, 16.5480], areaLabel: 'Bhimavaram - College Road' },
    rating: { avg: 4.9, count: 30 },
  });

  const publicDonor = await User.create({
    name: 'Suresh (Public Donor)',
    phone: '+919876500001',
    role: 'public',
    verification: { status: 'approved' },
    location: { type: 'Point', coordinates: [81.5180, 16.5410], areaLabel: 'Bhimavaram - Old Town' },
  });

  await MeetupPoint.insertMany([
    {
      name: 'Green Valley School - Main Gate',
      locality: 'College Road',
      location: { type: 'Point', coordinates: [81.5250, 16.5480] },
      addedBy: admin._id,
    },
    {
      name: 'Bhimavaram Central Library',
      locality: 'MG Road',
      location: { type: 'Point', coordinates: [81.5230, 16.5455] },
      addedBy: admin._id,
    },
    {
      name: 'Bhimavaram Railway Station - Main Entrance',
      locality: 'Station Road',
      location: { type: 'Point', coordinates: [81.5200, 16.5432] },
      addedBy: admin._id,
    },
  ]);

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await Listing.insertMany([
    {
      owner: rohan._id,
      title: 'Data Structures & Algorithms (2nd Year CSE)',
      category: 'book',
      subject: 'Data Structures',
      department: 'CSE',
      semester: '3',
      condition: 'Good',
      description: 'Lightly used, all pages intact, some highlighter marks in chapter 4.',
      photos: ['/uploads/sample-book-1.jpg'],
      type: 'Free',
      quantity: 1,
      location: rohan.location,
      status: 'active',
      expiresAt,
    },
    {
      owner: rohan._id,
      title: 'Scientific Calculator (Casio fx-991ES)',
      category: 'equipment',
      subject: 'General',
      department: 'CSE',
      semester: '3',
      condition: 'Good',
      description: 'Works perfectly, new battery installed.',
      photos: ['/uploads/sample-calc-1.jpg'],
      type: 'Paid',
      price: 300,
      originalPriceDeclared: 900,
      quantity: 1,
      location: rohan.location,
      status: 'active',
      expiresAt,
    },
    {
      owner: school._id,
      title: 'Surplus NCERT Set (Class 10, alumni drive)',
      category: 'book',
      subject: 'General',
      department: 'School',
      semester: 'Class 10',
      condition: 'Fair',
      description: 'Donated by alumni, full set of NCERT textbooks for Class 10.',
      photos: ['/uploads/sample-book-2.jpg'],
      type: 'Free',
      quantity: 8,
      location: school.location,
      status: 'active',
      expiresAt,
    },
    {
      owner: publicDonor._id,
      title: 'Assorted Stationery Pack',
      category: 'stationery',
      subject: 'General',
      department: 'General',
      semester: 'Any',
      condition: 'New',
      description: 'Unused notebooks, pens, geometry box - leftover from a stock clearance.',
      photos: ['/uploads/sample-stationery-1.jpg'],
      type: 'Free',
      quantity: 5,
      location: publicDonor.location,
      status: 'active',
      expiresAt,
    },
  ]);

  await Request.create({
    requester: priya._id,
    title: 'Data Structures & Algorithms',
    author: '',
    subject: 'Data Structures',
    urgency: 'high',
    status: 'open',
  });

  console.log('[seed] Done. Demo accounts (password: Passw0rd! for students/school):');
  console.log(` - Admin:    ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
  console.log(` - Student:  ${rohan.email} / Passw0rd!`);
  console.log(` - Student:  ${priya.email} / Passw0rd! (verification pending)`);
  console.log(` - School:   ${school.email} / Passw0rd!`);
  console.log(` - Public donor phone: ${publicDonor.phone} (OTP-verified, no password - use OTP login)`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
