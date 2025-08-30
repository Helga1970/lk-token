const { Client } = require('pg');
const jwt = require('jsonwebtoken');

// --- Функция проверки подписки ---
// Эта функция остаётся без изменений, так как это ключевая часть вашей логики.
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
// Теперь она будет использовать JWT-токен для проверки доступа.
exports.handler = async (event) => {
    // 1. Получаем JWT-токен из URL, если его там нет - из куки
const token = event.queryStringParameters.token || event.headers.cookie
    ?.split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
        
    // Если токена нет, значит, пользователь не авторизован
    if (!token) {
    return {
        statusCode: 302,
        headers: {
            'Location': 'https://pro-culinaria-lk.proculinaria-book.ru',
        },
    };
}
    try {
        // 2. Проверяем токен на действительность
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userEmail = decoded.email;

        // 3. Проверяем подписку по email, взятому из токена
        const hasAccess = await checkSubscription(userEmail);

        if (!hasAccess) {
            const errorBody = 'Доступ запрещён. Для доступа требуется действующая подписка. Для оплаты подписки перейдите по ссылке: https://pro-culinaria.ru/aboutplatej';
            return {
                statusCode: 403,
                body: errorBody
            };
        }
        
        // 4. Если доступ есть, возвращаем успешный статус
        return {
            statusCode: 200,
            body: 'Доступ разрешен.'
        };

    } catch (e) {
        console.error('Ошибка при проверке токена или доступе:', e);
        if (e.name === 'TokenExpiredError' || e.name === 'JsonWebTokenError') {
            return {
                statusCode: 401,
                body: 'Неверный или просроченный токен. Пожалуйста, войдите снова.'
            };
        }
        return {
            statusCode: 500,
            body: 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.'
        };
    }
};
