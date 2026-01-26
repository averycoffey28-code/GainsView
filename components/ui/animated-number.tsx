"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatOptions?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 0.5,
  formatOptions = {},
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => {
    const formatted = new Intl.NumberFormat("en-US", formatOptions).format(
      current
    );
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}

// Currency variant with color change for positive/negative
interface AnimatedCurrencyProps {
  value: number;
  duration?: number;
  className?: string;
  showSign?: boolean;
}

export function AnimatedCurrency({
  value,
  duration = 0.5,
  className = "",
  showSign = true,
}: AnimatedCurrencyProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  const spring = useSpring(value, {
    stiffness: 100,
    damping: 30,
  });

  const display = useTransform(spring, (current) => {
    const absValue = Math.abs(current);
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absValue);

    if (showSign && current !== 0) {
      return current > 0 ? `+${formatted}` : `-${formatted.replace("$", "")}`;
    }
    return formatted;
  });

  useEffect(() => {
    spring.set(value);
    setDisplayValue(value);
    prevValue.current = value;
  }, [spring, value]);

  const colorClass =
    displayValue > 0
      ? "text-emerald-400"
      : displayValue < 0
      ? "text-red-400"
      : "text-brown-300";

  return (
    <motion.span
      className={`${colorClass} ${className}`}
      initial={false}
      animate={{
        scale: prevValue.current !== value ? [1, 1.05, 1] : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      {display}
    </motion.span>
  );
}

// Percentage variant
interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  className?: string;
  showSign?: boolean;
}

export function AnimatedPercentage({
  value,
  duration = 0.5,
  className = "",
  showSign = true,
}: AnimatedPercentageProps) {
  const spring = useSpring(value, {
    stiffness: 100,
    damping: 30,
  });

  const display = useTransform(spring, (current) => {
    const sign = showSign && current > 0 ? "+" : "";
    return `${sign}${current.toFixed(1)}%`;
  });

  const colorClass =
    value > 0
      ? "text-emerald-400"
      : value < 0
      ? "text-red-400"
      : "text-brown-300";

  return (
    <motion.span className={`${colorClass} ${className}`}>{display}</motion.span>
  );
}
