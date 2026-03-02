import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const stored = localStorage.getItem(key);
        if (!stored) return;

        try {
            const parsedValue = JSON.parse(stored);
            setValue(parsedValue);
        } catch (error) {
            console.error(`Erreur : ${key}`, error);
        }
    }, [key]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue] as const;
}
