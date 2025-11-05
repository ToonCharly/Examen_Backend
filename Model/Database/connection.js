const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Build MONGO_URI from env variables if not provided directly
function buildMongoUri() {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;

  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASSWORD;
  const host = process.env.MONGO_HOST || '127.0.0.1:27017';
  const dbName = process.env.MONGO_DB || 'agenda_citas';

  if (user && pass && host) {
    // If host looks like a srv host (e.g., *.mongodb.net) use +srv
    const useSrv = host.includes('mongodb.net') || host.startsWith('server.');
    if (useSrv) {
      return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${dbName}?retryWrites=true&w=majority`;
    }
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${dbName}`;
  }

  // Fallback to localhost
  return 'mongodb://127.0.0.1:27017/agenda_citas';
}

const MONGO_URI = buildMongoUri();

async function connect(options = {}) {
  const maxRetries = parseInt(process.env.MONGO_CONNECT_RETRIES || '5', 10);
  const startWithoutDb = process.env.START_WITHOUT_DB === 'true';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // modern mongoose does not require useNewUrlParser/useUnifiedTopology
      await mongoose.connect(MONGO_URI, { ...options });
      console.log('✅ MongoDB connected to', MONGO_URI);
      return;
    } catch (error) {
      const isLast = attempt === maxRetries;
      console.error(`❌ MongoDB connection attempt ${attempt} failed:`, error.message);
      if (isLast) {
        if (startWithoutDb) {
          console.warn('⚠️ START_WITHOUT_DB=true — continuing without DB connection (development only)');
          return;
        }
        // rethrow so caller (server start) can decide
        throw error;
      }

      // backoff: wait attempt * 1000 ms
      const delay = attempt * 1000;
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

module.exports = {
  connect,
  mongoose,
  MONGO_URI,
};
