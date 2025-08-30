const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  // 1. Получаем токен из куки
  const token = event.headers.cookie
    ?.split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];

  // 2. Проверяем наличие токена
  if (!token) {
    return {
      statusCode: 302, // Код для перенаправления
      headers: {
        'Location': 'https://pro-culinaria-library.proculinaria-book.ru/unauthorized.html',
      },
    };
  }

  try {
    // 3. Проверяем валидность токена
    jwt.verify(token, process.env.JWT_SECRET);

    // 4. Если токен валиден, перенаправляем на страницу с контентом
    return {
      statusCode: 302,
      headers: {
        'Location': 'https://pro-culinaria.ru/chitalnyizal',
      },
    };
  } catch (e) {
    // 5. Если токен невалиден, перенаправляем на страницу входа
    return {
      statusCode: 302,
      headers: {
        'Location': 'https://pro-culinaria-library.proculinaria-book.ru/unauthorized.html',
      },
    };
  }
};
