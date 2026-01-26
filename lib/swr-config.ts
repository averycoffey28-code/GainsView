import { SWRConfiguration } from "swr";

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,
};

// Market data specific config - stale while revalidate
export const marketDataConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 30000, // Refresh every 30 seconds
  revalidateIfStale: true,
  revalidateOnMount: true,
};

// User data config - less frequent updates
export const userDataConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 60000, // Refresh every 60 seconds
  revalidateIfStale: true,
};

// Fetcher function
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    const data = await res.json().catch(() => ({}));
    (error as Error & { info?: unknown; status?: number }).info = data;
    (error as Error & { info?: unknown; status?: number }).status = res.status;
    throw error;
  }
  return res.json();
};
