import React, { useState } from 'react';
import { 
  Building2, 
  Home, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Key, 
  Wrench, 
  Calculator,
  Layers
} from 'lucide-react';
import { PROPERTY_ITEMS } from '../../data/mockData';
import { PropertyItem } from '../../types';

export const PropTechStudio: React.FC = () => {
  const [properties, setProperties] = useState<PropertyItem[]>(PROPERTY_ITEMS);
  const [investmentAmount, setInvestmentAmount] = useState<number>(500000);
  const [expectedCapRate, setExpectedCapRate] = useState<number>(6.5);

  const totalUnits = properties.reduce((acc, p) => acc + p.units, 0);
  const avgOccupancy = (properties.reduce((acc, p) => acc + p.occupancyRate, 0) / properties.length).toFixed(1);
  const totalRevenue = properties.reduce((acc, p) => acc + p.monthlyRevenue, 0);

  const projectedYearlyYield = (investmentAmount * (expectedCapRate / 100)).toLocaleString();

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>OPROX PropTech & Real Estate Domain Studio</span>
            </h1>
            <p className="text-xs text-slate-400">
              Smart property portfolio management, unit tracking, tenant lease analytics, and AI yield forecasting.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
          Portfolio Status: Optimal
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">Total Managed Units</p>
          <p className="text-2xl font-black text-white">{totalUnits}</p>
          <p className="text-[10px] text-cyan-400">across 4 properties</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">Average Occupancy</p>
          <p className="text-2xl font-black text-emerald-400">{avgOccupancy}%</p>
          <p className="text-[10px] text-emerald-400">+1.8% vs last quarter</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">Monthly Rental Revenue</p>
          <p className="text-2xl font-black text-white">${totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-400">100% On-time collection</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">AI Maintenance Health</p>
          <p className="text-2xl font-black text-cyan-400">96/100</p>
          <p className="text-[10px] text-cyan-400">Zero urgent work orders</p>
        </div>
      </div>

      {/* Property Portfolio Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Home className="w-5 h-5 text-cyan-400" />
          <span>Managed Commercial & Residential Properties</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase">
              <tr>
                <th className="p-3">Property Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Address</th>
                <th className="p-3">Units</th>
                <th className="p-3">Occupancy</th>
                <th className="p-3">Monthly Revenue</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">{p.name}</td>
                  <td className="p-3 text-cyan-400">{p.type}</td>
                  <td className="p-3 text-slate-400">{p.address}</td>
                  <td className="p-3">{p.units}</td>
                  <td className="p-3 text-emerald-400 font-bold">{p.occupancyRate}%</td>
                  <td className="p-3">${p.monthlyRevenue.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Yield Calculator */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <span>PropTech AI Yield & ROI Forecasting Engine</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Target Capital Investment ($)</label>
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Expected Cap Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={expectedCapRate}
              onChange={(e) => setExpectedCapRate(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-semibold">Projected Net Annual Yield</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">${projectedYearlyYield} / yr</span>
          </div>
        </div>
      </div>
    </div>
  );
};
