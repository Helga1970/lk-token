exports.handler = async () => {
    const expiredCookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';

    return {
        statusCode: 200,
        headers: {
            'Set-Cookie': expiredCookie,
            'Location': '/index.html'
        },
        body: 'Выход выполнен успешно.'
    };
};
