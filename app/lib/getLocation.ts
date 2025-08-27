import { getServerLocation } from "./getServerLocation";

export async function getLocation() {
    // First, try browser GPS
    if (navigator.geolocation) {
        return new Promise<{ latitude: number; longitude: number }>(async (resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    localStorage.setItem("latitude", latitude.toString());
                    localStorage.setItem("longitude", longitude.toString());
                    resolve({ latitude, longitude });
                },
                async (error) => {
                    console.warn("User denied geolocation or error:", error);
                    // fallback to server
                    const serverLoc = await getServerLocation();
                    if (serverLoc) {
                        localStorage.setItem("latitude", serverLoc.latitude.toString());
                        localStorage.setItem("longitude", serverLoc.longitude.toString());
                        resolve({ latitude: serverLoc.latitude, longitude: serverLoc.longitude });
                    } else {
                        resolve(undefined as any);
                    }
                }
            );
        });
    }

    // If browser doesn’t support GPS at all, fallback immediately
    return await getServerLocation();
}
