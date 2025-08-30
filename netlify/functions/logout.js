return {
    statusCode: 302, // Изменил статус на 302 для корректного перенаправления
    headers: {
        'Set-Cookie': expiredCookie,
        'Location': '/index.html'
    },
    body: 'Выход выполнен успешно.'
};
