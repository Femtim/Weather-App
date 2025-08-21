// get user from local storage
function getUser() {
  return JSON.parse(localStorage.getItem('user')) || [];
}

// set user to local storage
function setUser(user) {
  return localStorage.setItem('user', JSON.stringify(user));
  //   return user;
}

// Hash password using SHA-256
// This function uses the SubtleCrypto API to hash the password securely.
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

document.addEventListener('DOMContentLoaded', () => {

  // Get user from local storage
  const user = getUser();

  //password feasibility
  const passwordInput = document.getElementById('password');
  const passwordInput2 = document.getElementById('login_password');
  const togglePassword = document.getElementById('togglePassword');
  const eyeOpen = document.getElementById('eyeOpen');
  const eyeClosed = document.getElementById('eyeClosed');

  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      [passwordInput, passwordInput2].forEach(input => {
        if (input) {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
        }
      });
      // Toggle icon visibility
      const isPassword = passwordInput?.type === 'password';
      eyeOpen?.classList.toggle('hidden', !isPassword);
      eyeClosed?.classList.toggle('hidden', isPassword);
    });
  }



  // Signup Inputs
  const fullName = document.querySelector('#full_name');
  const email = document.querySelector('#email');
  const password = document.querySelector('#password');
  const signUpBtn = document.querySelector('#signup_button');
  const location = document.querySelector('#location');

  // Login Inputs
  const loginEmail = document.querySelector('#login_email');
  const loginPassword = document.querySelector('#login_password');
  const loginBtn = document.querySelector('#login_button');

  // Logout
  const logOut = document.querySelector('#logout');

  if (signUpBtn) {
    async function signUpBtnClickHandler(ev) {
      ev.preventDefault();

      if (!fullName.value || !email.value || !password.value) {
        alert('Please fill in all fields.');
        return;
      }

      if (!email.value.includes('@')) {
        alert('Please enter a valid email address.');
        return;
      }

      // Check if the user already exists
      if (user && user.some((u) => u.email === email.value)) {
        alert('User already exists exist.');
        window.location.href = 'Login.html';
        return;
      }
      // Check if password is less than 6 characters
      if (password.value.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }

      // Hash the password
      const hashedPassword = await hashPassword(password.value);
      const newUser = {
        id: crypto.randomUUID(), // Generate a unique ID for the user Generate a unique account number
        fullName: fullName.value,
        email: email.value,
        password: hashedPassword,
        location: location.value,
        createdAt: new Date().toISOString(),
      };

      user.push(newUser); // Add the new user to the user array
      setUser(user);
      alert('User registered successfully!');
      window.location.href = 'index.html'; // Redirect to login page after successful registration
    }

    signUpBtn.addEventListener('click', signUpBtnClickHandler);
    fullName.value = '';
    email.value = '';
    password.value = '';
    location.value = '';

  }

  // Login logic

  if (loginBtn) {
    loginBtn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const emailValue = loginEmail.value.trim();
      const passwordValue = loginPassword.value;

      if (!emailValue || !passwordValue) {
        alert('Please fill all fields.');
        return;
      }

      const users = getUser();
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



  // Weather Dashboard Logic
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  const weatherForm = document.getElementById('weatherForm');
  const cityInput = document.getElementById('cityInput');
  const weatherResult = document.getElementById('weatherResult');
  const forecastDiv = document.getElementById('forecast');
  const geoBtn = document.getElementById('geoBtn');
  const apiKey = 'af37647eae60c74c42c6df82cb20ecd6';

  const path = window.location.pathname.toLowerCase();
  if (
    (path === '/' || path.endsWith('dashboard.html')) &&
    !localStorage.getItem('loggedInUser')
  ) {
    window.location.href = '/index.html'; // absolute path for Vercel
  }


  const userDisplay = document.getElementById('userDisplay');
  if (loggedInUser && userDisplay) {
    userDisplay.textContent = `Welcome, ${loggedInUser.fullName}`;
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
        data.list.forEach(item => {
          const date = item.dt_txt.split(' ')[0];
          const hour = new Date(item.dt_txt).getHours();
          if (!days[date] || Math.abs(hour - 12) < Math.abs(new Date(days[date].dt_txt).getHours() - 12)) {
            days[date] = item;
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
  }
});

// Logout
document.addEventListener('DOMContentLoaded', () => {

  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
      }
    });
  }
});











