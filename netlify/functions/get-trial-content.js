const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

exports.handler = async (event) => {
    const cookieHeader = event.headers.cookie || '';
    const token = cookieHeader
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
    
    // Если токена нет, перенаправляем на страницу отказа в доступе для ознакомительного контента
    if (!token) {
        return {
            statusCode: 302,
            headers: {
                'Location': '/trial-unauthorized.html',
            },
        };
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        
        // Запрашиваем содержимое HTML-файла с основного сайта
        const urlToFetch = `https://pro-culinaria.ru/trial-content.html`;
        const response = await fetch(urlToFetch);

        if (!response.ok) {
            throw new Error(`Failed to fetch the content: ${response.statusText}`);
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
        console.error('Ошибка верификации токена:', e.name, 'Сообщение:', e.message);
        
        // Если токен просрочен, возвращаем на страницу входа для повторной авторизации
        if (e.name === 'TokenExpiredError') {
            return {
                statusCode: 302,
                headers: {
                    'Location': 'https://pro-culinaria-lk.proculinaria-book.ru/',
                },
            };
        } else {
            // В любом другом случае (неверный токен), перенаправляем на страницу отказа в доступе для ознакомительного контента
            return {
                statusCode: 302,
                headers: {
                    'Location': '/trial-unauthorized.html',
                },
            };
        }
    }
};
