"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X, Sparkles, ChevronDown } from "lucide-react";
import ContractInputForm from "@/components/ContractInputForm";
import ResultsSummary from "@/components/ResultsSummary";
import PriceScenarioSlider from "@/components/PriceScenarioSlider";
import StockSearch from "@/components/StockSearch";
import Logo from "@/components/shared/Logo";

// Dynamic imports for code splitting - heavy components loaded on demand
const ProfitLossChart = dynamic(
  () => import("@/components/ProfitLossChart"),
  { ssr: false, loading: () => <div className="h-64 bg-brown-800/50 rounded-xl animate-pulse" /> }
);

const OptionsChainSelector = dynamic(
  () => import("@/components/OptionsChainSelector"),
  { ssr: false }
);

const TradingAssistant = dynamic(
  () => import("@/components/TradingAssistant"),
  { ssr: false }
);
import {
  WelcomeHeader,
  QuickStats,
  MarketOverview,
  QuickActions,
  RecentActivity,
} from "@/components/dashboard";
import { useMarketData } from "@/hooks/useMarketData";
import { usePositions, useTrades, useWatchlist } from "@/hooks/useUserData";
import { OptionContract } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  ContractType,
  Position,
  calculateAll,
} from "@/lib/calculations";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const calculatorRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  // Dashboard data hooks
  const { positions, loading: positionsLoading } = usePositions();
  const { trades, totalPnL, loading: tradesLoading } = useTrades();
  const { watchlist, loading: watchlistLoading } = useWatchlist();

  // Calculate dashboard stats
  const openPositions = positions.filter((p) => p.status === "open").length;
  const watchlistCount = watchlist.length;
  const dashboardLoading = positionsLoading || tradesLoading || watchlistLoading;

  // Check onboarding status
  useEffect(() => {
    async function checkOnboarding() {
      if (!isLoaded || !user) {
        setOnboardingChecked(true);
        return;
      }

      try {
        const res = await fetch("/api/onboarding");
        if (res.ok) {
          const { onboarding_completed } = await res.json();
          if (!onboarding_completed) {
            router.push("/onboarding");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      }
      setOnboardingChecked(true);
    }

    checkOnboarding();
  }, [isLoaded, user, router]);

  // Show welcome message if just completed onboarding
  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      // Remove the query param
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);
  const [contractType, setContractType] = useState<ContractType>("call");
  const [position, setPosition] = useState<Position>("long");
  const [strikePrice, setStrikePrice] = useState(100);
  const [premium, setPremium] = useState(5);
  const [currentPrice, setCurrentPrice] = useState(100);
  const [contracts, setContracts] = useState(1);
  const [targetPrice, setTargetPrice] = useState(110);
  const [selectedContract, setSelectedContract] = useState<OptionContract | null>(null);

  const {
    quote,
    expirations,
    chain,
    selectedExpiration,
    isLoading,
    error,
    lastUpdated,
    fetchQuote,
    fetchOptionsChain,
  } = useMarketData();

  const handleSymbolChange = useCallback(
    async (symbol: string) => {
      const quoteData = await fetchQuote(symbol);
      if (quoteData) {
        setCurrentPrice(quoteData.price);
        setTargetPrice(Math.round(quoteData.price * 1.1));
        setStrikePrice(Math.round(quoteData.price));
        setSelectedContract(null);
      }
    },
    [fetchQuote]
  );

  const handleExpirationChange = useCallback(
    async (expiration: string) => {
      if (quote?.symbol) {
        await fetchOptionsChain(quote.symbol, expiration);
        setSelectedContract(null);
      }
    },
    [quote?.symbol, fetchOptionsChain]
  );

  const handleContractSelect = useCallback((contract: OptionContract) => {
    setSelectedContract(contract);
    setStrikePrice(contract.strike);
    const contractPremium =
      contract.last ||
      (contract.bid && contract.ask
        ? (contract.bid + contract.ask) / 2
        : contract.ask || contract.bid || 0);
    setPremium(contractPremium);
  }, []);

  const calculations = useMemo(() => {
    return calculateAll({
      contractType,
      position,
      strikePrice,
      premium,
      currentPrice,
      contracts,
      targetPrice,
    });
  }, [contractType, position, strikePrice, premium, currentPrice, contracts, targetPrice]);

  // Quick action handlers
  const handleNewCalculation = () => {
    setShowCalculator(true);
    setTimeout(() => {
      calculatorRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleLogTrade = () => {
    router.push("/pnl");
  };

  const handleAskAI = () => {
    router.push("/ai");
  };

  // Show loading while checking onboarding
  if (!onboardingChecked && isLoaded && user) {
    return (
      <div className="min-h-full h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex items-center justify-center">
        <div className="text-center">
          <Logo size="hero" glow animate />
          <p className="mt-4 text-brown-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 bg-gradient-to-r from-gold-500/20 to-gold-600/10 rounded-xl border border-gold-500/30 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-gold-500/20 rounded-lg"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Sparkles className="w-5 h-5 text-gold-400" />
                </motion.div>
                <div>
                  <p className="text-brown-50 font-medium">Welcome to GainsView!</p>
                  <p className="text-brown-400 text-sm">Your trading dashboard is ready. Start by searching for a stock symbol.</p>
                </div>
              </div>
              <motion.button
                onClick={() => setShowWelcome(false)}
                className="p-2 hover:bg-brown-800/50 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-brown-400" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Section */}
        <div className="mb-8">
          {/* Welcome Header */}
          <WelcomeHeader />

          {/* Quick Stats */}
          <QuickStats
            todayPnL={totalPnL}
            openPositions={openPositions}
            watchlistAlerts={watchlistCount}
            isLoading={dashboardLoading}
          />

          {/* Market Overview */}
          <MarketOverview />

          {/* Quick Actions */}
          <QuickActions
            onNewCalculation={handleNewCalculation}
            onLogTrade={handleLogTrade}
            onAskAI={handleAskAI}
          />

          {/* Recent Activity */}
          <RecentActivity
            trades={trades}
            positions={positions}
            isLoading={dashboardLoading}
          />
        </div>

        {/* Calculator Section Toggle */}
        <motion.div
          className="mb-6"
          ref={calculatorRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <motion.button
            type="button"
            onClick={() => setShowCalculator(!showCalculator)}
            className="w-full flex items-center justify-between p-4 bg-brown-800/50 rounded-xl border border-brown-700/50 hover:bg-brown-800/70 transition-colors"
            whileHover={{ scale: 1.01, boxShadow: "0 8px 30px rgba(212, 184, 150, 0.08)" }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Logo size="small" glow />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-brown-50">
                  Options P&L Calculator
                </h2>
                <p className="text-brown-400 text-sm">
                  Visualize potential returns with live market data
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showCalculator ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-brown-400" />
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Calculator Content */}
        <AnimatePresence>
          {showCalculator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="space-y-6">
            {/* Stock Search */}
            <StockSearch
              onQuoteLoaded={() => {}}
              onSymbolChange={handleSymbolChange}
              quote={quote}
              isLoading={isLoading}
              error={error}
              lastUpdated={lastUpdated}
            />

            {/* Options Chain Selector */}
            {quote && expirations.length > 0 && (
              <OptionsChainSelector
                expirations={expirations}
                selectedExpiration={selectedExpiration}
                onExpirationChange={handleExpirationChange}
                chain={chain}
                contractType={contractType}
                onContractSelect={handleContractSelect}
                isLoading={isLoading}
                currentPrice={currentPrice}
              />
            )}

            <ContractInputForm
              contractType={contractType}
              setContractType={setContractType}
              position={position}
              setPosition={setPosition}
              strikePrice={strikePrice}
              setStrikePrice={setStrikePrice}
              premium={premium}
              setPremium={setPremium}
              currentPrice={currentPrice}
              setCurrentPrice={setCurrentPrice}
              contracts={contracts}
              setContracts={setContracts}
              totalPremium={calculations.totalPremium}
            />

            <PriceScenarioSlider
              targetPrice={targetPrice}
              setTargetPrice={setTargetPrice}
              strikePrice={strikePrice}
              targetPnL={calculations.targetPnL}
            />
          </div>

          {/* Chart & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Contract Info */}
            {selectedContract && (
              <div className="p-4 bg-gold-400/10 border border-gold-400/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gold-400 uppercase tracking-wide">
                      Selected Contract
                    </span>
                    <p className="text-brown-50 font-mono text-sm mt-1">
                      {selectedContract.symbol}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-brown-400">
                      Strike: ${selectedContract.strike} | Premium: $
                      {premium.toFixed(2)}
                    </span>
                    <p className="text-xs text-brown-500 mt-1">
                      Bid: ${selectedContract.bid?.toFixed(2)} | Ask: $
                      {selectedContract.ask?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <ResultsSummary
              calculations={calculations}
              contractType={contractType}
              position={position}
              targetPrice={targetPrice}
            />

            {/* P&L Chart */}
            <ProfitLossChart
              data={calculations.priceRange}
              breakEven={calculations.breakEven}
              strikePrice={strikePrice}
              currentPrice={currentPrice}
              targetPrice={targetPrice}
              contractType={contractType}
              position={position}
            />
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-brown-800/30 rounded-xl border border-brown-700/50 flex items-start gap-3">
          <Info className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-brown-400">
            <p>
              This calculator shows profit/loss at expiration. Options can also
              be sold before expiration, where time value and implied
              volatility affect pricing.
            </p>
            <p className="mt-2">
              <strong className="text-brown-300">Live Data:</strong> Enter a
              stock symbol to fetch real-time quotes and options chains from
              Tradier. Requires API key in <code className="text-gold-400">.env.local</code>.
            </p>
          </div>
        </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Trading Assistant */}
      <TradingAssistant
        context={{
          symbol: quote?.symbol,
          contractType,
          position,
          strikePrice,
          premium,
          currentPrice,
          contracts,
          targetPrice,
        }}
        calculations={calculations}
      />
    </div>
  );
}
