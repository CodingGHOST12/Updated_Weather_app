const API_KEY = "";
const GEO = "https://api.openweathermap.org/geo/1.0/direct";
const WX = "https://api.openweathermap.org/data/2.5";
let tempC = null;
let unit = "C";
let debounce = null;
let errTimer = null;
let recents = JSON.parse(localStorage.getItem("skycast_v2") || "[]");
const inp = document.getElementById("cityInput"),
  dropP = document.getElementById("dropPanel"),
  dropH = document.getElementById("dropHead"),
  dropL = document.getElementById("dropList"),
  content = document.getElementById("content"),
  scene = document.getElementById("scene"),
  rainWrap = document.getElementById("rain"),
  clearBtn = document.getElementById("clearBtn");

inp.addEventListener("input", (e) => {
  const q = e.target.value.trim();
  if (clearBtn) clearBtn.classList.toggle("vis", q.length > 0);
  clearTimeout(debounce);
  if (q.length < 2) {
    showRecents();
    return;
  }
  debounce = setTimeout(() => fetchSuggestions(q), 300);
});
inp.addEventListener("focus", () => {
  if (inp.value.length < 2) showRecents();
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap") && dropP) dropP.style.display = "none";
});

function clearSearch() {
  inp.value = "";
  if (clearBtn) clearBtn.classList.remove("vis");
  dropP.style.display = "none";
}

async function fetchSuggestions(q) {
  if (!API_KEY) {
    showErr("API Key is missing");
    return;
  }
  try {
    const r = await fetch(
      `${GEO}?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`,
    );
    if (!r.ok) throw new Error("API Key Invalid or Network Error");
    const d = await r.json();
    if (!d || !d.length) {
      dropP.style.display = "none";
      return;
    }
    renderDrop(
      d.map((loc) => ({
        name: loc.name,
        country: loc.country,
        country_code: loc.country,
        admin1: loc.state || "",
        lat: loc.lat,
        lon: loc.lon,
      })),
      "Suggested Locations",
    );
  } catch (e) {
    console.error("Geo error:", e);
  }
}

function showRecents() {
  if (!recents.length) {
    dropP.style.display = "none";
    return;
  }
  renderDrop(recents, "Recent Searches");
}
function renderDrop(locs, title) {
  dropH.textContent = title;
  dropL.innerHTML = locs
    .map((l) => {
      const sub = l.admin1 ? `${l.admin1}, ${l.country}` : l.country;
      const flag = l.country_code ? countryFlag(l.country_code) : "📍";
      return `<div class="loc-item" onclick='pick(${JSON.stringify(l)})'><span class="loc-icon">${flag}</span><div class="loc-details"><div class="loc-city">${l.name}</div><div class="loc-region">${sub}</div></div><span class="loc-code">${l.country_code || ""}</span></div>`;
    })
    .join("");
  dropP.style.display = "block";
}
function countryFlag(code) {
  return !code || code.length !== 2
    ? "📍"
    : code
        .toUpperCase()
        .replace(/./g, (c) =>
          String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)),
        );
}
function pick(loc) {
  inp.value = `${loc.name}, ${loc.country}`;
  if (clearBtn) clearBtn.classList.add("vis");
  dropP.style.display = "none";
  saveRecent(loc);
  loadWeather(loc);
}
function saveRecent(loc) {
  recents = recents.filter((r) => !(r.lat === loc.lat && r.lon === loc.lon));
  recents.unshift(loc);
  if (recents.length > 5) recents.pop();
  localStorage.setItem("skycast_v2", JSON.stringify(recents));
}

async function loadWeather(loc) {
  setLoading();
  try {
    const curRes = await fetch(
      `${WX}/weather?lat=${loc.lat}&lon=${loc.lon}&units=metric&appid=${API_KEY}`,
    );
    if (!curRes.ok) throw new Error("Invalid API Key");
    const curData = await curRes.json();
    const fcRes = await fetch(
      `${WX}/forecast?lat=${loc.lat}&lon=${loc.lon}&units=metric&appid=${API_KEY}`,
    );
    if (!fcRes.ok) throw new Error("Forecast unavailable");
    const fcData = await fcRes.json();
    renderWeather(curData, fcData, loc);
  } catch (e) {
    showErr(e.message);
    content.innerHTML = `<div class="empty"><div class="empty-icon">⚡</div><h3>Data Unavailable</h3><p>Could not load weather.</p></div>`;
  }
}

function renderWeather(cur, fc, loc) {
  tempC = Math.round(cur.main.temp);
  const feelsC = Math.round(cur.main.feels_like);
  const hum = cur.main.humidity;
  const wind = Math.round(cur.wind.speed * 3.6);
  const pres = cur.main.pressure;
  const code = cur.weather[0].id;
  unit = "C";
  applyScene(code);
  checkAlert(loc.name);
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const dayMap = {};
  for (const item of fc.list) {
    const date = item.dt_txt.split(" ")[0];
    if (!dayMap[date] || item.dt_txt.includes("12:00:00")) {
      dayMap[date] = item;
    }
  }
  const fcDays = Object.values(dayMap)
    .slice(0, 5)
    .map((item) => {
      const dt = new Date(item.dt * 1000);
      return {
        day: dt.toLocaleDateString("en-US", { weekday: "short" }),
        date: dt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        icon: wxIcon(item.weather[0].id),
        hi: Math.round(item.main.temp_max),
        lo: Math.round(item.main.temp_min),
        rain: Math.round(item.pop * 100),
      };
    });

  content.innerHTML = `<div class="weather-card reveal"><div class="city-name">${loc.name}</div><div class="city-meta">${loc.admin1 ? loc.admin1 + ", " : ""}${loc.country} &nbsp;·&nbsp; ${dateStr}</div><div class="main-row"><div><div class="temp-block"><div class="temp-value" id="tvDisplay">${tempC}</div><div class="unit-toggle"><button class="unit-btn act" id="btnC" onclick="setUnit('C')">°C</button><button class="unit-btn" id="btnF" onclick="setUnit('F')">°F</button></div></div></div><div class="icon-area"><div class="wx-icon">${wxIcon(code)}</div><div class="wx-cond">${wxCond(code)}</div></div></div><div class="stats-grid"><div class="stat-item"><div class="stat-label">Feels Like</div><div class="stat-val" id="feelsVal">${feelsC}<span class="stat-unit">°C</span></div></div><div class="stat-item"><div class="stat-label">Humidity</div><div class="stat-val">${hum}<span class="stat-unit">%</span></div></div><div class="stat-item"><div class="stat-label">Wind</div><div class="stat-val">${wind}<span class="stat-unit">km/h</span></div></div><div class="stat-item"><div class="stat-label">Pressure</div><div class="stat-val">${pres}<span class="stat-unit">hPa</span></div></div></div></div><div class="reveal" style="animation-delay:.1s"><div class="section-label">5-Day Forecast</div><div class="forecast-row">${fcDays.map((f) => `<div class="fc-card"><div class="fc-day">${f.day}</div><div class="fc-date">${f.date}</div><span class="fc-icon">${f.icon}</span><div class="fc-hi">${f.hi}°</div><div class="fc-lo">${f.lo}°</div>${f.rain > 0 ? `<div class="fc-rain">💧 ${f.rain}%</div>` : ""}</div>`).join("")}</div></div>`;
  window._feelsC = feelsC;
}

function setUnit(u) {
  if (tempC === null) return;
  unit = u;
  const convert = (v) => (u === "F" ? Math.round((v * 9) / 5 + 32) : v);
  document.getElementById("tvDisplay").textContent = convert(tempC);
  const fv = document.getElementById("feelsVal");
  if (fv)
    fv.innerHTML = `${convert(window._feelsC)}<span class="stat-unit">°${u}</span>`;
  document.getElementById("btnC").classList.toggle("act", u === "C");
  document.getElementById("btnF").classList.toggle("act", u === "F");
}
function wxIcon(code) {
  if (code >= 200 && code < 300) return "⛈️";
  if (code >= 300 && code < 400) return "🌦️";
  if (code >= 500 && code < 600) return "🌧️";
  if (code >= 600 && code < 700) return "❄️";
  if (code >= 700 && code < 800) return "🌫️";
  if (code === 800) return "☀️";
  if (code === 801) return "🌤️";
  if (code === 802) return "⛅";
  return "☁️";
}
function wxCond(code) {
  if (code >= 200 && code < 300) return "Thunderstorm";
  if (code >= 300 && code < 600) return "Rain";
  if (code >= 600 && code < 700) return "Snow";
  if (code >= 700 && code < 800) return "Mist/Fog";
  if (code === 800) return "Clear Sky";
  if (code <= 802) return "Partly Cloudy";
  return "Overcast";
}
function applyScene(code) {
  const isRain = code >= 200 && code < 600;
  const isSunny = code === 800 || code === 801;
  if (scene)
    scene.className = "scene" + (isRain ? " rainy" : isSunny ? " sunny" : "");
  if (rainWrap) rainWrap.classList.toggle("on", isRain);
  if (isRain && rainWrap) {
    rainWrap.innerHTML = Array.from({ length: 55 })
      .map(() => {
        return `<div class="drop" style="left:${Math.random() * 100}%; height:${12 + Math.random() * 22}px; animation-duration:${0.45 + Math.random() * 0.55}s; animation-delay:${Math.random() * 0.8}s; opacity:${0.35 + Math.random() * 0.4};"></div>`;
      })
      .join("");
  } else if (rainWrap) {
    rainWrap.innerHTML = "";
  }
}
function checkAlert(cityName) {
  const bar = document.getElementById("alertBar");
  const txt = document.getElementById("alertTxt");
  if (!bar || !txt) return;
  if (tempC >= 40) {
    txt.textContent = `Extreme heat in ${cityName} — ${tempC}°C. Avoid prolonged sun exposure.`;
    bar.classList.add("on");
  } else if (tempC <= -10) {
    txt.textContent = `Freezing conditions in ${cityName} — ${tempC}°C. Risk of frostbite.`;
    bar.classList.add("on");
  } else {
    bar.classList.remove("on");
  }
}
function setLoading() {
  content.innerHTML = `<div class="loading"><div class="spin"></div><p>Fetching conditions…</p></div>`;
}
function showErr(msg) {
  const msgEl = document.getElementById("errMsg");
  const p = document.getElementById("errPop");
  if (!msgEl || !p) return;
  msgEl.textContent = msg;
  p.classList.add("on");
  clearTimeout(errTimer);
  errTimer = setTimeout(hideErr, 4000);
}
function hideErr() {
  const p = document.getElementById("errPop");
  if (p) p.classList.remove("on");
}
