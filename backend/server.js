const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // Allows your HTML/CSS frontend to connect

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.WEATHER_API_KEY;

// Main endpoint that your frontend will call
app.get('/api/weather', async (req, res) => {
    const { city } = req.query;

    if (!city) {
        return res.status(400).json({ error: "City name is required" });
    }

    try {
        // Run both API calls at the same time for faster response
        const [currentWeather, forecastWeather] = await Promise.all([
            axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`),
            axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`)
        ]);

        // 1. Format Current Weather (For your #cityName and .weather-icon)
        const current = {
            city: currentWeather.data.name,
            country: currentWeather.data.sys.country,
            temp: Math.round(currentWeather.data.main.temp),
            feels_like: Math.round(currentWeather.data.main.feels_like),
            condition: currentWeather.data.weather[0].main,
            description: currentWeather.data.weather[0].description,
            humidity: currentWeather.data.main.humidity,
            wind_speed: currentWeather.data.wind.speed,
            icon: `http://openweathermap.org/img/wn/${currentWeather.data.weather[0].icon}@4x.png`
        };

        // 2. Format 5-Day Forecast (For your .forecast-wrapper)
        // OpenWeather free tier returns data every 3 hours (40 items). 
        // We filter it to grab one reading per day (e.g., at 12:00:00).
        const dailyForecast = forecastWeather.data.list
            .filter(item => item.dt_txt.includes("12:00:00"))
            .map(item => ({
                date: item.dt_txt.split(' ')[0], // Extracts YYYY-MM-DD
                temp: Math.round(item.main.temp),
                description: item.weather[0].main,
                icon: `http://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`
            }));

        // Send the combined data back to your frontend
        res.json({
            current: current,
            forecast: dailyForecast
        });

    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: "City not found. Please try again." });
        }
        console.error("API Error:", error.message);
        res.status(500).json({ error: "Server error fetching weather data." });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});