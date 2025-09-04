exports.handler = async () => {
    const expiredCookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=.proculinaria-book.ru; Secure; SameSite=Lax';

    return {
        statusCode: 302,
        headers: {
            'Set-Cookie': expiredCookie,
            'Location': 'https://pro-culinaria-lk.proculinaria-book.ru'
        },
        body: 'Выход выполнен успешно.'
    };
};
