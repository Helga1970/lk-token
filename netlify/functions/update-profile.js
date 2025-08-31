const { Client } = require('pg');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
    // 1. Проверяем метод запроса
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: 'Bad Request' };
    }

    const { name, currentPassword, newPassword } = requestBody;

    // 2. Получаем токен из куки
    const cookieHeader = event.headers.cookie || '';
    const token = cookieHeader
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

    if (!token) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    let decoded;
    try {
        // 3. Верифицируем токен
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

        // 4. Проверяем текущий пароль (очень важный шаг)
        const userQuery = 'SELECT password FROM users WHERE email = $1';
        const userResult = await client.query(userQuery, [userEmail]);
        
        if (userResult.rows.length === 0 || userResult.rows[0].password !== currentPassword) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Неверный текущий пароль.' }),
            };
        }

        // 5. Обновляем данные
        let updateQuery = 'UPDATE users SET updated_at = NOW()';
        let updateValues = [];
        let paramCount = 1;

        if (name) {
            updateQuery += `, name = $${paramCount}`;
            updateValues.push(name);
            paramCount++;
        }
        
        if (newPassword) {
            updateQuery += `, password = $${paramCount}`;
            updateValues.push(newPassword);
            paramCount++;
        }

        updateQuery += ` WHERE email = $${paramCount}`;
        updateValues.push(userEmail);

        await client.query(updateQuery, updateValues);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Профиль успешно обновлен!' }),
        };

    } catch (err) {
        console.error('Ошибка при обновлении профиля:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Ошибка сервера при обновлении профиля.' }),
        };
    } finally {
        await client.end();
    }
};
