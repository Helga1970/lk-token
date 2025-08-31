const { Client } = require('pg');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
    // 1. Проверяем, что это POST-запрос, так как мы отправляем данные.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // 2. Получаем данные из запроса, отправленные с фронтенда.
    const { name, currentPassword, newPassword } = JSON.parse(event.body);

    // 3. Извлекаем email пользователя из JWT-токена, который хранится в куки.
    const cookieHeader = event.headers.cookie || '';
    const token = cookieHeader.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Неавторизованный доступ.' }) };
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Недействительный или просроченный токен.' }) };
    }

    const userEmail = decoded.email;

    // 4. Подключаемся к вашей базе данных Neon.
    const client = new Client({
        connectionString: process.env.NEON_DB_URL,
    });

    try {
        await client.connect();

        // 5. Проверяем, существует ли пользователь и получаем его текущий пароль.
        const userQuery = 'SELECT password FROM users WHERE email = $1';
        const userResult = await client.query(userQuery, [userEmail]);

        if (userResult.rows.length === 0) {
            return { statusCode: 404, body: JSON.stringify({ message: 'Пользователь не найден.' }) };
        }
        const user = userResult.rows[0];
        
        // 6. Ключевая проверка: сравниваем текущий пароль, введенный в форму, с паролем из базы.
        if (newPassword && currentPassword !== user.password) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Текущий пароль неверный. Пожалуйста, попробуйте снова.' }) };
        }
        
        let updateQuery = 'UPDATE users SET';
        const updateValues = [];
        let queryParts = [];

        // 7. Собираем запрос для обновления имени, если оно было изменено.
        if (name) {
            queryParts.push('name = $' + (updateValues.length + 1));
            updateValues.push(name);
        }

        // 8. Собираем запрос для обновления пароля, если он был изменен.
        if (newPassword) {
            queryParts.push('password = $' + (updateValues.length + 1));
            updateValues.push(newPassword);
        }

        if (queryParts.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Нечего обновлять.' }) };
        }

        updateQuery += ' ' + queryParts.join(', ');
        updateQuery += ' WHERE email = $' + (updateValues.length + 1);
        updateValues.push(userEmail);

        // 9. Выполняем SQL-запрос для обновления данных в базе.
        await client.query(updateQuery, updateValues);
        
        // 10. Отправляем успешный ответ фронтенду.
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Данные успешно обновлены." }),
        };

    } catch (err) {
        // 11. Обрабатываем возможные ошибки.
        console.error('Ошибка в serverless-функции:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Ошибка сервера. Пожалуйста, попробуйте позже." }),
        };
    } finally {
        await client.end();
    }
};
