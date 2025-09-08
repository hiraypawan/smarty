import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './sidepanel.css';

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
}

interface Summary {
  id: string;
  url: string;
  title: string;
  summary: string;
  keyPoints: string[];
  createdAt: Date;
  userId: string;
}

interface Lead {
  email: string;
  name: string;
  source: string;
}

interface AppState {
  user: User | null;
  summaries: Summary[];
  leads: Lead[];
  loading: boolean;
  error: string | null;
  activeTab: string;
  stats: {
    totalSummaries: number;
    totalLeads: number;
    totalActions: number;
  };
}

// Message helper function
const sendMessage = (action: string, data?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.success === false) {
        reject(new Error(response.error || 'Unknown error'));
      } else {
        resolve(response?.data || response);
      }
    });
  });
};


const SidePanel: React.FC = () => {
  const [state, setState] = useState<AppState>({
    user: null,
    summaries: [],
    leads: [],
    loading: true,
    error: null,
    activeTab: 'home',
    stats: {
      totalSummaries: 0,
      totalLeads: 0,
      totalActions: 0
    }
  });

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    isSignUp: false
  });

  useEffect(() => {
    initializeSidePanel();
  }, []);

  const initializeSidePanel = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Check if user is logged in
      try {
        const user = await sendMessage('get_user');
        if (user) {
          await loadUserData(user);
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            loading: false
          }));
        }
      } catch (error) {
        console.log('No user found, showing auth screen');
        setState(prev => ({
          ...prev,
          user: null,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Failed to initialize side panel:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize'
      }));
    }
  };

  const loadUserData = async (user: User) => {
    try {
      const [summaries, leads] = await Promise.all([
        sendMessage('get_summaries', { limit: 50 }).catch(() => []),
        sendMessage('get_leads', { limit: 100 }).catch(() => [])
      ]);

      setState(prev => ({
        ...prev,
        user,
        summaries: summaries || [],
        leads: leads || [],
        stats: {
          totalSummaries: (summaries || []).length,
          totalLeads: (leads || []).length,
          totalActions: (summaries || []).length + (leads || []).length
        },
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        user,
        loading: false,
        error: 'Failed to load user data'
      }));
    }
  };

  const handleAuth = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const action = authForm.isSignUp ? 'sign_up' : 'sign_in';
      const data = authForm.isSignUp 
        ? { email: authForm.email, password: authForm.password, name: authForm.name }
        : { email: authForm.email, password: authForm.password };
      
      const result = await sendMessage(action, data);
      
      await loadUserData(result);
      
      // Clear form
      setAuthForm({
        email: '',
        password: '',
        name: '',
        isSignUp: false
      });
      
      setState(prev => ({ ...prev, activeTab: 'home' }));
    } catch (error) {
      console.error('Authentication failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
    }
  };

  const handleSignOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await sendMessage('sign_out');
      setState(prev => ({
        ...prev,
        user: null,
        summaries: [],
        leads: [],
        stats: { totalSummaries: 0, totalLeads: 0, totalActions: 0 },
        loading: false,
        activeTab: 'auth'
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to sign out'
      }));
    }
  };


  const summarizeCurrentPage = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      
      if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('moz-extension://') || tab.url.startsWith('chrome-extension://')) {
        setState(prev => ({ ...prev, error: 'Cannot summarize this page. Try navigating to a regular website.' }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const domain = new URL(tab.url).hostname;
      const mockSummary = {
        id: 'summary_' + Date.now(),
        url: tab.url,
        title: tab.title || 'Untitled Page',
        summary: `This page from ${domain} contains valuable information. In a production version, AI would analyze the actual content and provide an intelligent summary of the key points, main topics, and actionable insights from the page.`,
        keyPoints: [
          `Main topic: Content from ${domain}`,
          'Key insights and information extracted',
          'Actionable recommendations provided',
          'Important data points highlighted'
        ],
        sentiment: 'neutral' as const,
        readingTime: Math.ceil(Math.random() * 5) + 2,
        userId: state.user?.id || 'demo',
        createdAt: new Date()
      };
      
      await sendMessage('save_summary', mockSummary);
      
      // Refresh data
      await loadUserData(state.user!);
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '✅ Page Summarized!',
        message: `Summary of "${tab.title}" has been saved.`
      });
      
    } catch (error) {
      console.error('Failed to summarize page:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to summarize page'
      }));
    }
  };

  const extractLeads = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      
      if (!tab?.url || tab.url.startsWith('chrome://')) {
        setState(prev => ({ ...prev, error: 'Cannot extract leads from this page' }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const domain = new URL(tab.url).hostname;
      const mockLeads = [
        { email: `info@${domain}`, name: 'Contact Person', source: tab.url },
        { email: `support@${domain}`, name: 'Support Team', source: tab.url }
      ];
      
      await sendMessage('save_leads', { leads: mockLeads, source: tab.url });
      
      // Refresh data
      await loadUserData(state.user!);
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '🎯 Leads Extracted!',
        message: `Found ${mockLeads.length} potential leads from ${domain}`
      });
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to extract leads'
      }));
    }
  };

  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (state.loading) {
    return (
      <div className="side-panel">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading...</h2>
          <p>Preparing your AI assistant</p>
        </div>
      </div>
    );
  }

  if (!state.user) {
    return (
      <div className="side-panel">
        <div className="auth-container">
          <div className="auth-header">
            <div className="logo">🧠</div>
            <h1>Smarty</h1>
            <p>Your AI Automation Assistant</p>
          </div>
          
          {state.error && (
            <div className="error-message">
              {state.error}
            </div>
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="auth-form">
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            {authForm.isSignUp && (
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
            )}
            
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            
            <button type="submit" className="btn-primary">
              {authForm.isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
          
          <div className="auth-toggle">
            <button
              type="button"
              className="btn-link"
              onClick={() => setAuthForm(prev => ({ 
                ...prev, 
                isSignUp: !prev.isSignUp,
                email: '',
                password: '',
                name: ''
              }))}
            >
              {authForm.isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"
              }
            </button>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <div className="side-panel">
      <div className="panel-header">
        <div className="user-info">
          <div className="avatar">
            {state.user.avatar ? (
              <img src={state.user.avatar} alt={state.user.name} />
            ) : (
              <div className="avatar-placeholder">
                {(state.user.name && state.user.name.length > 0) 
                  ? state.user.name.charAt(0).toUpperCase() 
                  : '?'}
              </div>
            )}
          </div>
          <div className="user-details">
            <h3>{state.user.name}</h3>
            <span className="plan-badge">{state.user.plan}</span>
          </div>
        </div>
        
        <button className="btn-icon" onClick={handleSignOut} title="Sign Out">
          🚪
        </button>
      </div>
      
      <nav className="panel-nav">
        <button 
          className={`nav-btn ${state.activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'home' }))}
        >
          🏠 Home
        </button>
        <button 
          className={`nav-btn ${state.activeTab === 'summaries' ? 'active' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'summaries' }))}
        >
          📝 Summaries
        </button>
        <button 
          className={`nav-btn ${state.activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setState(prev => ({ ...prev, activeTab: 'leads' }))}
        >
          🎯 Leads
        </button>
      </nav>
      
      {state.error && (
        <div className="error-message">
          {state.error}
          <button 
            className="error-dismiss"
            onClick={() => setState(prev => ({ ...prev, error: null }))}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="panel-content">
        {state.activeTab === 'home' && (
          <div className="home-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-value">{state.stats.totalSummaries}</div>
                <div className="stat-label">Summaries</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-value">{state.stats.totalLeads}</div>
                <div className="stat-label">Leads</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-value">{state.stats.totalActions}</div>
                <div className="stat-label">Total Actions</div>
              </div>
            </div>
            
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button 
                  className="action-btn"
                  onClick={summarizeCurrentPage}
                  disabled={state.loading}
                >
                  <span className="action-icon">📝</span>
                  <div>
                    <strong>Summarize Page</strong>
                    <small>Get AI summary of current page</small>
                  </div>
                </button>
                
                <button 
                  className="action-btn"
                  onClick={extractLeads}
                  disabled={state.loading}
                >
                  <span className="action-icon">🎯</span>
                  <div>
                    <strong>Extract Leads</strong>
                    <small>Find contact information</small>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {state.summaries.slice(0, 3).map(summary => (
                  <div key={summary.id} className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-content">
                      <p><strong>Summarized:</strong> {summary.title}</p>
                      <small>{formatDate(summary.createdAt)}</small>
                    </div>
                  </div>
                ))}
                {state.leads.slice(0, 2).map((lead, index) => (
                  <div key={`lead-${index}`} className="activity-item">
                    <div className="activity-icon">🎯</div>
                    <div className="activity-content">
                      <p><strong>Lead:</strong> {lead.name} ({lead.email})</p>
                      <small>From: {new URL(lead.source).hostname}</small>
                    </div>
                  </div>
                ))}
                {state.stats.totalActions === 0 && (
                  <div className="empty-state">
                    <p>No activity yet. Use the quick actions above to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {state.activeTab === 'summaries' && (
          <div className="summaries-tab">
            <div className="tab-header">
              <h3>Content Summaries</h3>
              <button 
                className="btn-refresh"
                onClick={() => loadUserData(state.user!)}
              >
                🔄
              </button>
            </div>
            
            <div className="summaries-list">
              {state.summaries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h4>No summaries yet</h4>
                  <p>Summarize web pages to see them here.</p>
                </div>
              ) : (
                state.summaries.map(summary => (
                  <div key={summary.id} className="summary-card">
                    <div className="summary-header">
                      <h4>{summary.title}</h4>
                      <small>{formatDate(summary.createdAt)}</small>
                    </div>
                    <p className="summary-text">{summary.summary}</p>
                    {summary.keyPoints && (
                      <div className="key-points">
                        <strong>Key Points:</strong>
                        <ul>
                          {summary.keyPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <a 
                      href={summary.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      🔗 View Source
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {state.activeTab === 'leads' && (
          <div className="leads-tab">
            <div className="tab-header">
              <h3>Generated Leads</h3>
              <button 
                className="btn-refresh"
                onClick={() => loadUserData(state.user!)}
              >
                🔄
              </button>
            </div>
            
            <div className="leads-list">
              {state.leads.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎯</div>
                  <h4>No leads extracted yet</h4>
                  <p>Use "Extract Leads" to find contact information.</p>
                </div>
              ) : (
                state.leads.map((lead, index) => (
                  <div key={`lead-${index}`} className="lead-card">
                    <div className="lead-info">
                      <h4>{lead.name}</h4>
                      <p>{lead.email}</p>
                    </div>
                    <div className="lead-source">
                      <small>From: {new URL(lead.source).hostname}</small>
                      <a 
                        href={lead.source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="source-link"
                      >
                        🔗 Visit
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Initialize side panel
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SidePanel />);
} else {
  console.error('Could not find root container');
}
