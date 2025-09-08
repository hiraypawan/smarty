import {
  User,
  ContentSummary,
  SocialMediaPost,
  Lead,
  PriceMonitoringItem,
  ExtractedData,
  AutomationTemplate,
  WorkflowExecution,
  FormTemplate,
  UserActivity,
  Subscription
} from '../types';

interface StorageData {
  users: User[];
  contentSummaries: ContentSummary[];
  socialMediaPosts: SocialMediaPost[];
  leads: Lead[];
  priceMonitors: PriceMonitoringItem[];
  extractedData: ExtractedData[];
  automationTemplates: AutomationTemplate[];
  workflowExecutions: WorkflowExecution[];
  userActivities: UserActivity[];
  currentUser: User | null;
  authToken: string | null;
}

export class ChromeStorageService {
  private currentUser: User | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Check if we have a stored current user
      const result = await chrome.storage.local.get(['currentUser', 'authToken']);
      if (result.currentUser) {
        this.currentUser = result.currentUser;
      }
      this.isInitialized = true;
      console.log('Chrome storage service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Chrome storage service:', error);
    }
  }

  // Utility methods for Chrome storage
  private async getStorageData<T>(key: string): Promise<T[]> {
    try {
      const result = await chrome.storage.local.get([key]);
      return result[key] || [];
    } catch (error) {
      console.error(`Failed to get ${key} from storage:`, error);
      return [];
    }
  }

  private async setStorageData<T>(key: string, data: T[]): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: data });
    } catch (error) {
      console.error(`Failed to set ${key} in storage:`, error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Simple password hashing for demo purposes
  private async hashPassword(password: string): Promise<string> {
    // In a real app, you'd use a proper hashing library
    // For demo purposes, we'll use a simple hash
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'smarty_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  private isValidPassword(password: string): boolean {
    return password.length >= 6; // Minimum 6 characters
  }

  // Authentication methods with improved validation
  async signUp(email: string, password: string, name: string): Promise<{ user: User | null; error: string | null; token?: string }> {
    try {
      // Validate inputs
      if (!email || !password || !name) {
        return { user: null, error: 'All fields are required' };
      }

      if (!this.isValidEmail(email)) {
        return { user: null, error: 'Please enter a valid email address' };
      }

      if (!this.isValidPassword(password)) {
        return { user: null, error: 'Password must be at least 6 characters long' };
      }

      if (name.trim().length < 2) {
        return { user: null, error: 'Name must be at least 2 characters long' };
      }

      // Check if user already exists
      const users = await this.getStorageData<User>('users');
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return { user: null, error: 'An account with this email already exists' };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const newUser: User = {
        id: this.generateId(),
        email: email.toLowerCase(),
        name: name.trim(),
        plan: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save user with hashed password (store separately for security)
      const userCredentials = {
        userId: newUser.id,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        createdAt: new Date()
      };

      users.push(newUser);
      await this.setStorageData('users', users);
      
      // Store credentials separately
      const credentials = await this.getStorageData<any>('userCredentials');
      credentials.push(userCredentials);
      await this.setStorageData('userCredentials', credentials);

      // Generate secure token
      const token = `token_${newUser.id}_${Date.now()}_${Math.random().toString(36)}`;
      
      // Set current user and token
      this.currentUser = newUser;
      await chrome.storage.local.set({ 
        currentUser: newUser, 
        authToken: token,
        tokenExpiry: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      });

      console.log('✅ User signed up successfully:', newUser.email);
      return { user: newUser, error: null, token };
    } catch (error) {
      console.error('SignUp failed:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Failed to create account. Please try again.' };
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null; token?: string }> {
    try {
      // Validate inputs
      if (!email || !password) {
        return { user: null, error: 'Email and password are required' };
      }

      if (!this.isValidEmail(email)) {
        return { user: null, error: 'Please enter a valid email address' };
      }

      // Find user by email
      const users = await this.getStorageData<User>('users');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return { user: null, error: 'Invalid email or password' };
      }

      // Get user credentials and verify password
      const credentials = await this.getStorageData<any>('userCredentials');
      const userCredential = credentials.find((cred: any) => cred.userId === user.id);
      
      if (!userCredential) {
        return { user: null, error: 'Account not found. Please sign up first.' };
      }

      // Hash the provided password and compare
      const hashedPassword = await this.hashPassword(password);
      if (hashedPassword !== userCredential.passwordHash) {
        return { user: null, error: 'Invalid email or password' };
      }

      // Generate secure token
      const token = `token_${user.id}_${Date.now()}_${Math.random().toString(36)}`;
      
      // Update last login
      user.updatedAt = new Date();
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = user;
        await this.setStorageData('users', users);
      }
      
      // Set current user and token
      this.currentUser = user;
      await chrome.storage.local.set({ 
        currentUser: user, 
        authToken: token,
        tokenExpiry: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      });

      console.log('✅ User signed in successfully:', user.email);
      return { user, error: null, token };
    } catch (error) {
      console.error('SignIn failed:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Failed to sign in. Please try again.' };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      this.currentUser = null;
      await chrome.storage.local.remove(['currentUser', 'authToken', 'tokenExpiry']);
      console.log('✅ User signed out successfully');
      return { error: null };
    } catch (error) {
      console.error('SignOut failed:', error);
      return { error: error instanceof Error ? error.message : 'Failed to sign out' };
    }
  }

  // Get user statistics
  async getUserStats(): Promise<any> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return null;

      const [summaries, leads, activities] = await Promise.all([
        this.getStorageData<ContentSummary>('contentSummaries'),
        this.getStorageData<any>('leads'),
        this.getStorageData<UserActivity>('userActivities')
      ]);

      return {
        totalSummaries: summaries.length,
        totalLeads: leads.length,
        totalActivities: activities.length,
        joinedDate: currentUser.createdAt,
        lastLogin: currentUser.updatedAt
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const result = await chrome.storage.local.get(['currentUser', 'authToken', 'tokenExpiry']);
      
      // Check if token exists and matches
      if (result.authToken !== token) {
        return null;
      }
      
      // Check if token has expired
      if (result.tokenExpiry && Date.now() > result.tokenExpiry) {
        console.log('Token expired, signing out user');
        await this.signOut();
        return null;
      }
      
      if (result.currentUser) {
        this.currentUser = result.currentUser;
        return result.currentUser;
      }
      
      return null;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // If we don't have a current user in memory, try to load from storage
      if (!this.currentUser) {
        const result = await chrome.storage.local.get(['currentUser', 'authToken', 'tokenExpiry']);
        
        // Check if we have valid stored session
        if (result.currentUser && result.authToken && result.tokenExpiry) {
          // Check if token has expired
          if (Date.now() > result.tokenExpiry) {
            console.log('Stored session expired, signing out');
            await this.signOut();
            return null;
          }
          
          this.currentUser = result.currentUser;
        }
      }
      
      return this.currentUser;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Content Summary methods
  async saveContentSummary(summary: ContentSummary): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const summaries = await this.getStorageData<ContentSummary>('contentSummaries');
    const newSummary: ContentSummary = {
      ...summary,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    summaries.unshift(newSummary); // Add to beginning
    await this.setStorageData('contentSummaries', summaries);
  }

  async getUserSummaryHistory(limit: number = 20): Promise<ContentSummary[]> {
    if (!this.currentUser) return [];
    
    const summaries = await this.getStorageData<ContentSummary>('contentSummaries');
    return summaries.slice(0, limit);
  }

  async deleteContentSummary(id: string): Promise<boolean> {
    if (!this.currentUser) return false;

    const summaries = await this.getStorageData<ContentSummary>('contentSummaries');
    const filteredSummaries = summaries.filter(s => s.id !== id);
    
    if (filteredSummaries.length < summaries.length) {
      await this.setStorageData('contentSummaries', filteredSummaries);
      return true;
    }
    return false;
  }

  // Social Media Post methods
  async saveSocialMediaPost(post: SocialMediaPost): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const posts = await this.getStorageData<SocialMediaPost>('socialMediaPosts');
    const newPost: SocialMediaPost = {
      ...post,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    posts.unshift(newPost);
    await this.setStorageData('socialMediaPosts', posts);
  }

  async getUserScheduledPosts(): Promise<SocialMediaPost[]> {
    if (!this.currentUser) return [];
    
    const posts = await this.getStorageData<SocialMediaPost>('socialMediaPosts');
    return posts.filter(p => !p.posted).sort((a, b) => {
      if (!a.scheduledFor) return 1;
      if (!b.scheduledFor) return -1;
      return a.scheduledFor.getTime() - b.scheduledFor.getTime();
    });
  }

  // Lead management methods
  async saveLeads(leads: Lead[]): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const existingLeads = await this.getStorageData<Lead>('leads');
    const newLeads = leads.map(lead => ({
      ...lead,
      id: this.generateId(),
      extractedAt: new Date()
    }));
    
    existingLeads.unshift(...newLeads);
    await this.setStorageData('leads', existingLeads);
  }

  async getLeads(limit: number = 50): Promise<Lead[]> {
    if (!this.currentUser) return [];
    
    const leads = await this.getStorageData<Lead>('leads');
    return leads.slice(0, limit);
  }

  // Price monitoring methods
  async savePriceMonitor(item: PriceMonitoringItem): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const monitors = await this.getStorageData<PriceMonitoringItem>('priceMonitors');
    const newMonitor: PriceMonitoringItem = {
      ...item,
      id: this.generateId()
    };
    
    monitors.unshift(newMonitor);
    await this.setStorageData('priceMonitors', monitors);
  }

  async getPriceMonitors(): Promise<PriceMonitoringItem[]> {
    if (!this.currentUser) return [];
    
    const monitors = await this.getStorageData<PriceMonitoringItem>('priceMonitors');
    return monitors;
  }

  // Activity tracking
  async logUserActivity(action: string, details: Record<string, any>): Promise<void> {
    if (!this.currentUser) return;

    const activities = await this.getStorageData<UserActivity>('userActivities');
    const activity: UserActivity = {
      id: this.generateId(),
      userId: this.currentUser.id,
      action,
      details,
      timestamp: new Date()
    };
    
    activities.unshift(activity);
    // Keep only last 100 activities to prevent storage bloat
    if (activities.length > 100) {
      activities.splice(100);
    }
    
    await this.setStorageData('userActivities', activities);
  }

  async getUserHistory(): Promise<UserActivity[]> {
    if (!this.currentUser) return [];
    
    const activities = await this.getStorageData<UserActivity>('userActivities');
    return activities.slice(0, 20);
  }

  // Generic data storage
  async saveExtractedData(executionId: string, data: any, format: string): Promise<{ id: string }> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const extractedDataList = await this.getStorageData<ExtractedData>('extractedData');
    const newData: ExtractedData = {
      id: this.generateId(),
      executionId,
      url: data.url || '',
      data,
      schema: [],
      extractedAt: new Date(),
      format: format as any
    };
    
    extractedDataList.unshift(newData);
    await this.setStorageData('extractedData', extractedDataList);
    
    return { id: newData.id };
  }

  // Get user usage statistics
  async getUserUsage(userId: string): Promise<any> {
    try {
      const summaries = await this.getStorageData<ContentSummary>('contentSummaries');
      const leads = await this.getStorageData<Lead>('leads');
      const priceMonitors = await this.getStorageData<PriceMonitoringItem>('priceMonitors');
      const activities = await this.getStorageData<UserActivity>('userActivities');
      
      return {
        summariesUsed: summaries.length,
        leadExtractionsUsed: leads.length,
        priceMonitorsActive: priceMonitors.filter(p => p.alertsEnabled).length,
        automationsUsed: activities.filter(a => a.action === 'automation_executed').length,
        formTemplatesUsed: activities.filter(a => a.action === 'form_filled').length,
        dataExportsUsed: activities.filter(a => a.action === 'data_exported').length,
        resetDate: new Date()
      };
    } catch (error) {
      console.error('Failed to get user usage:', error);
      return null;
    }
  }

  // Cleanup method
  async clearAllData(): Promise<void> {
    try {
      await chrome.storage.local.clear();
      this.currentUser = null;
      console.log('All storage data cleared');
    } catch (error) {
      console.error('Failed to clear storage data:', error);
    }
  }
}

// Export singleton instance
export const storageService = new ChromeStorageService();
