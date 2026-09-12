const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

mongoose.set('strictQuery', false);

dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const compareRoutes = require('./routes/compareRoutes');
const quizRoutes = require('./routes/quizRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const adminRoutes = require('./admin');

const app = express();

app.use(helmet());

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://localhost:3000',
];
const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : [];
const allowedOrigins = [...defaultOrigins, ...envOrigins];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV === 'development'
    ) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const url = req.originalUrl || req.url;
    if (url.startsWith('/api/auth/')) return true;
    if (url === '/api/health') return true;
    return false;
  },
});

app.use('/api', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  if (req.headers.origin) console.log(`   Origin: ${req.headers.origin}`);
  next();
});

const isProduction = process.env.NODE_ENV === 'production';
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  },
});

app.use((req, res, next) => {
  const p = req.path;
  if (
    p.startsWith('/api/auth/') &&
    (p.includes('/login') ||
      p.includes('/register') ||
      p.includes('/refresh'))
  ) {
    return next();
  }
  csrfProtection(req, res, next);
});

app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ success: true, csrfToken: req.csrfToken() });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/admin', adminRoutes.router);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'DocMind API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 10000;

if (!process.env.MONGO_URI) {
  console.error('❌ FATAL: MONGO_URI is not set.');
  process.exit(1);
}

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('='.repeat(60));
      console.log('🚀 DOCMIND BACKEND');
      console.log('='.repeat(60));
      console.log(`📍 Server running on http://localhost:${PORT}`);
      console.log(`📄 Health: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(60));
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  });

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});
