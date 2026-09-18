const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.WEATHER_API_KEY;

// Root route (Prevents "Cannot GET /")
app.get('/', (req, res) => {
    res.send('Weather API Backend is running!');
});

// Main weather endpoint
app.get('/api/weather', async (req, res) => {
    const { city } = req.query;

    if (!city) {
        return res.status(400).json({ error: "City name is required" });
    }

    if (!API_KEY) {
        return res.status(500).json({ error: "API key missing in backend/.env" });
    }

    try {
        const [currentWeather, forecastWeather] = await Promise.all([
            axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`),
            axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`)
        ]);

        const current = {
            city: currentWeather.data.name,
            country: currentWeather.data.sys.country,
            temp: Math.round(currentWeather.data.main.temp),
            feels_like: Math.round(currentWeather.data.main.feels_like),
            condition: currentWeather.data.weather[0].main,
            description: currentWeather.data.weather[0].description,
            humidity: currentWeather.data.main.humidity,
            wind_speed: currentWeather.data.wind.speed,
            icon: `https://openweathermap.org/img/wn/${currentWeather.data.weather[0].icon}@4x.png`
        };

        const dailyForecast = forecastWeather.data.list
            .filter(item => item.dt_txt.includes("12:00:00"))
            .map(item => ({
                date: item.dt_txt.split(' ')[0],
                temp: Math.round(item.main.temp),
                description: item.weather[0].main,
                icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`
            }));

        res.json({
            current: current,
            forecast: dailyForecast
        });

    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: "City not found. Please try again." });
        }
        if (error.response && error.response.status === 401) {
            return res.status(401).json({ error: "Invalid OpenWeather API key." });
        }
        console.error("API Error:", error.message);
        res.status(500).json({ error: "Server error fetching weather data." });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});