exports.handler = async () => {
    const expiredCookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=.pro-culinaria.ru; Secure; SameSite=Lax';

    return {
        statusCode: 302,
        headers: {
            'Set-Cookie': expiredCookie,
            'Location': 'https://lk.pro-culinaria.ru'
        },
        body: 'Выход выполнен успешно.'
    };
};
