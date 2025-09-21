# Polymotion - Polymarket Price Movement Dashboard

![](public/logobig.png)

A React web application that displays the top Polymarket questions with the biggest price movements over the last 24 hours.

## Features

- **Real-time Data**: Fetches market data from Polymarket's API
- **Price Movement Analysis**: Shows 24-hour high, low, current price, and movement
- **Category Filtering**: Filter markets by category (Politics, Sports, Crypto, etc.)
- **Smart Filtering**: Excludes markets resolving within 24 hours to avoid resolution volatility
- **Auto-refresh**: Optional automatic data updates every 5 minutes
- **Responsive Design**: Works on desktop and mobile devices

## How It Works

1. **Data Fetching**: Connects to Polymarket's CLOB API and GraphQL endpoints
2. **Price Analysis**: Calculates 24-hour price movements for each market
3. **Filtering**: Excludes low-volume markets and those resolving soon
4. **Sorting**: Orders markets by biggest price movement (high - low)
5. **Categorization**: Automatically categorizes markets by topic

## API Endpoints Used

- Primary: `https://clob.polymarket.com/markets`
- Fallback: `https://gamma-api.polymarket.com` (GraphQL)

## Price Movement Calculation

- **Current Price**: Latest market price (as percentage probability)
- **24h High**: Highest price in the last 24 hours
- **24h Low**: Lowest price in the last 24 hours  
- **Movement**: Difference between 24h high and low (high - low)

## Filtering Logic

- Excludes markets resolving within 24 hours
- Minimum volume threshold ($50 daily volume)
- Minimum movement threshold (0.5 cents)
- Only shows active, non-archived markets

## Category Detection

Markets are automatically categorized based on keywords in the question:

- **Politics**: election, government, candidate, policy
- **Sports**: NFL, NBA, MLB, soccer, football, basketball
- **Crypto**: Bitcoin, Ethereum, blockchain, DeFi
- **Entertainment**: movies, music, celebrities, awards
- **Technology**: AI, software, startups, tech
- **Finance**: stocks, economy, GDP, inflation
- **Weather**: climate, hurricanes, temperature
- **Other**: All remaining markets

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **date-fns** - Date manipulation
- **Lucide React** - Icons

## Note on API Access

This application attempts to connect to Polymarket's public APIs. If API access fails, it will display sample data for demonstration purposes. For production use, ensure proper API access and consider rate limiting.

## Future Enhancements

- Historical price charts for individual markets
- Push notifications for large movements
- Portfolio tracking for followed markets
- Advanced filtering options
- Export functionality for data analysis+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
