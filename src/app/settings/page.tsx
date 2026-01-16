"use client";

import React from "react";
import Link from "next/link";
import { 
  Settings, Globe, ArrowRight 
} from "lucide-react";

export default function SettingsDashboard() {
  
  const settingCards = [
    {
      title: "System Settings",
      description: "General, Branding, API Keys",
      icon: Settings,
      href: "/settings/system",
    },
    {
      title: "Web Settings",
      description: "SEO, Header, Footer, Scripts",
      icon: Globe,
      href: "/settings/web",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between py-6 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-black text-primary">Settings</h1>
          <p className="text-sm text-secondary mt-1">
            Configure your application modules and system preferences.
          </p>
        </div>
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
        {settingCards.map((card, idx) => (
          <Link 
            key={idx} 
            href={card.href}
            className="group relative theme-bg theme-border border rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-blue-600 dark:hover:border-blue-500 flex flex-col"
          >
            {/* ICON: Perfect Blue Style */}
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <card.icon size={24} />
            </div>

            {/* CONTENT */}
            <h3 className="text-lg font-bold text-primary mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">
              {card.title}
            </h3>
            <p className="text-sm text-secondary mb-6 line-clamp-2">
              {card.description}
            </p>

            {/* FOOTER LINK */}
            <div className="mt-auto flex items-center text-sm font-bold text-blue-600 dark:text-blue-500 gap-1 group-hover:gap-2 transition-all">
              Go to settings <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}