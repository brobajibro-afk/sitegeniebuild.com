# Requirements Document

## 1. Application Overview

**Application Name**: SiteGenie

**Description**: An AI-powered collaborative coding IDE platform enabling users to describe applications through natural language, generate complete React projects with multi-agent AI pipeline, edit code in real-time, manage projects with version control, and deploy applications directly to production.

## 2. Users and Usage Scenarios

**Target Users**:
- Developers seeking rapid prototyping and AI-assisted development
- Non-technical users creating web applications
- Organizations managing multiple projects

**Core Usage Scenarios**:
- User registers account and creates new project
- User describes application requirements through AI chat
- AI generates complete React project with proper structure
- User edits code with real-time preview and AI assistance
- User deploys application to Vercel or exports to GitHub
- User manages project versions and restores previous states
- User purchases token packages via Razorpay to continue AI generation

## 3. Page Structure and Functionality

### Global Layout — AppShell Component (All Authenticated Pages)

**Narrow Icon Sidebar** (56px width, fixed left edge):

**Top Section Icons** (vertical alignment):
- Logo icon (SiteGenie brand mark)
- User avatar circle
- Home/Dashboard icon
- Projects/folder icon
- Plugins icon
- Chat icon
- Write/pen icon

**Bottom Section Icons** (vertical alignment):
- Credits count display (number + \"Credits\" label)
- Bell/notifications icon
- Video icon
- Help/? icon
- User avatar circle with initial letter

**Sidebar Behavior**:
- Icons only, no text labels
- Active page highlighted with background color
- Hover shows tooltip with page name
- Fixed position, always visible on authenticated pages

**Main Content Area**:
- Occupies remaining width after sidebar
- Full viewport height
- Page-specific content renders here

### Page Hierarchy

```
├── Landing Page (/)
├── Authentication Pages
│   ├── Registration Page (/register)
│   └── Login Page (/login)
├── Home Page (/home)
├── Projects Page (/dashboard)
├── Subscription Page (/subscription)
└── Workspace Page (/workspace/:projectId)
    ├── Top Bar (h-10): Navigation + Actions
    ├── Left Icon Strip (40px): Panel Switcher
    ├── Main Area: Preview/Editor
    └── Right Panel: AI Chat
```

### 3.1 Landing Page (/)

**Hero Section**:
- Display bold headline with gradient text effect
- Show animated background with particles or blob shapes
- Provide two prominent CTA buttons: \"Start Building Free\" and \"Watch Demo\"
- Display live preview or mockup of the IDE interface
- \"Start Building Free\" button navigates to /home if user is logged in, or /login if not logged in
- \"Watch Demo\" button plays product demo video or interactive tour

**Tech Stack Ticker/Badge Row**:
- Display horizontal scrolling or static row of technology badges
- Show supported technologies: React, Vite, Tailwind CSS, Node.js, Express, Supabase, Firebase, TypeScript, Next.js 15 App Router, Shadcn UI, Monaco Editor, Sandpack, OpenRouter API, Claude API, Vercel AI SDK, LangGraph
- Each badge shows technology logo and name

**How It Works Section**:
- Display 3-step visual process with illustrations
- Step 1: Type - user inputs requirements in natural language
- Step 2: Generate - AI creates complete project with code
- Step 3: Preview - instant live preview opens, user can edit and rebuild

**Capabilities Showcase Section**:
- Display comprehensive list of supported project types:
  + HTML, CSS, JavaScript projects
  + React + Vite apps
  + Tailwind CSS UI components
  + Frontend dashboards
  + Backend APIs
  + Database integration projects
  + Authentication systems
  + AI chat applications
  + Mobile-style responsive apps
  + Games (2D/3D simple browser games)
  + Admin panels
  + SaaS applications
  + E-commerce sites
  + Landing pages
- Display additional capabilities:
  + File upload projects
  + Voice/text prompts
  + API integrations
  + One-click deployment (GitHub, Vercel)
  + Live editing of generated code
  + Preview support

**Live Preview Features Section**:
- Highlight preview capabilities:
  + Live browser preview
  + Real-time UI rendering
  + Mobile responsive preview
  + Component preview
  + Interactive app testing
  + Instant regenerate/update after prompt changes

**Best At Section**:
- Display showcase cards highlighting SiteGenie's strengths:
  + Fast UI generation
  + Startup MVPs
  + AI apps
  + Dashboard/admin systems
  + Clone apps
  + Modern landing pages
- Each card shows example project thumbnail and description

**Features Section**:
- Display 3-6 feature cards with icons
- Each card highlights AI capabilities: natural language to code, instant deployment, AI code review, multi-agent pipeline, version control, multi-model AI support

**Testimonials/Showcase Section**:
- Display demo project cards showing generated applications
- Each card shows project thumbnail, description, tech stack used

**Pricing Section**:
- Display token packages with Razorpay pricing:
  + ₹300 → 600 tokens
  + ₹500 → 1000 tokens
  + ₹1000 → 2000 tokens
  + ₹5000 → 9000 tokens
- Each package shows token amount and pricing
- Provide \"Purchase\" button for each package

**Footer**:
- Display navigation links: About, Documentation, Blog, Support, Terms, Privacy
- Show social media icons
- Display copyright information

### 3.2 Registration Page (/register)

**Functionality**:
- User inputs email and password
- User clicks \"Continue with Google\" button for Google OAuth registration
- Create new user account in Supabase
- Redirect to home page after successful registration

### 3.3 Login Page (/login)

**Functionality**:
- User inputs email and password
- User clicks \"Continue with Google\" button for Google OAuth login
- Authenticate user credentials
- Redirect to home page after successful login

### 3.4 Home Page (/home)

**Layout**: Full-height gradient hero banner with AppShell sidebar on left

**Hero Banner**:
- Purple/lavender gradient background
- Watermark text \"SiteGenie\" in background
- 3D robot/mascot illustration positioned on right side
- Large headline: \"Prompt Your Next App\" with gradient effect on \"Your\"

**Prompt Input Box** (centered, prominent):
- Large white floating textarea (rounded-2xl, shadow, ~3 rows height)
- Bottom toolbar within input box:
  + Left side: \"Deep Build\" dropdown pill, \"Upload\" pill, \"Skills\" pill
  + Right side: filter/settings icon, microphone icon, send button (black filled circle)

**Category Pills Row** (below input box):
- Horizontal scrollable row with left/right chevron arrows
- Pills: Website, App, Dashboard, Game, API, AI Chat, E-commerce, Landing Page, Admin Panel, SaaS, Mobile App, Clone
- User clicks pill to filter templates

**Template Gallery Section**:
- Top row: category tabs (pill style)
  + Tabs: Recommended, Education, Website, Marketing, Productivity, E-commerce, Tools, Games, Survey, Research
  + Right side: \"All\" dropdown, Search bar, \"Publish\" button
- Template cards grid below tabs (4 columns desktop, 2 tablet, 1 mobile)
- Each card shows template thumbnail, name, category badge
- Templates include diverse types: HTML/CSS/JS projects, React apps, dashboards, games, APIs, AI chat apps, mobile-style apps, admin panels, SaaS apps, e-commerce sites, landing pages, clone apps

**Functionality**:
- User enters prompt in input box, clicks send button
- System creates new project and navigates to workspace with prompt pre-filled
- User clicks template card to create project from template
- User clicks category pill or tab to filter templates

### 3.5 Projects Page (/dashboard)

**Page Title**: \"Project\" (not \"Dashboard\")

**Tab Bar** (pill style):
- \"Created\" tab (active by default)
- \"Liked\" tab

**Filter Row** (right-aligned):
- \"All statuses\" dropdown
- \"All\" dropdown
- Search input field
- \"+ Create project\" button (black filled)

**Project Cards Grid** (4 columns desktop, 2 tablet, 1 mobile):
- Each card displays:
  + Large thumbnail area showing project preview screenshot or gradient placeholder
  + Heart/like icon overlay on thumbnail
  + Online status dot indicator
  + Project name below thumbnail
  + \"Edited [date]\" timestamp
  + \"Webpage\" badge (or other type badge)
  + \"...\" kebab menu icon (rename, delete actions)

**Empty State**:
- Display illustration when user has no projects
- Show \"Create Your First Project\" CTA button

**Functionality**:
- User clicks \"+ Create project\" button, navigates to home page prompt input
- User clicks project card to open in workspace
- User clicks kebab menu to rename or delete project
- User clicks heart icon to like/unlike project
- User switches between \"Created\" and \"Liked\" tabs
- User uses search and filters to find projects

### 3.6 Subscription Page (/subscription)

**Functionality**:
- Display token packages with Razorpay pricing:
  + ₹300 → 600 tokens
  + ₹500 → 1000 tokens
  + ₹1000 → 2000 tokens
  + ₹5000 → 9000 tokens
- Each package shows token amount, pricing, and \"Purchase\" button
- User clicks \"Purchase\" button to initiate Razorpay payment flow
- After successful payment, tokens added to user account
- Display current token balance at top of page
- Show purchase history with transaction details

### 3.7 Workspace Page (/workspace/:projectId)

**Top Bar** (h-10, thin horizontal bar):
- Left section:
  + Back arrow icon (navigate to projects page)
  + Sidebar-toggle icon
  + Project name with pencil edit icon (inline rename)
  + Version dropdown pill (e.g. \"v20 ↓\")
- Right section:
  + Trash icon (delete project)
  + Code icon (view code)
  + \"198 Credits\" text display
  + \"B Collaboration\" button
  + \"Update\" button (black filled)

**Left Icon Strip** (40px width, inside workspace, separate from AppShell sidebar):
- Vertical icon list for panel switching:
  + File list icon (File Explorer panel)
  + Page/preview icon (Live Preview panel)
  + Components icon (Components panel)
  + Database icon (Backend/Database panel)
  + Chart icon (Analytics panel)
- Active panel highlighted
- Icons switch main area content

**Main Area** (occupies remaining width between icon strip and right panel):
- Displays content based on selected icon strip panel:
  + File Explorer panel: tree view of project files
  + Live Preview panel: Sandpack preview of running application
  + Components panel: generated React components list
  + Backend panel: Supabase schema, API routes, Edge Functions
  + Analytics panel: performance metrics, bundle size
- Monaco Editor embedded when file selected from File Explorer
- Multi-tab editing with tab bar at top
- Syntax highlighting, IntelliSense, autocomplete enabled
- Auto-save changes to Supabase

**Right Panel** (AI Chat, fixed width ~400px):
- Top section: AI model selector dropdown (5 models via AI Credits API)
- Middle section: conversation history display
  + User messages and AI responses
  + AI processing status during generation
  + Generated file information
  + Inline code explanations
- Bottom input bar:
  + \"Deep Build ▼\" dropdown
  + \"+\" icon (upload/attach)
  + Filter icon
  + Microphone icon
  + Send button (black filled circle)
- Chat history persisted to Supabase per project

**Functionality**:
- User clicks back arrow to return to projects page
- User clicks project name pencil icon to rename project inline
- User selects version from dropdown to view/restore previous version
- User clicks trash icon to delete project
- User clicks icon strip icons to switch main area panels
- User clicks file in File Explorer to open in Monaco Editor
- User edits code in Monaco Editor, changes auto-saved
- User enters prompt in AI chat input, AI generates code via multi-agent pipeline
- AI updates File Explorer with new/modified files
- Live Preview updates when files change
- User clicks \"Update\" button to trigger deployment

**Additional Tools** (accessible via command palette or menus):
- Command Palette (Cmd/Ctrl+K)
- Search & Replace
- Plugin Registry
- Version Control
- Testing Panel
- Performance Tools

## 4. Design System and Visual Standards

### 4.1 Color Palette

**Primary Colors**:
- Primary Accent: #7C3AED (Purple/Violet)
- Primary Hover: #6D28D9
- Primary Light: #A78BFA

**Background Colors**:
- Deep Dark Background: #0A0A0F
- Card Background: #1A1A24 with glassmorphism effect
- Panel Background: #13131A
- Sidebar Background: #0F0F14

**Text Colors**:
- Primary Text: #FFFFFF
- Secondary Text: #A1A1AA
- Muted Text: #71717A

**Accent Colors**:
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444
- Info: #3B82F6

### 4.2 Typography

**Font Family**:
- Primary: Inter or similar sans-serif
- Code: JetBrains Mono or Fira Code

**Hierarchy**:
- Hero Headline: 48-64px, bold, gradient text effect
- Section Headline: 32-40px, semi-bold
- Page Title: 24-28px, semi-bold
- Card Title: 20-24px, medium
- Body Text: 14-16px, regular
- Caption: 12-14px, regular

### 4.3 Visual Effects

**Glassmorphism**:
- Cards and panels use semi-transparent backgrounds
- Backdrop blur effect applied
- Subtle border with gradient or glow

**Animations**:
- Smooth transitions on hover (200-300ms)
- Fade-in animations for page load
- Particle or blob animations in hero section
- Button press animations with scale effect

**Shadows**:
- Card shadow: 0 4px 24px rgba(0, 0, 0, 0.4)
- Elevated shadow: 0 8px 32px rgba(0, 0, 0, 0.6)
- Glow effect on primary buttons

### 4.4 Spacing and Layout

**Spacing Scale**:
- Base unit: 4px
- Common spacing: 8px, 12px, 16px, 24px, 32px, 48px, 64px

**Grid System**:
- Project cards: 4-column grid on desktop, 2-column on tablet, 1-column on mobile
- Template cards: 4-column grid on desktop, 2-column on tablet, 1-column on mobile
- Feature cards: 3-column grid with equal height

**Consistent Padding**:
- Card padding: 24px
- Section padding: 64px vertical, 24px horizontal
- Button padding: 12px 24px
- Sidebar icon padding: 12px

**Layout Dimensions**:
- AppShell sidebar width: 56px
- Workspace icon strip width: 40px
- Workspace top bar height: 40px (h-10)
- AI chat panel width: ~400px

## 5. Business Rules and Logic

### 5.1 User Authentication and Authorization

- Users must register and login to access home, projects, and workspace pages
- User sessions managed by Supabase Auth
- Support email/password authentication and Google OAuth login
- Projects belong to specific users

### 5.2 Project Management

- Each project has unique ID and belongs to a user
- Projects stored in Supabase database with metadata (name, created date, last modified, type badge)
- Virtual file system for each project stored as JSON in Supabase
- Auto-save triggers on file edits with debounce (3 seconds)
- Projects can be loaded from database to restore workspace state
- Projects can be liked/unliked by users

### 5.3 Multi-Agent AI Pipeline with AI Credits API

**Agent Execution Flow**:
1. **Requirements Agent**: Analyzes user prompt, extracts functional requirements
2. **Planning Agent**: Creates architecture plan, determines file structure
3. **UI Agent**: Generates frontend components and styling
4. **Backend Agent**: Generates Supabase schema SQL, API routes, Edge Functions, migration files
5. **Fix Agent**: Reviews generated code, fixes errors
6. **Output**: Complete project files in JSON format

**AI Credits API Integration**:
- Supports 5 different AI models for code generation
- User selects AI model from dropdown in AI Chat panel
- AI Credits API handles model routing and generation
- Supports building all types of code: websites, apps, components
- Generated apps can be published to Vercel

**AI Generation Output Format**:
- Structured JSON with file paths as keys
- Each file contains complete, production-ready code
- Generated code follows Next.js 15 App Router conventions
- Code includes TypeScript types, accessibility attributes, responsive layouts
- Test files generated alongside components

### 5.4 AI Conversation Memory

- Chat history persisted to Supabase per project
- AI retrieves previous conversation context when processing new prompts
- Memory persists across browser sessions
- AI uses context to make informed modifications without regenerating entire project

### 5.5 Token System and Razorpay Payment

**Token Packages**:
- ₹300 → 600 tokens
- ₹500 → 1000 tokens
- ₹1000 → 2000 tokens
- ₹5000 → 9000 tokens

**Token Consumption**:
- Tokens consumed per AI generation request
- Token cost varies by AI model selected
- Token balance displayed in AppShell sidebar bottom section and workspace top bar
- User cannot generate code when token balance is zero

**Razorpay Payment Flow**:
- User navigates to subscription page
- User selects token package and clicks \"Purchase\" button
- Razorpay payment gateway opens
- User completes payment via Razorpay
- After successful payment, tokens added to user account in Supabase
- Token balance updated in real-time
- Purchase history recorded with transaction details

### 5.6 Version Control System

- File changes tracked with timestamps and user attribution
- Snapshots created automatically on significant changes
- Users can create manual snapshots with commit messages
- Previous versions viewable via version dropdown in workspace top bar
- Restore functionality replaces current files with selected version

### 5.7 Plugin System

- Plugins registered in Plugin Registry with metadata
- Enabled plugins modify AI generation prompts
- Plugin configurations stored per project
- Plugins can inject code templates and dependencies

### 5.8 Deployment Workflows

**Vercel Deployment**:
- User clicks \"Update\" button in workspace top bar
- System packages project files
- Initiates Vercel deployment via API
- Displays deployment progress and status
- Shows live URL after successful deployment

**GitHub Export**:
- User clicks code icon in workspace top bar, selects \"Export to GitHub\" option
- System authenticates with GitHub
- Creates new repository or pushes to existing repo
- Displays success confirmation with repository URL

**ZIP Download (Paid Subscribers Only)**:
- User clicks code icon in workspace top bar, selects \"Download ZIP\" option
- Free users see upgrade prompt with link to subscription page
- Paid subscribers: system packages all project files using JSZip
- Generates proper Next.js project structure
- Downloads .zip file to user's device

### 5.9 Keyboard Shortcuts

- Cmd/Ctrl+S: Save project
- Cmd/Ctrl+K: Open command palette
- Cmd/Ctrl+P: Open file switcher
- Cmd/Ctrl+F: Open search
- Cmd/Ctrl+Shift+F: Open global search and replace

### 5.10 Code Quality Standards

**Generated Code Requirements**:
- Production-ready quality with proper error handling
- Reusable React components with TypeScript props
- Responsive layouts using Tailwind CSS
- Accessibility attributes (ARIA labels, semantic HTML)
- Optimized bundle size
- Test files with meaningful test cases

## 6. Exceptions and Edge Cases

| Scenario | Handling |
|----------|----------|
| AI generation fails | Display error in chat, allow retry |
| Invalid user prompt | AI responds with clarification request |
| Code compilation error | Display error overlay with line numbers in preview |
| File name conflict | Overwrite with confirmation dialog |
| Network disconnection during generation | Save partial progress, resume when reconnected |
| Deployment failure | Display error message, show logs |
| GitHub authentication failure | Prompt user to re-authenticate |
| ZIP download by free user | Display upgrade prompt with link to subscription page |
| Plugin configuration error | Disable plugin, show error message |
| Version restore conflict | Show diff, allow user to choose version |
| Auto-save failure | Show warning, retry automatically |
| Supabase connection loss | Queue changes locally, sync when reconnected |
| Large project timeout | Implement streaming generation with progress |
| Test execution failure | Display failed test details with stack trace |
| Insufficient token balance | Display warning, prompt user to purchase tokens |
| Razorpay payment failure | Display error message, allow retry |
| Google OAuth authentication failure | Display error message, allow retry with email/password |
| Icon strip panel switch error | Reset to default panel, log error |
| Workspace top bar action failure | Display error message, allow retry |
| AI model selection error | Default to first available model, display warning |
| Template card click error | Display error message, log error |
| Category filter error | Reset to default filter, display warning |
| Landing page Start Building button click when not logged in | Navigate to /login |
| Landing page Start Building button click when logged in | Navigate to /home |

## 7. Acceptance Criteria

1. User opens landing page, views hero section with gradient headline and animated background, scrolls to view tech stack ticker, capabilities showcase, live preview features, and best at sections
2. User clicks \"Start Building Free\" button on landing page, navigates to /login if not logged in, or /home if logged in
3. User completes login, navigates to home page with gradient hero banner, 3D robot illustration, large prompt input box, updated category pills (Website, App, Dashboard, Game, API, AI Chat, E-commerce, Landing Page, Admin Panel, SaaS, Mobile App, Clone), and diverse template gallery
4. User enters prompt \"Build a dashboard with charts\" in input box, clicks send button, navigates to workspace with new project
5. User views workspace with narrow AppShell sidebar on left, thin top bar with project name and actions, 40px icon strip, main area, and AI chat panel on right
6. AI multi-agent pipeline processes request via AI Credits API, generates complete React project, files appear in File Explorer
7. User clicks page/preview icon in icon strip, Live Preview panel displays running application in main area with real-time rendering
8. User enters follow-up prompt in AI chat input, AI generates additional code, File Explorer updates with new files, Live Preview updates instantly
9. User clicks \"Update\" button in top bar, Vercel deployment initiates, deployment succeeds, live URL displayed
10. User clicks back arrow in top bar, navigates to projects page
11. User views projects page with \"Project\" title, \"Created\" and \"Liked\" tabs, filter row, project cards grid showing thumbnails and metadata
12. User navigates to subscription page, views token packages, completes Razorpay payment, tokens added to account

## 8. Features Not Included in This Release

- Team collaboration features
- Team management and permissions
- Project sharing with team members
- Real-time collaborative editing
- Advanced team permission roles
- Custom domain configuration for deployments
- Project analytics and usage metrics
- Code review and approval workflows
- Integration with other deployment platforms (Netlify, AWS)
- Mobile app version
- Offline mode support
- Advanced debugging breakpoints
- Git branch management
- Code formatting auto-fix on save
- AI code refactoring suggestions
- Component library integration (Material-UI, Ant Design)
- Database query builder UI
- API documentation generator
- Automated security vulnerability scanning
- Performance profiling tools
- A/B testing framework
- Internationalization (i18n) support
- Advanced particle animation customization
- Video background support for hero section
- Interactive demo playground on landing page
- User onboarding tutorial flow
- In-app feedback and bug reporting
- Advanced search filters in dashboard
- Project tags and categories
- Bulk project operations
- Export project as template
- Workspace settings section
- Editor font size and color theme customization
- Keyboard shortcut customization
- Drag-and-drop file upload in workspace
- Multi-language code generation
- Custom AI model training
- Workspace layout customization
- Advanced version control branching
- Code snippet library
- Automated testing suite generation