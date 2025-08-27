import { fetchWeatherApi } from "openmeteo";

export const getWeatherData = async (latitude: number, longitude: number) => {
    const params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": ["sunrise", "sunset", "weather_code", "temperature_2m_max", "temperature_2m_min", "daylight_duration", "sunshine_duration"],
        "hourly": ["temperature_2m", "apparent_temperature", "rain", "wind_speed_10m", "showers", "snowfall", "precipitation_probability", "is_day", "relative_humidity_2m", "pressure_msl", "precipitation", "uv_index", "weather_code"],
        "current": ["temperature_2m", "is_day", "apparent_temperature", "rain", "showers", "wind_speed_10m", "precipitation", "pressure_msl", "wind_direction_10m", "relative_humidity_2m", "weather_code"],
        // "timezone": "auto",
        "forecast_days": 1,
    };
    const url = "https://api.open-meteo.com/v1/forecast";
    const responses = await fetchWeatherApi(url, params);

    // Process first location. Add a for-loop for multiple locations or weather models
    const response = responses[0];

    // Attributes for timezone and location
    const _latitude = response.latitude();
    const _longitude = response.longitude();
    const _elevation = response.elevation();
    const timezone = response.timezone();
    const timezoneAbbreviation = response.timezoneAbbreviation();
    const _utcOffsetSeconds = response.utcOffsetSeconds();

    console.log(
        `\nCoordinates: ${_latitude}°N ${_longitude}°E`,
        `\nElevation: ${_elevation}m asl`,
        `\nTimezone: ${timezone} ${timezoneAbbreviation}`,
        `\nTimezone difference to GMT+0: ${_utcOffsetSeconds}s`,
    );

    const current = response.current()!;
    const hourly = response.hourly()!;
    const daily = response.daily()!;

    // Define Int64 variables so they can be processed accordingly
    const sunrise = daily.variables(0)!;
    const sunset = daily.variables(1)!;

    // Note: The order of weather variables in the URL query and the indices below need to match!
    const weatherData = {
        current: {
            time: new Date((Number(current.time()) + _utcOffsetSeconds) * 1000),
            temperature_2m: current.variables(0)!.value(),
            is_day: current.variables(1)!.value(),
            apparent_temperature: current.variables(2)!.value(),
            rain: current.variables(3)!.value(),
            showers: current.variables(4)!.value(),
            wind_speed_10m: current.variables(5)!.value(),
            precipitation: current.variables(6)!.value(),
            pressure_msl: current.variables(7)!.value(),
            wind_direction_10m: current.variables(8)!.value(),
            relative_humidity_2m: current.variables(9)!.value(),
            weather_code: current.variables(10)!.value(),
        },
        hourly: {
            time: [...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())].map(
                (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + _utcOffsetSeconds) * 1000)
            ),
            temperature_2m: hourly.variables(0)!.valuesArray(),
            apparent_temperature: hourly.variables(1)!.valuesArray(),
            rain: hourly.variables(2)!.valuesArray(),
            wind_speed_10m: hourly.variables(3)!.valuesArray(),
            showers: hourly.variables(4)!.valuesArray(),
            snowfall: hourly.variables(5)!.valuesArray(),
            precipitation_probability: hourly.variables(6)!.valuesArray(),
            is_day: hourly.variables(7)!.valuesArray(),
            relative_humidity_2m: hourly.variables(8)!.valuesArray(),
            pressure_msl: hourly.variables(9)!.valuesArray(),
            precipitation: hourly.variables(10)!.valuesArray(),
            uv_index: hourly.variables(11)!.valuesArray(),
            weather_code: hourly.variables(12)!.valuesArray(),
            visibility: hourly.variables(13)!.valuesArray(),
            cloud_cover: hourly.variables(14)!.valuesArray(),
            uv_index_clear_sky: hourly.variables(15)!.valuesArray(),
            sunshine_duration: hourly.variables(16)!.valuesArray(),
        },
        daily: {
            time: [...Array((Number(daily.timeEnd()) - Number(daily.time())) / daily.interval())].map(
                (_, i) => new Date((Number(daily.time()) + i * daily.interval() + _utcOffsetSeconds) * 1000)
            ),
            // Map Int64 values to according structure
            sunrise: [...Array(sunrise.valuesInt64Length())].map(
                (_, i) => new Date((Number(sunrise.valuesInt64(i)) + _utcOffsetSeconds) * 1000)
            ),
            // Map Int64 values to according structure
            sunset: [...Array(sunset.valuesInt64Length())].map(
                (_, i) => new Date((Number(sunset.valuesInt64(i)) + _utcOffsetSeconds) * 1000)
            ),
            weather_code: daily.variables(2)!.valuesArray(),
            temperature_2m_max: daily.variables(3)!.valuesArray(),
            temperature_2m_min: daily.variables(4)!.valuesArray(),
            daylight_duration: daily.variables(5)!.valuesArray(),
            sunshine_duration: daily.variables(6)!.valuesArray(),
        },
    };
    return weatherData;
}

