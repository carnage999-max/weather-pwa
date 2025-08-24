// app/components/HourlyData.tsx
"use client";

import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";

type ArrayLikeNumber = ArrayLike<number> | null | undefined;

interface RawHourly {
    time: (string | Date)[] | ArrayLike<string | Date>;
    temperature_2m: ArrayLikeNumber;
    wind_speed_10m: ArrayLikeNumber;
    is_day?: ArrayLikeNumber;
    weather_code?: ArrayLikeNumber;
}

interface IconMap {
    day?: string;
    night?: string;
    noon?: string;
    weatherCodes?: Record<number, string>;
}

interface Props {
    raw?: RawHourly | null;
    bgClass?: string; // e.g. "bg-transparent" or "bg-slate-900/5"
    iconMap?: IconMap;
    height?: number; // px, default 320
}

export default function HourlyData({
    raw,
    bgClass = "bg-transparent",
    iconMap = {},
    height = 320,
}: Props) {
    const data = useMemo(() => {
        if (!raw?.time) return [];
        const times = Array.from(raw.time as Iterable<any>);
        const temps = Array.from(raw.temperature_2m ?? []);
        const winds = Array.from(raw.wind_speed_10m ?? []);
        const isDays = raw.is_day ? Array.from(raw.is_day ?? []) : [];
        const codes = raw.weather_code ? Array.from(raw.weather_code ?? []) : [];

        return times.map((t, i) => {
            const dt = new Date(t);
            const hour = dt.getHours();
            const timeLabel = dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
            const tempRaw = typeof temps[i] !== "undefined" ? Number(temps[i]) : NaN;
            const rounded = Number.isFinite(tempRaw) ? Math.round(tempRaw) : null;
            const tempLabel = rounded !== null ? `${rounded}°` : "--";
            const windRaw = typeof winds[i] !== "undefined" ? Number(winds[i]) : 0;
            const windKmh = windRaw.toFixed(1);
            const isDay = typeof isDays[i] !== "undefined" ? Number(isDays[i]) : 1;
            const weatherCode = typeof codes[i] !== "undefined" ? Number(codes[i]) : null;
            return { timeLabel, temperature: tempRaw, tempLabel, windKmh, isDay, weatherCode, hour };
        });
    }, [raw]);

    const pickIcon = (p: any) => {
        if (p.hour === 12) return iconMap.noon ?? "/icons/noon.svg";
        if (p.weatherCode && iconMap.weatherCodes?.[p.weatherCode]) return iconMap.weatherCodes[p.weatherCode];
        return p.isDay ? iconMap.day ?? "/icons/sun.svg" : iconMap.night ?? "/icons/moon.svg";
    };

    const XTick = ({ x, y, payload }: any) => {
        const entry = data.find((d) => d.timeLabel === payload.value);
        return (
            <g transform={`translate(${x},${y + 6})`}>
                <text x={0} y={0} textAnchor="middle" fontSize={11} fill="#111">{payload.value}</text>
                <text x={0} y={14} textAnchor="middle" fontSize={10} fill="#6b7280">{entry ? `${entry.windKmh} km/h` : ""}</text>
            </g>
        );
    };

    const CustomDot = ({ cx, cy, payload }: any) => {
        if (cx == null || cy == null) return null;
        const icon = pickIcon(payload);
        const iconSize = 18;
        const iconY = cy + 8;
        return (
            <g>
                <text x={cx} y={cy - 12} textAnchor="middle" fontSize={12} fontWeight={700} fill="#111">{payload.tempLabel}</text>
                <circle cx={cx} cy={cy} r={3.5} fill="#10B981" stroke="#fff" strokeWidth={1} />
                <image href={icon} x={cx - iconSize / 2} y={iconY} width={iconSize} height={iconSize} />
                {payload.hour === 12 && <text x={cx} y={iconY + iconSize + 12} textAnchor="middle" fontSize={11} fontWeight={700} fill="#111">Noon</text>}
            </g>
        );
    };

    if (!data || data.length === 0) {
        return <div className={`${bgClass} rounded-md p-3 text-center text-sm text-gray-500`}>No hourly data</div>;
    }

    return (
        <div className={`${bgClass} rounded-md`} style={{ padding: 8 }}>
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 28, right: 12, left: 12, bottom: 96 }}>
                        <XAxis dataKey="timeLabel" tick={(props) => <XTick {...props} />} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(data.length / 8))} height={72} />
                        <Tooltip formatter={(v: any, name: string) => name === "temperature" ? [`${Math.round(v)}°`, "Temp"] : [`${v}`, name]} />
                        <Line type="monotone" dataKey="temperature" stroke="#10B981" strokeWidth={2} dot={<CustomDot />} activeDot={{ r: 6 }} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
