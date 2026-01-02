"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, Globe, Trophy, Shield, 
  ArrowUpRight, Activity, Database, Server 
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

type DashboardProps = {
  stats: {
    users: number;
    leagues: number;
    matches: number;
    players: number;
    pages: number;
  };
  recentUsers: any[];
};

export default function DashboardClient({ stats, recentUsers }: DashboardProps) {
  const { user } = useAdminAuth();
  const [displayName, setDisplayName] = useState("");

  // ✅ Fetch full profile to get the Name (since session usually only has email)
  useEffect(() => {
    fetch("/api/admin/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.user?.name) {
          setDisplayName(data.user.name);
        }
      })
      .catch(() => {}); // Silent fail, fallback to email
  }, []);

  // Helper to render a Stats Card (Using Theme Classes)
  const StatCard = ({ title, value, icon: Icon, color, href }: any) => (
    <Link 
      href={href}
      className="group theme-bg theme-border border rounded-xl p-6 transition-all hover:shadow-lg hover:border-blue-500/30 flex items-start justify-between"
    >
      <div>
        <p className="text-xs font-black text-secondary uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-primary group-hover:text-blue-500 transition-colors">
          {value.toLocaleString()}
        </h3>
      </div>
      <div className={`p-3 rounded-lg ${color} text-white shadow-lg`}>
        <Icon size={24} />
      </div>
    </Link>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary">Dashboard</h1>
          <p className="text-secondary mt-1 flex items-center gap-2 flex-wrap">
            Welcome back, 
            {/* ✅ Priority: Name > Email > "Admin" */}
            <span className="font-bold text-blue-500">
              {displayName || user?.email || "Admin"}
            </span>
            
            {/* Role Badge */}
            {user?.role && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {user.role}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black flex items-center gap-2 border border-emerald-500/20">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
             System Operational
           </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats.users} 
          icon={Users} 
          color="bg-blue-600" 
          href="/settings/members" 
        />
        <StatCard 
          title="Active Leagues" 
          value={stats.leagues} 
          icon={Shield} 
          color="bg-indigo-500" 
          href="/seo/league" 
        />
        <StatCard 
          title="Players Tracked" 
          value={stats.players} 
          icon={Trophy} 
          color="bg-violet-500" 
          href="/seo/player" 
        />
        <StatCard 
          title="SEO Pages" 
          value={stats.pages} 
          icon={Globe} 
          color="bg-rose-500" 
          href="/seo/pages/terms" 
        />
      </div>

      {/* 3. Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Recent Activity (New Users) */}
        <div className="lg:col-span-2 theme-bg theme-border border rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b theme-border flex items-center justify-between">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <Activity size={18} className="text-blue-500" />
              Recently Added Members
            </h3>
            <Link href="/settings/members" className="text-xs font-black text-blue-500 hover:underline">
              View All
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/5 text-xs font-black text-secondary uppercase tracking-widest border-b theme-border">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined</th>
                </tr>
              </thead>
              {/* ✅ REMOVED 'divide-y theme-border' to remove lines */}
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-secondary text-sm">
                      No recent activity found.
                    </td>
                  </tr>
                ) : recentUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-primary text-sm">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-secondary font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Server Info & Quick Actions */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <div className="theme-bg theme-border border rounded-xl p-6">
             <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
               <ArrowUpRight size={18} className="text-blue-500" />
               Quick Actions
             </h3>
             <div className="space-y-2">
               <Link href="/seo/league" className="block w-full text-left px-4 py-3 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-bold text-primary transition-colors border border-transparent hover:border-blue-500/30">
                 + Add New League SEO
               </Link>
               <Link href="/settings/members" className="block w-full text-left px-4 py-3 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-bold text-primary transition-colors border border-transparent hover:border-blue-500/30">
                 + Invite Team Member
               </Link>
               <Link href="/seo/global" className="block w-full text-left px-4 py-3 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-bold text-primary transition-colors border border-transparent hover:border-blue-500/30">
                 Config Global Metadata
               </Link>
             </div>
          </div>

          {/* System Info */}
          <div className="theme-bg theme-border border rounded-xl p-6">
             <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
               <Server size={18} className="text-secondary" />
               System Status
             </h3>
             <div className="space-y-4">
               <div className="flex justify-between text-sm">
                 <span className="text-secondary">Database</span>
                 <span className="font-bold text-emerald-500 flex items-center gap-1">
                   <Database size={12} /> Connected
                 </span>
               </div>
               <div className="flex justify-between text-sm items-center">
                 <span className="text-secondary">Environment</span>
                 <span className="font-mono text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-200 dark:border-slate-700">
                   {process.env.NODE_ENV}
                 </span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-secondary">Next.js</span>
                 <span className="font-bold text-primary">v16.0.10</span>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}