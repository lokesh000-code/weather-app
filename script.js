"use strict";

const API_KEY = "43bd682ea910152ac6e5296e6140cb00";

const CURRENT_WEATHER_API = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_API = "https://api.openweathermap.org/data/2.5/forecast";

/* HTML elements */
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchId");
const loadingSpinner = document.getElementById("loadingSpinner");
const weatherIcon = document.getElementById("weatherIcon");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const thunder = document.getElementById("thunder");
const locationBtn = document.getElementById("locationBtn");

/* Event Listeners */
if (searchForm) {
  searchForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const city = cityInput.value.trim();

    if (city === "") {
      showError("Please enter a city name.");
      return;
    }

    await loadCompleteWeather(city);
  });
}

if (locationBtn) {
  locationBtn.addEventListener("click", getCurrentLocationWeather);
}

/* Geolocation logic */
function getCurrentLocationWeather() {
  if (!navigator.geolocation) {
    showError("Location is not supported. Showing Delhi weather.");
    loadCompleteWeather("Delhi");
    return;
  }

  setLoading(true);

  navigator.geolocation.getCurrentPosition(
    locationSuccess,
    locationError,
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

async function locationSuccess(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const accuracy = position.coords.accuracy;

  try {
    const currentData = await getCurrentWeatherByCoordinates(latitude, longitude);
    const forecastData = await getForecastByCoordinates(latitude, longitude);
    const locationData = await getExactLocationName(latitude, longitude);

    displayCurrentWeather(currentData);
    displayFiveDayForecast(forecastData);
    updateWeatherTable(currentData);
    displayExactLocation(locationData, accuracy);

  } catch (error) {
    console.error(error);
    showError("Unable to find exact location. Showing nearby weather.");
  } finally {
    setLoading(false);
  }
}

function displayExactLocation(location, accuracy) {
  cityName.innerHTML = `
    <span class="location-area">📍 ${escapeHTML(location.area)}</span>
    <span class="location-city">
      ${escapeHTML(location.city)}
      ${location.city && location.state ? ", " : ""}
      ${escapeHTML(location.state)}
    </span>
    <small class="location-accuracy">
      Location accuracy: approximately ${Math.round(accuracy)} metres
    </small>
  `;
}

function locationError(error) {
  setLoading(false);
  
  if (error.code === error.PERMISSION_DENIED) {
    showError("Location permission denied. Showing Delhi weather.");
  } else if (error.code === error.POSITION_UNAVAILABLE) {
    showError("Location is unavailable. Showing Delhi weather.");
  } else if (error.code === error.TIMEOUT) {
    showError("Location request timed out. Showing Delhi weather.");
  } else {
    showError("Unable to access location. Showing Delhi weather.");
  }

  loadCompleteWeather("Delhi");
}

/* Load complete weather data */
async function loadCompleteWeather(city) {
  setLoading(true);

  try {
    validateApiKey();

    const currentData = await getCurrentWeather(city);
    const forecastData = await getForecastWeather(city);

    displayCurrentWeather(currentData);
    displayFiveDayForecast(forecastData);
    updateWeatherTable(currentData);

    cityInput.value = "";
  } catch (error) {
    console.error(error);
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

/* API Fetch functions */
async function getCurrentWeather(city) {
  const requestURL = `${CURRENT_WEATHER_API}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  const response = await fetch(requestURL);
  if (!response.ok) throw createApiError(response.status);
  return response.json();
}

async function getForecastWeather(city) {
  const requestURL = `${FORECAST_API}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  const response = await fetch(requestURL);
  if (!response.ok) throw createApiError(response.status);
  return response.json();
}

async function getCurrentWeatherByCoordinates(latitude, longitude) {
  const requestURL = `${CURRENT_WEATHER_API}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
  const response = await fetch(requestURL);
  if (!response.ok) throw createApiError(response.status);
  return response.json();
}

async function getForecastByCoordinates(latitude, longitude) {
  const requestURL = `${FORECAST_API}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
  const response = await fetch(requestURL);
  if (!response.ok) throw createApiError(response.status);
  return response.json();
}

async function getExactLocationName(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
  const response = await fetch(url, { headers: { "Accept-Language": "en" } });

  if (!response.ok) throw new Error("Unable to find exact location name.");

  const data = await response.json();
  const address = data.address || {};

  const area = address.neighbourhood || address.suburb || address.quarter || address.residential || address.city_district || address.road || "Current Location";
  const city = address.city || address.town || address.municipality || address.county || "";
  const state = address.state || "";

  return { area, city, state, fullAddress: data.display_name || "" };
}

/* Display UI updates */
function displayCurrentWeather(data) {
  const weatherData = data.weather[0];

  cityName.textContent = data.name;
  temperature.textContent = `${formatNumber(data.main.temp)} °C`;
  humidity.textContent = `${data.main.humidity}%`;
  wind.textContent = `${formatNumber(data.wind.speed)} m/s`;
  thunder.textContent = weatherData.description;

  weatherIcon.src = `https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`;
  weatherIcon.alt = weatherData.description;
  weatherIcon.style.display = "block";
}

function displayFiveDayForecast(data) {
  const dailyForecasts = selectFiveDailyForecasts(data.list);

  dailyForecasts.forEach(function (forecast, index) {
    const dayNumber = index + 1;
    const dateElement = document.getElementById(`day${dayNumber}Date`);
    const iconElement = document.getElementById(`day${dayNumber}Icon`);
    const temperatureElement = document.getElementById(`day${dayNumber}Temp`);

    if (!dateElement || !iconElement || !temperatureElement) return;

    const forecastDate = new Date(forecast.dt * 1000);
    const formattedDate = forecastDate.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short"
    });

    const weatherData = forecast.weather[0];
    dateElement.textContent = formattedDate;
    iconElement.src = `https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`;
    iconElement.alt = weatherData.description;
    temperatureElement.textContent = `${formatNumber(forecast.main.temp)} °C`;
  });
}

function selectFiveDailyForecasts(forecastList) {
  const forecastsByDate = {};

  forecastList.forEach(function (forecast) {
    const date = forecast.dt_txt.split(" ")[0];
    if (!forecastsByDate[date]) forecastsByDate[date] = [];
    forecastsByDate[date].push(forecast);
  });

  return Object.values(forecastsByDate)
    .map(function (dailyForecasts) {
      return getForecastClosestToNoon(dailyForecasts);
    })
    .slice(0, 5);
}

function getForecastClosestToNoon(dailyForecasts) {
  return dailyForecasts.reduce(function (closest, current) {
    const closestHour = Number(closest.dt_txt.split(" ")[1].split(":")[0]);
    const currentHour = Number(current.dt_txt.split(" ")[1].split(":")[0]);

    const closestDifference = Math.abs(12 - closestHour);
    const currentDifference = Math.abs(12 - currentHour);

    return currentDifference < closestDifference ? current : closest;
  });
}

function updateWeatherTable(data) {
  const table = document.querySelector(".table");
  if (!table) return;

  const tableHead = table.querySelector("thead");
  const tableBody = table.querySelector("tbody");
  if (!tableHead || !tableBody) return;

  tableHead.innerHTML = `
    <tr>
      <th class="text-start">City</th>
      <th>Temperature</th>
      <th>Humidity</th>
      <th>Wind Speed</th>
      <th>Weather</th>
    </tr>
  `;

  if (!tableBody.dataset.liveWeatherStarted) {
    tableBody.innerHTML = "";
    tableBody.dataset.liveWeatherStarted = "true";
  }

  const cityKey = data.name.toLowerCase();
  const existingRow = tableBody.querySelector(`tr[data-city="${CSS.escape(cityKey)}"]`);
  if (existingRow) existingRow.remove();

  const newRow = document.createElement("tr");
  newRow.dataset.city = cityKey;
  newRow.innerHTML = `
    <th scope="row" class="text-start">${escapeHTML(data.name)}</th>
    <td>${formatNumber(data.main.temp)} °C</td>
    <td>${data.main.humidity}%</td>
    <td>${formatNumber(data.wind.speed)} m/s</td>
    <td class="text-capitalize">${escapeHTML(data.weather[0].description)}</td>
  `;

  tableBody.prepend(newRow);
}

/* Helpers & Utilities */
function setLoading(isLoading) {
  if (loadingSpinner) loadingSpinner.style.display = isLoading ? "block" : "none";
  if (searchButton) {
    searchButton.disabled = isLoading;
    searchButton.textContent = isLoading ? "Loading..." : "Search";
  }
}

function validateApiKey() {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("Please paste your OpenWeatherMap API key in script.js.");
  }
}

function createApiError(statusCode) {
  if (statusCode === 401) return new Error("Your API key is incorrect or not activated yet.");
  if (statusCode === 404) return new Error("City not found. Please check the spelling.");
  if (statusCode === 429) return new Error("Too many requests. Please wait and try again.");
  return new Error("Weather data could not be loaded.");
}

function showError(message) {
  const oldError = document.querySelector(".weather-error");
  if (oldError) oldError.remove();

  const errorBox = document.createElement("div");
  errorBox.className = "weather-error";
  errorBox.textContent = message;

  document.body.appendChild(errorBox);
  window.setTimeout(() => errorBox.remove(), 3500);
}

function formatNumber(value) {
  return Number(value).toFixed(1);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Initialize default location on startup */
getCurrentLocationWeather();