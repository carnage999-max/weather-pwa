"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { getLocation } from "./lib/getLocation";
import { getWeatherData } from "./lib/weatherData";
import { weatherCodes } from "./lib/weatherCodes";
import HourlyWeatherChart from "./components/HourlyData";
import WeatherInfo from "./components/WeatherInfo";

export default function Home() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>(
    undefined
  );
  const [weatherData, setWeatherData] = useState<any>(undefined);
  const [place, setPlace] = useState<any>(undefined);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      const loc = await getLocation();
      if (loc) setLocation(loc);
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    if (!location) return;
    getWeatherData(location.latitude, location.longitude)
      .then((data) => setWeatherData(data))
      .catch(console.error);

    const getPlace = async () => {
      try {
        const response = await fetch(
          `https://geocode.maps.co/reverse?lat=${location.latitude}&lon=${location.longitude}&api_key=${process.env.NEXT_PUBLIC_GEOCODE_API_KEY}`
        );
        const data = await response.json();
        localStorage.setItem("city", data.address?.county ?? "");
        setPlace(data);
      } catch (err) {
        console.error("place error", err);
      }
    };
    getPlace();
  }, [location]);

  useEffect(() => {
    // Detect if already installed
    const isStandalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      // @ts-ignore (iOS Safari)
      window.navigator.standalone === true;

    if (isStandalone) {
      setShowCTA(false);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowCTA(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowCTA(false);
    }
    setDeferredPrompt(null);
  };

  const light_or_dark = weatherData?.current?.is_day ?? 0;

  const sunset =
    weatherData?.daily?.sunset?.[0] !== undefined
      ? new Date(weatherData.daily.sunset[0]).toTimeString().slice(0, 5)
      : "--";
  const sunrise =
    weatherData?.daily?.sunrise?.[0] !== undefined
      ? new Date(weatherData.daily.sunrise[0]).toTimeString().slice(0, 5)
      : "--";

  const weather =
    weatherCodes[
      (weatherData?.current?.weather_code?.toString() ?? "") as keyof typeof weatherCodes
    ] ?? "";

  const minTemp =
    typeof weatherData?.daily?.temperature_2m_min?.[0] !== "undefined"
      ? Math.round(weatherData.daily.temperature_2m_min[0])
      : "--";
  const maxTemp =
    typeof weatherData?.daily?.temperature_2m_max?.[0] !== "undefined"
      ? Math.round(weatherData.daily.temperature_2m_max[0])
      : "--";

  const now: Date = new Date();

  const currentTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const data = [
    {
      name: "Wind speed",
      statValue: weatherData ? Math.round(weatherData.current.wind_speed_10m ?? 0) : 0,
      unit: "km/h",
      iconUrl: "/windy.png",
    },
    {
      name: "Wind Direction",
      statValue: weatherData ? Math.round(weatherData.current.wind_direction_10m ?? 0) : 0,
      unit: "°",
      iconUrl: "/wind-direction.png",
    },
    {
      name: "Feels Like",
      statValue: weatherData ? Math.round(weatherData.current.apparent_temperature ?? 0) : 0,
      unit: "°",
      iconUrl: "/celsius.png",
    },
    {
      name: "Humidity",
      statValue: weatherData ? Math.round(weatherData.current.relative_humidity_2m ?? 0) : 0,
      unit: "%",
      iconUrl: "/humidity.png",
    },
    {
      name: "Pressure",
      statValue: weatherData ? Math.round(weatherData.current.pressure_msl ?? 0) : 0,
      unit: "hPa",
      iconUrl: "/barometer.png",
    },
    {
      name: `${light_or_dark ? "Sunset" : "Sunrise"}`,
      statValue: weatherData ? (light_or_dark ? sunset : sunrise) : "--",
      unit: "",
      iconUrl: `${light_or_dark ? "/sunset.png" : "/sunrise.png"}`,
    },
  ];

  const hourlyData = weatherData?.hourly;

  const points = (() => {
    if (!hourlyData) return 24;
    return hourlyData.time?.length ?? hourlyData.length ?? 24;
  })();
  const tickSpacing = 56;
  const chartInnerWidth = Math.max(980, points * tickSpacing);

  return (
    <div
      className={
        light_or_dark
          ? `flex items-center justify-center min-h-screen bg-[url(/weather-bg-day.png)] bg-cover bg-center bg-amber-100 bg-blend-multiply p-4`
          : `flex items-center justify-center min-h-screen bg-[url(/weather-bg-dark.png)] bg-cover bg-center p-4`
      }
    >
      <div style={{ width: "100%", maxWidth: 980, margin: "0 auto", minWidth: 0 }}>
        <main className="flex flex-col gap-4 items-center sm:items-start" style={{ minWidth: 0 }}>
          {/* header row */}
          <div className="flex gap-4 items-center flex-col sm:flex-row font-sans">
            <div>
              {light_or_dark ? (
                <Image
                  className="dark-invert"
                  src="/daylight.png"
                  alt="Weather"
                  width={38}
                  height={38}
                  priority
                />
              ) : (
                <Image
                  className="dark-invert"
                  src="/crescent-moon.png"
                  alt="Weather"
                  width={38}
                  height={38}
                  priority
                />
              )}
            </div>

            {place && (
              <div className="font-light text-2xl">
                {place.address?.county} {currentTime}
              </div>
            )}

            {weatherData && (
              <div>
                <div className="text-9xl font-thin">
                  {Math.round(weatherData.current.temperature_2m ?? 0)}
                  &deg;
                </div>
                <span className="font-medium bg-white/20 backdrop-blur-sm p-1 rounded-full">
                  {weather} {maxTemp}&deg;/{minTemp}&deg;
                </span>
              </div>
            )}
          </div>

          {/* WeatherInfo + Chart */}
          <div style={{ width: "100%", minWidth: 0 }}>
            <div style={{ width: "100%", minWidth: 0 }}>
              <WeatherInfo data={data} />
            </div>

            <div
              style={{
                width: "100%",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorX: "contain",
              }}
            >
              <div
                style={{
                  width: chartInnerWidth,
                  height: 240,
                  display: "block",
                  margin: "0 auto",
                  overflowY: "hidden",
                  borderRadius: "20px",
                  marginTop: "10px",
                }}
              >
                <HourlyWeatherChart
                  raw={hourlyData}
                  bgClass="bg-white/20"
                  iconMap={{
                    day: "/icons/sun.svg",
                    night: "/icons/moon.svg",
                    noon: "/icons/noon.svg",
                    weatherCodes: { 80: "/icons/rain.svg", 3: "/icons/cloud.svg" },
                  }}
                  height={320}
                />
              </div>
            </div>
          </div>

          {/* CTA (only if not installed) */}
          {showCTA && (
            deferredPrompt ? (
              <div className="mt-8 w-full text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto">
                  <h2 className="text-lg font-semibold mb-2">Install this app</h2>
                  <p className="text-sm text-gray-100 mb-3">
                    Add this app to your home screen for quick access:
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Install App
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8 w-full text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto">
                  <h2 className="text-lg font-semibold mb-2">Install this app</h2>
                  <p className="text-sm text-gray-100 mb-3">
                    Get quick access by installing it manually:
                  </p>
                  <ol className="list-decimal list-inside text-sm text-gray-200 space-y-1 text-left">
                    <li>Open the browser menu (⋮ or ⌵)</li>
                    <li>
                      Select <span className="font-medium">“Add to Home Screen”</span>
                    </li>
                    <li>Tap <span className="font-medium">Install</span></li>
                  </ol>
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
