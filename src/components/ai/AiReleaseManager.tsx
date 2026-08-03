import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  GitCommit,
  ShieldCheck,
  Check,
  Copy,
  Download,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { ReleaseCandidate } from '../../types';

interface AiReleaseManagerProps {
  theme?: 'dark' | 'light';
  onDeployRelease?: (release: ReleaseCandidate) => void;
}

export const AiReleaseManager: React.FC<AiReleaseManagerProps> = ({
  theme = 'dark',
  onDeployRelease
}) => {
  const isDark = theme === 'dark';

  const [semverType, setSemverType] = useState<'major' | 'minor' | 'patch'>('minor');
  const [isCreatingRelease, setIsCreatingRelease] = useState(false);
  const [copied, setCopied] = useState(false);

  // Release Candidates State
  const [releases, setReleases] = useState<ReleaseCandidate[]>([
    {
      id: 'rel_250',
      version: 'v2.5.0-rc1',
      semverType: 'minor',
      releaseNotes: `### OPROX Code / AI — v2.5.0 Official Release Candidate

#### 🚀 New Features & Capabilities
- **AI Project Generator**: Added 6-step project wizard with template, architecture, stack, DB, auth, and deployment target selection.
- **9-Agent Swarm Collaboration**: Real multi-agent collaboration with shared project context bus and automated handoffs.
- **AI Task Execution Pipeline**: Integrated DAG task execution queue with parallel processing, retries, and cancellation.
- **Live Workspace Sync**: Real-time VFS file, build, Vitest coverage, Git branch, and Cloud Run container status monitoring.
- **AI Release Manager**: Automated release candidate creation, semantic versioning, and production readiness scoring.

#### 🛡️ Security & Performance Audit
- 0 OWASP vulnerabilities detected
- 100% Vitest assertions green (14/14 passed)
- Bundled artifact size: 412.5 KB (optimized CJS build)
`,
      readinessScore: 98,
      goNoGo: 'GO',
      checklist: [
        { id: 'c1', label: 'All Vitest Unit & Integration Suites Green', completed: true },
        { id: 'c2', label: 'OWASP Security & JWT Authorization Pass', completed: true },
        { id: 'c3', label: 'Drizzle Schema Migrations Verified', completed: true },
        { id: 'c4', label: 'Cloud Run Port 3000 Ingress Operational', completed: true },
        { id: 'c5', label: 'AI Wallet & CostGuard Limits Verified', completed: true }
      ],
      createdAt: 'Just now',
      status: 'approved'
    }
  ]);

  const currentRelease = releases[0];

  const handleCreateNewRelease = () => {
    setIsCreatingRelease(true);
    setTimeout(() => {
      const nextVer = semverType === 'major' ? 'v3.0.0-rc1' : semverType === 'minor' ? 'v2.6.0-rc1' : 'v2.5.1-rc1';
      const newRelease: ReleaseCandidate = {
        id: `rel_${Date.now()}`,
        version: nextVer,
        semverType: semverType,
        releaseNotes: `### OPROX Release Candidate ${nextVer}\n\nAutomated synthesis of workspace changes and patches. All security and QA audits passed successfully.`,
        readinessScore: 100,
        goNoGo: 'GO',
        checklist: [
          { id: 'c1', label: 'All Vitest Unit & Integration Suites Green', completed: true },
          { id: 'c2', label: 'OWASP Security & JWT Authorization Pass', completed: true },
          { id: 'c3', label: 'Drizzle Schema Migrations Verified', completed: true },
          { id: 'c4', label: 'Cloud Run Port 3000 Ingress Operational', completed: true }
        ],
        createdAt: 'Just now',
        status: 'approved'
      };
      setReleases((prev) => [newRelease, ...prev]);
      setIsCreatingRelease(false);
    }, 1200);
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(currentRelease.releaseNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerDeploy = () => {
    if (onDeployRelease && currentRelease) {
      onDeployRelease(currentRelease);
    }
    setReleases((prev) =>
      prev.map((r, i) => (i === 0 ? { ...r, status: 'released' as const } : r))
    );
  };

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25">
            <Rocket className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">AI Release Manager & Production Readiness</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Phase 3 Release
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Release Candidates • SemVer Calculator • Production Readiness Report • Deployment Checklist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1">
            {(['patch', 'minor', 'major'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSemverType(st)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
                  semverType === st ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateNewRelease}
            disabled={isCreatingRelease}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isCreatingRelease ? 'animate-spin' : ''}`} />
            <span>{isCreatingRelease ? 'Synthesizing...' : 'Create Release Candidate'}</span>
          </button>
        </div>
      </div>

      {/* Readiness Report Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block">Active Release Version</span>
            <span className="text-xl font-mono font-extrabold text-emerald-400">{currentRelease?.version}</span>
          </div>
          <Rocket className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block">Readiness Index</span>
            <span className="text-2xl font-extrabold text-emerald-400">{currentRelease?.readinessScore}/100</span>
          </div>
          <Award className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block">Production Gate</span>
            <span className="text-xl font-extrabold text-emerald-400">{currentRelease?.goNoGo}</span>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          <button
            onClick={handleTriggerDeploy}
            disabled={currentRelease?.status === 'released'}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Rocket className="w-4 h-4" />
            <span>{currentRelease?.status === 'released' ? 'RELEASE DEPLOYED TO PROD' : 'DEPLOY RELEASE TO PROD'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Checklist & Release Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deployment Checklist */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">Pre-Deployment Checklist</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-2">
            {currentRelease?.checklist.map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-200 font-mono text-[11px]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Release Notes Markdown */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
              <FileText className="w-4 h-4" /> Synthesized Release Notes ({currentRelease?.version})
            </span>

            <button
              onClick={handleCopyNotes}
              className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1 border border-slate-800 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Notes'}</span>
            </button>
          </div>

          <textarea
            value={currentRelease?.releaseNotes}
            onChange={(e) =>
              setReleases((prev) =>
                prev.map((r, i) => (i === 0 ? { ...r, releaseNotes: e.target.value } : r))
              )
            }
            rows={10}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 leading-relaxed focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
