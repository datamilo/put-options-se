# Put Options SE

A comprehensive financial analysis web application for put options trading and stock market analysis. Put Options SE provides sophisticated tools for analyzing put options data, calculating potential returns, visualizing market trends, and examining support levels with customizable parameters.

## Features

### Options Analysis
- **Interactive Options Table**: Filter and analyze put options by strike price, expiry date, volume, and other metrics
- **Dynamic Calculations**: Real-time recalculation based on customizable underlying values and transaction costs
- **Risk Assessment**: Calculate potential returns, break-even points, and probability metrics
- **OHLC Candlestick Charts**: Full price action visualization for individual stocks

### Support Level Analysis
- **Rolling Low Calculation**: Analyze stock support levels using N-day rolling minimum (30, 90, 180, 270, or 365 calendar days)
- **Support Break Detection**: Identify when rolling support levels break down
- **Break Clustering**: Group consecutive support breaks within configurable time windows
- **Multi-Trace Visualization**: Plotly charts with candlesticks, rolling low line, and break markers
- **Detailed Analytics**: Cluster statistics, support break history, and stability metrics

### Portfolio Generation
- **Automated Portfolio Builder**: Generate optimized put options portfolios based on multiple strategies
- **Risk Metrics**: Expected Value, EV per Capital, and Risk-Adjusted Score calculations
- **Multi-Factor Filtering**: Apply filters across date range, probability, strike price, volume, and more
- **Strategy Selection**: Sort by EV, EV per Capital, or Risk-Adjusted metrics

### Seasonality & Trends
- **Monthly Analysis**: Historical performance analysis with seasonal patterns
- **Heatmap Visualization**: Identify seasonal trading opportunities
- **Volatility Tracking**: Stock event volatility analysis with historical tracking

### User Experience
- **Dark/Light Mode**: Theme support with persistent preferences
- **User Preferences**: Customizable settings with Supabase persistence (or localStorage for guest users)
- **Column Management**: Show/hide options table columns based on preference
- **Responsive Design**: Mobile-optimized layouts and touch-friendly interactions
- **Authentication**: Optional Supabase auth with row-level security

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Visualization**: Recharts and Plotly
- **Data Processing**: Papa Parse for CSV handling
- **State Management**: TanStack Query for data fetching
- **Authentication**: Supabase
- **Theme Support**: Next Themes

## Getting Started

### Prerequisites
- Node.js 16+ (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd put-options-se-1

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:5173` with hot-reload enabled.

### Build for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
put-options-se-1/
├── src/
│   ├── pages/              # Route components
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript interfaces
│   ├── contexts/           # React context providers
│   ├── auth/               # Authentication components
│   └── lib/                # Utility functions
├── data/                   # CSV data files (tracked in git)
├── public/                 # Static assets
└── package.json
```

## Key Pages

- **Dashboard** (`/`) - Main options analysis with filterable table
- **Support Level Analysis** (`/consecutive-breaks`) - Stock support level strength analysis
- **Portfolio Generator** (`/portfolio-generator`) - Portfolio optimization tools
- **Monthly Analysis** (`/monthly-analysis`) - Historical performance and seasonality
- **Volatility Analysis** (`/volatility-analysis`) - Stock event volatility tracking
- **Stock Details** (`/stock/:stockName`) - Individual stock price action
- **Option Details** (`/option/:optionId`) - Detailed option analysis

## Data

The application uses static CSV data files stored in `/data/`:

- **Stock Data** (`stock_data.csv`): OHLC prices with format `date|name|open|high|low|close|volume|pct_change_close`
- **Options Data** (`data.csv`): Put options with symbol, strike, expiry, prices, and metrics
- **Probability Data** (`recovery_report_data.csv`, `validation_report_data.csv`): Probability analysis data
- **Other Data**: Monthly, volatility, and historical probability data in CSV format

Data is loaded directly from GitHub's `/data/` folder via raw.githubusercontent.com URLs.

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

### Important Development Patterns

- **Data Hooks**: Use `useEnrichedOptionsData` for options table data (includes recalculations)
- **Settings Systems**: Main page and Portfolio Generator maintain separate preference systems
- **Support Level Analysis**: Calculate rolling low on FULL historical data before filtering for display
- **OHLC Data**: Always use `low` field for period lows (not close prices)
- **Charts**: Use CandlestickChart for OHLC visualization, Plotly for Support Level Analysis

See `CLAUDE.md` for comprehensive documentation of architecture, data flows, and implementation patterns.

## User Preferences

The application supports two independent settings systems:

1. **Main Page Settings** - Underlying value, transaction cost, column visibility
2. **Portfolio Generator Settings** - Portfolio-specific filters and preferences

Settings persist via Supabase for authenticated users or localStorage for guests.

## Deployment

- **Primary**: Lovable.dev hosting
- **GitHub Pages**: Alternative deployment (with basename handling)
- **Build Scripts**: Prebuild script automatically synchronizes data files

## Documentation

For detailed technical documentation including architecture, data flows, and development patterns, see `CLAUDE.md`.

## License

This project is proprietary and confidential.

## Support

For issues, questions, or contributions, please check the project documentation.
