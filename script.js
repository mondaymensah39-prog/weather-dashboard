// 1. Grab the elements we need
const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const statusEl = document.getElementById("status");
const card = document.getElementById("weather-card");
const searchBtn = form.querySelector("button");

// 2. Translate weather codes into words
const weatherLabels = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  61: "Rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  95: "Thunderstorm"
};

// 3. Show or hide the status message
function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type; // "loading" or "error"
}

function hideStatus() {
  statusEl.textContent = "";
  statusEl.className = "hidden";
}

// 4. Turn a city name into coordinates
async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("The location service is unavailable. Try again later.");
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`No city found called "${city}". Check the spelling.`);
  }

  const place = data.results[0];
  return {
    name: place.name,
    country: place.country,
    lat: place.latitude,
    lon: place.longitude
  };
}

// 5. Get the current weather for coordinates
async function getCurrentWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not fetch the weather. Try again later.");
  }

  const data = await response.json();
  return data.current;
}

// 6. Put the results on the page
function showWeather(place, current) {
  document.getElementById("city-name").textContent = `${place.name}, ${place.country}`;
  document.getElementById("temperature").textContent = `${Math.round(current.temperature_2m)}°C`;
  document.getElementById("condition").textContent = weatherLabels[current.weather_code] ?? "Other weather";
  document.getElementById("humidity").textContent = current.relative_humidity_2m;
  document.getElementById("wind").textContent = current.wind_speed_10m;

  card.classList.remove("hidden");
}

// 7. The main flow: runs when the user submits the form
form.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the page from reloading

  const city = cityInput.value.trim();
  if (!city) return;

  // Loading state
  card.classList.add("hidden");
  searchBtn.disabled = true;
  showStatus("Loading weather...", "loading");

  try {
    const place = await getCoordinates(city);
    const current = await getCurrentWeather(place.lat, place.lon);

    hideStatus();
    showWeather(place, current);
  } catch (error) {
    // Error state
    if (error instanceof TypeError) {
      // fetch() throws a TypeError when there's no internet at all
      showStatus("No internet connection. Check your network and try again.", "error");
    } else {
      showStatus(error.message, "error");
    }
  } finally {
    // Runs whether it worked or failed
    searchBtn.disabled = false;
  }
});