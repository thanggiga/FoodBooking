async function getWeather() {
    const city = document.getElementById('city').value.trim();
    const apiKey = 'b4c80ccfed7f1c47fab3ad6abad920ad';
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

    if (!city) {
        alert('Please enter a city name.');
        return;
    }

    try {
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl)
        ]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Không tìm thấy khu vực');
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        displayCurrentWeather(currentData);
        displayHourlyForecast(forecastData);
        displayRainForecast(forecastData);
        displayDailyForecast(forecastData);

    } catch (error) {
        
    }
}

function displayCurrentWeather(data) {
    const { name, main, weather, wind, visibility } = data;
    document.getElementById('current-weather').innerHTML = `
        <h2>Current Weather</h2>
        <p>Location: ${name}</p>
        <p>Temperature: ${main.temp}°C</p>
        <p>Feels Like: ${main.feels_like}°C</p>
        <p>Condition: ${weather[0].description}</p>
        <p>Humidity: ${main.humidity}%</p>
        <p>Wind Speed: ${wind.speed} m/s</p>
        <p>Visibility: ${(visibility / 1000).toFixed(1)} km</p>
    `;
}

function displayHourlyForecast(data) {
    const labels = data.list.slice(0, 8).map(item => {
        const date = new Date(item.dt * 1000);
        return `${date.getHours()}:00`;
    });

    const temperatures = data.list.slice(0, 8).map(item => item.main.temp);

    const ctx = document.getElementById('hourlyChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                }
            }
        }
    });
}

function displayRainForecast(data) {
    const labels = data.list.slice(0, 8).map(item => {
        const date = new Date(item.dt * 1000);
        return `${date.getHours()}:00`;
    });

    const rainChances = data.list.slice(0, 8).map(item => (item.pop || 0) * 100);

    const ctx = document.getElementById('rainChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rain Probability (%)',
                data: rainChances,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function displayDailyForecast(data) {
    const dailyForecastContainer = document.getElementById('daily-forecast');
    dailyForecastContainer.innerHTML = '';

    const groupedByDay = data.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {});

    Object.entries(groupedByDay).forEach(([date, items]) => {
        const temps = items.map(item => item.main.temp);
        const minTemp = Math.min(...temps);
        const maxTemp = Math.max(...temps);

        dailyForecastContainer.innerHTML += `
            <div class="day">
                <p>${date}</p>
                <p>Min Temp: ${minTemp}°C</p>
                <p>Max Temp: ${maxTemp}°C</p>
                <p>Condition: ${items[0].weather[0].description}</p>
            </div>
        `;
    });
}

const map = L.map('map').setView([20.5937, 78.9629], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const tempLayer = L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=your_api_key_here', {
    attribution: '© OpenWeatherMap',
    opacity: 0.5
});

const rainLayer = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=your_api_key_here', {
    attribution: '© OpenWeatherMap',
    opacity: 0.5
});

function toggleLayer(type) {
    if (type === 'temp') {
        map.addLayer(tempLayer);
        map.removeLayer(rainLayer);
    } else if (type === 'rain') {
        map.addLayer(rainLayer);
        map.removeLayer(tempLayer);
    }
}

map.addLayer(tempLayer);

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function info() {
  const popup = document.getElementById("accountPopup");
  const nameEl = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");

  const user = getCurrentUser();
  if (user) {
    nameEl.textContent = user.displayName || "Ẩn danh";
    emailEl.textContent = user.email || "Không có email";
  } else {
    nameEl.textContent = "Chưa đăng nhập";
    emailEl.textContent = "";
  }
  popup.style.display = "block";
}

function closePopup() {
  document.getElementById("accountPopup").style.display = "none";
}

window.info = info;
window.closePopup = closePopup;