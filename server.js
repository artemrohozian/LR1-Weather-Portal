require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = process.env.OPENWEATHER_API_KEY;
if (!API_KEY) {
    console.warn("Api key not found");
}

const BASE = 'https://api.openweathermap.org/data/2.5';
const GEO = 'https://api.openweathermap.org/geo/1.0';

async function proxyRequest(url, res) {
    try {
        const apiRes = await fetch(url);
        const data = await apiRes.json();
        if (!apiRes.ok) {
            return res.status(apiRes.status).json(data);
        }
        res.json(data);
    } catch (error) {
        console.error('API Fetch Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

app.get('/weather', (req, res) => {
    const { city, lat, lon } = req.query;
    if (city) return proxyRequest(`${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`, res);
    if (lat && lon) return proxyRequest(`${BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`, res);
    res.status(400).json({ error: 'City or coordinates required' });
});

app.get('/forecast', (req, res) => {
    const { city, lat, lon } = req.query;
    if (city) return proxyRequest(`${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`, res);
    if (lat && lon) return proxyRequest(`${BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`, res);
    res.status(400).json({ error: 'City or coordinates required' });
});

app.get('/geocode', (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" required' });
    proxyRequest(`${GEO}/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`, res);
});

app.get('/air', (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Coordinates required' });
    proxyRequest(`${BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`, res);
});

app.listen(PORT, () => {
    console.log(`Server running! Port:${PORT}`);
});