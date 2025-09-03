 // Импортируем JWT для работы с токенами
import jwt from 'jsonwebtoken';

// Эта функция будет обрабатывать все запросы
export default async function handleRequest(request) {
    // 1. Проверяем, что это POST-запрос, и что путь правильный
    if (request.method === 'POST' && new URL(request.url).pathname === '/api/login') {
        try {
            const { email, password } = await request.json();
            const JWT_SECRET = request.env.JWT_SECRET; // Используем переменную окружения

            if (email === 'admin@example.com' && password === 'admin') {
                const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '2m' });
                
                // Создаем ответ с установкой куки
                const response = new Response(JSON.stringify({ success: true }), { status: 200 });
                response.headers.set('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=None`);
                return response;
            } else {
                return new Response(JSON.stringify({ message: 'Неверный email или пароль' }), { status: 401 });
            }
        } catch (error) {
            console.error('Ошибка в функции входа:', error);
            return new Response(JSON.stringify({ message: "Ошибка сервера" }), { status: 500 });
        }
    }

    // Если запрос не соответствует нашему маршруту, возвращаем 404
    return new Response('Not Found', { status: 404 });
}
