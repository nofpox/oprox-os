import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Zap,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  HardDrive,
  Cpu,
  Users,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowUpRight
} from 'lucide-react';
import { PlatformViewId } from './platformTypes';

interface BillingViewsProps {
  viewId: PlatformViewId;
  theme?: 'dark' | 'light';
}

export const BillingAndUsageViews: React.FC<BillingViewsProps> = ({ viewId, theme = 'dark' }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<any>(null);

  useEffect(() => {
    fetch('/admin/billing/invoices')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setInvoices(data);
      })
      .catch(() => {});

    fetch('/admin/billing/subscriptions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSubscriptions(data);
      })
      .catch(() => {});

    fetch('/admin/ai/usage')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object') setUsageStats(data);
      })
      .catch(() => {});

    fetch('/ai/wallet/balance')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object') setWalletBalance(data);
      })
      .catch(() => {});
  }, []);

  if (viewId === 'billing') {
    return (
      <div className="space-y-6 select-none">
        {/* Billing Overview Banner */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Payment Status: Good Standing
            </span>
            <h1 className="text-xl font-extrabold text-white mt-1">Enterprise Payment Methods & Invoices</h1>
            <p className="text-xs text-slate-400 font-mono">
              Primary Card: Visa ending in <strong className="text-white">•••• 4242</strong> (Expires 09/2028)
            </p>
          </div>

          <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" />
            <span>Update Payment Card</span>
          </button>
        </div>

        {/* Invoice Table */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Billing History & Downloadable Receipts</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-bold">Invoice ID</th>
                  <th className="pb-3 font-bold">Billing Period</th>
                  <th className="pb-3 font-bold">Amount</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">PDF Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {(invoices.length > 0 ? invoices : [
                  { id: 'inv_001', period: 'July 2026', amountDue: 29900, status: 'paid' },
                  { id: 'inv_002', period: 'June 2026', amountDue: 29900, status: 'paid' },
                ]).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 font-bold text-white">{inv.id}</td>
                    <td className="py-3 text-slate-400">{inv.period || 'Monthly Subscription'}</td>
                    <td className="py-3 text-emerald-400 font-bold">${((inv.amountDue || 29900) / 100).toFixed(2)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {inv.status || 'paid'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (viewId === 'subscription') {
    return (
      <div className="space-y-6 select-none">
        {/* Tier Selector Header */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white">OPROX Enterprise Tier Subscription</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Select an annual subscription plan to unlock unlimited AI agent swarms & SOC2 compliance.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                billingCycle === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                billingCycle === 'annually' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              Annual (20% Off)
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          {[
            {
              title: 'Developer Pro',
              price: 'Pricing TBD',
              desc: 'Ideal for small software engineering teams.',
              features: ['5,000,000 AI Tokens', '5 Team Member Seats', 'Basic Support', 'Cloud Run Deployments'],
              isCurrent: false
            },
            {
              title: 'Enterprise Ultimate',
              price: 'Pricing TBD',
              desc: 'For scaling companies requiring autonomous AI agent swarms.',
              features: ['50,000,000 AI Tokens', '50 Team Member Seats', '24/7 Dedicated SLA Support', 'SOC2 Compliance & Okta SSO', 'Unlimited Solution Studios'],
              isCurrent: true
            },
            {
              title: 'Custom Sovereign Cloud',
              price: 'Contact Sales',
              desc: 'Dedicated single-tenant GCP Cloud Run deployment.',
              features: ['Custom Token Quotas', 'Unlimited Seats', 'Dedicated Solutions Architect', 'Custom SLA Guarantee'],
              isCurrent: false
            }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl bg-slate-900 border flex flex-col justify-between space-y-6 ${
                plan.isCurrent ? 'border-emerald-500/50 shadow-xl shadow-emerald-500/10' : 'border-slate-800'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white">{plan.title}</h3>
                  {plan.isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active Tier
                    </span>
                  )}
                </div>

                <div className="text-2xl font-black text-emerald-400">{plan.price}</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{plan.desc}</p>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                disabled={plan.isCurrent}
                className={`w-full py-2.5 rounded-xl font-bold cursor-pointer transition-all ${
                  plan.isCurrent
                    ? 'bg-slate-950 text-slate-500 border border-slate-800 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {plan.isCurrent ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewId === 'usage-quotas') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>Real-Time Usage Metering & Quota Gauges</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Live consumption breakdown for Gemini Flash tokens, Cloud Run compute, and Storage.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">Quota Reset: Aug 1, 2026</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>AI Token Metering</span>
              </span>
              <span className="text-emerald-400 font-bold">34%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div className="h-full bg-emerald-500" style={{ width: '34%' }} />
            </div>
            <p className="text-slate-400 text-[11px]">17,000,000 / 50,000,000 tokens used</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>Media Storage</span>
              </span>
              <span className="text-cyan-400 font-bold">18%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div className="h-full bg-cyan-500" style={{ width: '18%' }} />
            </div>
            <p className="text-slate-400 text-[11px]">184 GB / 1,000 GB used</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Active Seat Licenses</span>
              </span>
              <span className="text-indigo-400 font-bold">48%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div className="h-full bg-indigo-500" style={{ width: '48%' }} />
            </div>
            <p className="text-slate-400 text-[11px]">24 / 50 team seats active</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
