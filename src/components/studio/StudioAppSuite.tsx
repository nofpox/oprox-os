import React, { useState, useEffect } from 'react';
import {
  Layers,
  Palette,
  Database,
  GitBranch,
  Play,
  Save,
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Code,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sliders,
  Zap,
} from 'lucide-react';
import {
  StudioIr,
  StudioNode,
  StudioComponentType,
  createDefaultStudioIr,
  validateStudioIr,
} from '../../lib/studio/studioIr';
import { compileStudioIr } from '../../lib/studio/studioCompiler';
import { generateDrizzleSchemaCode } from '../../lib/studio/studioDrizzleGenerator';
import { simulateFlowExecution } from '../../lib/studio/studioFlowEngine';

type WorkspaceMode = 'DESIGN' | 'SCHEMA' | 'FLOWS' | 'PREVIEW';
type ViewportSize = 'DESKTOP' | 'TABLET' | 'MOBILE';
type SaveStatus = 'DIRTY' | 'SAVING' | 'SAVED' | 'FAILED' | 'CONFLICT';

export const StudioAppSuite: React.FC = () => {
  const [projectId, setProjectId] = useState<string>('proj_studio_demo');
  const [projectName, setProjectName] = useState<string>('My Low-Code App');
  const [tenantId] = useState<string>('tenant_demo');
  const [mode, setMode] = useState<WorkspaceMode>('DESIGN');
  const [viewport, setViewport] = useState<ViewportSize>('DESKTOP');

  const [studioIr, setStudioIr] = useState<StudioIr>(() =>
    createDefaultStudioIr('proj_studio_demo', 'tenant_demo', 'My Low-Code App')
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node_hero_section');
  const [activeRevisionNumber, setActiveRevisionNumber] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('SAVED');

  // Copilot state
  const [copilotPrompt, setCopilotPrompt] = useState<string>('');
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);
  const [copilotSummary, setCopilotSummary] = useState<string | null>(null);

  // Compilation & Promotion state
  const [compiledOutput, setCompiledOutput] = useState<any>(null);
  const [promotedInfo, setPromotedInfo] = useState<any>(null);

  // Flow simulator output
  const [simOutput, setSimOutput] = useState<any>(null);

  // Autosave simulation trigger
  useEffect(() => {
    setSaveStatus('DIRTY');
    const timer = setTimeout(() => {
      setSaveStatus('SAVING');
      setTimeout(() => {
        setSaveStatus('SAVED');
      }, 300);
    }, 1000);
    return () => clearTimeout(timer);
  }, [studioIr]);

  // Handle Node Selection
  function findNodeById(node: StudioNode, id: string): StudioNode | null {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  const selectedNode = selectedNodeId
    ? findNodeById(studioIr.pages[0].rootNode, selectedNodeId)
    : null;

  // Update selected node props/style
  function updateNode(nodeId: string, mutator: (n: StudioNode) => void) {
    const newIr: StudioIr = JSON.parse(JSON.stringify(studioIr));
    function traverse(node: StudioNode) {
      if (node.id === nodeId) {
        mutator(node);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (traverse(child)) return true;
        }
      }
      return false;
    }
    traverse(newIr.pages[0].rootNode);
    setStudioIr(newIr);
  }

  // Insert component
  function handleInsertComponent(type: StudioComponentType) {
    const parentId = selectedNodeId || 'node_root_container';
    const newNodeId = `node_${type.toLowerCase()}_${Date.now().toString(36).substring(4)}`;

    const newNode: StudioNode = {
      id: newNodeId,
      type,
      name: `${type} Node`,
      props:
        type === 'Heading'
          ? { text: 'New Heading', level: 2 }
          : type === 'Button'
          ? { label: 'Click Me' }
          : type === 'Text'
          ? { text: 'Sample text content' }
          : {},
      style:
        type === 'Container' || type === 'Card' || type === 'Section'
          ? { padding: '1rem', backgroundColor: '#111827', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }
          : type === 'Button'
          ? { backgroundColor: '#6366f1', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '0.375rem' }
          : { color: '#f8fafc' },
    };

    updateNode(parentId, (parent) => {
      if (!parent.children) parent.children = [];
      parent.children.push(newNode);
    });

    setSelectedNodeId(newNodeId);
  }

  // Delete component
  function handleDeleteNode(nodeId: string) {
    if (nodeId === 'node_root_container') return; // Cannot delete root
    const newIr: StudioIr = JSON.parse(JSON.stringify(studioIr));

    function removeChild(parent: StudioNode): boolean {
      if (!parent.children) return false;
      const idx = parent.children.findIndex((c) => c.id === nodeId);
      if (idx !== -1) {
        parent.children.splice(idx, 1);
        return true;
      }
      for (const child of parent.children) {
        if (removeChild(child)) return true;
      }
      return false;
    }

    removeChild(newIr.pages[0].rootNode);
    setStudioIr(newIr);
    setSelectedNodeId('node_root_container');
  }

  // Copilot execution
  async function handleRunCopilot() {
    if (!copilotPrompt.trim()) return;
    setCopilotLoading(true);
    setCopilotSummary(null);

    try {
      const res = await fetch(`/api/studio/projects/${projectId}/copilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          prompt: copilotPrompt,
          scope: 'ALL',
          currentIr: studioIr,
        }),
      });

      const data = await res.json();
      if (data.success && data.proposedIr) {
        setStudioIr(data.proposedIr);
        setCopilotSummary(data.summary);
      } else {
        setCopilotSummary(`Copilot fallback processed for: "${copilotPrompt}"`);
      }
    } catch (e: any) {
      setCopilotSummary(`Copilot error: ${e?.message || e}`);
    } finally {
      setCopilotLoading(false);
      setCopilotPrompt('');
    }
  }

  // Compile
  function handleCompile() {
    const compiled = compileStudioIr(studioIr);
    const drizzleCode = generateDrizzleSchemaCode(studioIr.schema);
    setCompiledOutput({ compiled, drizzleCode });
  }

  // Promote
  async function handlePromote() {
    try {
      const res = await fetch(`/api/studio/projects/${projectId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ targetBranch: 'feature/studio-build' }),
      });
      const data = await res.json();
      if (data.success) {
        setPromotedInfo(data);
      }
    } catch (e: any) {
      setPromotedInfo({ error: e?.message || 'Promotion failed' });
    }
  }

  // Simulate flow
  function handleSimulateFlow() {
    const res = simulateFlowExecution(studioIr.flows, { userRole: 'admin' });
    setSimOutput(res);
  }

  // Render node recursively
  function renderCanvasNode(node: StudioNode) {
    const isSelected = selectedNodeId === node.id;
    const borderStyle = isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : '';

    switch (node.type) {
      case 'Heading': {
        const text = node.props.text || node.name;
        return (
          <h1
            key={node.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeId(node.id);
            }}
            className={`cursor-pointer transition-all ${borderStyle}`}
            style={node.style}
          >
            {text}
          </h1>
        );
      }
      case 'Text': {
        const text = node.props.text || node.name;
        return (
          <p
            key={node.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeId(node.id);
            }}
            className={`cursor-pointer transition-all ${borderStyle}`}
            style={node.style}
          >
            {text}
          </p>
        );
      }
      case 'Button': {
        const label = node.props.label || 'Button';
        return (
          <button
            key={node.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeId(node.id);
            }}
            className={`cursor-pointer transition-all ${borderStyle}`}
            style={node.style}
          >
            {label}
          </button>
        );
      }
      case 'Container':
      case 'Section':
      case 'Card':
      default: {
        return (
          <div
            key={node.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeId(node.id);
            }}
            className={`cursor-pointer transition-all min-h-[40px] ${borderStyle}`}
            style={node.style}
          >
            {(node.children || []).map((c) => renderCanvasNode(c))}
          </div>
        );
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            S
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>{projectName}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Studio Phase 1
              </span>
            </h1>
            <p className="text-xs text-slate-400">Low-Code Visual Application Builder</p>
          </div>
        </div>

        {/* Viewport & Workspace Mode Switcher */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setMode('DESIGN')}
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === 'DESIGN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" /> Design Canvas
            </button>
            <button
              onClick={() => setMode('SCHEMA')}
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === 'SCHEMA' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" /> Schema Builder
            </button>
            <button
              onClick={() => setMode('FLOWS')}
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === 'FLOWS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Flow Graph
            </button>
            <button
              onClick={() => setMode('PREVIEW')}
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === 'PREVIEW' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" /> Live Preview
            </button>
          </div>

          {mode === 'DESIGN' && (
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 space-x-1">
              <button
                onClick={() => setViewport('DESKTOP')}
                className={`p-1.5 rounded text-xs ${
                  viewport === 'DESKTOP' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport('TABLET')}
                className={`p-1.5 rounded text-xs ${
                  viewport === 'TABLET' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500'
                }`}
                title="Tablet View"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport('MOBILE')}
                className={`p-1.5 rounded text-xs ${
                  viewport === 'MOBILE' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Status Badges & Promote Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400">Rev #{activeRevisionNumber}</span>
            <span
              className={`px-2 py-0.5 rounded-full font-medium ${
                saveStatus === 'SAVED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : saveStatus === 'SAVING'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
              }`}
            >
              {saveStatus}
            </span>
          </div>

          <button
            onClick={handlePromote}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-semibold shadow flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" /> Promote to Code / AI
          </button>
        </div>
      </header>

      {/* AI Copilot Prompt Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center space-x-3 shrink-0">
        <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
        <input
          type="text"
          value={copilotPrompt}
          onChange={(e) => setCopilotPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRunCopilot()}
          placeholder="Ask Studio Copilot (e.g. 'Add a pricing card grid with monthly subscription buttons')"
          className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-md flex-1 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleRunCopilot}
          disabled={copilotLoading}
          className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition-all disabled:opacity-50"
        >
          {copilotLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Generate'}
        </button>

        {copilotSummary && (
          <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-1 rounded truncate max-w-xs">
            {copilotSummary}
          </span>
        )}
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {mode === 'DESIGN' && (
          <>
            {/* Left Component Palette */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-3 flex flex-col space-y-4 shrink-0 overflow-y-auto">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Insert Components
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['Container', 'Section', 'Card', 'Heading', 'Text', 'Button', 'Input', 'Badge'] as StudioComponentType[]).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => handleInsertComponent(type)}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2 rounded text-left font-medium text-slate-300 flex items-center justify-between group transition-all"
                      >
                        <span>{type}</span>
                        <Plus className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Design Tokens Preview */}
              <div className="border-t border-slate-800 pt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Design Tokens
                </h3>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Primary</span>
                    <span className="w-4 h-4 rounded bg-indigo-600 border border-slate-700 inline-block" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Secondary</span>
                    <span className="w-4 h-4 rounded bg-pink-500 border border-slate-700 inline-block" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Canvas</span>
                    <span className="w-4 h-4 rounded bg-slate-950 border border-slate-700 inline-block" />
                  </div>
                </div>
              </div>
            </aside>

            {/* Center Canvas */}
            <main className="flex-1 bg-slate-950 p-6 flex justify-center items-start overflow-y-auto">
              <div
                className={`transition-all duration-300 ${
                  viewport === 'DESKTOP' ? 'w-full max-w-5xl' : viewport === 'TABLET' ? 'w-[768px]' : 'w-[375px]'
                }`}
              >
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl min-h-[600px]">
                  {renderCanvasNode(studioIr.pages[0].rootNode)}
                </div>
              </div>
            </main>

            {/* Right Property Inspector */}
            <aside className="w-72 border-l border-slate-800 bg-slate-900/60 p-4 flex flex-col space-y-4 shrink-0 overflow-y-auto">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Inspector
                </span>
                {selectedNodeId && selectedNodeId !== 'node_root_container' && (
                  <button
                    onClick={() => handleDeleteNode(selectedNodeId)}
                    className="text-rose-400 hover:text-rose-300"
                    title="Delete Component"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </h3>

              {selectedNode ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Component Name</label>
                    <input
                      type="text"
                      value={selectedNode.name}
                      onChange={(e) =>
                        updateNode(selectedNode.id, (n) => {
                          n.name = e.target.value;
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
                    />
                  </div>

                  {(selectedNode.type === 'Heading' || selectedNode.type === 'Text') && (
                    <div>
                      <label className="text-slate-400 block mb-1">Text Content</label>
                      <input
                        type="text"
                        value={selectedNode.props.text || ''}
                        onChange={(e) =>
                          updateNode(selectedNode.id, (n) => {
                            n.props.text = e.target.value;
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
                      />
                    </div>
                  )}

                  {selectedNode.type === 'Button' && (
                    <div>
                      <label className="text-slate-400 block mb-1">Button Label</label>
                      <input
                        type="text"
                        value={selectedNode.props.label || ''}
                        onChange={(e) =>
                          updateNode(selectedNode.id, (n) => {
                            n.props.label = e.target.value;
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-slate-400 block mb-1">Background Color</label>
                    <input
                      type="text"
                      value={selectedNode.style.backgroundColor || ''}
                      onChange={(e) =>
                        updateNode(selectedNode.id, (n) => {
                          n.style.backgroundColor = e.target.value;
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Text Color</label>
                    <input
                      type="text"
                      value={selectedNode.style.color || ''}
                      onChange={(e) =>
                        updateNode(selectedNode.id, (n) => {
                          n.style.color = e.target.value;
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Padding</label>
                    <input
                      type="text"
                      value={selectedNode.style.padding || ''}
                      onChange={(e) =>
                        updateNode(selectedNode.id, (n) => {
                          n.style.padding = e.target.value;
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Select a component on canvas to inspect properties.</p>
              )}
            </aside>
          </>
        )}

        {mode === 'SCHEMA' && (
          <main className="flex-1 p-6 bg-slate-950 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" /> Relational Schema Builder
                  </h2>
                  <p className="text-xs text-slate-400">Visual ERD database tables and live Drizzle ORM generator</p>
                </div>
                <button
                  onClick={handleCompile}
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                >
                  Generate Drizzle Code
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {studioIr.schema.tables.map((t) => (
                  <div key={t.name} className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">{t.name}</h4>
                    <div className="space-y-1.5 text-xs font-mono">
                      {t.columns.map((c) => (
                        <div key={c.name} className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                          <span className="text-slate-200 flex items-center gap-1">
                            {c.isPrimaryKey && <span className="text-amber-400">🔑</span>}
                            {c.name}
                          </span>
                          <span className="text-slate-400">{c.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {compiledOutput?.drizzleCode && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-pink-400" /> Drizzle ORM Generated Schema
                  </h4>
                  <pre className="p-3 bg-slate-950 rounded text-xs text-emerald-400 font-mono overflow-x-auto">
                    {compiledOutput.drizzleCode}
                  </pre>
                </div>
              )}
            </div>
          </main>
        )}

        {mode === 'FLOWS' && (
          <main className="flex-1 p-6 bg-slate-950 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-pink-400" /> Visual Flow Graph Editor
                  </h2>
                  <p className="text-xs text-slate-400">Event triggers, business actions, and step-by-step simulator</p>
                </div>
                <button
                  onClick={handleSimulateFlow}
                  className="px-3 py-1.5 rounded bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" /> Simulate Flow
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 min-h-[300px] flex items-center justify-center space-x-6">
                {studioIr.flows.nodes.map((node, i) => (
                  <React.Fragment key={node.id}>
                    <div className="bg-slate-950 border border-indigo-500/50 p-4 rounded-xl shadow-lg w-48 text-center space-y-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {node.kind}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-100">{node.label}</h4>
                    </div>
                    {i < studioIr.flows.nodes.length - 1 && <ChevronRight className="w-6 h-6 text-slate-600" />}
                  </React.Fragment>
                ))}
              </div>

              {simOutput && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-slate-400">Simulation Steps Result</h4>
                  <pre className="p-3 bg-slate-950 rounded text-xs text-indigo-300 font-mono overflow-x-auto">
                    {JSON.stringify(simOutput, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </main>
        )}

        {mode === 'PREVIEW' && (
          <main className="flex-1 bg-slate-950 p-6 flex justify-center items-start overflow-y-auto">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                Live App Preview (Interactive)
              </h3>
              {renderCanvasNode(studioIr.pages[0].rootNode)}
            </div>
          </main>
        )}
      </div>

      {/* Promoted Output Banner */}
      {promotedInfo && (
        <div className="bg-indigo-950 border-t border-indigo-800 px-4 py-2 flex items-center justify-between text-xs text-indigo-200 shrink-0">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Promoted to Code / AI Workspace! Workspace Project ID: <strong>{promotedInfo.workspaceProjectId}</strong>
          </span>
          <button onClick={() => setPromotedInfo(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default StudioAppSuite;
