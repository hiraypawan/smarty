// Core Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface PageContext {
  url: string;
  title: string;
  domain: string;
  pageType: PageType;
  hasForm: boolean;
  hasPricing: boolean;
  hasContactInfo: boolean;
  isEcommerce: boolean;
  isSocialMedia: boolean;
  isJobBoard: boolean;
  metadata?: Record<string, any>;
}

export type PageType = 'social-media' | 'ecommerce' | 'job-board' | 'article' | 'form-page' | 'general';

// Module-specific Types
export interface SocialMediaPost {
  id: string;
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram';
  content: string;
  caption?: string;
  media?: string[];
  scheduledFor?: Date;
  posted: boolean;
  createdAt: Date;
}

export interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source: string;
  verified: boolean;
  extractedAt: Date;
}

export interface PriceMonitoringItem {
  id: string;
  url: string;
  productName: string;
  currentPrice: number;
  targetPrice?: number;
  currency: string;
  selector: string;
  lastChecked: Date;
  priceHistory: PricePoint[];
  alertsEnabled: boolean;
}

export interface PricePoint {
  price: number;
  timestamp: Date;
}

export interface ContentSummary {
  id: string;
  url: string;
  title: string;
  summary: string;
  keyPoints: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  readingTime?: number;
  createdAt: Date;
}

export interface FormTemplate {
  id: string;
  name: string;
  url?: string;
  fields: FormField[];
  createdAt: Date;
  usageCount: number;
}

export interface FormField {
  name: string;
  selector: string;
  value: string;
  fieldType: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea';
  required?: boolean;
}

export interface ExtractedData {
  id: string;
  executionId?: string;
  url: string;
  data: Record<string, any>;
  schema: DataSchema[];
  extractedAt: Date;
  format: 'csv' | 'json' | 'xlsx';
}

export interface DataSchema {
  field: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'url' | 'email';
  selector?: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  steps: AutomationStep[];
  triggers: AutomationTrigger[];
  createdAt: Date;
  isActive: boolean;
}

export interface AutomationStep {
  id: string;
  type: 'extract' | 'summarize' | 'fill-form' | 'send-notification' | 'save-data' | 'ai-decision';
  config: Record<string, any>;
  nextStepId?: string;
  conditionalNextSteps?: ConditionalStep[];
}

export interface ConditionalStep {
  condition: string;
  nextStepId: string;
}

export interface AutomationTrigger {
  type: 'url-match' | 'page-type' | 'element-present' | 'schedule' | 'manual';
  config: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  templateId: string;
  context: PageContext;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: ExecutionStep[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface ExecutionStep {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface NotificationConfig {
  id: string;
  type: 'browser' | 'email' | 'dashboard';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
  sent: boolean;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Chrome Extension Types
export interface ChromeMessage {
  type: string;
  data?: any;
  requestId?: string;
}

export interface ChromeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// AI Integration Types
export interface AIRequest {
  prompt: string;
  context?: Record<string, any>;
  model?: string;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  confidence: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Settings Types
export interface UserSettings {
  notifications: {
    browser: boolean;
    email: boolean;
    frequency: 'instant' | 'hourly' | 'daily';
  };
  automation: {
    autoExecute: boolean;
    confirmActions: boolean;
    smartSuggestions: boolean;
  };
  privacy: {
    collectUsageData: boolean;
    shareImprovements: boolean;
  };
  integrations: {
    supabase?: SupabaseConfig;
    gemini?: GeminiConfig;
  };
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  connected: boolean;
}

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: PlanLimits;
}

export interface PlanLimits {
  automationsPerMonth: number;
  summariesPerMonth: number;
  priceMonitors: number;
  leadExtractions: number;
  formTemplates: number;
  dataExports: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt?: Date;
  usage: UsageStats;
}

export interface UsageStats {
  automationsUsed: number;
  summariesUsed: number;
  priceMonitorsActive: number;
  leadExtractionsUsed: number;
  formTemplatesUsed: number;
  dataExportsUsed: number;
  resetDate: Date;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
