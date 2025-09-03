const jwt = require('jsonwebtoken');

const trialContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0;">
    <iframe src="https://pro-culinaria.ru/fornewuser" style="width:100%; height:100vh; border:none;"></iframe>
</body>
</html>
`;

exports.handler = async (event) => {
    const cookieHeader = event.headers.cookie || '';
    const token = cookieHeader
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
    
    // 1. Проверяем наличие токена
    if (!token) {
        return {
            statusCode: 302,
            headers: { 'Location': '/trial-unauthorized.html' },
        };
    }

    // 2. Если токен есть, проверяем его валидность
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        
        // Если токен валиден, возвращаем контент
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: trialContent,
        };
    } catch (e) {
        // 3. Если токен не валиден, перенаправляем на страницу отказа
        return {
            statusCode: 302,
            headers: { 'Location': '/trial-unauthorized.html' },
        };
    }
};
