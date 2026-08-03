import React, { useState } from 'react';
import {
  Workflow,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Sparkles,
  GitCommit,
  Layers,
  Check,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { PipelineTaskNode, SpecialistAgentRole } from '../../types';

interface TaskExecutionPipelineProps {
  theme?: 'dark' | 'light';
  projectTitle?: string;
}

export const TaskExecutionPipeline: React.FC<TaskExecutionPipelineProps> = ({
  theme = 'dark',
  projectTitle = 'OPROX Project Workspace'
}) => {
  const isDark = theme === 'dark';

  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Pipeline Tasks State
  const [tasks, setTasks] = useState<PipelineTaskNode[]>([
    {
      id: 'task_1',
      title: 'Analyze Requirements & Generate Architecture Spec',
      assignedAgent: 'architect',
      dependencies: [],
      status: 'completed',
      retryCount: 0,
      maxRetries: 3,
      output: 'Architecture spec compiled in docs/ARCHITECTURE.md',
      completedAt: '12 mins ago'
    },
    {
      id: 'task_2',
      title: 'Design Drizzle Schema & PostgreSQL Migrations',
      assignedAgent: 'database',
      dependencies: ['task_1'],
      status: 'completed',
      retryCount: 0,
      maxRetries: 3,
      output: 'Schema generated in src/lib/userOrg.ts',
      completedAt: '10 mins ago'
    },
    {
      id: 'task_3',
      title: 'Synthesize REST API Router & Middleware Guards',
      assignedAgent: 'backend',
      dependencies: ['task_2'],
      status: 'completed',
      retryCount: 0,
      maxRetries: 3,
      output: 'API routes mounted in src/routes/orgRoutes.ts',
      completedAt: '8 mins ago'
    },
    {
      id: 'task_4',
      title: 'Build Autonomous Workspace React Dashboard',
      assignedAgent: 'frontend',
      dependencies: ['task_3'],
      status: 'completed',
      retryCount: 0,
      maxRetries: 3,
      output: 'Rendered OproxCodeAiSuite component',
      completedAt: '5 mins ago'
    },
    {
      id: 'task_5',
      title: 'Run Vitest Unit & Integration Assertion Suite',
      assignedAgent: 'qa',
      dependencies: ['task_4'],
      status: 'running',
      retryCount: 0,
      maxRetries: 3,
      output: 'Running vitest runner on phase2-oprox-code-ai.test.ts...',
      startedAt: '1 min ago'
    },
    {
      id: 'task_6',
      title: 'Execute OWASP Security & Vulnerability Audit',
      assignedAgent: 'security',
      dependencies: ['task_5'],
      status: 'pending',
      retryCount: 0,
      maxRetries: 3
    },
    {
      id: 'task_7',
      title: 'Containerize App & Deploy to Cloud Run (Port 3000)',
      assignedAgent: 'devops',
      dependencies: ['task_6'],
      status: 'pending',
      retryCount: 0,
      maxRetries: 3
    }
  ]);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const handleStartPipeline = () => {
    setIsPipelineRunning(true);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.status === 'running') {
          return {
            ...t,
            status: 'completed' as const,
            completedAt: 'Just now',
            output: 'Vitest suite executed with 100% assertions green'
          };
        }
        if (t.id === 'task_6') {
          return {
            ...t,
            status: 'running' as const,
            startedAt: 'Just now',
            output: 'Auditing routes & headers...'
          };
        }
        return t;
      })
    );
    setTimeout(() => {
      setIsPipelineRunning(false);
    }, 1500);
  };

  const handleRetryTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'running' as const, retryCount: t.retryCount + 1 } : t))
    );
    setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'completed' as const, completedAt: 'Just now' } : t))
      );
    }, 1000);
  };

  const handleCancelTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'cancelled' as const } : t))
    );
  };

  const filteredTasks = tasks.filter((t) => filterStatus === 'all' || t.status === filterStatus);

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-600 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/25">
            <Workflow className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">AI Task Execution Pipeline & DAG</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-teal-500/10 text-teal-400 border border-teal-500/20">
                DAG Execution Queue
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Task Queue • Parallel Execution • Retry & Auto-Recovery • Cancellation & Execution Log
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartPipeline}
            disabled={isPipelineRunning}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isPipelineRunning ? 'animate-spin' : ''}`} />
            <span>{isPipelineRunning ? 'Executing Pipeline Tasks...' : 'Run Pipeline Queue'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Stats */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 mb-6">
        <div className="flex items-center justify-between text-xs font-mono font-bold">
          <span className="text-slate-400 uppercase">Pipeline Progress: {progressPercent}% Completed</span>
          <span className="text-teal-400">{completedCount} of {tasks.length} Tasks Succeeded</span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/60 mb-6">
        {['all', 'pending', 'running', 'completed', 'failed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
              filterStatus === st
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Task Queue Node Cards */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded-2xl border transition-all ${
              task.status === 'running'
                ? 'bg-teal-950/40 border-teal-500/60 shadow-lg shadow-teal-500/10'
                : task.status === 'completed'
                ? 'bg-slate-900 border-slate-800 opacity-90'
                : 'bg-slate-950 border-slate-800/80'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-xl text-slate-950 font-bold ${
                  task.status === 'completed' ? 'bg-emerald-500' :
                  task.status === 'running' ? 'bg-teal-400 animate-pulse' :
                  task.status === 'failed' ? 'bg-rose-500' :
                  task.status === 'cancelled' ? 'bg-slate-600' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {task.status === 'completed' && <Check className="w-4 h-4" />}
                  {task.status === 'running' && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {task.status === 'pending' && <Clock className="w-4 h-4" />}
                  {task.status === 'failed' && <AlertTriangle className="w-4 h-4" />}
                  {task.status === 'cancelled' && <Ban className="w-4 h-4" />}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-slate-100">{task.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-teal-300">
                      {task.assignedAgent}
                    </span>
                  </div>
                  {task.output && <p className="text-[11px] font-mono text-slate-400 mt-1">{task.output}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {task.status === 'running' && (
                  <button
                    onClick={() => handleCancelTask(task.id)}
                    className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer hover:bg-rose-500/30 transition-all"
                  >
                    Cancel
                  </button>
                )}

                {(task.status === 'failed' || task.status === 'cancelled') && (
                  <button
                    onClick={() => handleRetryTask(task.id)}
                    className="px-3 py-1 rounded-lg bg-teal-500 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-teal-400 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry
                  </button>
                )}

                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {task.completedAt || task.startedAt || 'Queued'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
