// Подключаем необходимые библиотеки
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http'); // Подключаем адаптер для Netlify

const app = express();

// Секретный ключ для подписи токена.
// Этот ключ теперь берется из переменных окружения Netlify.
const JWT_SECRET = process.env.JWT_SECRET;

// Разрешаем приложению парсить JSON-тела запросов
app.use(express.json());

// Подключаем cookie-parser
app.use(cookieParser());

// --- Роуты вашего приложения ---

// 1. Роут для авторизации.
app.post('/api/login', (req, res) => {
    // Получаем email и пароль из тела запроса
    const { email, password } = req.body;

    // Сравнение должно быть с переменной email, а не username
    if (email === 'admin@example.com' && password === 'admin') {
        const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            domain: '.netlify.app',
            sameSite: 'Lax'
        }).status(200).json({ success: true });
    } else {
        // Сообщение об ошибке должно быть согласовано с полем email
        res.status(401).json({ message: 'Неверный email или пароль' });
    }
});

// 2. Роут для доступа к защищенным данным.
app.get('/api/dashboard', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }
        // Переменная 'email' не существует в этом роуте.
        // Нужно использовать 'user.email' из токена.
        res.json({ message: 'Привет, ' + user.email + '!' });
    });
});

// 3. Роут для выхода из системы
app.post('/api/logout', (req, res) => {
    // Очищаем куку, используя те же параметры, что и при установке.
    res.clearCookie('token', {
        domain: '.netlify.app',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax'
    });

    res.status(200).json({ success: true, message: 'Вы успешно вышли из системы.' });
});

// Мы не используем app.listen, так как это бессерверная функция.
// Вместо этого мы экспортируем Express-приложение как Serverless-функцию.
module.exports.handler = serverless(app);
