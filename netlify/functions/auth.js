// Подключаем необходимые библиотеки
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http'); // Подключаем адаптер для Netlify

const app = express();

// Секретный ключ для подписи токена.
const JWT_SECRET = process.env.JWT_SECRET;

// Подключаем CORS middleware, чтобы разрешить запросы с ЛЮБОГО источника
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    // Чтобы обрабатывать запросы OPTIONS (предварительные запросы браузера)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Разрешаем приложению парсить JSON-тела запросов
app.use(express.json());

// Подключаем cookie-parser
app.use(cookieParser());

// --- Роуты вашего приложения ---

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@example.com' && password === 'admin') {
        const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '2m' }); // Изменено на 2 минуты
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        }).status(200).json({ success: true });
    } else {
        res.status(401).json({ message: 'Неверный email или пароль' });
    }
});

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

app.post('/api/logout', (req, res) => {
    res.clearCookie('token', {
        secure: true,
        httpOnly: true,
        sameSite: 'None'
    });
    res.status(200).json({ success: true, message: 'Вы успешно вышли из системы.' });
});

module.exports.handler = serverless(app);
