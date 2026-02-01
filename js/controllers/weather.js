import { showToast } from '../utils/toast.js';
import { router } from '../core/router.js';
import { store } from '../core/store.js';

const MOCK_WEATHER = {
    temp: 24,
    condition: 'Ensolarado',
    location: 'São Paulo, BR',
    humidity: 45,
    wind: 12,
    uv: 'Alto',
    icon: 'wb_sunny',
    isMock: true
};

export async function initWeather() {
    // Attach listener to back button
    const backBtn = document.getElementById('weather-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            router.navigateTo('dashboard');
        });
    }

    // Attach listener to refresh button
    const refreshBtn = document.getElementById('weather-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering parent click events
            handleManualRefresh();
        });
    }

    // Attempt to fetch location on init (fails gracefully to mock if permission denied/ignored)
    // Check cache first
    const CACHE_DURATION = 30 * 60 * 1000; // 30 mins
    if (store.weatherCache && store.weatherCache.timestamp && (Date.now() - store.weatherCache.timestamp < CACHE_DURATION)) {
        updateUI(store.weatherCache.data);
    } else {
        // We start with mock data visibly, then try to update.
        updateUI(MOCK_WEATHER);
        if (navigator.geolocation) {
            getPreciseLocation(true); // silent mode
        }
    }
}

async function handleManualRefresh() {
    const btn = document.getElementById('weather-refresh-btn');
    if (btn) {
        btn.classList.add('animate-spin');
        // Add a temporary rotation class or similar if CSS supports it,
        // otherwise just visual feedback via opacity
        btn.style.opacity = '0.5';
    }

    await getPreciseLocation(false);

    if (btn) {
        btn.classList.remove('animate-spin');
        btn.style.opacity = '1';
    }
}

/**
 * Gets the precise location and updates the weather.
 * @param {boolean} silent - If true, suppresses error toasts (useful for auto-load).
 */
async function getPreciseLocation(silent = false) {
    if (!navigator.geolocation) {
        if (!silent) showToast('Geolocalização não suportada', 'error');
        return;
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: true
            });
        });

        const { latitude, longitude } = position.coords;
        // Save location for other controllers (e.g. Planner)
        store.saveUserLocation({ latitude, longitude });

        await fetchWeatherData(latitude, longitude);

    } catch (error) {
        console.warn("Location access issue:", error);
        if (!silent) {
            if (error.code === error.PERMISSION_DENIED) {
                showToast('Permissão de localização negada.', 'info');
            } else {
                showToast('Erro ao obter localização.', 'error');
            }
        }
        // Fallback is already shown (Mock)
    }
}

async function fetchWeatherData(lat, lon) {
    let current, daily, weatherInfo, uvValue;

    try {
        // 1. Fetch Weather Data (Open-Meteo)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=uv_index_max&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) throw new Error('Weather API failed');
        const weatherJson = await weatherRes.json();

        current = weatherJson.current;
        daily = weatherJson.daily;
        weatherInfo = mapWmoCode(current.weather_code);
        uvValue = daily && daily.uv_index_max && daily.uv_index_max.length > 0 ? daily.uv_index_max[0] : 0;
    } catch (err) {
        console.error("Fetch weather error:", err);
        showToast('Erro ao atualizar clima.', 'error');
        return;
    }

    // 2. Fetch Location Name (Reverse Geocoding) - Handle independently
    let locationName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=pt`;
        const geoRes = await fetch(geoUrl);
        if (geoRes.ok) {
            const geoJson = await geoRes.json();
            if (geoJson.results && geoJson.results[0]) {
                const place = geoJson.results[0];
                locationName = `${place.name}, ${place.country_code ? place.country_code.toUpperCase() : ''}`;
            }
        }
    } catch (err) {
        console.warn("Geocoding failed (using coords):", err);
    }

    const data = {
        temp: Math.round(current.temperature_2m),
        condition: weatherInfo.text,
        location: locationName,
        humidity: current.relative_humidity_2m,
        wind: Math.round(current.wind_speed_10m),
        uv: getUVText(uvValue),
        icon: weatherInfo.icon,
        isMock: false
    };

    // Save to cache
    store.saveWeatherCache({
        data: data,
        timestamp: Date.now()
    });

    updateUI(data);
    showToast(`Clima atualizado!`, 'success');
}

export async function getWeeklyForecast(lat, lon) {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await fetch(weatherUrl);
        if (!res.ok) throw new Error('Forecast API failed');
        const json = await res.json();
        const daily = json.daily;

        const forecastMap = {};
        if (daily && daily.time) {
            daily.time.forEach((date, i) => {
                forecastMap[date] = {
                    date: date,
                    code: daily.weather_code[i],
                    max: Math.round(daily.temperature_2m_max[i]),
                    min: Math.round(daily.temperature_2m_min[i]),
                    info: mapWmoCode(daily.weather_code[i])
                };
            });
        }
        return forecastMap;
    } catch (e) {
        console.error("Error fetching weekly forecast:", e);
        return null;
    }
}

export function mapWmoCode(code) {
    // WMO Weather interpretation codes (WW)
    if (code === 0) return { text: 'Céu Limpo', icon: 'wb_sunny' };
    if (code >= 1 && code <= 3) return { text: 'Parcialmente Nublado', icon: 'partly_cloudy_day' };
    if (code >= 45 && code <= 48) return { text: 'Nevoeiro', icon: 'foggy' };
    if (code >= 51 && code <= 55) return { text: 'Chuvisco', icon: 'rainy' };
    if (code >= 56 && code <= 57) return { text: 'Chuvisco Gelado', icon: 'ac_unit' };
    if (code >= 61 && code <= 65) return { text: 'Chuva', icon: 'rainy' };
    if (code >= 66 && code <= 67) return { text: 'Chuva Gelada', icon: 'ac_unit' };
    if (code >= 71 && code <= 77) return { text: 'Neve', icon: 'ac_unit' };
    if (code >= 80 && code <= 82) return { text: 'Pancadas de Chuva', icon: 'rainy' };
    if (code >= 85 && code <= 86) return { text: 'Pancadas de Neve', icon: 'ac_unit' };
    if (code >= 95) return { text: 'Tempestade', icon: 'thunderstorm' };
    if (code >= 96 && code <= 99) return { text: 'Tempestade com Granizo', icon: 'thunderstorm' };

    return { text: 'Nublado', icon: 'cloud' };
}

function getUVText(uv) {
    if (uv < 3) return 'Baixo';
    if (uv < 6) return 'Médio';
    if (uv < 8) return 'Alto';
    if (uv < 11) return 'Muito Alto';
    return 'Extremo';
}

function updateUI(data) {
    // Dashboard Widget
    const dashLoc = document.getElementById('dash-weather-location');
    const dashTemp = document.getElementById('dash-weather-temp');
    const dashCond = document.getElementById('dash-weather-condition');

    // Also update the big icon in the dashboard if possible.
    const dashWidget = document.getElementById('weather-widget');
    if (dashWidget) {
        const iconContainer = dashWidget.querySelector('.material-symbols-outlined.text-\\[120px\\]');
        if (iconContainer) iconContainer.textContent = data.icon;
    }

    if (dashLoc) dashLoc.textContent = data.location;
    if (dashTemp) dashTemp.textContent = `${data.temp}°`;
    if (dashCond) dashCond.textContent = data.condition;

    // Weather Style View
    const styleContainer = document.getElementById('weather-style-container');
    const styleTemp = document.getElementById('style-weather-temp');
    const styleCond = document.getElementById('style-weather-condition');
    const styleLoc = document.getElementById('style-weather-location');
    const styleHum = document.getElementById('style-weather-humidity');
    const styleWind = document.getElementById('style-weather-wind');
    const styleUv = document.getElementById('style-weather-uv');

    // Weather View Icon
    const viewStyle = document.getElementById('view-weather-style');
    if (viewStyle) {
        // Update the big icon in the new immersive layout
        const iconEl = viewStyle.querySelector('.material-symbols-outlined.text-8xl');
        if (iconEl) iconEl.textContent = data.icon;
    }

    // Dynamic Background
    if (styleContainer) {
        styleContainer.classList.remove('weather-gradient-sunny', 'weather-gradient-cloudy', 'weather-gradient-rainy', 'weather-gradient-night');

        let gradientClass = 'weather-gradient-cloudy'; // default
        const icon = data.icon;

        if (['wb_sunny', 'clear_day'].includes(icon)) gradientClass = 'weather-gradient-sunny';
        else if (['partly_cloudy_day', 'cloud', 'foggy'].includes(icon)) gradientClass = 'weather-gradient-cloudy';
        else if (['rainy', 'thunderstorm', 'ac_unit'].includes(icon)) gradientClass = 'weather-gradient-rainy';
        else if (['clear_night', 'partly_cloudy_night', 'nights_stay'].includes(icon)) gradientClass = 'weather-gradient-night';

        styleContainer.classList.add(gradientClass);
    }

    if (styleTemp) styleTemp.textContent = `${data.temp}°`;
    if (styleCond) styleCond.textContent = data.condition;
    if (styleLoc) styleLoc.textContent = data.location;
    if (styleHum) styleHum.textContent = `${data.humidity}%`;
    if (styleWind) styleWind.textContent = `${data.wind}km/h`;
    if (styleUv) styleUv.textContent = data.uv;
}
