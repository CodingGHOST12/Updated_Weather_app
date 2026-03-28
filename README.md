# SkyCast - Professional Weather Dashboard

A modern and responsive weather forecasting application created with Vanilla JavaScript and Tailwind CSS. The application offers real-time meteorological data and a 5-day extended forecast using the OpenWeatherMap API. The application offers a premium user experience with features like a glassmorphism UI, intelligent search autocomplete, and dynamic environmental backgrounds that respond to live weather conditions.

## 🚀 Features

* **Intelligent Global Search:** The application uses the OpenWeatherMap API's Geocoding API to provide city, state, and country autocomplete suggestions as the user types in the search bar.
* **Extended Forecast:** The application displays a clean 5-day weather forecast by extracting data from 3-hourly API data chunks.
* **Dynamic Environment:** The background of the application uses the HTML Canvas element and CSS animations to dynamically show rain effects if detected in the API's weather data.
* **Extreme Weather Alerts:** The application uses custom JavaScript logic to trigger high-priority UI warnings if extreme temperatures are detected in the API's weather data.
* **Metric Toggles:** The application uses instant and localized state management to allow users to switch between Celsius and Fahrenheit units without needing to reload the DOM.
* **Session Persistence:** The application uses the browser's localStorage API to save recent successful search queries for fast access.

## 🛠️ Technologies Used

* **Frontend:** The application uses basic HTML5 elements and Tailwind CSS through a CDN import.
* **Custom Styling:** The application uses custom CSS with features like CSS Variables, Keyframe Animations, and Backdrop Filters.
* **Logic:** The application uses Modern Vanilla JavaScript with features like ES6+, Async/Await, and the Fetch API.
* **Data Provider:** The application uses the OpenWeatherMap API to fetch weather data and geolocation data.