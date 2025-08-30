exports.handler = async () => {
    // 1. Создаем переменную expiredCookie.
    const expiredCookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';

    return {
        statusCode: 302, // Код для перенаправления
        headers: {
            'Set-Cookie': expiredCookie, // 2. Используем переменную здесь
            'Location': 'https://pro-culinaria-lk.proculinaria-book.ru' // или '/index.html'
        },
        body: 'Выход выполнен успешно.'
    };
};
