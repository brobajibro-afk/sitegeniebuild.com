// Virtual file system — maps file path → file content
export type VirtualFileSystem = Record<string, string>;

// Supported frameworks
export type Framework =
  | "react-ts"      // React + TypeScript (default)
  | "react-js"      // React + JavaScript
  | "vue"           // Vue 3
  | "svelte"        // Svelte
  | "angular"       // Angular
  | "vanilla-js"    // Vanilla JS/HTML/CSS
  | "python-django" // Python Django (scaffold)
  | "php-laravel";  // PHP Laravel (scaffold)

export interface FrameworkConfig {
  id: Framework;
  label: string;
  icon: string;
  sandpackTemplate: "react-ts" | "react" | "vue" | "svelte" | "angular" | "vanilla" | null;
  color: string;
  isBackend: boolean;
}

// File tree node for the explorer
export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  language?: string;
}

// Chat message
export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  agentStep?: AgentStep;
  isStreaming?: boolean;
}

// Multi-agent pipeline step
export type AgentStepStatus = "pending" | "running" | "completed" | "error";

export interface AgentStep {
  id: string;
  name: AgentName;
  label: string;
  status: AgentStepStatus;
  description?: string;
}

export type AgentName =
  | "requirements"
  | "planning"
  | "ui"
  | "backend"
  | "fix"
  | "complete";

// Workspace state
export interface WorkspaceState {
  files: VirtualFileSystem;
  activeFile: string | null;
  openFiles: string[];
  messages: ChatMessage[];
  isGenerating: boolean;
  agentSteps: AgentStep[];
  projectName: string;
  projectId: string | null;
  requirementsOutput: string;
  backendOutput: string;
  enabledPlugins: string[];
  framework: Framework;
}

// AI generation result
export interface GenerationResult {
  files: VirtualFileSystem;
  summary: string;
}

// Sandpack file format
export interface SandpackFile {
  code: string;
  hidden?: boolean;
  active?: boolean;
  readOnly?: boolean;
}

export type SandpackFiles = Record<string, SandpackFile | string>;

// Example prompts for the chat
export interface ExamplePrompt {
  label: string;
  prompt: string;
  icon: string;
}

// Supabase DB types
export type SubscriptionPlan = 'free' | 'pro' | 'team';

export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: "user" | "admin";
  avatar_url: string | null;
  theme: string;
  editor_font_size: number;
  editor_color_theme: string;
  token_balance: number;
  subscription_plan: SubscriptionPlan;
  custom_domain: string | null;
  domain_verified: boolean;
  domain_txt_token: string | null;
  domain_added_at: string | null;
  created_at: string;
  updated_at: string;
}

export function isPaidUser(profile: Profile | null): boolean {
  return profile?.subscription_plan === 'pro' || profile?.subscription_plan === 'team';
}

export interface DomainDeployment {
  id: string;
  user_id: string;
  project_id: string | null;
  custom_domain: string;
  vercel_url: string | null;
  status: 'pending' | 'active' | 'error';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  user_id: string;
  team_id: string | null;
  files: VirtualFileSystem;
  framework?: string;
  enabled_plugins: string[];
  requirements_output: string | null;
  backend_output: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  user_id: string;
  files: VirtualFileSystem;
  message: string;
  created_at: string;
}

export interface ProjectMessage {
  id: string;
  project_id: string;
  role: MessageRole;
  content: string;
  agent_step: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface RazorpayOrder {
  id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount_paise: number;
  tokens: number;
  status: "created" | "paid" | "failed";
  created_at: string;
  paid_at: string | null;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  profiles?: Profile;
}

// Plugin system
export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "styling" | "backend" | "auth" | "payment" | "analytics" | "testing";
  promptModifier?: string;
}

// Collaborator presence
export interface CollaboratorPresence {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  active_file: string | null;
  cursor_line: number | null;
  color: string;
}

// Search result
export interface SearchResult {
  filePath: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

// Command palette item
export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: string;
  action: () => void;
}

// Version history entry (UI)
export interface VersionEntry {
  id: string;
  message: string;
  created_at: string;
  fileCount: number;
}
