"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useTimezone } from "@/contexts/TimezoneContext";

export default function WelcomeHeader() {
  const { user } = useUser();
  const { getCurrentHour } = useTimezone();

  const greeting = useMemo(() => {
    const hour = getCurrentHour();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, [getCurrentHour]);
  const firstName = user?.firstName || "Trader";

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.h1
        className="text-2xl sm:text-3xl font-bold text-brown-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {greeting},{" "}
        <motion.span
          className="text-gold-400"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {firstName}
        </motion.span>
      </motion.h1>
      <motion.p
        className="text-brown-400 mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        Here&apos;s your trading overview for today
      </motion.p>
    </motion.div>
  );
}
