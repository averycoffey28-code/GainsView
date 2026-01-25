export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  description: string;
  timestamp: string;
}

export interface OptionContract {
  symbol: string;
  strike: number;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  delta?: number;
  iv?: number;
}

export interface OptionsChain {
  symbol: string;
  expiration: string;
  calls: OptionContract[];
  puts: OptionContract[];
  timestamp: string;
}

export interface OptionsExpirations {
  symbol: string;
  expirations: string[];
  timestamp: string;
}

export interface MarketDataState {
  quote: StockQuote | null;
  expirations: string[];
  chain: OptionsChain | null;
  selectedExpiration: string | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}
