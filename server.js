// Подключаем необходимые библиотеки
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Создаем экземпляр приложения Express
const app = express();
const PORT = process.env.PORT || 3000;

// Секретный ключ для подписи токена.
const JWT_SECRET = 'your-super-secret-key';

// Разрешаем приложению парсить JSON-тела запросов
app.use(express.json());

// Подключаем cookie-parser
app.use(cookieParser());

// --- Роуты вашего приложения ---

// 1. Роут для авторизации.
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (username === 'admin' && password === 'admin') {
        const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            domain: '.netlify.app',
            sameSite: 'Lax'
        }).status(200).json({ success: true });
    } else {
        res.status(401).json({ message: 'Неверный логин или пароль' });
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
        // Изменение для отладки
        res.json({ message: 'Привет!' });
    });
});

// 3. Роут для выхода из системы
app.post('/api/logout', (req, res) => {
    res.clearCookie('token', {
        domain: '.netlify.app',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax'
    });

    res.status(200).json({ success: true, message: 'Вы успешно вышли из системы.' });
});

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
