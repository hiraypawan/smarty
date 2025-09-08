// Chrome Extension Content Script
// This script runs on web pages to enable Smarty functionality

console.log('🧠 Smarty Content Script Loaded');

// Simple message interface
interface Message {
  action: string;
  data?: any;
}

// Initialize content script
let isInitialized = false;
let smartyUI: HTMLElement | null = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

function initialize() {
  if (isInitialized) return;
  
  console.log('Initializing Smarty content script on:', window.location.href);
  isInitialized = true;
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    handleMessage(message)
      .then(response => sendResponse(response))
      .catch(error => {
        console.error('Content script error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep message channel open for async response
  });
  
  // Add keyboard shortcut for Smarty (Ctrl+Shift+S)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      showSmartyQuickActions();
    }
  });
  
  // Add floating action button (optional)
  addFloatingActionButton();
}

// Handle messages from background script or popup
async function handleMessage(message: Message): Promise<any> {
  const { action, data } = message;
  
  try {
    switch (action) {
      case 'extract_page_content':
        return extractPageContent();
      
      case 'summarize_page':
        return await summarizePage();
      
      case 'extract_leads':
        return extractLeads();
      
      case 'monitor_price':
        return monitorPrice(data?.selector);
      
      case 'fill_form':
        return fillForm(data?.formData);
      
      case 'show_quick_actions':
        showSmartyQuickActions();
        return { success: true };
      
      case 'hide_ui':
        hideSmartyUI();
        return { success: true };
      
      default:
        console.warn('Unknown action:', action);
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Extract page content for summarization
function extractPageContent() {
  try {
    const title = document.title || '';
    const url = window.location.href;
    
    // Try to get main content from various selectors
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '#content',
      '.post-content',
      '.entry-content',
      '.article-content'
    ];
    
    let content = '';
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = element.textContent || '';
        break;
      }
    }
    
    // Fallback to body content if no main content found
    if (!content.trim()) {
      content = document.body.textContent || '';
    }
    
    // Clean up content (remove extra whitespace, etc.)
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .slice(0, 10000); // Limit to 10k characters
    
    return {
      success: true,
      data: {
        title,
        url,
        content,
        wordCount: content.split(' ').length,
        extractedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error extracting page content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract content'
    };
  }
}

// Summarize page (sends content to background for processing)
async function summarizePage() {
  try {
    const contentData = extractPageContent();
    
    if (!contentData.success) {
      throw new Error('Failed to extract page content');
    }
    
    // Send to background script for AI processing
    const response = await chrome.runtime.sendMessage({
      action: 'process_summary',
      data: contentData.data
    });
    
    if (response && response.success) {
      showNotification('Page summarized successfully!', 'success');
      return response;
    } else {
      throw new Error(response?.error || 'Failed to process summary');
    }
  } catch (error) {
    console.error('Error summarizing page:', error);
    showNotification('Failed to summarize page', 'error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to summarize'
    };
  }
}

// Extract potential leads from the page
function extractLeads() {
  try {
    const leads: any[] = [];
    
    // Look for email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatches = document.body.textContent?.match(emailRegex) || [];
    
    // Look for phone numbers (simple pattern)
    const phoneRegex = /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g;
    const phoneMatches = document.body.textContent?.match(phoneRegex) || [];
    
    // Create lead objects
    const uniqueEmails = [...new Set(emailMatches)];
    const uniquePhones = [...new Set(phoneMatches)];
    
    uniqueEmails.forEach(email => {
      leads.push({
        email,
        source: window.location.href,
        extractedAt: new Date(),
        verified: false
      });
    });
    
    uniquePhones.forEach(phone => {
      leads.push({
        phone,
        source: window.location.href,
        extractedAt: new Date(),
        verified: false
      });
    });
    
    return {
      success: true,
      data: {
        leads,
        count: leads.length,
        source: window.location.href
      }
    };
  } catch (error) {
    console.error('Error extracting leads:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract leads'
    };
  }
}

// Monitor price on e-commerce pages
function monitorPrice(selector?: string) {
  try {
    // Common price selectors for e-commerce sites
    const priceSelectors = [
      selector,
      '.price',
      '.price-current',
      '.current-price',
      '[data-price]',
      '.product-price',
      '.sale-price',
      '.offer-price'
    ].filter(Boolean);
    
    let priceElement: Element | null = null;
    let priceText = '';
    
    for (const sel of priceSelectors) {
      if (!sel) continue;
      priceElement = document.querySelector(sel);
      if (priceElement) {
        priceText = priceElement.textContent || '';
        break;
      }
    }
    
    if (!priceElement || !priceText) {
      throw new Error('No price found on this page');
    }
    
    // Extract numeric price
    const priceMatch = priceText.match(/[\d,.]+(\d{2})/g);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
    
    return {
      success: true,
      data: {
        url: window.location.href,
        productName: document.title,
        currentPrice: price,
        currency: 'USD', // Default to USD
        selector: priceSelectors.find(s => s && document.querySelector(s)),
        lastChecked: new Date(),
        priceHistory: [{ price, date: new Date() }]
      }
    };
  } catch (error) {
    console.error('Error monitoring price:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to monitor price'
    };
  }
}

// Fill form with provided data
function fillForm(formData: Record<string, string>) {
  try {
    if (!formData) {
      throw new Error('No form data provided');
    }
    
    let fieldsFound = 0;
    
    // Fill form fields based on name, id, or placeholder
    Object.entries(formData).forEach(([key, value]) => {
      const selectors = [
        `input[name="${key}"]`,
        `input[id="${key}"]`,
        `input[placeholder*="${key}"]`,
        `textarea[name="${key}"]`,
        `select[name="${key}"]`
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element) {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          fieldsFound++;
          break;
        }
      }
    });
    
    return {
      success: true,
      data: {
        fieldsFound,
        totalFields: Object.keys(formData).length
      }
    };
  } catch (error) {
    console.error('Error filling form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fill form'
    };
  }
}

// Show Smarty quick actions UI
function showSmartyQuickActions() {
  if (smartyUI) {
    smartyUI.remove();
  }
  
  smartyUI = document.createElement('div');
  smartyUI.id = 'smarty-quick-actions';
  smartyUI.innerHTML = `
    <div class="smarty-panel">
      <div class="smarty-header">
        <span>🧠 Smarty</span>
        <button class="smarty-close" onclick="this.closest('#smarty-quick-actions').remove()">×</button>
      </div>
      <div class="smarty-actions">
        <button class="smarty-action" data-action="summarize">📝 Summarize Page</button>
        <button class="smarty-action" data-action="extract-leads">👥 Extract Leads</button>
        <button class="smarty-action" data-action="monitor-price">💰 Monitor Price</button>
        <button class="smarty-action" data-action="extract-content">📄 Extract Content</button>
      </div>
    </div>
  `;
  
  // Add event listeners
  smartyUI.querySelectorAll('.smarty-action').forEach(button => {
    button.addEventListener('click', async (e) => {
      const action = (e.target as HTMLElement).dataset.action;
      
      switch (action) {
        case 'summarize':
          await summarizePage();
          break;
        case 'extract-leads':
          const leads = extractLeads();
          if (leads.success && leads.data) {
            showNotification(`Found ${leads.data.count} potential leads`, 'success');
            chrome.runtime.sendMessage({ action: 'save_leads', data: leads.data });
          }
          break;
        case 'monitor-price':
          const price = monitorPrice();
          if (price.success) {
            showNotification('Price monitor added', 'success');
            chrome.runtime.sendMessage({ action: 'save_price_monitor', data: price.data });
          } else {
            showNotification(price.error || 'Failed to monitor price', 'error');
          }
          break;
        case 'extract-content':
          const content = extractPageContent();
          if (content.success) {
            showNotification('Content extracted successfully', 'success');
          }
          break;
      }
      
      smartyUI?.remove();
      smartyUI = null;
    });
  });
  
  document.body.appendChild(smartyUI);
}

// Hide Smarty UI
function hideSmartyUI() {
  if (smartyUI) {
    smartyUI.remove();
    smartyUI = null;
  }
}

// Add floating action button
function addFloatingActionButton() {
  if (document.getElementById('smarty-fab')) return; // Already exists
  
  const fab = document.createElement('div');
  fab.id = 'smarty-fab';
  fab.innerHTML = '🧠';
  fab.title = 'Smarty AI Assistant (Ctrl+Shift+S)';
  
  fab.addEventListener('click', showSmartyQuickActions);
  
  document.body.appendChild(fab);
}

// Show notification
function showNotification(message: string, type: 'success' | 'error' = 'success') {
  const notification = document.createElement('div');
  notification.className = `smarty-notification smarty-notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Export for testing
if (typeof window !== 'undefined') {
  (window as any).Smarty = {
    extractPageContent,
    extractLeads,
    monitorPrice,
    showQuickActions: showSmartyQuickActions,
    hideUI: hideSmartyUI
  };
}

// Content script enhanced functionality
class SmartyContentScript {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.isInitialized) return;
    
    console.log('Smarty Content Script initialized on:', window.location.href);
    
    // Listen for messages from background script
    window.addEventListener('message', this.handleMessage.bind(this));
    
    // Listen for Chrome extension messages
    chrome.runtime.onMessage.addListener(this.handleChromeMessage.bind(this));
    
    // Auto-detect page context and suggest actions
    this.analyzePageContext();
    
    // Set up mutation observer to detect dynamic content changes
    this.setupMutationObserver();
    
    // Inject Smarty floating action button
    this.injectFloatingActionButton();
    
    this.isInitialized = true;
  }

  private handleMessage(event: MessageEvent) {
    if (event.source !== window) return;
    
    const { type, data } = event.data;
    
    switch (type) {
      case 'SMARTY_EXTRACT_DATA':
        this.handleDataExtraction(data?.selectedText);
        break;
      case 'SMARTY_SUMMARIZE_PAGE':
        this.handlePageSummarization();
        break;
      case 'SMARTY_AUTO_FILL_FORM':
        this.handleAutoFillForm();
        break;
      case 'SMARTY_MONITOR_PRICE':
        this.handlePriceMonitoring();
        break;
      case 'SMARTY_EXTRACT_LEADS':
        this.handleLeadExtraction();
        break;
    }
  }

  private handleChromeMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    switch (message.type) {
      case 'GET_PAGE_DATA':
        this.getPageData().then(sendResponse);
        return true;
      case 'EXECUTE_ACTION':
        this.executeAction(message.action, message.data).then(sendResponse);
        return true;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  private async analyzePageContext() {
    const pageContext = {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      pageType: this.detectPageType(),
      hasForm: document.querySelectorAll('form').length > 0,
      hasPricing: this.detectPricingElements(),
      hasContactInfo: this.detectContactInfo(),
      isEcommerce: this.isEcommercePage(),
      isSocialMedia: this.isSocialMediaPage(),
      isJobBoard: this.isJobBoardPage()
    };

    // Send context to background script for intelligent suggestions
    chrome.runtime.sendMessage({
      type: 'PAGE_CONTEXT_ANALYZED',
      context: pageContext
    });

    // Show relevant floating actions based on context
    this.updateFloatingActions(pageContext);
  }

  private detectPageType(): string {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const content = document.body.textContent?.toLowerCase() || '';

    if (url.includes('linkedin.com') || url.includes('twitter.com') || url.includes('facebook.com')) {
      return 'social-media';
    }
    if (url.includes('amazon.com') || url.includes('ebay.com') || content.includes('add to cart')) {
      return 'ecommerce';
    }
    if (url.includes('indeed.com') || url.includes('linkedin.com/jobs') || title.includes('job')) {
      return 'job-board';
    }
    if (document.querySelectorAll('article, .article, .post, .blog-post').length > 0) {
      return 'article';
    }
    if (document.querySelectorAll('form').length > 0) {
      return 'form-page';
    }
    
    return 'general';
  }

  private detectPricingElements(): boolean {
    const priceSelectors = [
      '.price', '.cost', '.amount', '[class*="price"]', '[id*="price"]',
      '.currency', '$', '€', '£', '¥', 'USD', 'EUR', 'GBP'
    ];
    
    return priceSelectors.some(selector => {
      if (selector.startsWith('.') || selector.startsWith('[')) {
        return document.querySelector(selector) !== null;
      }
      return document.body.textContent?.includes(selector) || false;
    });
  }

  private detectContactInfo(): boolean {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phoneRegex = /(\+\d{1,3}[- ]?)?\d{10}|\(\d{3}\)\s*\d{3}-\d{4}/;
    const content = document.body.textContent || '';
    
    return emailRegex.test(content) || phoneRegex.test(content);
  }

  private isEcommercePage(): boolean {
    const ecommerceIndicators = [
      'add to cart', 'buy now', 'checkout', 'shopping cart', 'product',
      '.add-to-cart', '.buy-button', '.checkout-button', '.product-price'
    ];
    
    const content = document.body.textContent?.toLowerCase() || '';
    return ecommerceIndicators.some(indicator => {
      if (indicator.startsWith('.')) {
        return document.querySelector(indicator) !== null;
      }
      return content.includes(indicator);
    });
  }

  private isSocialMediaPage(): boolean {
    const socialDomains = ['linkedin.com', 'twitter.com', 'facebook.com', 'instagram.com', 'tiktok.com'];
    return socialDomains.some(domain => window.location.href.includes(domain));
  }

  private isJobBoardPage(): boolean {
    const jobDomains = ['indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com'];
    const jobKeywords = ['job', 'career', 'position', 'hiring', 'employment'];
    const content = document.body.textContent?.toLowerCase() || '';
    
    return jobDomains.some(domain => window.location.href.includes(domain)) ||
           jobKeywords.some(keyword => content.includes(keyword));
  }

  private setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldReanalyze = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if important elements were added (forms, prices, etc.)
          const addedElements = Array.from(mutation.addedNodes)
            .filter(node => node.nodeType === Node.ELEMENT_NODE) as Element[];
          
          if (addedElements.some(el => 
            el.tagName === 'FORM' || 
            el.querySelector('form') ||
            el.classList.contains('price') ||
            el.querySelector('.price')
          )) {
            shouldReanalyze = true;
          }
        }
      });
      
      if (shouldReanalyze) {
        setTimeout(() => this.analyzePageContext(), 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private injectFloatingActionButton() {
    // Remove existing button if present
    const existing = document.getElementById('smarty-floating-button');
    if (existing) existing.remove();

    const button = document.createElement('div');
    button.id = 'smarty-floating-button';
    button.innerHTML = `
      <div class="smarty-fab">
        <div class="smarty-fab-icon">🧠</div>
        <div class="smarty-fab-menu" id="smarty-fab-menu">
          <div class="smarty-fab-option" data-action="summarize">📄 Summarize</div>
          <div class="smarty-fab-option" data-action="extract">📊 Extract Data</div>
          <div class="smarty-fab-option" data-action="autofill">📝 Auto Fill</div>
          <div class="smarty-fab-option" data-action="leads">👥 Find Leads</div>
          <div class="smarty-fab-option" data-action="monitor">💰 Monitor Price</div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #smarty-floating-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        font-family: Arial, sans-serif;
      }
      .smarty-fab {
        position: relative;
      }
      .smarty-fab-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
      }
      .smarty-fab-icon:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.3);
      }
      .smarty-fab-menu {
        position: absolute;
        bottom: 70px;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 8px;
        min-width: 160px;
        display: none;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
      }
      .smarty-fab-menu.show {
        display: block;
        opacity: 1;
        transform: translateY(0);
      }
      .smarty-fab-option {
        padding: 12px 16px;
        cursor: pointer;
        border-radius: 6px;
        transition: background-color 0.2s;
        font-size: 14px;
        color: #333;
      }
      .smarty-fab-option:hover {
        background-color: #f0f0f0;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(button);

    // Add event listeners
    const fabIcon = button.querySelector('.smarty-fab-icon') as HTMLElement;
    const fabMenu = button.querySelector('.smarty-fab-menu') as HTMLElement;

    fabIcon.addEventListener('click', () => {
      fabMenu.classList.toggle('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!button.contains(e.target as Node)) {
        fabMenu.classList.remove('show');
      }
    });

    // Handle menu option clicks
    fabMenu.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('smarty-fab-option')) {
        const action = target.getAttribute('data-action');
        this.handleFloatingActionClick(action);
        fabMenu.classList.remove('show');
      }
    });
  }

  private updateFloatingActions(context: any) {
    const menu = document.getElementById('smarty-fab-menu');
    if (!menu) return;

    const options = menu.querySelectorAll('.smarty-fab-option');
    options.forEach(option => {
      const action = option.getAttribute('data-action');
      (option as HTMLElement).style.display = this.shouldShowAction(action, context) ? 'block' : 'none';
    });
  }

  private shouldShowAction(action: string | null, context: any): boolean {
    switch (action) {
      case 'summarize':
        return context.pageType === 'article' || context.url.includes('news') || context.url.includes('blog');
      case 'extract':
        return true; // Always show
      case 'autofill':
        return context.hasForm;
      case 'leads':
        return context.hasContactInfo || context.isSocialMedia;
      case 'monitor':
        return context.isEcommerce && context.hasPricing;
      default:
        return false;
    }
  }

  private async handleFloatingActionClick(action: string | null) {
    switch (action) {
      case 'summarize':
        await this.handlePageSummarization();
        break;
      case 'extract':
        await this.handleDataExtraction();
        break;
      case 'autofill':
        await this.handleAutoFillForm();
        break;
      case 'leads':
        await this.handleLeadExtraction();
        break;
      case 'monitor':
        await this.handlePriceMonitoring();
        break;
    }
  }

  // Action handlers (placeholder implementations)
  private async handleDataExtraction(selectedText?: string) {
    try {
      const result = {
        url: window.location.href,
        selectedText,
        extractedAt: new Date().toISOString(),
        data: 'Data extraction feature coming soon'
      };

      this.showNotification('Data extraction feature coming soon!', 'info');
      
      // Send to background for storage
      chrome.runtime.sendMessage({
        type: 'SAVE_EXTRACTED_DATA',
        data: result
      });
    } catch (error) {
      console.error('Data extraction failed:', error);
      this.showNotification('Failed to extract data', 'error');
    }
  }

  private async handlePageSummarization() {
    try {
      const result = {
        url: window.location.href,
        title: document.title,
        summary: 'Page summarization feature coming soon',
        timestamp: new Date().toISOString()
      };
      
      this.showNotification('Summarization saved (placeholder)!', 'success');
      
      // Send to background for storage
      chrome.runtime.sendMessage({
        action: 'save_summary',
        data: result
      });
    } catch (error) {
      console.error('Page summarization failed:', error);
      this.showNotification('Failed to summarize page', 'error');
    }
  }

  private async handleAutoFillForm() {
    try {
      this.showNotification('Auto-fill feature coming soon!', 'info');
    } catch (error) {
      console.error('Auto-fill failed:', error);
      this.showNotification('Failed to auto-fill forms', 'error');
    }
  }

  private async handleLeadExtraction() {
    try {
      const result = {
        leads: [{
          name: 'Sample Lead',
          email: 'sample@example.com',
          source: window.location.href,
          extractedAt: new Date().toISOString()
        }],
        url: window.location.href
      };
      
      this.showNotification('Lead extraction (placeholder) complete!', 'success');
      
      // Send to background for storage
      chrome.runtime.sendMessage({
        action: 'save_leads',
        data: result
      });
    } catch (error) {
      console.error('Lead extraction failed:', error);
      this.showNotification('Failed to extract leads', 'error');
    }
  }

  private async handlePriceMonitoring() {
    try {
      const result = {
        url: window.location.href,
        productName: 'Product from ' + window.location.hostname,
        currentPrice: 99.99,
        alertsEnabled: true,
        createdAt: new Date().toISOString()
      };
      
      this.showNotification('Price monitoring (placeholder) started!', 'success');
      
      // Send to background for storage
      chrome.runtime.sendMessage({
        action: 'save_price_monitor',
        data: result
      });
    } catch (error) {
      console.error('Price monitoring setup failed:', error);
      this.showNotification('Failed to set up price monitoring', 'error');
    }
  }

  private async getPageData() {
    return {
      url: window.location.href,
      title: document.title,
      content: document.body.innerText.slice(0, 5000), // First 5000 chars
      metadata: this.extractPageMetadata()
    };
  }

  private extractPageMetadata() {
    const metadata: Record<string, any> = {};
    
    // Extract meta tags
    document.querySelectorAll('meta').forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('itemprop');
      const content = meta.getAttribute('content');
      if (name && content) {
        metadata[name] = content;
      }
    });
    
    // Extract structured data
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script, index) => {
      try {
        metadata[`structuredData_${index}`] = JSON.parse(script.textContent || '');
      } catch (e) {
        // Ignore invalid JSON
      }
    });
    
    return metadata;
  }

  private async executeAction(action: string, data: any) {
    switch (action) {
      case 'extract-data':
        return await this.handleDataExtraction(data?.selectedText);
      case 'summarize':
        return await this.handlePageSummarization();
      case 'auto-fill':
        return await this.handleAutoFillForm();
      case 'extract-leads':
        return await this.handleLeadExtraction();
      case 'monitor-price':
        return await this.handlePriceMonitoring();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `smarty-notification smarty-notification-${type}`;
    notification.textContent = message;

    // Add notification styles if not present
    if (!document.getElementById('smarty-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'smarty-notification-styles';
      style.textContent = `
        .smarty-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 6px;
          color: white;
          font-family: Arial, sans-serif;
          font-size: 14px;
          z-index: 10001;
          max-width: 300px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          animation: smartySlideIn 0.3s ease;
        }
        .smarty-notification-success { background-color: #4CAF50; }
        .smarty-notification-error { background-color: #F44336; }
        .smarty-notification-info { background-color: #2196F3; }
        @keyframes smartySlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes smartySlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'smartySlideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SmartyContentScript());
} else {
  new SmartyContentScript();
}
