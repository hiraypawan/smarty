// Chrome Extension Background Script (Service Worker)
// This runs in the background and handles extension lifecycle events

import { storageService } from '../services/storageService';

interface Message {
  action: string;
  data?: any;
}

interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Initialize background script
console.log('🧠 Smarty Background Script Initialized');

// Create context menu for side panel access (merged with installation handler below)

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openSidePanel' && tab) {
    openSidePanel(tab.windowId);
  }
});

// Function to open side panel
async function openSidePanel(windowId?: number) {
  try {
    console.log('Attempting to open side panel...');
    
    // Check Chrome version for side panel support
    const isModernChrome = typeof chrome?.sidePanel !== 'undefined';
    
    if (isModernChrome) {
      console.log('Modern Chrome detected, using side panel API...');
      
      // Method 1: Try opening existing side panel
      try {
        if ((chrome.sidePanel as any).open) {
          if (windowId) {
            await (chrome.sidePanel as any).open({ windowId });
          } else {
            await (chrome.sidePanel as any).open({});
          }
          console.log('✅ Side panel opened successfully!');
          return;
        }
      } catch (apiError) {
        console.log('Direct API open failed, trying configuration...', apiError);
      }
      
      // Method 2: Try setting path and enabling
      try {
        if ((chrome.sidePanel as any).setOptions) {
          await (chrome.sidePanel as any).setOptions({
            path: 'sidepanel.html',
            enabled: true
          });
          console.log('✅ Side panel configured!');
          return;
        }
      } catch (configError) {
        console.log('Configuration failed, trying new tab fallback...', configError);
      }
    } else {
      console.log('Legacy Chrome detected or side panel not supported');
    }
    
    // Fallback: Open in new tab with proper window sizing
    console.log('📂 Opening in new tab as fallback...');
    const url = chrome.runtime.getURL('sidepanel.html');
    
    chrome.tabs.create({
      url: url,
      active: true
    }, (tab) => {
      if (tab?.id) {
        // Try to position the tab as a side panel would be
        chrome.windows.update(tab.windowId!, {
          width: 1200,
          height: 800
        }).catch(() => {
          // Ignore window sizing errors
        });
        console.log('✅ Opened in new tab successfully!');
      }
    });
    
  } catch (error) {
    console.error('❌ All side panel methods failed:', error);
    
    // Absolute final fallback
    try {
      chrome.tabs.create({
        url: chrome.runtime.getURL('sidepanel.html')
      });
      console.log('✅ Emergency fallback successful');
    } catch (emergencyError) {
      console.error('❌ Emergency fallback failed:', emergencyError);
      
      // Show notification if everything fails
      try {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Smarty Extension',
          message: 'Unable to open side panel. Please right-click and select "Open Smarty Side Panel"'
        });
      } catch (notificationError) {
        // Ignore notification errors
        console.log('Notification failed:', notificationError);
      }
    }
  }
}

// Handle extension action (clicking the extension icon)
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked!');
  await openSidePanel(tab.windowId);
});

// Handle Chrome extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Smarty extension installed:', details.reason);
  
  // Create context menu for side panel access
  chrome.contextMenus.create({
    id: 'openSidePanel',
    title: 'Open Smarty Side Panel',
    contexts: ['page', 'selection', 'link']
  });
  
  if (details.reason === 'install') {
    // Set default settings or show welcome page
    chrome.storage.local.set({
      welcomeShown: false,
      settings: {
        notifications: true,
        autoSummarize: false,
        theme: 'light'
      }
    });
    
    // Log installation activity
    storageService.logUserActivity('extension_installed', {
      reason: details.reason,
      timestamp: new Date().toISOString()
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  // Handle async messages properly
  handleMessage(message, sender)
    .then(response => {
      sendResponse(response);
    })
    .catch(error => {
      console.error('Error handling message:', error);
      sendResponse({
        success: false,
        error: error.message || 'Unknown error'
      });
    });
  
  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Message handler function
async function handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<MessageResponse> {
  const { action, data } = message;
  
  try {
    switch (action) {
      case 'ping':
        return { success: true, data: 'pong' };
      
      case 'get_user':
        // Ensure storage service is initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        const user = await storageService.getCurrentUser();
        return { success: true, data: user };
      
      case 'sign_in':
        const { email, password } = data;
        const signInResult = await storageService.signIn(email, password);
        return { 
          success: !signInResult.error, 
          data: signInResult.user,
          error: signInResult.error || undefined
        };
      
      case 'sign_up':
        const { email: signUpEmail, password: signUpPassword, name } = data;
        const signUpResult = await storageService.signUp(signUpEmail, signUpPassword, name);
        return { 
          success: !signUpResult.error, 
          data: signUpResult.user,
          error: signUpResult.error || undefined
        };
      
      case 'sign_out':
        const signOutResult = await storageService.signOut();
        return { 
          success: !signOutResult.error,
          error: signOutResult.error || undefined
        };
      
      case 'save_summary':
        await storageService.saveContentSummary(data);
        await storageService.logUserActivity('content_summarized', {
          url: data.url,
          title: data.title
        });
        return { success: true };
      
      case 'get_summaries':
        const summaries = await storageService.getUserSummaryHistory(data?.limit || 20);
        return { success: true, data: summaries };
      
      case 'save_leads':
        await storageService.saveLeads(data.leads);
        await storageService.logUserActivity('leads_extracted', {
          count: data.leads.length,
          source: data.source
        });
        return { success: true };
      
      case 'get_leads':
        const leads = await storageService.getLeads(data?.limit || 50);
        return { success: true, data: leads };
      
      case 'save_price_monitor':
        await storageService.savePriceMonitor(data);
        await storageService.logUserActivity('price_monitor_created', {
          url: data.url,
          productName: data.productName
        });
        return { success: true };
      
      case 'get_price_monitors':
        const monitors = await storageService.getPriceMonitors();
        return { success: true, data: monitors };
      
      case 'get_user_stats':
        const currentUser = await storageService.getCurrentUser();
        if (!currentUser) {
          return { success: false, error: 'User not authenticated' };
        }
        const stats = await storageService.getUserUsage(currentUser.id);
        return { success: true, data: stats };
      
      case 'log_activity':
        await storageService.logUserActivity(data.action, data.details);
        return { success: true };
      
      case 'get_user_history':
        const history = await storageService.getUserHistory();
        return { success: true, data: history };
      
      case 'clear_all_data':
        // Debug action to clear all stored data
        try {
          await chrome.storage.local.clear();
          return { success: true, data: 'All data cleared successfully' };
        } catch (error) {
          return { success: false, error: 'Failed to clear data' };
        }
      
      default:
        console.warn('Unknown action:', action);
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    console.error('Error in handleMessage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Handle tab updates for potential content monitoring
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    // Log page visit activity (optional)
    storageService.logUserActivity('page_visited', {
      url: tab.url,
      title: tab.title || 'Unknown',
      tabId: tabId
    }).catch(console.error);
  }
});

// Handle alarms for scheduled tasks
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm fired:', alarm.name);
  
  switch (alarm.name) {
    case 'price_check':
      // Handle price monitoring checks
      handlePriceMonitoringCheck();
      break;
    
    case 'social_media_post':
      // Handle scheduled social media posts
      handleScheduledPosts();
      break;
    
    default:
      console.log('Unknown alarm:', alarm.name);
  }
});

// Price monitoring check handler
async function handlePriceMonitoringCheck() {
  try {
    console.log('Running price monitoring check...');
    // This would typically check all active price monitors
    // For now, just log the activity
    await storageService.logUserActivity('price_check_scheduled', {
      timestamp: new Date().toISOString(),
      checkType: 'automated'
    });
  } catch (error) {
    console.error('Price monitoring check failed:', error);
  }
}

// Scheduled posts handler
async function handleScheduledPosts() {
  try {
    console.log('Checking for scheduled posts...');
    // This would typically check for posts ready to be published
    // For now, just log the activity
    await storageService.logUserActivity('scheduled_posts_check', {
      timestamp: new Date().toISOString(),
      checkType: 'automated'
    });
  } catch (error) {
    console.error('Scheduled posts check failed:', error);
  }
}

// Setup periodic alarms
chrome.alarms.create('price_check', { delayInMinutes: 1, periodInMinutes: 60 }); // Every hour
chrome.alarms.create('social_media_post', { delayInMinutes: 5, periodInMinutes: 30 }); // Every 30 minutes

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { handleMessage };
}

