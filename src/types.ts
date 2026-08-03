// Global OPROX Types

export type AppMode = 'dashboard' | 'ai-os' | 'showcase' | 'ide' | 'database' | 'cloud' | 'enterprise' | 'media' | 'proptech' | 'solutions' | 'platform-suite' | 'design-system';

export type SolutionCategory = 'Media & Content' | 'Real Estate & PropTech' | 'Property Management' | 'Enterprise ERP' | 'FinTech & Billing' | 'AI & Automation' | 'Developer Tools';

export interface IndustrySolution {
  id: string;
  name: string;
  tagline: string;
  category: SolutionCategory;
  description: string;
  iconName: string;
  version: string;
  rating: number;
  installCount: number;
  isFeatured: boolean;
  isInstalled: boolean;
  activeUsers: number;
  monthlySavings: string;
  status: 'Active' | 'Updating' | 'Installed' | 'Available';
  tags: string[];
  bannerGradient: string;
}

export interface SolutionActivityLog {
  id: string;
  solutionId: string;
  action: string;
  user: string;
  timestamp: string;
  status: 'success' | 'info' | 'warning';
}

export interface SolutionPermission {
  id: string;
  role: 'Admin' | 'Developer' | 'Manager' | 'Viewer';
  permissions: string[];
}

export interface BillingSummary {
  planName: string;
  monthlyQuotaTokens: string;
  usedTokensPercent: number;
  storageUsedGB: number;
  storageMaxGB: number;
  activeSeats: number;
  maxSeats: number;
  nextBillingDate: string;
  estimatedCost: string;
}

export type AgentRole = 'Planner' | 'Architect' | 'Coder' | 'Reviewer' | 'Tester' | 'DevOps';

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Scaffolding' | 'Refactoring' | 'Security' | 'Optimization' | 'Testing';
  description: string;
  templateText: string;
  variables: string[];
}

export interface ContextItem {
  id: string;
  name: string;
  type: 'code' | 'doc' | 'schema' | 'image' | 'pdf';
  size: string;
  tokenCount: number;
  snippet?: string;
  isSelected: boolean;
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'Convention' | 'Preference' | 'API Spec' | 'Architecture';
  lastUpdated: string;
}

export interface AITaskItem {
  id: string;
  title: string;
  assignedAgent: AgentRole;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  outputSnippet?: string;
}

export interface ModelConfig {
  modelName: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  systemInstruction: string;
}

export interface Agent {
  id: AgentRole;
  name: string;
  avatar: string;
  title: string;
  color: string;
  bgLight: string;
  borderAccent: string;
  status: 'idle' | 'thinking' | 'coding' | 'reviewing' | 'completed';
  description: string;
  specialty: string;
}

export interface AgentMessage {
  id: string;
  agentRole: AgentRole;
  timestamp: string;
  thought?: string;
  content: string;
  plan?: string[];
  codeSnippet?: string;
  suggestedCommands?: string[];
  reviewNotes?: string;
  status?: 'info' | 'success' | 'warning' | 'error';
}

export interface VFSNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  language?: string;
  children?: VFSNode[];
  isModified?: boolean;
}

export interface OpenTab {
  nodeId: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isModified?: boolean;
}

export interface FactoryStage {
  id: number;
  name: string;
  category: 'Planning' | 'Synthesis' | 'Verification' | 'Deployment' | 'Monitoring';
  status: 'pending' | 'running' | 'completed' | 'failed';
  durationMs?: number;
  logs: string[];
  autoRemediated?: boolean;
  description: string;
}

export interface DBTable {
  name: string;
  description: string;
  rowCount: number;
  columns: {
    name: string;
    type: string;
    isPrimary?: boolean;
    isNullable?: boolean;
    foreignKey?: string;
  }[];
  sampleData: Record<string, any>[];
}

export interface PatternItem {
  id: string;
  title: string;
  category: string;
  reusabilityScore: number;
  timesApplied: number;
  description: string;
  codeTemplate: string;
}

export interface TechDebtItem {
  id: string;
  file: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestedFix: string;
}

export interface PropertyItem {
  id: string;
  name: string;
  type: 'Commercial' | 'Residential' | 'Mixed-Use' | 'Industrial';
  address: string;
  units: number;
  occupancyRate: number;
  monthlyRevenue: number;
  aiMaintenanceScore: number;
  status: 'Optimal' | 'Attention' | 'Leasing';
}

export interface MediaAsset {
  id: string;
  title: string;
  type: 'Image Prompt' | 'Video Script' | 'UI Component' | 'Brand Asset';
  concept: string;
  description: string;
  tags: string[];
  dateCreated: string;
  previewUrl?: string;
}
