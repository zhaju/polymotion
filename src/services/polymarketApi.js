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

  // Filter markets to only show recent ones (last 30 days)
  filterRecentMarkets(allMarkets) {
    console.log(`📅 Filtering ${allMarkets.length} markets for those with 1+ month before resolution...`);
    
    const now = new Date();
    const oneMonthFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
    
    // Step 1: Filter for markets with at least 1 month before resolution
    const marketsWithTimeLeft = allMarkets.filter(market => {
      // Must have basic data
      if (!market.question || !market.condition_id || market.archived) {
        return false;
      }
      
      // Check end date
      if (!market.end_date_iso) {
        // Only include markets without end dates if they're not closed
        if (!market.closed) {
          console.log(`⚠️ Market "${market.question.substring(0, 50)}..." has no end_date_iso but not closed, including it`);
          return true;
        } else {
          return false; // Skip closed markets without end dates
        }
      }
      
      try {
        const endDate = new Date(market.end_date_iso);
        const hasTimeLeft = endDate > oneMonthFromNow;
        
        if (hasTimeLeft) {
          const daysUntilResolution = Math.ceil((endDate - now) / (24 * 60 * 60 * 1000));
          console.log(`✅ Market "${market.question.substring(0, 50)}..." has ${daysUntilResolution} days until resolution`);
        }
        
        return hasTimeLeft;
      } catch (error) {
        console.log(`⚠️ Invalid date format for market ${market.condition_id}: ${market.end_date_iso}`);
        return false;
      }
    });
    
    console.log(`🎯 Found ${marketsWithTimeLeft.length} markets with 1+ month before resolution`);
    
    if (marketsWithTimeLeft.length > 0) {
      return this.sortAndReturnMarkets(marketsWithTimeLeft, 'markets with 1+ month remaining');
    }
    
    // Fallback 1: Markets with any future end date
    console.log('⚠️ No markets with 1+ month found, looking for any future markets...');
    const anyFutureMarkets = allMarkets.filter(market => {
      if (!market.question || !market.condition_id || market.archived) {
        return false;
      }
      
      if (!market.end_date_iso) {
        return !market.closed; // Include non-closed markets without end dates
      }
      
      try {
        const endDate = new Date(market.end_date_iso);
        return endDate > now; // Any future date
      } catch (error) {
        return false;
      }
    });
    
    console.log(`📊 Found ${anyFutureMarkets.length} markets with any future resolution date`);
    
    if (anyFutureMarkets.length > 0) {
      return this.sortAndReturnMarkets(anyFutureMarkets.slice(0, 30), 'future markets');
    }
    
    // Fallback 2: Unresolved markets (closed=false, archived=false)
    console.log('⚠️ No future markets found, looking for unresolved markets...');
    const unresolvedMarkets = allMarkets.filter(market => {
      return !market.closed && !market.archived && market.question && market.condition_id;
    });
    
    console.log(`📊 Found ${unresolvedMarkets.length} unresolved markets`);
    
    if (unresolvedMarkets.length > 0) {
      // Prioritize the Google vs ChatGPT market and other interesting unresolved markets
      const prioritized = unresolvedMarkets.sort((a, b) => {
        const aQ = a.question.toLowerCase();
        const bQ = b.question.toLowerCase();
        
        // Google vs ChatGPT gets highest priority
        if (aQ.includes('google') && aQ.includes('chatgpt')) return -1;
        if (bQ.includes('google') && bQ.includes('chatgpt')) return 1;
        
        // Then other current topics
        const currentKeywords = ['2025', '2026', 'ai', 'trump', 'bitcoin', 'election'];
        const aScore = currentKeywords.reduce((score, keyword) => score + (aQ.includes(keyword) ? 1 : 0), 0);
        const bScore = currentKeywords.reduce((score, keyword) => score + (bQ.includes(keyword) ? 1 : 0), 0);
        
        return bScore - aScore;
      });
      
      return this.sortAndReturnMarkets(prioritized, 'unresolved markets');
    }
    
    // Final fallback: Just show interesting markets regardless of status
    console.log('⚠️ Using final fallback: showing most interesting markets...');
    const interestingMarkets = allMarkets.filter(market => {
      if (!market.question || !market.condition_id || market.archived) return false;
      
      const question = market.question.toLowerCase();
      return (
        question.includes('2025') || question.includes('2026') ||
        question.includes('trump') || question.includes('election') ||
        question.includes('bitcoin') || question.includes('ai') ||
        question.includes('google') || question.includes('chatgpt')
      );
    });
    
    return this.sortAndReturnMarkets(interestingMarkets.slice(0, 15), 'interesting markets (fallback)');
  }
  
  sortAndReturnMarkets(markets, description) {
    // Sort by current topics first, then by end date
    const sortedMarkets = markets.sort((a, b) => {
      const aQ = a.question.toLowerCase();
      const bQ = b.question.toLowerCase();
      
      // Prioritize current topics
      const currentKeywords = ['2025', '2026', 'google', 'chatgpt', 'ai', 'trump', 'bitcoin', 'election'];
      const aScore = currentKeywords.reduce((score, keyword) => score + (aQ.includes(keyword) ? 1 : 0), 0);
      const bScore = currentKeywords.reduce((score, keyword) => score + (bQ.includes(keyword) ? 1 : 0), 0);
      
      if (aScore !== bScore) return bScore - aScore;
      
      // Then sort by end date (future dates first)
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
      console.log(`🔄 Fetching LIVE markets from CLOB API with multiple strategies...`);
      
      const allMarkets = [];
      
      // Strategy 1: Get truly active unresolved markets sorted by end date
      try {
        console.log('📡 Strategy 1: Fetching active markets sorted by end date...');
        const response1 = await this.clobClient.get('/markets', {
          params: {
            active: true,
            closed: false,
            archived: false,
            order_by: 'end_date_iso',
            order: 'asc', // Soonest first, but we'll filter for 1+ month
            limit: 200,
            offset: 0
          }
        });
        
        const markets1 = response1.data?.data || response1.data || [];
        // For debugging, let's be more permissive and see what we actually get
        const activeMarkets = markets1.filter(m => !m.archived); // Only filter out archived
        console.log(`✅ Strategy 1: Found ${activeMarkets.length} non-archived markets from ${markets1.length} total`);
        allMarkets.push(...activeMarkets);
      } catch (error) {
        console.log('❌ Strategy 1 failed:', error.message);
      }
      
      // Strategy 2: Get markets with future end dates
      try {
        console.log('📡 Strategy 2: Fetching markets with future end dates...');
        const response2 = await this.clobClient.get('/markets', {
          params: {
            archived: false,
            order_by: 'end_date_iso',
            order: 'desc', // Latest end dates first
            limit: 200,
            offset: 0
          }
        });
        
        const markets2 = response2.data?.data || response2.data || [];
        const futureMarkets = markets2.filter(m => {
          if (!m.end_date_iso) return true; // Include markets without end dates
          
          try {
            const endDate = new Date(m.end_date_iso);
            const now = new Date();
            return endDate > now && !m.archived; // Future markets only
          } catch (error) {
            return false;
          }
        });
        console.log(`✅ Strategy 2: Found ${futureMarkets.length} future markets`);
        allMarkets.push(...futureMarkets);
      } catch (error) {
        console.log('❌ Strategy 2 failed:', error.message);
      }
      
      // Strategy 3: Broad search for any active markets
      try {
        console.log('� Strategy 3: Broad search for active markets...');
        const response3 = await this.clobClient.get('/markets', {
          params: {
            limit: 300,
            offset: 100
          }
        });
        
        const markets3 = response3.data?.data || response3.data || [];
        const broadMarkets = markets3.filter(m => m.active && !m.closed);
        console.log(`✅ Strategy 3: Found ${broadMarkets.length} broad active markets`);
        allMarkets.push(...broadMarkets);
      } catch (error) {
        console.log('❌ Strategy 3 failed:', error.message);
      }
      
      // Remove duplicates based on market slug
      const uniqueMarkets = allMarkets.reduce((acc, market) => {
        if (!acc.some(existing => existing.market_slug === market.market_slug)) {
          acc.push(market);
        }
        return acc;
      }, []);
      
      console.log(`🎯 Combined ${allMarkets.length} total markets, ${uniqueMarkets.length} unique markets`);
      
      if (uniqueMarkets.length === 0) {
        console.log('⚠️ No markets found with any strategy, falling back to basic call...');
        const fallbackResponse = await this.clobClient.get('/markets', {
          params: { limit: 100 }
        });
        const fallbackMarkets = fallbackResponse.data?.data || fallbackResponse.data || [];
        return this.filterRecentMarkets(fallbackMarkets);
      }
      
      // Apply our intelligent filtering
      return this.filterRecentMarkets(uniqueMarkets);
      
    } catch (error) {
      console.error('🚨 CLOB API completely failed:', error.message);
      console.error('Error details:', error);
      
      // Provide user-friendly error handling
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error('Network connectivity issue - API server unreachable');
        throw new Error('Unable to connect to Polymarket API. Please check your internet connection.');
      } else if (error.response?.status === 429) {
        console.error('Rate limited by API');
        throw new Error('API rate limit exceeded. Please try again in a few minutes.');
      } else if (error.response?.status >= 500) {
        console.error('Server error from API');
        throw new Error('Polymarket API is experiencing issues. Please try again later.');
      } else {
        throw new Error(`Failed to fetch markets: ${error.message}`);
      }
    }
  }
}

const polymarketAPI = new PolymarketAPI();
export default polymarketAPI;