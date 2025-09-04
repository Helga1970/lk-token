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
    const cookieHeader = event.headers.cookie || '';
    const token = cookieHeader
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
    
    // --- СТРОКА ДЛЯ ДИАГНОСТИКИ ---
    console.log('Полученный токен:', token);

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
        // --- СТРОКА ДЛЯ ДИАГНОСТИКИ ---
        console.log('Токен успешно верифицирован. Срок действия:', new Date(decoded.exp * 1000).toLocaleString());

        const userEmail = decoded.email;
        const hasAccess = await checkSubscription(userEmail);

        if (!hasAccess) {
            // ИЗМЕНЕНИЕ: Вместо редиректа возвращаем ошибку с кодом 403
            const errorBody = 'Доступ запрещён. Для доступа требуется действующая подписка. Для оплаты подписки перейдите по ссылке: https://pro-culinaria.ru/aboutplatej';
            return { 
                statusCode: 403,
                body: errorBody
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: protectedContent,
        };

    } catch (e) {
        // --- СТРОКА ДЛЯ ДИАГНОСТИКИ ---
        console.error('Ошибка верификации токена:', e.name, 'Сообщение:', e.message);
        
        if (e.name === 'TokenExpiredError') {
            return {
                statusCode: 302,
                headers: {
                    'Location': 'https://pro-culinaria-lk.proculinaria-book.ru/',
                },
            };
        } else {
            return {
                statusCode: 302,
                headers: {
                    'Location': '/unauthorized.html',
                },
            };
        }
    }
};
