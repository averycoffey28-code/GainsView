"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type DetectionMethod = "auto" | "manual";

interface TimezoneContextValue {
  timezone: string;
  detectionMethod: DetectionMethod;
  isLoaded: boolean;
  setManualTimezone: (tz: string) => void;
  resetToAutoDetect: () => void;
  /** Returns today's date as "YYYY-MM-DD" in the user's timezone */
  getToday: () => string;
  /** Returns the current hour (0-23) in the user's timezone */
  getCurrentHour: () => number;
  /** Format a date string for display using the user's timezone */
  formatDate: (dateString: string, options?: Intl.DateTimeFormatOptions) => string;
  /** Format a time string for display using the user's timezone */
  formatTime: (dateString: string) => string;
  /** Get timezone abbreviation (e.g. "EST", "PST") */
  getTimezoneAbbreviation: () => string;
  /** Get the readable timezone label */
  getTimezoneLabel: () => string;
}

const TimezoneContext = createContext<TimezoneContextValue>({
  timezone: "America/New_York",
  detectionMethod: "auto",
  isLoaded: false,
  setManualTimezone: () => {},
  resetToAutoDetect: () => {},
  getToday: () => new Date().toISOString().split("T")[0],
  getCurrentHour: () => new Date().getHours(),
  formatDate: () => "",
  formatTime: () => "",
  getTimezoneAbbreviation: () => "ET",
  getTimezoneLabel: () => "Eastern Time (ET)",
});

// Common timezones for trading
export const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European (CET)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
] as const;

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezone] = useState("America/New_York");
  const [detectionMethod, setDetectionMethod] = useState<DetectionMethod>("auto");
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize timezone on mount
  useEffect(() => {
    const savedTz = localStorage.getItem("gainsview-timezone");
    const savedMethod = localStorage.getItem("gainsview-timezone-method") as DetectionMethod | null;

    if (savedTz && savedMethod === "manual") {
      setTimezone(savedTz);
      setDetectionMethod("manual");
    } else {
      // Auto-detect from browser
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detected) {
          setTimezone(detected);
          setDetectionMethod("auto");
          localStorage.setItem("gainsview-timezone", detected);
          localStorage.setItem("gainsview-timezone-method", "auto");
        }
      } catch {
        // Fall back to ET (US market time)
      }
    }
    setIsLoaded(true);
  }, []);

  const setManualTimezone = useCallback((tz: string) => {
    setTimezone(tz);
    setDetectionMethod("manual");
    localStorage.setItem("gainsview-timezone", tz);
    localStorage.setItem("gainsview-timezone-method", "manual");
  }, []);

  const resetToAutoDetect = useCallback(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
      }
    } catch {
      // Keep current timezone
    }
    setDetectionMethod("auto");
    localStorage.setItem("gainsview-timezone-method", "auto");
    localStorage.setItem("gainsview-timezone", timezone);
  }, [timezone]);

  const getToday = useCallback((): string => {
    // Get today's date in the user's timezone as "YYYY-MM-DD"
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now); // "YYYY-MM-DD"
  }, [timezone]);

  const getCurrentHour = useCallback((): number => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(now), 10);
  }, [timezone]);

  const formatDate = useCallback(
    (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
      // Parse "YYYY-MM-DD" as a local date in the user's timezone
      const clean = (dateString || "").split("T")[0];
      const [year, month, day] = clean.split("-").map(Number);
      if (!year || !month || !day) return dateString;

      // Create a date at noon UTC to avoid DST boundary issues
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return date.toLocaleDateString("en-US", {
        timeZone: timezone,
        ...options,
      });
    },
    [timezone]
  );

  const formatTime = useCallback(
    (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
      });
    },
    [timezone]
  );

  const getTimezoneAbbreviation = useCallback((): string => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart ? tzPart.value : timezone;
  }, [timezone]);

  const getTimezoneLabel = useCallback((): string => {
    const match = TIMEZONE_OPTIONS.find((tz) => tz.value === timezone);
    return match ? match.label : timezone;
  }, [timezone]);

  return (
    <TimezoneContext.Provider
      value={{
        timezone,
        detectionMethod,
        isLoaded,
        setManualTimezone,
        resetToAutoDetect,
        getToday,
        getCurrentHour,
        formatDate,
        formatTime,
        getTimezoneAbbreviation,
        getTimezoneLabel,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  return useContext(TimezoneContext);
}
