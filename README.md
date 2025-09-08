# 🧠 Smarty - Intelligent Browser Extension SaaS

**Smarty** is a powerful, AI-driven browser extension that revolutionizes how you interact with web content through intelligent automation. It combines the power of Google's Gemini AI with smart workflow orchestration to provide context-aware automation that actually understands what you're trying to accomplish.

## ✨ Key Features

### 🎯 Smart Context-Aware Automation
- **Intelligent Page Analysis**: Automatically detects page type, forms, pricing, contact info, and suggests relevant actions
- **AI-Powered Suggestions**: Uses Gemini AI to recommend the most appropriate automation for each webpage
- **One-Click Workflows**: Execute complex multi-step automations with a single click

### 🔧 Core Automation Modules
- **📄 Content Summarizer**: AI-powered summarization of articles, webpages, and YouTube videos
- **📊 Data Extraction Tool**: Point-and-click data scraping with intelligent field detection
- **📝 Form Auto-Fill Assistant**: Smart form filling with template management
- **👥 Lead Generator**: Automated contact extraction and verification
- **💰 E-commerce Price Monitor**: Real-time price tracking with intelligent alerts
- **📱 Social Media Scheduler**: AI-generated content with optimal posting time analysis

### 🤖 Pre-Built Automation Modes
- **💼 Job Application Mode**: Auto-detect job postings → Extract recruiter contacts → Fill applications → Submit
- **🛒 E-commerce Monitoring**: Track competitor prices → Generate alerts → Create pricing strategies
- **📚 Content Research Mode**: Summarize articles → Aggregate research → Send weekly updates

### 🚀 Advanced Features
- **Cross-Device Sync**: Seamless experience across all your devices
- **Smart Workflow Engine**: Chains automations intelligently based on context
- **Background Processing**: Periodic tasks like price monitoring and research updates
- **Notification System**: Browser notifications, email alerts, and dashboard notifications
- **User Authentication**: Secure login with email/password and Google OAuth
- **Freemium SaaS Model**: Free tier with Pro and Enterprise options

## 🏗️ Architecture

### Frontend (Browser Extension)
- **Manifest V3** Chrome extension
- **TypeScript** for type safety and better development experience
- **React** for dashboard interface
- **Webpack** for bundling and optimization

### Backend Services
- **Supabase** for database, authentication, and real-time features
- **Google Gemini AI** for intelligent content generation and analysis
- **Background Workers** for periodic tasks and automation

### Key Components
- **Background Service Worker**: Orchestrates automations and handles alarms
- **Content Scripts**: Inject smart UI elements and handle page interactions
- **Popup Interface**: Quick access to automations and smart suggestions
- **Web Dashboard**: Comprehensive management and analytics interface

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Chrome browser for testing
- Supabase account (free tier available)
- Google AI Studio account for Gemini API access

### 1. Clone and Install
```bash
git clone <repository-url>
cd smarty
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Database Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema setup (see `docs/database-schema.sql`)
3. Enable Row Level Security (RLS) policies
4. Configure authentication providers

### 4. Build the Extension
```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

### 5. Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `dist` folder
4. The Smarty extension should now appear in your extensions

## 🔧 Development

### Project Structure
```
smarty/
├── public/                 # Static assets and manifest
│   ├── manifest.json      # Extension manifest
│   └── icons/             # Extension icons
├── src/
│   ├── background/        # Background service worker
│   ├── content/           # Content scripts and styles
│   ├── popup/             # Extension popup interface
│   ├── dashboard/         # Web dashboard (React)
│   ├── modules/           # Core automation modules
│   ├── services/          # Backend services integration
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── dist/                  # Built extension files
└── docs/                  # Documentation
```

### Key Scripts
```bash
npm run dev          # Development build with watch
npm run build        # Production build
npm run test         # Run tests
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

### Development Workflow
1. Make changes to source files in `src/`
2. Run `npm run dev` to watch for changes
3. Reload the extension in Chrome (`chrome://extensions/`)
4. Test functionality on various websites

## 📋 Core Modules

### Content Summarizer
```typescript
const summarizer = new ContentSummarizer();
const summary = await summarizer.summarizePage(url);
// Returns: { summary, keyPoints, sentiment, readingTime }
```

### Smart Workflow Engine
```typescript
const engine = new SmartWorkflowEngine();
const suggestions = await engine.detectContextAndSuggest(pageContext);
const execution = await engine.executeFullAutomationFlow(pageContext);
```

### Data Extraction Tool
```typescript
const extractor = new DataExtractionTool();
const data = await extractor.extractData({
  url: currentUrl,
  selectors: ['.price', '.title', '.description']
});
```

### Social Media Scheduler
```typescript
const scheduler = new SocialMediaScheduler();
const post = await scheduler.schedulePost(
  'linkedin',
  'Check out this amazing content!',
  caption, // AI-generated
  scheduledTime
);
```

## 🔒 Security & Privacy

### Data Protection
- All sensitive data encrypted at rest and in transit
- User data stored securely in Supabase with RLS policies
- No tracking or analytics without explicit user consent
- GDPR and CCPA compliant data handling

### Extension Security
- Manifest V3 for enhanced security
- Minimal permissions requested
- Content Security Policy (CSP) implemented
- Regular security audits and updates

## 💳 SaaS Plans

### 🆓 Free Plan
- 50 automations per month
- 10 content summaries
- 3 price monitors
- Basic support

### 💼 Pro Plan ($15/month)
- Unlimited automations
- 500 summaries per month
- 50 price monitors
- Cross-device sync
- Priority support
- Advanced analytics

### 🏢 Enterprise Plan ($50/month)
- Everything in Pro
- API access
- Custom integrations
- Team collaboration
- Dedicated support
- Custom automation workflows

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Module Development Guide](docs/modules.md)
- [Database Schema](docs/database-schema.sql)
- [Deployment Guide](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

## 🚀 Roadmap

### Phase 1 (Current)
- ✅ Core automation modules
- ✅ Smart workflow engine
- ✅ Browser extension MVP
- 🔄 Web dashboard
- 🔄 User authentication

### Phase 2
- 📱 Mobile companion app
- 🌐 More AI models integration
- 🔗 Third-party integrations (Zapier, IFTTT)
- 📊 Advanced analytics dashboard
- 🎯 Personalization engine

### Phase 3
- 🤖 Custom automation builder
- 👥 Team collaboration features
- 🌍 Multi-language support
- 📈 Enterprise features
- 🎓 AI training on user data

## ❓ FAQ

**Q: Does Smarty work on all websites?**
A: Smarty works on most websites, but some sites with strict security policies may limit functionality.

**Q: Is my data secure?**
A: Yes! All data is encrypted and stored securely. We follow industry best practices for data protection.

**Q: Can I cancel my subscription anytime?**
A: Absolutely! You can cancel anytime with no questions asked.

**Q: Does it work offline?**
A: Some features work offline, but AI-powered features require internet connectivity.

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request? Please:
1. Check existing [Issues](../../issues)
2. Create a new issue with detailed description
3. Include steps to reproduce (for bugs)
4. Add relevant labels

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI team for the powerful AI capabilities
- Supabase team for the excellent backend-as-a-service platform
- Chrome Extensions team for the robust extension platform
- The open-source community for inspiration and tools

---

**Built with ❤️ by the Smarty team**

For support, email us at support@smarty-extension.com or join our [Discord community](https://discord.gg/smarty).
