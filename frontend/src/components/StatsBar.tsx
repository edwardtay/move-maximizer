"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Percent } from "lucide-react";

const STATS = [
  {
    label: "Total Value Locked",
    value: "$7.5M",
    icon: DollarSign,
    change: "+12.5%",
  },
  {
    label: "Average APY",
    value: "12.2%",
    icon: Percent,
    change: "+2.1%",
  },
  {
    label: "Total Users",
    value: "2,847",
    icon: Users,
    change: "+156",
  },
  {
    label: "Total Yield Distributed",
    value: "$892K",
    icon: TrendingUp,
    change: "+$24K",
  },
];

export function StatsBar() {
  return (
    <section className="py-8 px-4 border-y border-gray-800 bg-accent/20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <stat.icon className="w-5 h-5 text-primary" />
                <span className="text-2xl md:text-3xl font-bold">{stat.value}</span>
              </div>
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <span className="text-green-500 text-xs">{stat.change}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
