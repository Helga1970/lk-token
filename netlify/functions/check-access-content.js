const { Client } = require('pg');
const jwt = require('jsonwebtoken');

// --- Функция проверки подписки ---
const checkSubscription = async (email) => {
    const client = new Client({
        connectionString: process.env.NEON_DB_URL,
    });
    try {
        await client.connect();
        const query = 'SELECT access_end_date FROM users WHERE email = $1';
        const result = await client.query(query, [email]);
        if (result.rows.length === 0) return false;

        const endDateMs = new Date(result.rows[0].access_end_date).getTime();
        const nowMs = new Date().getTime();

        return endDateMs >= nowMs;
    } catch (error) {
        console.error('Ошибка при проверке подписки:', error);
        return false;
    } finally {
        await client.end();
    }
};

// --- Главная функция-обработчик ---
exports.handler = async (event) => {
    // Получаем токен из куки.
    const token = event.headers.cookie
        ?.split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
    
    // Если токена нет, или он недействителен
    if (!token) {
        return {
            statusCode: 302,
            headers: {
                'Location': '/access-denied.html',
            },
        };
    }

    try {
        // Проверяем токен на валидность и получаем email
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userEmail = decoded.email;

        // Проверяем подписку
        const hasAccess = await checkSubscription(userEmail);

        if (!hasAccess) {
            return {
                statusCode: 302,
                headers: {
                    'Location': '/access-denied.html',
                },
            };
        }
        
        // Если всё в порядке, возвращаем успешный статус (200), чтобы показать страницу
        return {
            statusCode: 200,
            body: 'Доступ разрешен.',
        };

    } catch (e) {
        console.error('Ошибка при проверке токена или подписки:', e);
        return {
            statusCode: 302,
            headers: {
                'Location': '/access-denied.html',
            },
        };
    }
};
