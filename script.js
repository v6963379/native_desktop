// Массив для хранения всех действий
let userActions = [];

// Функция для добавления действия в лог
function logAction(action) {
    const now = new Date();
    const logEntry = {
        timestamp: now.toISOString(),
        action: action
    };
    userActions.push(logEntry);

    // Добавляем запись в визуальный лог
    const logElement = document.getElementById('log');
    const logItem = document.createElement('div');
    logItem.className = 'mb-1 pb-1 border-b border-gray-200';
    logItem.textContent = `${now.toLocaleTimeString()}: ${action}`;
    logElement.appendChild(logItem);
    logElement.scrollTop = logElement.scrollHeight;
}

// Отслеживание движения мыши/тачпада
let lastMouseMove = Date.now();
document.getElementById('testArea').addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastMouseMove > 100) { // Ограничиваем частоту логирования
        logAction(`Движение мыши: x=${e.clientX}, y=${e.clientY}`);
        lastMouseMove = now;
    }
});

// Отслеживание кликов
document.getElementById('testArea').addEventListener('click', (e) => {
    logAction(`Левый клик: x=${e.clientX}, y=${e.clientY}`);
});

document.getElementById('testArea').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    logAction(`Правый клик: x=${e.clientX}, y=${e.clientY}`);
});

// Обновленное отслеживание скролла
let lastScroll = Date.now();
let lastScrollTop = 0;

// Слушаем скролл на всем документе
document.addEventListener('wheel', (e) => {
    const now = Date.now();
    if (now - lastScroll > 100) { // Ограничиваем частоту логирования
        const deltaY = Math.abs(e.deltaY);
        logAction(`Скролл: deltaY=${deltaY}`);
        lastScroll = now;
    }
});

// Также можно добавить отслеживание скролла через трекпад
document.addEventListener('scroll', (e) => {
    const now = Date.now();
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (now - lastScroll > 100 && Math.abs(currentScrollTop - lastScrollTop) > 5) {
        logAction(`Скролл: offset=${currentScrollTop}px`);
        lastScroll = now;
        lastScrollTop = currentScrollTop;
    }
});

// Добавляем новый тип действия в статистику
const actionTypes = {
    'Движение мыши': 0,
    'Левый клик': 0,
    'Правый клик': 0,
    'Скролл': 0,
    'Перетаскивание': 0
};

// Добавляем отслеживание перетаскивания
let isDragging = false;
let dragStartTime = 0;
let lastDragLog = 0;

document.addEventListener('dragstart', (e) => {
    isDragging = true;
    dragStartTime = Date.now();
    logAction(`Начало перетаскивания: x=${e.clientX}, y=${e.clientY}`);
});

document.addEventListener('drag', (e) => {
    if (isDragging) {
        const now = Date.now();
        // Логируем каждые 100мс для предотвращения слишком частых записей
        if (now - lastDragLog > 100) {
            logAction(`Перетаскивание: x=${e.clientX}, y=${e.clientY}`);
            lastDragLog = now;
        }
    }
});

document.addEventListener('dragend', (e) => {
    if (isDragging) {
        const dragDuration = (Date.now() - dragStartTime) / 1000;
        logAction(`Конец перетаскивания: x=${e.clientX}, y=${e.clientY}, длительность=${dragDuration.toFixed(2)}с`);
        isDragging = false;
    }
});

// Сделаем тестовую область скроллируемой
document.getElementById('testArea').style.overflow = 'auto';
document.getElementById('testArea').innerHTML += `
    <div style="height: 500px; padding: 20px;">
        <p>Область для скролла</p>
        <p>Попробуйте прокрутить вверх и вниз</p>
    </div>
`;

// Делаем тестовую область перетаскиваемой
const testArea = document.getElementById('testArea');
testArea.setAttribute('draggable', 'true');
testArea.style.cursor = 'move';

// Загрузка отчета
document.getElementById('downloadReport').addEventListener('click', () => {
    const report = {
        device: 'macOS',
        browser: 'Safari',
        timestamp: new Date().toISOString(),
        actions: userActions
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-actions-report.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Функция для генерации сводного отчета
function generateReport() {
    const totalActions = userActions.length;
    if (totalActions === 0) {
        return '<p class="text-gray-500">Нет записанных действий</p>';
    }

    const firstAction = new Date(userActions[0].timestamp);
    const lastAction = new Date(userActions[userActions.length - 1].timestamp);
    const duration = (lastAction - firstAction) / 1000;

    // Подсчет действий по типам
    const actionTypes = {
        'Движение мыши': 0,
        'Левый клик': 0,
        'Правый клик': 0,
        'Скролл': 0,
        'Перетаскивание': 0
    };

    userActions.forEach(action => {
        Object.keys(actionTypes).forEach(type => {
            if (action.action.startsWith(type)) {
                actionTypes[type]++;
            }
        });
    });

    // Расчет интервалов между действиями
    const intervals = [];
    for (let i = 1; i < userActions.length; i++) {
        const current = new Date(userActions[i].timestamp);
        const previous = new Date(userActions[i-1].timestamp);
        intervals.push(current - previous);
    }
    const avgInterval = intervals.length > 0 
        ? intervals.reduce((a, b) => a + b, 0) / intervals.length / 1000 
        : 0;

    return `
        <div class="space-y-6">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-lg mb-2">Общая статистика</h3>
                <p>Всего действий: ${totalActions}</p>
                <p>Длительность: ${duration.toFixed(2)} сек</p>
                <p>Действий в секунду: ${(totalActions/duration).toFixed(2)}</p>
                <p>Средний интервал: ${avgInterval.toFixed(2)} сек</p>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-lg mb-2">Действия по типам</h3>
                ${Object.entries(actionTypes)
                    .map(([type, count]) => `<p>${type}: ${count}</p>`)
                    .join('')}
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-lg mb-2">Временная шкала</h3>
                <p>Начало: ${firstAction.toLocaleString()}</p>
                <p>Конец: ${lastAction.toLocaleString()}</p>
            </div>
        </div>
    `;
}

// Находим место, где мы обрабатываем клик по кнопке "Показать отчет"
document.getElementById('showReport').addEventListener('click', () => {
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = generateReport();
});

// И в обработчике очистки данных
document.getElementById('clearData').addEventListener('click', () => {
    userActions = [];
    document.getElementById('log').innerHTML = '';
    document.getElementById('reportContent').innerHTML = generateReport(); // Обновляем отчет
    logAction('Данные очищены');
}); 