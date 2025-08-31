const jwt = require('jsonwebtoken');
const fs = require('fs');

exports.handler = async (event) => {
    // Получаем заголовок с куки или пустую строку
    const cookieHeader = event.headers.cookie || '';
    
    // Ищем токен
    const token = cookieHeader
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
    
    // Если токен не найден, перенаправляем на страницу отказа
    if (!token) {
        return {
            statusCode: 302,
            headers: {
                'Location': '/trial-unauthorized.html',
            },
        };
    }

    try {
        // Проверяем валидность токена
        jwt.verify(token, process.env.JWT_SECRET);
        
        // Читаем содержимое локального файла
        const htmlContent = fs.readFileSync('./trial-content.html', 'utf-8');
        
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
        // Если токен просрочен, возвращаем на страницу входа
        if (e.name === 'TokenExpiredError') {
            return {
                statusCode: 302,
                headers: {
                    'Location': 'https://pro-culinaria-lk.proculinaria-book.ru/',
                },
            };
        } else {
            // В любом другом случае (неверный токен), перенаправляем на страницу отказа
            return {
                statusCode: 302,
                headers: {
                    'Location': '/trial-unauthorized.html',
                },
            };
        }
    }
};
