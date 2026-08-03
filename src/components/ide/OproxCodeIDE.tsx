import React, { useState, useEffect } from 'react';
import { WorkspaceHeader } from './WorkspaceHeader';
import { LeftSidebar } from './LeftSidebar';
import { MultiTabEditor } from './MultiTabEditor';
import { RightSidebar } from './RightSidebar';
import { BottomDrawer } from './BottomDrawer';
import { BottomStatusBar } from './BottomStatusBar';
import { VFSNode, OpenTab, AgentMessage, AgentRole, FactoryStage } from '../../types';
import { initialVFSTree } from '../../data/initialVFS';
import { INITIAL_FACTORY_STAGES } from '../../data/mockData';

interface OproxCodeIDEProps {
  initialPrompt?: string;
  onProjectChange?: (title: string) => void;
  theme?: 'dark' | 'light';
}

const PROJECTS_LIST = [
  'OPROX Enterprise Core',
  'Aethel Multi-Tenant Auth API',
  'PropTech Lease Portal OS',
  'Media Studio 4K Storyboard Generator'
];

export const OproxCodeIDE: React.FC<OproxCodeIDEProps> = ({
  initialPrompt,
  onProjectChange,
  theme = 'dark'
}) => {
  // Multi-Project State
  const [currentProject, setCurrentProject] = useState<string>(PROJECTS_LIST[0]);

  // VFS State
  const [vfsNodes, setVfsNodes] = useState<VFSNode[]>(initialVFSTree);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([
    {
      nodeId: 'file-app',
      path: '/src/App.tsx',
      name: 'App.tsx',
      content: initialVFSTree[3]?.children?.[0]?.content || '',
      language: 'typescript',
      isModified: false,
    },
    {
      nodeId: 'file-ai-agent',
      path: '/src/services/aiAgentService.ts',
      name: 'aiAgentService.ts',
      content: initialVFSTree[3]?.children?.[1]?.children?.[0]?.content || '',
      language: 'typescript',
      isModified: false,
    },
  ]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>('/src/App.tsx');

  // Layout & Panel Visibility State (with localStorage persistence)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showBottomDrawer, setShowBottomDrawer] = useState(true);
  const [isSplitEditor, setIsSplitEditor] = useState(false);
  const [layoutPreset, setLayoutPreset] = useState<'default' | 'split' | 'focus' | 'full-preview'>('default');

  // Load layout preferences from localStorage if available
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem('oprox_ide_layout');
      if (savedLayout) {
        const parsed = JSON.parse(savedLayout);
        setShowLeftSidebar(parsed.showLeftSidebar ?? true);
        setShowRightSidebar(parsed.showRightSidebar ?? true);
        setShowBottomDrawer(parsed.showBottomDrawer ?? true);
        setIsSplitEditor(parsed.isSplitEditor ?? false);
        setLayoutPreset(parsed.layoutPreset ?? 'default');
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // Save layout preferences to localStorage
  const saveLayoutState = (newState: Partial<any>) => {
    try {
      const current = {
        showLeftSidebar,
        showRightSidebar,
        showBottomDrawer,
        isSplitEditor,
        layoutPreset,
        ...newState
      };
      localStorage.setItem('oprox_ide_layout', JSON.stringify(current));
    } catch (err) {
      // ignore
    }
  };

  const handleSelectProject = (proj: string) => {
    setCurrentProject(proj);
    if (onProjectChange) onProjectChange(proj);
  };

  const handleChangeLayoutPreset = (preset: 'default' | 'split' | 'focus' | 'full-preview') => {
    setLayoutPreset(preset);
    if (preset === 'focus') {
      setShowLeftSidebar(false);
      setShowRightSidebar(false);
      setShowBottomDrawer(false);
      setIsSplitEditor(false);
      saveLayoutState({ showLeftSidebar: false, showRightSidebar: false, showBottomDrawer: false, isSplitEditor: false, layoutPreset: 'focus' });
    } else if (preset === 'split') {
      setShowLeftSidebar(true);
      setShowRightSidebar(true);
      setShowBottomDrawer(true);
      setIsSplitEditor(true);
      saveLayoutState({ showLeftSidebar: true, showRightSidebar: true, showBottomDrawer: true, isSplitEditor: true, layoutPreset: 'split' });
    } else if (preset === 'full-preview') {
      setShowLeftSidebar(false);
      setShowRightSidebar(true);
      setShowBottomDrawer(false);
      setIsSplitEditor(false);
      saveLayoutState({ showLeftSidebar: false, showRightSidebar: true, showBottomDrawer: false, isSplitEditor: false, layoutPreset: 'full-preview' });
    } else {
      setShowLeftSidebar(true);
      setShowRightSidebar(true);
      setShowBottomDrawer(true);
      setIsSplitEditor(false);
      saveLayoutState({ showLeftSidebar: true, showRightSidebar: true, showBottomDrawer: true, isSplitEditor: false, layoutPreset: 'default' });
    }
  };

  // Terminal & Pipeline State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'oprox@workspace:~$ oprox status',
    '[SUCCESS] OPROX Engine online. VFS mounted at /',
    '[INFO] 6 Specialized AI Agents (Planner, Architect, Coder, Reviewer, Tester, DevOps) initialized.',
    '[INFO] 18-Stage Software Factory ready.',
  ]);

  const [factoryStages, setFactoryStages] = useState<FactoryStage[]>(INITIAL_FACTORY_STAGES);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);

  // Agent Messages State
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([
    {
      id: 'msg-1',
      agentRole: 'Planner',
      timestamp: '10:14:02 AM',
      thought: 'Analyzing user workspace setup and Virtual File System (VFS) nodes.',
      content: 'OPROX Autonomous Engine initialized. Ready to accept feature requests, build microservices, or run 18-stage software factory pipelines.',
      plan: ['1. Parse input specs', '2. Scaffold code & database models', '3. Run verification tests'],
    },
  ]);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const [proposedDiff, setProposedDiff] = useState<{ original: string; proposed: string } | null>(null);

  // File Handlers
  const handleSelectFile = (node: VFSNode) => {
    if (node.type !== 'file') return;
    const existing = openTabs.find((t) => t.path === node.path);
    if (!existing) {
      setOpenTabs((prev) => [
        ...prev,
        {
          nodeId: node.id,
          path: node.path,
          name: node.name,
          content: node.content || '',
          language: node.language || 'typescript',
          isModified: false,
        },
      ]);
    }
    setActiveTabPath(node.path);
  };

  const handleCreateNode = (parentPath: string, name: string, type: 'file' | 'directory') => {
    const newPath = `${parentPath}/${name}`;
    const newNode: VFSNode = {
      id: 'node_' + Math.random().toString(36).substring(7),
      name,
      type,
      path: newPath,
      content: type === 'file' ? `// New file: ${name}\nexport {};\n` : undefined,
      language: name.endsWith('.json') ? 'json' : 'typescript',
      children: type === 'directory' ? [] : undefined,
    };

    const updateChildren = (list: VFSNode[]): VFSNode[] => {
      return list.map((item) => {
        if (item.path === parentPath && item.type === 'directory') {
          return { ...item, children: [...(item.children || []), newNode] };
        }
        if (item.children) {
          return { ...item, children: updateChildren(item.children) };
        }
        return item;
      });
    };

    setVfsNodes((prev) => updateChildren(prev));
    if (type === 'file') {
      handleSelectFile(newNode);
    }
    setTerminalLogs((prev) => [...prev, `[SUCCESS] Created ${type}: ${newPath}`]);
  };

  const handleDeleteNode = (path: string) => {
    const filterNodes = (list: VFSNode[]): VFSNode[] => {
      return list
        .filter((item) => item.path !== path)
        .map((item) => (item.children ? { ...item, children: filterNodes(item.children) } : item));
    };

    setVfsNodes((prev) => filterNodes(prev));
    setOpenTabs((prev) => prev.filter((t) => t.path !== path));
    if (activeTabPath === path) {
      const remaining = openTabs.filter((t) => t.path !== path);
      setActiveTabPath(remaining.length > 0 ? remaining[0].path : null);
    }
    setTerminalLogs((prev) => [...prev, `[INFO] Deleted node: ${path}`]);
  };

  const handleContentChange = (path: string, newContent: string) => {
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, content: newContent, isModified: true } : t))
    );
  };

  const handleSaveFile = (path: string) => {
    setOpenTabs((prev) => prev.map((t) => (t.path === path ? { ...t, isModified: false } : t)));
    setTerminalLogs((prev) => [...prev, `[SUCCESS] Saved file changes: ${path}`]);
  };

  // Terminal Execution Handler
  const handleExecuteTerminalCommand = (cmd: string) => {
    setTerminalLogs((prev) => [...prev, `oprox@workspace:~$ ${cmd}`]);

    if (cmd === 'clear') {
      setTerminalLogs([]);
      return;
    }

    if (cmd === 'help') {
      setTerminalLogs((prev) => [
        ...prev,
        'Supported Commands:',
        '  ls                      - List files in workspace',
        '  oprox build             - Trigger production build',
        '  oprox test              - Run Vitest suite',
        '  oprox deploy            - Trigger Cloud Run zero-downtime release',
        '  clear                   - Clear terminal logs',
      ]);
      return;
    }

    if (cmd === 'oprox build') {
      setTerminalLogs((prev) => [
        ...prev,
        '[INFO] Compiling TypeScript AST...',
        '[INFO] Running esbuild bundler...',
        '[SUCCESS] Build complete! dist/server.cjs generated with 0 errors.',
      ]);
      return;
    }

    setTerminalLogs((prev) => [...prev, `[INFO] Executed process: ${cmd}`]);
  };

  // Dispatch AI Task Handler
  const handleDispatchTask = async (agentRole: AgentRole, promptText: string) => {
    setIsAgentProcessing(true);
    const activeTab = openTabs.find((t) => t.path === activeTabPath);

    setTimeout(() => {
      const newMsg: AgentMessage = {
        id: 'msg_' + Math.random().toString(36).substring(7),
        agentRole: agentRole,
        timestamp: new Date().toLocaleTimeString(),
        thought: `Analyzing input requirements for ${agentRole}`,
        content: `Completed task: "${promptText}"`,
        plan: ['1. Parse AST spec', '2. Generate modular TS patch', '3. Execute Vitest suite'],
        codeSnippet: `// OPROX Auto-Generated Patch\nexport function handle${agentRole}Logic() {\n  console.log("Synthesized response for: ${promptText}");\n  return true;\n}`,
      };

      setAgentMessages((prev) => [...prev, newMsg]);
      setIsAgentProcessing(false);
      setTerminalLogs((prev) => [...prev, `[AGENT LOG] ${agentRole} completed task: "${promptText}"`]);
    }, 600);
  };

  const handleRequestAiAction = (actionType: string, path: string, content: string) => {
    if (actionType === 'Refactor') {
      const proposed = content + `\n\n// Refactored by OPROX AI Engine\nexport const optimizedHandler = () => {\n  console.log("Optimized execution");\n};`;
      setProposedDiff({ original: content, proposed });
    } else {
      handleDispatchTask('Reviewer', `${actionType} on file ${path}`);
    }
  };

  const handleRunPipeline = async () => {
    setIsPipelineRunning(true);
    for (let i = 0; i < factoryStages.length; i++) {
      setFactoryStages((prev) =>
        prev.map((stage, idx) => (idx === i ? { ...stage, status: 'running' } : stage))
      );
      await new Promise((resolve) => setTimeout(resolve, 200));
      setFactoryStages((prev) =>
        prev.map((stage, idx) => (idx === i ? { ...stage, status: 'completed' } : stage))
      );
    }
    setIsPipelineRunning(false);
    setTerminalLogs((prev) => [...prev, '[SUCCESS] All 18 Factory Pipeline Stages Executed Green!']);
  };

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-slate-950 overflow-hidden text-slate-100">
      {/* 1. AI WORKSPACE HEADER */}
      <WorkspaceHeader
        currentProject={currentProject}
        projectsList={PROJECTS_LIST}
        onSelectProject={handleSelectProject}
        layoutPreset={layoutPreset}
        onChangeLayoutPreset={handleChangeLayoutPreset}
        showLeftSidebar={showLeftSidebar}
        onToggleLeftSidebar={() => {
          const next = !showLeftSidebar;
          setShowLeftSidebar(next);
          saveLayoutState({ showLeftSidebar: next });
        }}
        showRightSidebar={showRightSidebar}
        onToggleRightSidebar={() => {
          const next = !showRightSidebar;
          setShowRightSidebar(next);
          saveLayoutState({ showRightSidebar: next });
        }}
        showBottomDrawer={showBottomDrawer}
        onToggleBottomDrawer={() => {
          const next = !showBottomDrawer;
          setShowBottomDrawer(next);
          saveLayoutState({ showBottomDrawer: next });
        }}
        isSplitEditor={isSplitEditor}
        onToggleSplitEditor={() => {
          const next = !isSplitEditor;
          setIsSplitEditor(next);
          saveLayoutState({ isSplitEditor: next });
        }}
        onRunPipeline={handleRunPipeline}
        isPipelineRunning={isPipelineRunning}
        theme={theme}
      />

      {/* MAIN PANELS SPLIT VIEW */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* LEFT SIDEBAR (Explorer, Git, DB, Deployments, Monitoring) */}
        {showLeftSidebar && (
          <div className="col-span-12 sm:col-span-3 lg:col-span-2 h-full overflow-hidden">
            <LeftSidebar
              vfsNodes={vfsNodes}
              activePath={activeTabPath}
              onSelectFile={handleSelectFile}
              onCreateNode={handleCreateNode}
              onDeleteNode={handleDeleteNode}
              theme={theme}
            />
          </div>
        )}

        {/* CENTER COLUMN: MULTI-TAB EDITOR & BOTTOM DRAWER */}
        <div className={`h-full flex flex-col overflow-hidden border-r border-slate-800 ${
          showLeftSidebar && showRightSidebar
            ? 'col-span-12 sm:col-span-6 lg:col-span-7'
            : !showLeftSidebar && !showRightSidebar
            ? 'col-span-12'
            : 'col-span-12 sm:col-span-9 lg:col-span-10'
        }`}>
          {/* Top: Multi-Tab Code Editor */}
          <div className={`${showBottomDrawer ? 'h-[65%]' : 'h-full'} overflow-hidden transition-all`}>
            <MultiTabEditor
              openTabs={openTabs}
              activeTabPath={activeTabPath}
              onSelectTab={setActiveTabPath}
              onCloseTab={(p) => {
                setOpenTabs((prev) => prev.filter((t) => t.path !== p));
                if (activeTabPath === p) {
                  const rem = openTabs.filter((t) => t.path !== p);
                  setActiveTabPath(rem.length > 0 ? rem[0].path : null);
                }
              }}
              onContentChange={handleContentChange}
              onSaveFile={handleSaveFile}
              onRequestAiAction={handleRequestAiAction}
              isSplitEditor={isSplitEditor}
              onToggleSplitEditor={() => setIsSplitEditor(!isSplitEditor)}
              proposedCodeDiff={proposedDiff}
              onAcceptDiff={() => {
                if (proposedDiff && activeTabPath) {
                  handleContentChange(activeTabPath, proposedDiff.proposed);
                  setProposedDiff(null);
                }
              }}
              onRejectDiff={() => setProposedDiff(null)}
              theme={theme}
            />
          </div>

          {/* Bottom Drawer (Terminal, Console, Problems, 18-Stage Factory Output) */}
          {showBottomDrawer && (
            <div className="h-[35%] overflow-hidden transition-all">
              <BottomDrawer
                logs={terminalLogs}
                onExecuteCommand={handleExecuteTerminalCommand}
                onClearLogs={() => setTerminalLogs([])}
                factoryStages={factoryStages}
                isPipelineRunning={isPipelineRunning}
                onRunPipeline={handleRunPipeline}
                theme={theme}
              />
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR (AI Chat, Agent Status, Live Preview) */}
        {showRightSidebar && (
          <div className="col-span-12 sm:col-span-3 lg:col-span-3 h-full overflow-hidden">
            <RightSidebar
              messages={agentMessages}
              onDispatchTask={handleDispatchTask}
              isProcessing={isAgentProcessing}
              onApplyGeneratedCode={(code) => {
                if (activeTabPath) handleContentChange(activeTabPath, code);
              }}
              theme={theme}
            />
          </div>
        )}
      </div>

      {/* BOTTOM STATUS BAR */}
      <BottomStatusBar
        currentProject={currentProject}
        activeFilePath={activeTabPath}
        errorCount={0}
        warningCount={3}
        theme={theme}
      />
    </div>
  );
};
