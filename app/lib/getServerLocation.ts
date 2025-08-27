export async function getServerLocation() {
    try {
        // Use a free IP geolocation API
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("Failed to fetch server location");

        const data = await response.json();
        return {
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city,
            country: data.country_name,
        };
    } catch (err) {
        console.error("Server location fallback failed", err);
        return undefined;
    }
}
