const searchButton = document.getElementById('search-button');
const cityInput = document.getElementById('city-input');
const loader = document.getElementById('loader');

// --- Your API Key ---
const apiKey = '19103c69a69a8909e16c36121a02da6d'; // <<< PASTE YOUR KEY HERE

searchButton.addEventListener('click', () => {
    const cityName = cityInput.value;

    if (cityName === '') {
        alert('Please enter a city name');
        return;
    }
    
    loader.style.display = 'block';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('forecast-title').style.display = 'none';

    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}`;

    Promise.all([
        fetch(currentWeatherUrl).then(handleResponse),
        fetch(forecastUrl).then(handleResponse)
    ])
    .then(([currentData, forecastData]) => {
        console.log("Current Data:", currentData);
        console.log("Forecast Data:", forecastData);
        
        displayResults(currentData, forecastData);
        
        loader.style.display = 'none';
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        alert('Could not find weather data for that city. Please try again.');
        loader.style.display = 'none';
    });
});

function handleResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function displayResults(currentData, forecastData) {
    // 1. Find the HTML elements
    const resultsSection = document.getElementById('results-section');
    const cityNameElement = document.getElementById('results-city-name');
    const currentWeatherDisplay = document.getElementById('current-weather-display');
    const forecastCardsContainer = document.getElementById('forecast-cards');
    const forecastTitle = document.getElementById('forecast-title');

    // --- Part A: Display Current Weather (WITH NEW DATA) ---
    
    const tempCelsius = (currentData.main.temp - 273.15).toFixed(0);
    const feelsLikeCelsius = (currentData.main.feels_like - 273.15).toFixed(0);
    const humidity = currentData.main.humidity;
    const windSpeed = currentData.wind.speed;
    const description = currentData.weather[0].description;
    const iconCode = currentData.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    // Get today's high and low from the *current* data
    const tempMin = (currentData.main.temp_min - 273.15).toFixed(0);
    const tempMax = (currentData.main.temp_max - 273.15).toFixed(0);

    cityNameElement.textContent = currentData.name;

    // Updated HTML structure for current details
    const currentHtml = `
        <p class="current-temp">${tempCelsius}°</p>
        <img src="${iconUrl}" alt="${description}" class="current-icon">
        <p class="current-description">${description}</p>
        <div class="current-details">
            <p><strong>High</strong> ${tempMax}°</p>
            <p><strong>Low</strong> ${tempMin}°</p>
            <p><strong>Feels Like</strong> ${feelsLikeCelsius}°</p>
            <p><strong>Humidity</strong> ${humidity}%</p>
            <p><strong>Wind Speed</strong> ${windSpeed} m/s</p>
        </div>
    `;
    currentWeatherDisplay.innerHTML = currentHtml;

    // --- Part B: Display 5-Day Forecast (NEW LOGIC) ---

    forecastCardsContainer.innerHTML = ''; // Clear old cards

    // This object will hold the min/max for each day
    const dailyData = {};

    // Loop through all 40 forecast items (8 per day)
    forecastData.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0]; // Get the date "YYYY-MM-DD"

        if (!dailyData[date]) {
            // If it's the first time seeing this date, initialize it
            dailyData[date] = {
                min: item.main.temp_min,
                max: item.main.temp_max,
                icon: item.weather[0].icon,
                description: item.weather[0].description
            };
        } else {
            // Update the min and max for that day
            dailyData[date].min = Math.min(dailyData[date].min, item.main.temp_min);
            dailyData[date].max = Math.max(dailyData[date].max, item.main.temp_max);
        }
        
        // Use the icon from the 3:00 PM (15:00:00) forecast as it's a good daily summary
        if (item.dt_txt.includes("15:00:00")) {
            dailyData[date].icon = item.weather[0].icon;
            dailyData[date].description = item.weather[0].description;
        }
    });

    // Get the dates, skip the first day (today), and take the next 5
    const forecastDays = Object.keys(dailyData).slice(1, 6);

    forecastDays.forEach(dateStr => {
        const day = dailyData[dateStr];
        
        // Convert date string to a Date object to get the day name
        const date = new Date(dateStr + "T00:00:00"); // Add time to avoid timezone issues
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Convert from Kelvin
        const tempMin = (day.min - 273.15).toFixed(0);
        const tempMax = (day.max - 273.15).toFixed(0);
        const iconUrl = `https://openweathermap.org/img/wn/${day.icon}@2x.png`;
        
        // Updated card HTML with High/Low
        const cardHtml = `
            <div class="forecast-card">
                <p class="forecast-day">${dayName}</p>
                <img src="${iconUrl}" alt="${day.description}">
                <p class="forecast-temp">${tempMax}° <span>/ ${tempMin}°</span></p>
            </div>
        `;
        forecastCardsContainer.innerHTML += cardHtml;
    });

    // 6. Finally, make the whole results section visible
    resultsSection.style.display = 'block';
    forecastTitle.style.display = 'block';
}