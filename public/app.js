
const API = 'http://localhost:5000'; 
const ICONS = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '⛅',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cityInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchWeather();
    });
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city') || 'Kharkiv';
    loadCity(city);
});


function searchWeather() {
    const city = document.getElementById('cityInput')?.value.trim();
    if (!city) { 
        showError('Будь ласка, введіть назву міста'); 
        return; 
    }
    loadCity(city);
}

async function loadCity(city) {
    showError('');
    setText('cityName', 'Завантаження...');

    const input = document.getElementById('cityInput');
    if (input) input.value = city;

    try {
        const [weather, forecast] = await Promise.all([
            fetchAPI(`/weather?city=${encodeURIComponent(city)}`),
            fetchAPI(`/forecast?city=${encodeURIComponent(city)}`)
        ]);

        renderCurrent(weather);
        renderForecast(forecast);
        updateMap(weather.coord.lat, weather.coord.lon);
    } catch (err) {
        console.error(err);
        showError('Місто не знайдено або сервер недоступний.');
        setText('cityName', 'Помилка 😢');
        setText('currentTemp', '--°');
        setText('weatherDesc', 'Дані недоступні');
    }
}

function getLocation() {
    if (!navigator.geolocation) { 
        showError('Ваш браузер не підтримує геолокацію'); 
        return; 
    }
    showError('Шукаємо вас...');
    navigator.geolocation.getCurrentPosition(async (pos) => {
        showError('');
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
            const [weather, forecast] = await Promise.all([
                fetchAPI(`/weather?lat=${lat}&lon=${lon}`),
                fetchAPI(`/forecast?lat=${lat}&lon=${lon}`)
            ]);
            if (document.getElementById('cityInput')) {
                document.getElementById('cityInput').value = weather.name;
            }
            renderCurrent(weather);
            renderForecast(forecast);
            updateMap(lat, lon);
        } catch (err) {
            showError('Не вдалося отримати погоду за координатами.');
        }
    }, () => showError('Доступ до геолокації заборонено.'));
}

async function fetchAPI(endpoint) {
    const res = await fetch(`${API}${endpoint}`);
    const data = await res.json();
    if (!res.ok || (data.cod && data.cod != 200)) {
        throw new Error(data.message || 'Помилка API');
    }
    return data;
}


function renderCurrent(d) {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('uk-UA', dateOptions);

    setText('cityName', `${d.name}, ${d.sys.country}`);
    setText('currentDate', today.charAt(0).toUpperCase() + today.slice(1));
    setText('currentTemp', `${Math.round(d.main.temp)}°C`);
    setText('weatherDesc', d.weather[0].description.charAt(0).toUpperCase() + d.weather[0].description.slice(1));
    setText('weatherIcon', ICONS[d.weather[0].icon] || '🌤️');
    setText('humidity', `${d.main.humidity}%`);
    setText('windSpeed', `${Math.round(d.wind.speed)} м/с`);
    setText('pressure', `${d.main.pressure} гПа`);
}

function renderForecast(data) {
    const tbody = document.getElementById('forecastTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);

    dailyData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayOptions = { weekday: 'long', day: 'numeric', month: 'short' };
        let dayName = date.toLocaleDateString('uk-UA', dayOptions);
        dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        const icon = ICONS[item.weather[0].icon] || '🌤️';
        const temp = Math.round(item.main.temp);
        const desc = item.weather[0].description.charAt(0).toUpperCase() + item.weather[0].description.slice(1);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dayName}</td>
            <td style="font-size:1.8rem;">${icon}</td>
            <td style="font-weight:bold; color:#003366;">${temp}°C</td>
            <td>${desc}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateMap(lat, lon) {
    const iframe = document.querySelector('iframe[title="Weather Map"]');
    if (iframe) {
        iframe.src = `https://openweathermap.org/weathermap?basemap=map&cities=true&layer=temperature&lat=${lat}&lon=${lon}&zoom=7`;
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function showError(msg) {
    const el = document.getElementById('errorMsg');
    if (el) {
        el.textContent = msg;
        el.style.color = '#cc0000';
    }
}