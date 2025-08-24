export function getLocation() {
    if (localStorage.getItem("latitude") && localStorage.getItem("longitude")) {
        const latitude = parseFloat(localStorage.getItem("latitude")!);
        const longitude = parseFloat(localStorage.getItem("longitude")!);
        return { latitude, longitude };
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                localStorage.setItem("latitude", latitude.toString());
                localStorage.setItem("longitude", longitude.toString());
                console.log(latitude);
                console.log(longitude);
                return { latitude, longitude };
            });
    }
    else {
        console.error('Geolocation is not supported by this browser.');
        return undefined;
    }

}
