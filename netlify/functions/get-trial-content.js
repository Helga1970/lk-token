const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

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
                'Location': 'https://pro-culinaria-lk.proculinaria-book.ru/',
            },
        };
    }

    try {
        // Проверяем только валидность токена
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
        console.error('Неверный или просроченный токен:', e);
        return {
            statusCode: 302,
            headers: {
                'Location': 'https://pro-culinaria-lk.proculinaria-book.ru/',
            },
        };
    }
};
