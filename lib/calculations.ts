export type ContractType = "call" | "put";
export type Position = "long" | "short";

export interface OptionsInput {
  contractType: ContractType;
  position: Position;
  strikePrice: number;
  premium: number;
  currentPrice: number;
  contracts: number;
  targetPrice: number;
}

export interface Calculations {
  breakEven: number;
  maxProfit: number | "Unlimited";
  maxLoss: number | "Unlimited";
  totalPremium: number;
  targetPnL: number;
  targetROI: number;
  priceRange: { price: number; pnl: number }[];
}

const CONTRACT_MULTIPLIER = 100;

export function calculateBreakEven(
  contractType: ContractType,
  strikePrice: number,
  premium: number
): number {
  return contractType === "call"
    ? strikePrice + premium
    : strikePrice - premium;
}

export function calculatePnL(
  contractType: ContractType,
  position: Position,
  strikePrice: number,
  premium: number,
  contracts: number,
  targetPrice: number
): number {
  let intrinsicValue: number;

  if (contractType === "call") {
    intrinsicValue = Math.max(0, targetPrice - strikePrice);
  } else {
    intrinsicValue = Math.max(0, strikePrice - targetPrice);
  }

  const pnlPerShare =
    position === "long"
      ? intrinsicValue - premium
      : premium - intrinsicValue;

  return pnlPerShare * contracts * CONTRACT_MULTIPLIER;
}

export function calculateMaxProfitLoss(
  contractType: ContractType,
  position: Position,
  strikePrice: number,
  premium: number,
  contracts: number
): { maxProfit: number | "Unlimited"; maxLoss: number | "Unlimited" } {
  const totalPremium = premium * contracts * CONTRACT_MULTIPLIER;

  if (contractType === "call") {
    if (position === "long") {
      return { maxLoss: totalPremium, maxProfit: "Unlimited" };
    } else {
      return { maxProfit: totalPremium, maxLoss: "Unlimited" };
    }
  } else {
    // Put options
    const maxPutValue = (strikePrice - premium) * contracts * CONTRACT_MULTIPLIER;
    if (position === "long") {
      return { maxLoss: totalPremium, maxProfit: maxPutValue };
    } else {
      return { maxProfit: totalPremium, maxLoss: maxPutValue };
    }
  }
}

export function generatePriceRangeData(
  contractType: ContractType,
  position: Position,
  strikePrice: number,
  premium: number,
  contracts: number
): { price: number; pnl: number }[] {
  const priceRange: { price: number; pnl: number }[] = [];
  const minPrice = Math.max(0, strikePrice * 0.7);
  const maxPrice = strikePrice * 1.3;
  const step = (maxPrice - minPrice) / 50;

  for (let price = minPrice; price <= maxPrice; price += step) {
    const pnl = calculatePnL(
      contractType,
      position,
      strikePrice,
      premium,
      contracts,
      price
    );
    priceRange.push({
      price: Number(price.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
    });
  }

  return priceRange;
}

export function calculateAll(input: OptionsInput): Calculations {
  const {
    contractType,
    position,
    strikePrice,
    premium,
    contracts,
    targetPrice,
  } = input;

  const totalPremium = premium * contracts * CONTRACT_MULTIPLIER;
  const breakEven = calculateBreakEven(contractType, strikePrice, premium);
  const { maxProfit, maxLoss } = calculateMaxProfitLoss(
    contractType,
    position,
    strikePrice,
    premium,
    contracts
  );
  const targetPnL = calculatePnL(
    contractType,
    position,
    strikePrice,
    premium,
    contracts,
    targetPrice
  );
  const targetROI = (targetPnL / totalPremium) * 100;
  const priceRange = generatePriceRangeData(
    contractType,
    position,
    strikePrice,
    premium,
    contracts
  );

  return {
    breakEven,
    maxProfit,
    maxLoss,
    totalPremium,
    targetPnL,
    targetROI,
    priceRange,
  };
}
