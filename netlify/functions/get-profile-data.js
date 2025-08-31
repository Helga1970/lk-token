const { Client } = require('pg');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
    // Проверяем, что это GET-запрос. Это важно для безопасности.
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Получаем токен из куки
    const cookieHeader = event.headers.cookie || '';
    const token = cookieHeader
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

    // Если токена нет, возвращаем ошибку
    if (!token) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    let decoded;
    try {
        // Верифицируем токен, чтобы получить email пользователя
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        return { statusCode: 401, body: 'Invalid or expired token' };
    }

    const userEmail = decoded.email;

    const client = new Client({
        connectionString: process.env.NEON_DB_URL,
    });

    try {
        await client.connect();

        // Делаем запрос в базу данных за всеми данными пользователя
        const query = 'SELECT name, email, subscription_type, access_end_date FROM users WHERE email = $1';
        const result = await client.query(query, [userEmail]);

        if (result.rows.length === 0) {
            return { statusCode: 404, body: 'User not found' };
        }

        const userData = result.rows[0];

        // Возвращаем данные на фронтенд
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        };

    } catch (err) {
        console.error('Ошибка при получении данных профиля:', err);
        return { statusCode: 500, body: 'Server error' };
    } finally {
        await client.end();
    }
};
