
export function initWeather() {
    // Ideally, we would fetch data here or set up an interval
    // For now, we update it once on init, and maybe every time the view becomes active if we hooked into router
    // Since we don't have a "onViewActive" hook easily exposed, we'll just run it once.
    // Ideally, the Router should call this.
    // However, since the DOM is static, updating it once is fine for the demo.
    updateWeatherView();

    // Optional: Add a refresh button listener if one exists or just rely on reload
}

function updateWeatherView() {
    const view = document.getElementById('view-weather-style');
    if (!view) return;

    // Simulate fetching weather data
    const mockWeather = {
        temp: Math.floor(Math.random() * (28 - 12) + 12), // Random temp between 12 and 28
        condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
        location: 'São Paulo, BR',
        humidity: Math.floor(Math.random() * (90 - 30) + 30),
        wind: Math.floor(Math.random() * (25 - 2) + 2),
        uv: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
    };

    // Update UI elements
    const tempEl = view.querySelector('h1.text-4xl');
    const conditionEl = view.querySelector('p.text-slate-300.text-lg');
    const locationEl = view.querySelector('.text-sm.font-medium');

    // Update Icons based on condition (simple mapping)
    const iconEl = view.querySelector('.material-symbols-outlined.text-6xl');
    if (iconEl) {
        let iconName = 'wb_sunny';
        if (mockWeather.condition === 'Partly Cloudy') iconName = 'partly_cloudy_day';
        if (mockWeather.condition === 'Cloudy') iconName = 'cloud';
        if (mockWeather.condition === 'Rainy') iconName = 'rainy';
        iconEl.textContent = iconName;
    }

    // Stats (Humidity, Wind, UV)
    const statsContainer = view.querySelector('.mt-6.flex.justify-between');
    if (statsContainer) {
         const stats = statsContainer.querySelectorAll('p.font-bold'); // Targeting the values
         if (stats.length >= 3) {
             stats[0].textContent = `${mockWeather.humidity}%`;
             stats[1].textContent = `${mockWeather.wind} km/h`;
             stats[2].textContent = mockWeather.uv;
         }
    }

    if (tempEl) tempEl.textContent = `${mockWeather.temp}°C`;
    if (conditionEl) conditionEl.textContent = mockWeather.condition;
    if (locationEl) locationEl.textContent = mockWeather.location;
}
