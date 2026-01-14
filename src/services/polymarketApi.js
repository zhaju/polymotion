import axios from 'axios';

// Use Vite proxy in development, CORS proxy in production
const isDev = import.meta.env.DEV;
const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const CORS_PROXY = 'https://corsproxy.io/?';

class PolymarketAPI {
  constructor() {
    this.isDev = isDev;
    this.gammaClient = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  getUrl(path) {
    if (this.isDev) {
      return `/api/gamma${path}`;
    }
    return CORS_PROXY + encodeURIComponent(`${GAMMA_API_BASE}${path}`);
  }

  // Sort markets by end date
  sortMarkets(markets) {
    const sortedMarkets = markets.sort((a, b) => {
      // Sort by end date (future dates first)
      const aEndDate = a.endDate || a.end_date_iso;
      const bEndDate = b.endDate || b.end_date_iso;

      if (aEndDate && bEndDate) {
        const aDate = new Date(aEndDate);
        const bDate = new Date(bEndDate);
        const now = new Date();

        // Future dates first, then by proximity
        if (aDate > now && bDate <= now) return -1;
        if (aDate <= now && bDate > now) return 1;
        if (aDate > now && bDate > now) return aDate - bDate;
        return bDate - aDate;
      }

      // Prioritize non-closed markets
      if (a.closed !== b.closed) return a.closed ? 1 : -1;

      return 0;
    });

    return sortedMarkets;
  }

  // Normalize Gamma API market data to match expected format
  normalizeMarket(market) {
    // Extract outcome prices from outcomePrices string (e.g., "[0.95, 0.05]")
    let tokens = [];
    const outcomes = market.outcomes ? JSON.parse(market.outcomes) : ['Yes', 'No'];
    const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : [0.5, 0.5];

    tokens = outcomes.map((outcome, index) => ({
      outcome: outcome,
      price: prices[index] || 0.5,
      winner: false
    }));

    return {
      condition_id: market.conditionId || market.id,
      question_id: market.questionId,
      question: market.question,
      description: market.description,
      end_date_iso: market.endDate,
      market_slug: market.slug,
      closed: market.closed || false,
      archived: market.archived || false,
      active: market.active !== false,
      tokens: tokens,
      tags: market.tags || [],
      volume24hr: parseFloat(market.volume24hr) || 0,
      volumeNum: parseFloat(market.volumeNum) || 0,
      liquidity: parseFloat(market.liquidity) || 0,
      // Keep original data for reference
      _original: market
    };
  }

  // Fetch markets using Gamma API events endpoint
  async fetchMarkets(limit = 100, offset = 0) {
    try {
      console.log(`🔄 Fetching markets from Gamma API...`);

      // Build URL with query params
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        order: 'id',
        ascending: 'false',
        closed: 'false'
      });
      const url = this.getUrl(`/events?${params.toString()}`);

      // Fetch active events with their markets
      const response = await this.gammaClient.get(url);

      const events = response.data || [];
      console.log(`✅ Fetched ${events.length} events from Gamma API`);

      // Extract all markets from events
      let allMarkets = [];
      for (const event of events) {
        if (event.markets && Array.isArray(event.markets)) {
          for (const market of event.markets) {
            // Add event-level data to market
            const enrichedMarket = {
              ...market,
              eventTitle: event.title,
              eventSlug: event.slug,
              tags: event.tags || market.tags || []
            };
            allMarkets.push(this.normalizeMarket(enrichedMarket));
          }
        }
      }

      console.log(`📊 Extracted ${allMarkets.length} markets from events`);

      if (allMarkets.length === 0) {
        throw new Error('No markets available from Polymarket Gamma API');
      }

      return this.sortMarkets(allMarkets);

    } catch (error) {
      console.error('🚨 Gamma API failed:', error.message);

      // Provide user-friendly error handling
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Unable to connect to Polymarket API. Please check your internet connection.');
      } else if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded. Please try again in a few minutes.');
      } else if (error.response?.status >= 500) {
        throw new Error('Polymarket API is experiencing issues. Please try again later.');
      } else {
        throw new Error(`Failed to fetch markets: ${error.message}`);
      }
    }
  }
}

const polymarketAPI = new PolymarketAPI();
export default polymarketAPI;