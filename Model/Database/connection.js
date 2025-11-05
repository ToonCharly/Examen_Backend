const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agenda_citas';

async function connect() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected to', MONGO_URI);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

module.exports = {
  connect,
  mongoose,
};
