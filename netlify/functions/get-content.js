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

// --- HTML-код вашей страницы ---
const protectedContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0;">
    <iframe src="https://pro-culinaria.ru/chitalnyizal" style="width:100%; height:100vh; border:none;"></iframe>
</body>
</html>
`;

// --- Главная функция-обработчик ---
exports.handler = async (event) => {
    // Получаем токен из куки.
    const token = event.headers.cookie
        ?.split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
    
    if (!token) {
        return {
            statusCode: 302,
            headers: {
                'Location': '/unauthorized.html',
            },
        };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userEmail = decoded.email;
        const hasAccess = await checkSubscription(userEmail);

        if (!hasAccess) {
            return {
                statusCode: 302,
                headers: {
                    'Location': '/unauthorized.html',
                },
            };
        }
        
        // Если проверка прошла, возвращаем HTML-страницу
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
            },
            body: protectedContent,
        };

    } catch (e) {
        console.error('Неверный или просроченный токен:', e);
        return {
            statusCode: 302,
            headers: {
                'Location': '/unauthorized.html',
            },
        };
    }
};
