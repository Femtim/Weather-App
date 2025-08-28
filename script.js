// Utility functions for local storage
function getUsers() {
  return JSON.parse(localStorage.getItem('user')) || [];
}
function setUsers(users) {
  localStorage.setItem('user', JSON.stringify(users));
}

// Hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Password toggle logic
  const passwordInput = document.getElementById('password');
  const passwordInput2 = document.getElementById('login_password');
  const togglePassword = document.getElementById('togglePassword');
  const eyeOpen = document.getElementById('eyeOpen');
  const eyeClosed = document.getElementById('eyeClosed');

  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      [passwordInput, passwordInput2].forEach(input => {
        if (input) {
          input.type = input.type === 'password' ? 'text' : 'password';
        }
      });
      const isPassword = passwordInput?.type === 'password';
      eyeOpen?.classList.toggle('hidden', !isPassword);
      eyeClosed?.classList.toggle('hidden', isPassword);
    });
  }

  // Signup logic
  const fullName = document.getElementById('full_name');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const signUpBtn = document.getElementById('signup_button');
  const location = document.getElementById('location');

  if (signUpBtn) {
    signUpBtn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const users = getUsers();

      if (!fullName.value || !email.value || !password.value || !location.value) {
        alert('Please fill in all fields.');
        return;
      }
      if (!email.value.includes('@')) {
        alert('Please enter a valid email address.');
        return;
      }
      if (users.some(u => u.email === email.value)) {
        alert('User already exists.');
        window.location.href = 'index.html';
        return;
      }
      if (password.value.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }

      const hashedPassword = await hashPassword(password.value);
      const newUser = {
        id: crypto.randomUUID(),
        fullName: fullName.value,
        email: email.value,
        password: hashedPassword,
        location: location.value,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      setUsers(users);
      alert('User registered successfully!');
      window.location.href = 'index.html';
    });

    fullName.value = '';
    email.value = '';
    password.value = '';
    location.value = '';
  }

  // Login logic
  const loginEmail = document.getElementById('login_email');
  const loginPassword = document.getElementById('login_password');
  const loginBtn = document.getElementById('login_button');

  if (loginBtn) {
    loginBtn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const emailValue = loginEmail.value.trim();
      const passwordValue = loginPassword.value;

      if (!emailValue || !passwordValue) {
        alert('Please fill all fields.');
        return;
      }

      const users = getUsers();
      const hashedPassword = await hashPassword(passwordValue);
      const user = users.find(u => u.email === emailValue);

      if (!user) {
        alert('User not found.');
        return;
      }
      if (user.password !== hashedPassword) {
        alert('Incorrect password.');
        return;
      }

      localStorage.setItem('loggedInUser', JSON.stringify(user));
      alert('Login successful!');
      window.location.href = 'dashboard.html';
    });

    loginEmail.value = '';
    loginPassword.value = '';
  }

  // Auth redirect for dashboard
  const path = window.location.pathname.toLowerCase();
  if (
    (path === '/' || path.endsWith('dashboard.html')) &&
    !localStorage.getItem('loggedInUser')
  ) {
    window.location.href = '/index.html';
  }

  // Weather Dashboard Logic
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  const weatherForm = document.getElementById('weatherForm');
  const cityInput = document.getElementById('cityInput');
  const weatherResult = document.getElementById('weatherResult');
  const forecastDiv = document.getElementById('forecast');
  const geoBtn = document.getElementById('geoBtn');
  const apiKey = 'af37647eae60c74c42c6df82cb20ecd6';

  const userDisplay = document.getElementById('userDisplay');
  if (loggedInUser && userDisplay) {
    userDisplay.textContent = `Welcome, ${loggedInUser.fullName}`;
  }
  // Greeting logic
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  const greetingEl = document.getElementById('greeting');
  if (greetingEl) {
    greetingEl.textContent = getGreeting();
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
        const days = {};
        const today = new Date().toISOString().split('T')[0];
        data.list.forEach(item => {
          const date = item.dt_txt.split(' ')[0];
          const hour = new Date(item.dt_txt).getHours();
          // Only add days after today
          if (date > today) {
            if (!days[date] || Math.abs(hour - 12) < Math.abs(new Date(days[date].dt_txt).getHours() - 12)) {
              days[date] = item;
            }
          }
        });
        let html = `<div class="text-lg sm:text-xl underline font-bold text-blue-800 mb-2 text-left">5-Days Forecast</div>
<div class="flex gap-2 sm:gap-4 mt-2 overflow-x-auto">`;
        Object.values(days).slice(0, 5).forEach(day => {
          html += `
            <div class="min-w-[100px] sm:min-w-[120px]">
              <div class="flex-1 bg-[linear-gradient(to_top,_#6600ff_5%,_#9966ff_100%)] rounded-lg p-2 sm:p-3 text-center shadow text-white">
                <div class="font-semibold text-white text-sm sm:text-base">${new Date(day.dt_txt).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" class="m-auto" width="40" sm:width="60">
                <div class="font-bold text-lg sm:text-xl text-white">${day.main.temp}°C</div>
                <div class="text-xs sm:text-sm text-white">${day.weather[0].main}</div>
                <div class="text-xs sm:text-sm text-gray-200">Wind: ${day.wind.speed} m/s</div>
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
  }

  function getWeatherByCity(city) {
    weatherResult.innerHTML = `<div class="text-gray-500">Loading...</div>`;
    forecastDiv.innerHTML = '';
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
    weatherResult.innerHTML = `<div class="text-gray-500">Loading...</div>`;
    forecastDiv.innerHTML = '';
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

  // Show default weather for user's location after login
  if (loggedInUser && weatherForm && cityInput) {
    getWeatherByCity(loggedInUser.location);

    weatherForm.addEventListener('submit', function (e) {
      e.preventDefault();
      getWeatherByCity(cityInput.value.trim());
    });

    if (geoBtn) {
      geoBtn.addEventListener('click', function () {
        weatherResult.innerHTML = '<div class="text-gray-500">Getting your location...</div>';
        forecastDiv.innerHTML = '';
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
            err => weatherResult.innerHTML = `<span class="text-red-600">Could not get location: ${err.message}</span>`
          );
        } else {
          weatherResult.innerHTML = '<span class="text-red-600">Geolocation not supported</span>';
        }
      });
    }
  }

  // Logout logic
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
      }
    });
  }
});










