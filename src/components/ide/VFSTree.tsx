import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson, 
  Plus, 
  Trash2, 
  Search, 
  ChevronRight, 
  ChevronDown,
  FilePlus,
  FolderPlus
} from 'lucide-react';
import { VFSNode } from '../../types';

interface VFSTreeProps {
  nodes: VFSNode[];
  activePath: string | null;
  onSelectFile: (node: VFSNode) => void;
  onCreateNode: (parentPath: string, name: string, type: 'file' | 'directory') => void;
  onDeleteNode: (path: string) => void;
}

export const VFSTree: React.FC<VFSTreeProps> = ({
  nodes,
  activePath,
  onSelectFile,
  onCreateNode,
  onDeleteNode,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    '/src': true,
    '/src/components': true,
    '/src/services': true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState<{ parentPath: string; type: 'file' | 'directory' } | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.json')) return <FileJson className="w-4 h-4 text-amber-400" />;
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return <FileCode className="w-4 h-4 text-indigo-400" />;
    if (fileName.endsWith('.md')) return <FileText className="w-4 h-4 text-emerald-400" />;
    if (fileName.endsWith('.sql')) return <FileCode className="w-4 h-4 text-cyan-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !showCreateModal) return;
    onCreateNode(showCreateModal.parentPath, newItemName.trim(), showCreateModal.type);
    setShowCreateModal(null);
    setNewItemName('');
  };

  const renderNode = (node: VFSNode, level = 0) => {
    if (searchQuery) {
      const matches = node.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (node.type === 'file' && !matches) return null;
    }

    const isExpanded = expandedPaths[node.path] ?? false;
    const isActive = activePath === node.path;

    if (node.type === 'directory') {
      return (
        <div key={node.path} className="select-none">
          <div
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors hover:bg-slate-800/60 ${
              isActive ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => toggleExpand(node.path)}
          >
            <div className="flex items-center gap-1.5 truncate">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </div>

            <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
              <button
                title="New File"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal({ parentPath: node.path, type: 'file' });
                }}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
              >
                <FilePlus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isExpanded && node.children && (
            <div className="space-y-0.5">
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        onClick={() => onSelectFile(node)}
        className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all group ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-300 font-semibold border-l-2 border-emerald-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
        }`}
        style={{ paddingLeft: `${level * 12 + 22}px` }}
      >
        <div className="flex items-center gap-2 truncate">
          {getFileIcon(node.name)}
          <span className="truncate">{node.name}</span>
          {node.isModified && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
        </div>

        <button
          title="Delete file"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNode(node.path);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-r border-slate-800 text-slate-200">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Virtual Workspace (VFS)
          </span>
          <button
            onClick={() => setShowCreateModal({ parentPath: '/src', type: 'file' })}
            className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded text-slate-300 hover:text-emerald-400 transition-colors"
            title="Add File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search VFS files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {nodes.map((node) => renderNode(node))}
      </div>

      {/* New File Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl"
          >
            <h3 className="font-bold text-white text-sm">
              Create New {showCreateModal.type === 'file' ? 'File' : 'Directory'} in{' '}
              <span className="text-emerald-400">{showCreateModal.parentPath}</span>
            </h3>

            <input
              type="text"
              placeholder={showCreateModal.type === 'file' ? 'e.g. authService.ts' : 'e.g. utils'}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
