import axios from 'axios';

const POLYMARKET_CLOB_API = 'https://clob.polymarket.com';

class PolymarketAPI {
  constructor() {
    this.clobClient = axios.create({
      baseURL: POLYMARKET_CLOB_API,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  // No filtering - return all markets
  filterRecentMarkets(allMarkets) {
    console.log(`📅 Returning all ${allMarkets.length} markets without filtering`);
    return this.sortAndReturnMarkets(allMarkets, 'all markets (no filtering)');
  }
  
  sortAndReturnMarkets(markets, description) {
    // Sort by end date, then by closed status
    const sortedMarkets = markets.sort((a, b) => {
      // Sort by end date (future dates first)
      if (a.end_date_iso && b.end_date_iso) {
        const aDate = new Date(a.end_date_iso);
        const bDate = new Date(b.end_date_iso);
        const now = new Date();
        
        // Future dates first, then by proximity
        if (aDate > now && bDate <= now) return -1;
        if (aDate <= now && bDate > now) return 1;
        if (aDate > now && bDate > now) return aDate - bDate; // Soonest future first
        return bDate - aDate; // Most recent past first
      }
      
      // Prioritize non-closed markets
      if (a.closed !== b.closed) return a.closed ? 1 : -1;
      
      return 0;
    });
    
    console.log(`✅ Returning ${sortedMarkets.length} ${description}`);
    return sortedMarkets;
  }

  // Get all markets with basic info using CLOB API
  async fetchMarkets(limit = 100, offset = 0) {
    try {
      console.log(`🔄 Fetching markets from CLOB API...`);
      
      const response = await this.clobClient.get('/markets', {
        params: {
          limit: 500,
          offset: 0
        }
      });
      
      const markets = response.data?.data || response.data || [];
      console.log(`✅ Fetched ${markets.length} markets from API`);
      
      if (markets.length === 0) {
        throw new Error('No markets available from Polymarket API');
      }
      
      return this.filterRecentMarkets(markets);
      
    } catch (error) {
      console.error('🚨 CLOB API failed:', error.message);
      
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