// app/components/ServiceWorkerRegister.tsx
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) {
            console.log("[sw] no serviceWorker support");
            return;
        }

        // Only run in production (optional)
        const isProd = process.env.NODE_ENV === "production";
        if (!isProd) {
            console.log("[sw] skipping registration in dev");
            return;
        }

        async function registerAndSeed() {
            try {
                console.log("[sw] attempting to register /sw.js");
                const reg = await navigator.serviceWorker.register("/sw.js");
                console.log("[sw] registration success:", reg.scope);

                // Wait until the SW is active and controlling the page
                const worker = await navigator.serviceWorker.ready;
                console.log("[sw] navigator.serviceWorker.ready -> active worker:", worker);

                // If the page is not controlled yet, claim clients on activation; wait a tick
                // (workbox usually uses clients.claim(); this is defensive)
                if (!navigator.serviceWorker.controller) {
                    console.log("[sw] page not yet controlled; reload to let SW take control");
                    // Don't force reload automatically — just log. You can reload manually.
                }

                // MANUAL SEED: make a client-side fetch to the same API pattern you use
                // so the runtime caching rules can store the response. Replace lat/lon if needed.
                const weatherUrl =
                    "https://api.open-meteo.com/v1/forecast?latitude=6.4474&longitude=3.3903&daily=sunrise%2Csunset%2Cweather_code%2Ctemperature_2m_max%2Ctemperature_2m_min%2Cdaylight_duration%2Csunshine_duration&hourly=temperature_2m%2Capparent_temperature%2Crain%2Cwind_speed_10m%2Cshowers%2Csnowfall%2Cprecipitation_probability%2Cis_day%2Crelative_humidity_2m%2Cpressure_msl%2Cprecipitation%2Cuv_index%2Cweather_code&current=temperature_2m%2Cis_day%2Capparent_temperature%2Crain%2Cshowers%2Cwind_speed_10m%2Cprecipitation%2Cpressure_msl%2Cwind_direction_10m%2Crelative_humidity_2m%2Cweather_code&forecast_days=1&format=flatbuffers";

                try {
                    console.log("[sw] fetching weather URL to seed cache...");
                    const r = await fetch(weatherUrl, { method: "GET", cache: "no-store" });
                    console.log("[sw] fetch done, status:", r.status, "type:", r.type);
                    // we don't care about body content here, just seed cache via SW
                } catch (fetchErr) {
                    console.warn("[sw] fetch to seed cache failed:", fetchErr);
                }

                // List caches for debugging
                const keys = await caches.keys();
                console.log("[sw] caches.keys:", keys);
                for (const k of keys) {
                    try {
                        const cache = await caches.open(k);
                        const reqs = await cache.keys();
                        console.log(`[sw] cache ${k} has ${reqs.length} entries (first 10):`);
                        reqs.slice(0, 10).forEach((rq) => console.log("   ", rq.url));
                    } catch (e) {
                        console.warn("[sw] error listing cache", k, e);
                    }
                }
            } catch (err) {
                console.error("[sw] registration failed:", err);
            }
        }

        registerAndSeed();
    }, []);

    return null;
}
