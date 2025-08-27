// app/components/PwaEntrance.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

interface Props {
    protocol?: string;
    openTimeoutMs?: number;
    autoTryUnknown?: boolean;
}

export default function PwaEntrance({
    protocol = "web+weather",
    openTimeoutMs = 1200,
    autoTryUnknown = false,
}: Props) {
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
    const [openInProgress, setOpenInProgress] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [suppressBecauseProtocolOpen, setSuppressBecauseProtocolOpen] = useState(false);
    const triedAutoRef = useRef(false);

    // 0) Suppress immediately if the page was opened via protocol payload.
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const source = params.get("source");
            // common keys: ?source=protocol&payload=..., or you may use source=app
            if (source === "protocol" || source === "app") {
                setSuppressBecauseProtocolOpen(true);
            }
        } catch (e) {
            // ignore
        }
    }, []);

    // 1) detect standalone mode
    useEffect(() => {
        const check = () => {
            const standalone =
                (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
                // iOS legacy
                // @ts-ignore
                (window.navigator as any).standalone === true;
            setIsStandalone(Boolean(standalone));
        };
        check();
        const mm = window.matchMedia && window.matchMedia("(display-mode: standalone)");
        if (mm?.addEventListener) mm.addEventListener("change", check);
        return () => {
            if (mm?.removeEventListener) mm.removeEventListener("change", check);
        };
    }, []);

    // 2) beforeinstallprompt
    useEffect(() => {
        const onBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };
        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    }, []);

    // 3) getInstalledRelatedApps (hint only)
    useEffect(() => {
        if (!("getInstalledRelatedApps" in navigator)) {
            setIsInstalled(null);
            return;
        }
        (navigator as any)
            .getInstalledRelatedApps()
            .then((apps: any[]) => {
                setIsInstalled(Array.isArray(apps) && apps.length > 0 ? true : null);
            })
            .catch(() => setIsInstalled(null));
    }, []);

    // helper to attempt protocol open and detect success
    const tryOpenProtocol = (protocolUrl: string) =>
        new Promise<boolean>((resolve) => {
            let resolved = false;
            const timeout = window.setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    resolve(false);
                }
            }, openTimeoutMs);

            const cleanup = () => {
                window.clearTimeout(timeout);
                document.removeEventListener("visibilitychange", onVisibility);
                window.removeEventListener("pagehide", onPageHide);
                window.removeEventListener("blur", onBlur);
            };

            const finish = (ok: boolean) => {
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    resolve(ok);
                }
            };

            const onVisibility = () => {
                if (document.visibilityState === "hidden") finish(true);
            };
            const onPageHide = () => finish(true);
            const onBlur = () => finish(true);

            document.addEventListener("visibilitychange", onVisibility);
            window.addEventListener("pagehide", onPageHide);
            window.addEventListener("blur", onBlur);

            try {
                window.location.assign(protocolUrl);
            } catch {
                // ignore; timeout will resolve false
            }
        });

    // Auto-try conservative path (only when detection says installed)
    useEffect(() => {
        if (isStandalone) return;
        if (suppressBecauseProtocolOpen) return; // crucial: do not auto-try when opened via protocol
        if (isInstalled === true && !triedAutoRef.current) {
            triedAutoRef.current = true;
            (async () => {
                setOpenInProgress(true);
                const payload = encodeURIComponent(location.href);
                const prot = `${protocol}://open?url=${payload}`;
                const ok = await tryOpenProtocol(prot);
                setOpenInProgress(false);
                if (!ok) setMessage("It looks like the app is installed — tap Open app to launch it.");
            })();
        }
    }, [isInstalled, isStandalone, suppressBecauseProtocolOpen, protocol]);

    // Optional auto-try for unknown (testing)
    useEffect(() => {
        if (!autoTryUnknown) return;
        if (isStandalone) return;
        if (suppressBecauseProtocolOpen) return;
        if (isInstalled !== null) return;
        if (triedAutoRef.current) return;
        triedAutoRef.current = true;
        (async () => {
            setOpenInProgress(true);
            const payload = encodeURIComponent(location.href);
            const prot = `${protocol}://open?url=${payload}`;
            const ok = await tryOpenProtocol(prot);
            setOpenInProgress(false);
            if (!ok) setMessage("Tap Open app to launch the installed app.");
        })();
    }, [autoTryUnknown, isInstalled, isStandalone, suppressBecauseProtocolOpen, protocol]);

    const handleOpenClick = async () => {
        const payload = encodeURIComponent(location.href);
        const prot = `${protocol}://open?url=${payload}`;
        setOpenInProgress(true);
        const ok = await tryOpenProtocol(prot);
        setOpenInProgress(false);
        if (!ok) setMessage("Couldn't open the app. Try reinstalling or open it manually.");
    };

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            setMessage("No install prompt available. Use the browser menu → 'Add to Home screen'.");
            return;
        }
        try {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === "accepted") {
                setMessage("Thanks — app installed or in progress.");
                setDeferredPrompt(null);
            } else {
                setMessage("Install dismissed.");
            }
        } catch (err) {
            console.error(err);
            setMessage("Install failed or dismissed.");
        }
    };

    // Final render decision:
    // suppress if running as standalone OR if opened via protocol payload
    if (isStandalone || suppressBecauseProtocolOpen) return null;

    // show open CTA when installed or unknown (to surface the prompt on browsers that don't report installed)
    const showOpen = isInstalled === true || isInstalled === null;

    if (showOpen) {
        return (
            <div style={styles.banner}>
                <div style={styles.content}>
                    <div style={{ fontWeight: 700 }}>Open installed app?</div>
                    <div style={{ fontSize: 13, color: "#444" }}>
                        {message ?? "Open the installed Weather app for a faster, offline-capable experience."}
                    </div>
                </div>
                <div style={styles.actions}>
                    <button style={styles.primary} onClick={handleOpenClick} disabled={openInProgress}>
                        {openInProgress ? "Opening…" : "Open app"}
                    </button>
                    <button
                        style={styles.secondary}
                        onClick={() => {
                            setMessage("If you don't have the app, tap Install (or use browser menu → Add to Home screen).");
                        }}
                    >
                        Help
                    </button>
                </div>
            </div>
        );
    }

    // else show install CTA
    return (
        <div style={styles.banner}>
            <div style={styles.content}>
                <div style={{ fontWeight: 700 }}>Install Weather</div>
                <div style={{ fontSize: 13, color: "#444" }}>
                    {message ?? (deferredPrompt ? "Install this app to your home screen." : "Install via browser menu.")}
                </div>
            </div>
            <div style={styles.actions}>
                {deferredPrompt ? (
                    <button style={styles.primary} onClick={handleInstallClick}>
                        Install
                    </button>
                ) : (
                    <button style={styles.secondary} onClick={() => setMessage("Open browser menu → Add to Home screen")}>
                        How to install
                    </button>
                )}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    banner: {
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 18,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "10px 12px",
        background: "rgba(255,255,255,0.95)",
        borderRadius: 12,
        boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
        maxWidth: 980,
        margin: "0 auto",
    },
    content: {
        display: "flex",
        flexDirection: "column",
    },
    actions: {
        display: "flex",
        gap: 8,
        alignItems: "center",
    },
    primary: {
        background: "#0ea5a1",
        color: "#fff",
        border: "none",
        padding: "8px 12px",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: 700,
    },
    secondary: {
        background: "transparent",
        color: "#0ea5a1",
        border: "1px solid rgba(14,165,161,0.15)",
        padding: "8px 12px",
        borderRadius: 8,
        cursor: "pointer",
    },
};
