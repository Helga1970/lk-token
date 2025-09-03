// Код для profile.js
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Загрузка данных пользователя (в реальном приложении нужно получать с сервера)
    const user = {
        name: "Имя Пользователя", // Замените на реальное имя
        email: "user@example.com", // Замените на реальный email
        subscription: "30 дней" // Замените на реальный статус
    };

    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userSubscription').textContent = user.subscription;

    const form = document.getElementById('profileForm');
    const statusMessage = document.getElementById('statusMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        // 2. Отправка данных на сервер
        const response = await fetch('/.netlify/functions/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                currentPassword,
                newPassword
            })
        });

        const result = await response.json();

        // 3. Отображение результата
        statusMessage.style.display = 'block';
        if (response.ok) {
            statusMessage.className = 'message success';
            statusMessage.textContent = 'Профиль успешно обновлен!';
        } else {
            statusMessage.className = 'message error';
            statusMessage.textContent = result.message || 'Произошла ошибка при обновлении профиля.';
        }
    });
});
