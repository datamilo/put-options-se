# Put Options SE - Project Summary for Claude Code

## Project Overview
Put Options SE is a comprehensive financial analysis web application focused on put options trading and stock market analysis. The application provides sophisticated tools for analyzing put options data, calculating potential returns, and visualizing market trends with customizable parameters.

## Project Goals
- **Options Analysis**: Provide detailed analysis of put options with customizable underlying values and transaction costs
- **Risk Assessment**: Calculate potential returns, probabilities, and risk metrics for options trading
- **Data Visualization**: Interactive charts and heatmaps for seasonal analysis and market trends
- **Portfolio Generation**: Tools for generating optimized put options portfolios
- **Monthly Analysis**: Historical performance analysis with seasonal patterns
- **User Customization**: Personalized settings with database persistence

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for styling with custom design system
- **shadcn/ui** component library with Radix UI primitives
- **React Router Dom** for navigation
- **TanStack Query** for data fetching and caching
- **Recharts** for data visualization
- **Next Themes** for dark/light mode support

### Backend & Data
- **Supabase** for authentication and user preferences storage
- **CSV Data Processing** with Papa Parse
- **Static Data Files** (CSV format) for options and stock data
- **Local Storage** fallback for unauthenticated users

### Development Tools
- **ESLint** for code linting
- **TypeScript** for type safety
- **Lucide React** for icons

## Key Application Structure

### Core Pages
- **Index** (`/`) - Main options analysis dashboard with filterable table
- **Portfolio Generator** (`/portfolio-generator`) - Portfolio optimization tools
- **Monthly Analysis** (`/monthly-analysis`) - Historical performance and seasonality
- **Option Details** (`/option/:optionId`) - Detailed individual option analysis
- **Stock Details** (`/stock/:stockName`) - Individual stock performance
- **Authentication** (`/auth`, `/auth/callback`) - User login/signup

### Key Components

#### Data Management
- **useEnrichedOptionsData** - Main hook combining options data with user calculations
- **useRecalculatedOptions** - Applies user settings to option calculations
- **useMonthlyStockData** - Historical stock performance data
- **useUserPreferences** - Supabase integration for user settings

#### UI Components
- **OptionsTable** - Main data table with sorting, filtering, and column management
- **OptionsChart** - Interactive price/volume charts
- **MonthlySeasonalityHeatmap** - Seasonal performance visualization
- **SettingsModal** - User preference configuration
- **NavigationMenu** - App navigation with dropdown menu

#### Settings & Context
- **SettingsContext** - Global state for underlying value and transaction costs
- **AuthProvider** - Supabase authentication wrapper

## Data Structure

### Options Data Fields
- Basic option info: Symbol, OptionName, StrikePrice, ExpiryDate
- Market data: LastPrice, Volume, OpenInterest, ImpliedVolatility
- Calculated metrics: PotentialReturn, BreakEven, ProbabilityITM
- User-customizable: UnderlyingValue, TransactionCost

### Stock Data
- Historical monthly performance
- Seasonal analysis data
- Risk/return metrics

## Key Features

### 1. Dynamic Calculations
- Real-time recalculation based on user settings
- Customizable underlying portfolio value
- Adjustable transaction costs
- Probability calculations and risk metrics

### 2. Advanced Filtering
- Date range selection for option expiry
- Minimum volume/open interest filters
- Stock symbol filtering
- Column visibility management

### 3. Data Visualization
- Interactive charts with Recharts
- Seasonality heatmaps
- Risk/return scatter plots
- Performance ranking charts

### 4. User Preferences
- Persistent settings via Supabase
- localStorage fallback for guest users
- Column visibility preferences
- Calculation parameter storage

### 5. Responsive Design
- Mobile-optimized layouts
- Dark/light theme support
- Collapsible navigation
- Touch-friendly interactions

## Authentication & User Management
- **Supabase Auth** for user management
- **Protected Routes** for authenticated features
- **Guest Mode** with localStorage persistence
- **Row Level Security** for user data isolation

## Data Sources
- Static CSV files in `/data` and `/public/data`
- Python scripts for data generation (`portfolio_generator.py`)
- Automated data updates with timestamps

## Known Issues & Limitations

### Recent Fixes Applied
- **Double Calculation Bug**: Fixed issue where options were being recalculated twice
- **Settings Reversion**: Resolved problem where user settings reverted after apply
- **State Management**: Improved handling of user preferences vs database sync

### Current Limitations
- **Static Data**: Relies on pre-generated CSV files, not real-time market data
- **GitHub Pages Deployment**: Specific basename handling for GitHub Pages vs other environments
- **CSV Processing**: Large datasets may impact initial load performance

## Development Notes

### Important Patterns
- Use `useEnrichedOptionsData` for options table data (already includes recalculations)
- Avoid calling `useRecalculatedOptions` on already enriched data
- Settings context handles both authenticated and guest user scenarios
- Always use semantic tokens from design system, never direct colors

### File Organization
- `/src/hooks` - Custom React hooks for data fetching and calculations
- `/src/components` - Reusable UI components
- `/src/pages` - Route components
- `/src/contexts` - React context providers
- `/data` - Static CSV data files
- `/src/components/ui` - shadcn/ui component library

### Design System
- Custom HSL color tokens in `index.css`
- Tailwind config with semantic color mapping
- Component variants for different states
- Consistent spacing and typography scales

## Deployment
- **Primary**: Lovable.dev hosting
- **GitHub Pages**: Alternative deployment with basename handling
- **Environment Detection**: Automatic hostname-based configuration

This application represents a sophisticated financial analysis tool with modern React patterns, comprehensive data visualization, and robust user experience features.