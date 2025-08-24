"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { getLocation } from "./lib/getLocation";
import { getWeatherData } from "./lib/weatherData";
import { Card } from "@tremor/react";
import { weatherCodes } from "./lib/weatherCodes";
import HourlyWeatherChart from "./components/HourlyData";

interface weatherInfo {
  name: string;
  statValue: number | string;
  unit: string;
  iconUrl: string;
}

interface weatherInfoProps {
  data: weatherInfo[];
}

export function WeatherInfo({ data }: weatherInfoProps) {
  return (
    <div className="mt-4 flex flex-wrap justify-center">
      {data.map((item) => (
        <Card
          key={item.name}
          className="w-[47%] rounded-lg m-1 bg-white/30 backdrop-blur-sm border-white/30 font-sans sm:w-[47%]"
        >
          <div className="px-3 py-3">
            <div className="font-medium text-center text-sm">
              <span>{item.name}</span>
            </div>
            <Image
              src={item.iconUrl}
              alt={item.name}
              width={32}
              height={32}
              className="mx-auto my-1"
            />
            <div className="text-tremor-default text-tremor-content dark:text-dark-tremor-content text-center">
              <span className="p-1 rounded-lg font-medium text-md backdrop-blur-sm border-white/30">
                {item.statValue} {item.unit}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Home() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>(
    undefined
  );
  const [weatherData, setWeatherData] = useState<any>(undefined);
  const [place, setPlace] = useState<any>(undefined);

  useEffect(() => {
    const loc = getLocation();
    if (loc) setLocation(loc);
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

  // defensive helpers
  const light_or_dark = weatherData?.current?.is_day ?? 1;

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

  // compute inner chart width so the inner chart canvas can be wider than viewport and scroll
  const points = (() => {
    if (!hourlyData) return 24;
    return hourlyData.time?.length ?? hourlyData.length ?? 24;
  })();
  const tickSpacing = 56; // px per tick (tune this)
  const chartInnerWidth = Math.max(980, points * tickSpacing); // inner canvas width in px

  return (
    <div
      className={
        light_or_dark
          ? `flex items-center justify-center min-h-screen bg-[url(/weather-bg-day.png)] bg-cover bg-center bg-amber-100 bg-blend-multiply p-4`
          : `flex items-center justify-center min-h-screen bg-[url(/weather-bg-dark.png)] bg-cover bg-center p-4`
      }
    >
      {/* center visible column — this controls the visual width shared by WeatherInfo & chart wrapper */}
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

            {place && <div className="font-light text-2xl">{place.address?.county}</div>}

            {weatherData && (
              <div>
                <div className="text-7xl font-thin">
                  {Math.round(weatherData.current.temperature_2m ?? 0)}
                  &deg;
                </div>
                <span className="font-medium bg-white/20 backdrop-blur-sm p-1 rounded-full">
                  {weather} {maxTemp}&deg;/{minTemp}&deg;
                </span>
              </div>
            )}
          </div>

          {/* unified content wrapper: WeatherInfo (fills visible width) + chart (scrolls inside) */}
          <div style={{ width: "100%", minWidth: 0 }}>
            {/* Weather summary/cards — visible width */}
            <div style={{ width: "100%", minWidth: 0 }}>
              <WeatherInfo data={data} />
            </div>

            {/* Chart scroller: viewport that user scrolls left-right */}
            <div
              style={{
                width: "100%",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorX: "contain",
              }}
            >
              {/* Inner canvas: MUST be wider than viewport for the chart content to scroll */}
              <div
                style={{
                  width: chartInnerWidth,
                  height: 360,
                  display: "block", // prevents flexbox shrinking
                  margin: "0 auto",
                }}
              >
                <HourlyWeatherChart
                  raw={hourlyData}
                  bgClass="bg-white/5"
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
        </main>
      </div>
    </div>
  );
}
