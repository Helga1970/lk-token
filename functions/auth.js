// netlify/functions/auth.js

const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http');

const app = express();

// Секретный ключ для подписи токена (должен быть задан в Netlify → Environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Домен фронтенда (твой сайт)
const FRONTEND_URL = "https://pro-culinaria-lk.proculinaria-book.ru";

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// --- Роуты ---

// Логин
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'admin@example.com' && password === 'admin') {
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS в продакшне
      sameSite: 'Lax'
      // domain не указываем — иначе Netlify не запишет
    });

    return res.status(200).json({ success: true });
  }

  res.status(401).json({ message: 'Неверный email или пароль' });
});

// Дашборд
app.get('/api/dashboard', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    res.json({ message: 'Привет, ' + user.email + '!' });
  });
});

// Логаут
app.post('/api/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax'
  });
  res.status(200).json({ success: true, message: 'Вы успешно вышли из системы.' });
});

module.exports.handler = serverless(app);
