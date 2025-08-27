"use client";

import Image from "next/image";
import React from "react";
import { Card } from "@tremor/react";

interface WeatherInfoItem {
    name: string;
    statValue: number | string;
    unit: string;
    iconUrl: string;
}

interface Props {
    data: WeatherInfoItem[];
}

export default function WeatherInfo({ data }: Props) {
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
