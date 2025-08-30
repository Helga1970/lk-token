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
                'Location': '/', // Было: 'https://pro-culinaria-lk.proculinaria-book.ru'
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
            statusCode: 302,
            headers: {
                'Location': '/content.html', // Было: 'https://pro-culinaria-library.proculinaria-book.ru'
            },
        };

    } catch (e) {
        console.error('Ошибка при проверке токена или подписки:', e);
        return {
            statusCode: 302,
            headers: {
                'Location': '/', // Было: 'https://pro-culinaria-lk.proculinaria-book.ru'
            },
        };
    }
};
