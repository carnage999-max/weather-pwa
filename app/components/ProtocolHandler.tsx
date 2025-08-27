// app/components/ProtocolHandler.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * ProtocolHandler
 * - Looks for ?source=protocol&payload=... in the URL
 * - Decodes payload (expected to be URL encoded)
 * - If decoded is same-origin URL -> client-side router.replace to that path
 * - If decoded is an external URL -> perform normal navigation (window.location.replace)
 *
 * Place this high in layout so it runs on app start.
 */
export default function ProtocolHandler() {
    const router = useRouter();

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const source = params.get("source");
            const payload = params.get("payload");

            if (source !== "protocol" || !payload) return;

            let decoded = "";
            try {
                decoded = decodeURIComponent(payload);
            } catch (e) {
                // If decode fails, fallback to raw payload
                decoded = payload;
            }

            // Try to parse as URL
            let parsed: URL | null = null;
            try {
                parsed = new URL(decoded, window.location.href);
            } catch (e) {
                parsed = null;
            }

            if (parsed) {
                // If it's same-origin, do client-side route change to preserve SPA state
                if (parsed.origin === window.location.origin) {
                    const to = parsed.pathname + parsed.search + parsed.hash;
                    // replace to avoid adding protocol query to history
                    router.replace(to);
                    return;
                } else {
                    // external URL: navigate normally (will leave app)
                    window.location.replace(parsed.href);
                    return;
                }
            }

            // If it's not a full URL, maybe it's a route (e.g. "/forecast/xxx")
            if (decoded.startsWith("/")) {
                router.replace(decoded);
            } else {
                // can't handle — just log
                console.warn("ProtocolHandler: unrecognized payload:", decoded);
            }
        } catch (err) {
            console.error("ProtocolHandler error:", err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
