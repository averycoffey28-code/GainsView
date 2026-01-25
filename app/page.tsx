"use client";

import { useState, useMemo, useCallback } from "react";
import { BarChart3, Info } from "lucide-react";
import ContractInputForm from "@/components/ContractInputForm";
import ResultsSummary from "@/components/ResultsSummary";
import PriceScenarioSlider from "@/components/PriceScenarioSlider";
import ProfitLossChart from "@/components/ProfitLossChart";
import StockSearch from "@/components/StockSearch";
import OptionsChainSelector from "@/components/OptionsChainSelector";
import { useMarketData } from "@/hooks/useMarketData";
import { OptionContract } from "@/lib/types";
import {
  ContractType,
  Position,
  calculateAll,
} from "@/lib/calculations";

export default function Home() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gold-400/20 rounded-xl">
              <BarChart3 className="w-6 h-6 text-gold-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-brown-50">
              Options P&L Calculator
            </h1>
          </div>
          <p className="text-brown-400 text-lg">
            Visualize potential returns with live market data
          </p>
        </div>

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
      </div>
    </div>
  );
}
