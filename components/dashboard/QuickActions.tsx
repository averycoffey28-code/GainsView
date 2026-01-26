"use client";

import { Calculator, Plus, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedButton } from "@/components/ui/animated-button";

interface QuickActionsProps {
  onNewCalculation: () => void;
  onLogTrade: () => void;
  onAskAI: () => void;
}

export default function QuickActions({
  onNewCalculation,
  onLogTrade,
  onAskAI,
}: QuickActionsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="flex gap-3 mb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="flex-1">
        <AnimatedButton
          onClick={onNewCalculation}
          variant="gold"
          ripple
          glow
          className="w-full bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 border-gold-500/30 h-auto py-3"
        >
          <Calculator className="w-4 h-4" />
          New Calculation
        </AnimatedButton>
      </motion.div>
      <motion.div variants={item} className="flex-1">
        <AnimatedButton
          onClick={onLogTrade}
          ripple
          className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30 h-auto py-3"
        >
          <Plus className="w-4 h-4" />
          Log Trade
        </AnimatedButton>
      </motion.div>
      <motion.div variants={item} className="flex-1">
        <AnimatedButton
          onClick={onAskAI}
          ripple
          className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30 h-auto py-3"
        >
          <Brain className="w-4 h-4" />
          Ask AI
        </AnimatedButton>
      </motion.div>
    </motion.div>
  );
}
