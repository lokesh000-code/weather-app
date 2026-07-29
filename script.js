"use strict";

/*
  Paste your OpenWeatherMap API key here.
  Keep the API key inside quotation marks.
*/
const API_KEY = "43bd682ea910152ac6e5296e6140cb00";

const CURRENT_WEATHER_API =
  "https://api.openweathermap.org/data/2.5/weather";

const FORECAST_API =
  "https://api.openweathermap.org/data/2.5/forecast";

/* HTML elements */

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchId");

const loadingSpinner =
  document.getElementById("loadingSpinner");

const weatherIcon =
  document.getElementById("weatherIcon");

const cityName =
  document.getElementById("cityName");

const temperature =
  document.getElementById("temperature");

const humidity =
  document.getElementById("humidity");

const wind =
  document.getElementById("wind");

const thunder =
  document.getElementById("thunder");

/* Search event */

searchForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (city === "") {
    showError("Please enter a city name.");
    return;
  }

  await loadCompleteWeather(city);
});

/* Load both current and forecast weather */

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

/* Current-weather request */

async function getCurrentWeather(city) {
  const requestURL =
    `${CURRENT_WEATHER_API}?q=${encodeURIComponent(city)}` +
    `&appid=${API_KEY}&units=metric`;

  const response = await fetch(requestURL);

  if (!response.ok) {
    throw createApiError(response.status);
  }

  return response.json();
}

/* Forecast request */

async function getForecastWeather(city) {
  const requestURL =
    `${FORECAST_API}?q=${encodeURIComponent(city)}` +
    `&appid=${API_KEY}&units=metric`;

  const response = await fetch(requestURL);

  if (!response.ok) {
    throw createApiError(response.status);
  }

  return response.json();
}

/* Display current weather */

function displayCurrentWeather(data) {
  const weatherData = data.weather[0];

  cityName.textContent = data.name;

  temperature.textContent =
    `${formatNumber(data.main.temp)} °C`;

  humidity.textContent =
    `${data.main.humidity}%`;

  wind.textContent =
    `${formatNumber(data.wind.speed)} m/s`;

  thunder.textContent =
    weatherData.description;

  weatherIcon.src =
    `https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`;

  weatherIcon.alt =
    weatherData.description;

  weatherIcon.style.display = "block";
}

/* Display 5-day forecast */

function displayFiveDayForecast(data) {
  const dailyForecasts =
    selectFiveDailyForecasts(data.list);

  dailyForecasts.forEach(function (forecast, index) {
    const dayNumber = index + 1;

    const dateElement =
      document.getElementById(`day${dayNumber}Date`);

    const iconElement =
      document.getElementById(`day${dayNumber}Icon`);

    const temperatureElement =
      document.getElementById(`day${dayNumber}Temp`);

    if (
      !dateElement ||
      !iconElement ||
      !temperatureElement
    ) {
      return;
    }

    const forecastDate =
      new Date(forecast.dt * 1000);

    const formattedDate =
      forecastDate.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short"
      });

    const weatherData =
      forecast.weather[0];

    dateElement.textContent =
      formattedDate;

    iconElement.src =
      `https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`;

    iconElement.alt =
      weatherData.description;

    temperatureElement.textContent =
      `${formatNumber(forecast.main.temp)} °C`;
  });
}

/*
  OpenWeatherMap forecast provides data every 3 hours.
  This selects one forecast close to 12 PM for each date.
*/

function selectFiveDailyForecasts(forecastList) {
  const forecastsByDate = {};

  forecastList.forEach(function (forecast) {
    const date =
      forecast.dt_txt.split(" ")[0];

    if (!forecastsByDate[date]) {
      forecastsByDate[date] = [];
    }

    forecastsByDate[date].push(forecast);
  });

  return Object.values(forecastsByDate)
    .map(function (dailyForecasts) {
      return getForecastClosestToNoon(dailyForecasts);
    })
    .slice(0, 5);
}

function getForecastClosestToNoon(dailyForecasts) {
  return dailyForecasts.reduce(function (
    closest,
    current
  ) {
    const closestHour =
      Number(closest.dt_txt.split(" ")[1].split(":")[0]);

    const currentHour =
      Number(current.dt_txt.split(" ")[1].split(":")[0]);

    const closestDifference =
      Math.abs(12 - closestHour);

    const currentDifference =
      Math.abs(12 - currentHour);

    return currentDifference < closestDifference
      ? current
      : closest;
  });
}

/* Update your existing last table */

function updateWeatherTable(data) {
  const table = document.querySelector(".table");

  if (!table) {
    return;
  }

  const tableHead =
    table.querySelector("thead");

  const tableBody =
    table.querySelector("tbody");

  if (!tableHead || !tableBody) {
    return;
  }

  /*
    Replace old headings with live-weather headings.
  */

  tableHead.innerHTML = `
    <tr>
      <th class="text-start">City</th>
      <th>Temperature</th>
      <th>Humidity</th>
      <th>Wind Speed</th>
      <th>Weather</th>
    </tr>
  `;

  /*
    Remove original hard-coded rows only once.
  */

  if (!tableBody.dataset.liveWeatherStarted) {
    tableBody.innerHTML = "";
    tableBody.dataset.liveWeatherStarted = "true";
  }

  const cityKey =
    data.name.toLowerCase();

  const existingRow =
    tableBody.querySelector(
      `tr[data-city="${CSS.escape(cityKey)}"]`
    );

  if (existingRow) {
    existingRow.remove();
  }

  const newRow =
    document.createElement("tr");

  newRow.dataset.city = cityKey;

  newRow.innerHTML = `
    <th scope="row" class="text-start">
      ${escapeHTML(data.name)}
    </th>

    <td>
      ${formatNumber(data.main.temp)} °C
    </td>

    <td>
      ${data.main.humidity}%
    </td>

    <td>
      ${formatNumber(data.wind.speed)} m/s
    </td>

    <td class="text-capitalize">
      ${escapeHTML(data.weather[0].description)}
    </td>
  `;

  tableBody.prepend(newRow);
}

/* Loading */

function setLoading(isLoading) {
  loadingSpinner.style.display =
    isLoading ? "block" : "none";

  searchButton.disabled = isLoading;

  searchButton.textContent =
    isLoading ? "Loading..." : "Search";
}

/* Error handling */

function validateApiKey() {
  if (
    API_KEY === "" ||
    API_KEY === "YOUR_API_KEY_HERE"
  ) {
    throw new Error(
      "Please paste your OpenWeatherMap API key in script.js."
    );
  }
}

function createApiError(statusCode) {
  if (statusCode === 401) {
    return new Error(
      "Your API key is incorrect or not activated yet."
    );
  }

  if (statusCode === 404) {
    return new Error(
      "City not found. Please check the spelling."
    );
  }

  if (statusCode === 429) {
    return new Error(
      "Too many requests. Please wait and try again."
    );
  }

  return new Error(
    "Weather data could not be loaded."
  );
}

function showError(message) {
  const oldError =
    document.querySelector(".weather-error");

  if (oldError) {
    oldError.remove();
  }

  const errorBox =
    document.createElement("div");

  errorBox.className =
    "weather-error";

  errorBox.textContent =
    message;

  document.body.appendChild(errorBox);

  window.setTimeout(function () {
    errorBox.remove();
  }, 3500);
}

/* Helpers */

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

/* Load Delhi when the page opens */

loadCompleteWeather("Delhi");






