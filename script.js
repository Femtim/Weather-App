const apiKey = 'af37647eae60c74c42c6df82cb20ecd6';

const weatherForm = document.getElementById('weatherForm');
const cityInput = document.getElementById('cityInput');
const weatherResult = document.getElementById('weatherResult');
const forecastDiv = document.getElementById('forecast');
const geoBtn = document.getElementById('geoBtn');

weatherForm.addEventListener('submit', function (e) {
  e.preventDefault();
  getWeatherByCity(cityInput.value.trim());
});

geoBtn.addEventListener('click', function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      err => alert('Could not get location')
    );
  } else {
    alert('Geolocation not supported');
  }
});

function getWeatherByCity(city) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      if (data.cod !== 200) throw new Error(data.message);
      showWeather(data);
      getForecast(data.coord.lat, data.coord.lon);
    })
    .catch(err => {
      weatherResult.innerHTML = `<span class="text-red-600">${err.message}</span>`;
      forecastDiv.innerHTML = '';
    });
}

function getWeatherByCoords(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      showWeather(data);
      getForecast(lat, lon);
    })
    .catch(err => {
      weatherResult.innerHTML = `<span class="text-red-600">${err.message}</span>`;
      forecastDiv.innerHTML = '';
    });
}

function showWeather(data) {
  const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  weatherResult.innerHTML = `
        <div class="flex flex-col items-center">
          <h3 class="text-xl font-semibold text-blue-800">${data.name}, ${data.sys.country}</h3>
          <img src="${icon}" class="w-32 h-32" alt="${data.weather[0].description}">
          <div class="text-xl font-medium">${data.weather[0].main} <span class="text-gray-500 text-sm">(${data.weather[0].description})</span></div>
          <div class="mt-2 text-blue-700 font-bold text-xl">🌡️ ${data.main.temp}°C</div>
          <div class="mt-2 text-gray-700 text-xl mb-2">💨 Wind: ${data.wind.speed} m/s</div>
        </div>
      `;
}

function getForecast(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      // Group by day, pick the forecast at 12:00 each day
      const days = {};
      data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (item.dt_txt.includes('12:00:00')) days[date] = item;
      });
      let html = `
        <div class="text-xl underline font-bold text-blue-800 mb-2 text-left">5-Days Forecast</div>
        <div class="flex gap-2 mt-2">
      `;
      Object.values(days).slice(0, 5).forEach(day => {
        html += `
          <div class="flex-1">
            <div class="flex-1 bg-[linear-gradient(to_top,_#6600ff_5%,_#9966ff_100%)] rounded-lg p-3 text-center shadow text-white">
              <div class="font-semibold text-blue-800">${new Date(day.dt_txt).toLocaleDateString(undefined, { weekday: 'short' })}</div>
              <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="" class="mx-auto" width="40">
              <div class="font-bold text-xl text-white">${day.main.temp}°C</div>
              <div class="text-sm text-white">${day.weather[0].main}</div>
              <div class="text-sm text-gray-200">Wind: ${day.wind.speed} m/s</div>
            </div>
          </div>
        `;
      });
      html += '</div>';
      forecastDiv.innerHTML = html;
    })
    .catch(err => {
      forecastDiv.innerHTML = `<span class="text-red-600">${err.message}</span>`;
    });
  ;
}