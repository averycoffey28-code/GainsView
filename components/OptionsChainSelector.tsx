"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { List, Calendar, Loader2 } from "lucide-react";
import { OptionsChain, OptionContract } from "@/lib/types";
import { ContractType } from "@/lib/calculations";

interface OptionsChainSelectorProps {
  expirations: string[];
  selectedExpiration: string | null;
  onExpirationChange: (expiration: string) => void;
  chain: OptionsChain | null;
  contractType: ContractType;
  onContractSelect: (contract: OptionContract) => void;
  isLoading: boolean;
  currentPrice: number;
}

export default function OptionsChainSelector({
  expirations,
  selectedExpiration,
  onExpirationChange,
  chain,
  contractType,
  onContractSelect,
  isLoading,
  currentPrice,
}: OptionsChainSelectorProps) {
  if (expirations.length === 0) {
    return null;
  }

  const contracts = chain
    ? contractType === "call"
      ? chain.calls
      : chain.puts
    : [];

  // Find ATM strike (closest to current price)
  const atmStrike = contracts.length > 0
    ? contracts.reduce((prev, curr) =>
        Math.abs(curr.strike - currentPrice) < Math.abs(prev.strike - currentPrice)
          ? curr
          : prev
      ).strike
    : null;

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <List className="w-5 h-5 text-purple-400" />
          Options Chain
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expiration Selector */}
        <div className="space-y-2">
          <Label className="text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Expiration Date
          </Label>
          <Select
            value={selectedExpiration || ""}
            onValueChange={onExpirationChange}
            disabled={isLoading}
          >
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="Select expiration" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {expirations.slice(0, 12).map((exp) => (
                <SelectItem
                  key={exp}
                  value={exp}
                  className="text-white hover:bg-slate-700"
                >
                  {new Date(exp + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && selectedExpiration && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-400">Loading options...</span>
          </div>
        )}

        {/* Options Chain Table */}
        {chain && contracts.length > 0 && !isLoading && (
          <div className="space-y-2">
            <Label className="text-slate-300">
              Select {contractType === "call" ? "Call" : "Put"} Contract
            </Label>
            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/80 sticky top-0">
                  <tr className="text-slate-400 text-xs uppercase">
                    <th className="p-2 text-left">Strike</th>
                    <th className="p-2 text-right">Bid</th>
                    <th className="p-2 text-right">Ask</th>
                    <th className="p-2 text-right">Last</th>
                    <th className="p-2 text-right">Vol</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => {
                    const isATM = contract.strike === atmStrike;
                    const isITM =
                      contractType === "call"
                        ? contract.strike < currentPrice
                        : contract.strike > currentPrice;

                    return (
                      <tr
                        key={contract.symbol}
                        className={`border-t border-slate-700/50 hover:bg-slate-800/50 transition-colors ${
                          isATM ? "bg-blue-500/10" : ""
                        }`}
                      >
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono ${
                                isITM ? "text-emerald-400" : "text-white"
                              }`}
                            >
                              ${contract.strike.toFixed(2)}
                            </span>
                            {isATM && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 border-blue-500 text-blue-400"
                              >
                                ATM
                              </Badge>
                            )}
                            {isITM && !isATM && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 border-emerald-500 text-emerald-400"
                              >
                                ITM
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-right font-mono text-slate-300">
                          ${contract.bid?.toFixed(2) || "-"}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-300">
                          ${contract.ask?.toFixed(2) || "-"}
                        </td>
                        <td className="p-2 text-right font-mono text-white">
                          ${contract.last?.toFixed(2) || "-"}
                        </td>
                        <td className="p-2 text-right text-slate-400">
                          {contract.volume?.toLocaleString() || "-"}
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onContractSelect(contract)}
                            className="h-7 px-2 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">
              Showing {contracts.length} contracts.{" "}
              <span className="text-emerald-400">Green = In the Money</span>
            </p>
          </div>
        )}

        {/* No contracts message */}
        {selectedExpiration && !isLoading && contracts.length === 0 && (
          <div className="p-4 bg-slate-800/30 rounded-lg text-center">
            <p className="text-sm text-slate-500">
              No {contractType} options available for this expiration
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
