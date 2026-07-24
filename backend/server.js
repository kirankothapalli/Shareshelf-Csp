require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { initSocket } = require('./utils/socket');

const authRoutes = require('./routes/authRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const userRoutes = require('./routes/userRoutes');
const listingRoutes = require('./routes/listingRoutes');
const requestRoutes = require('./routes/requestRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const meetupRoutes = require('./routes/meetupRoutes');

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      // or if the origin is in our allowed list, or if we allow all vercel apps for testing
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(generalLimiter);

// static serving of uploaded photos/docs (local storage provider)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.send('ShareShelf API is running. Please visit the frontend application.'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'shareshelf-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meetup-points', meetupRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`[server] ShareShelf API running on port ${PORT}`);
  });
}

start();

module.exports = app;
