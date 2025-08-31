const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

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
    const cookieHeader = event.headers.cookie || '';
    const token = cookieHeader
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
    
    // Если токена нет, всегда перенаправляем на страницу 'unauthorized.html'
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

        // Если подписки нет, перенаправляем на страницу 'unauthorized.html'
        if (!hasAccess) {
            return {
                statusCode: 302,
                headers: {
                    'Location': '/unauthorized.html',
                },
            };
        }
        
        // --- ПРОКСИ-ЧАСТЬ (остаётся без изменений) ---
        const response = await fetch('https://pro-culinaria.ru/chitalnyizal');
        if (!response.ok) {
            throw new Error(`Failed to fetch Tilda page: ${response.statusText}`);
        }
        const htmlContent = await response.text();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: htmlContent,
        };

    } catch (e) {
        // Если ошибка связана с просроченным токеном, перенаправляем на вход
        if (e.name === 'TokenExpiredError') {
            console.error('Просроченный токен. Перенаправляем на страницу входа.');
            return {
                statusCode: 302,
                headers: {
                    'Location': 'https://pro-culinaria-lk.proculinaria-book.ru/',
                },
            };
        } else {
            // В случае любой другой ошибки (неверная подпись, неверный формат), перенаправляем на 'unauthorized.html'
            console.error('Неверный токен или другая ошибка:', e);
            return {
                statusCode: 302,
                headers: {
                    'Location': '/unauthorized.html',
                },
            };
        }
    }
};
