document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    const statusMessage = document.getElementById('statusMessage');
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const userSubscriptionElement = document.getElementById('userSubscription');
    const subscriptionEndDateElement = document.getElementById('subscriptionEndDate');
    
    // Функция для загрузки и отображения данных пользователя
    async function fetchUserData() {
        try {
            const response = await fetch('/.netlify/functions/get-profile-data'); 
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка загрузки данных профиля.');
            }
            const data = await response.json();
            
            // Заполняем элементы данными
            userNameElement.textContent = data.name || 'Имя не указано';
            userEmailElement.textContent = data.email || 'Email не указан'; 
            
            // Отображаем статус подписки и срок действия
            const now = new Date();
            const endDate = data.access_end_date ? new Date(data.access_end_date) : null;

            if (endDate && endDate.getTime() >= now.getTime()) {
                // Подписка активна
                userSubscriptionElement.textContent = 'Действующая';

                // Форматируем только дату
                const formattedDate = endDate.toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // Форматируем только время (в 24-часовом формате)
                const formattedTime = endDate.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                // Объединяем дату и время для отображения
                subscriptionEndDateElement.textContent = `${formattedDate}, ${formattedTime}`;

            } else {
                // Подписки нет или она неактивна
                userSubscriptionElement.textContent = 'Подписка не активна';
                subscriptionEndDateElement.textContent = ''; // Пустое поле
            }
            
        } catch (error) {
            console.error('Ошибка:', error);
            statusMessage.style.display = 'block';
            statusMessage.classList.add('error');
            statusMessage.textContent = error.message;
        }
    }
    
    // Функция для отправки данных формы
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        
        const body = {
            name: name || undefined,
            currentPassword,
            newPassword: newPassword || undefined
        };
        
        try {
            const response = await fetch('/.netlify/functions/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            const data = await response.json();
            
            statusMessage.style.display = 'block';
            statusMessage.textContent = data.message;
            
            if (response.ok) {
                statusMessage.classList.remove('error');
                statusMessage.classList.add('success');
                // Обновляем данные на странице после успешного обновления
                fetchUserData(); 
            } else {
                statusMessage.classList.remove('success');
                statusMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            statusMessage.style.display = 'block';
            statusMessage.classList.remove('success');
            statusMessage.classList.add('error');
            statusMessage.textContent = 'Ошибка сервера. Пожалуйста, попробуйте позже.';
        }
    });
    
    // Загружаем данные при первой загрузке страницы
    fetchUserData();
});
