require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('./models/Listing');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const listings = await Listing.find({});
    console.log(`Found ${listings.length} listings in the database.`);
    listings.forEach(l => {
      console.log(`- ${l.title} | Coords: ${l.location.coordinates}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
