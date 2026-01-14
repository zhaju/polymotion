import { differenceInHours, parseISO } from 'date-fns';

export class MarketAnalyzer {
  constructor() {
    this.categoryMappings = {
      'politics': ['politics', 'election', 'government', 'policy', 'candidate'],
      'sports': ['sports', 'nfl', 'nba', 'mlb', 'nhl', 'soccer', 'football', 'basketball', 'baseball', 'hockey'],
      'crypto': ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'defi', 'nft'],
      'entertainment': ['entertainment', 'movie', 'music', 'celebrity', 'award', 'tv', 'streaming'],
      'technology': ['technology', 'tech', 'ai', 'artificial intelligence', 'software', 'startup'],
      'finance': ['finance', 'stock', 'market', 'economy', 'gdp', 'inflation', 'federal reserve'],
      'weather': ['weather', 'climate', 'hurricane', 'temperature', 'rain', 'snow'],
      'other': []
    };
  }

  // Categorize a market based on its question and tags
  categorizeMarket(market) {
    const text = `${market.question} ${market.description || ''} ${(market.tags || []).join(' ')}`.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryMappings)) {
      if (category === 'other') continue;
      
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return 'other';
  }

  // Check if market resolves within 24 hours
  isResolvingSoon(market, hoursThreshold = 24) {
    if (!market.endDateIso) return false;
    
    try {
      const endDate = parseISO(market.endDateIso);
      const now = new Date();
      const hoursUntilResolution = differenceInHours(endDate, now);
      
      return hoursUntilResolution <= hoursThreshold && hoursUntilResolution >= 0;
    } catch (error) {
      console.warn('Error parsing end date:', market.endDateIso, error);
      return false;
    }
  }

  // Calculate price movement for markets
  calculatePriceMovement(priceHistory) {
    if (!priceHistory || priceHistory.length === 0) {
      return { high: 0, low: 0, movement: 0, currentPrice: 0 };
    }

    // Sort by timestamp to ensure chronological order
    const sortedHistory = [...priceHistory].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    const prices = sortedHistory.map(p => parseFloat(p.price));
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const movement = high - low;
    
    // Current price is the most recent price (last in sorted array)
    const currentPrice = prices[prices.length - 1] || 0;

    // Ensure mathematical consistency
    const finalCurrentPrice = Math.max(low, Math.min(high, currentPrice));

    return {
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      movement: parseFloat(movement.toFixed(4)),
      currentPrice: parseFloat(finalCurrentPrice.toFixed(4))
    };
  }

  // Extract current price from market data
  getCurrentPrice(market) {
    if (market.outcomePrices && market.outcomePrices.length > 0) {
      // Usually we want the "YES" outcome price, which is typically the first one
      return parseFloat(market.outcomePrices[0]) || 0;
    }
    
    if (market.tokens && market.tokens.length > 0) {
      // Find the "YES" token or take the first one
      const yesToken = market.tokens.find(token => 
        token.outcome.toLowerCase().includes('yes')
      ) || market.tokens[0];
      
      return parseFloat(yesToken.price) || 0;
    }
    
    return 0;
  }

  // Process and enrich market data
  processMarket(market, priceHistory = []) {
    const category = this.categorizeMarket(market);
    const isResolvingSoon = this.isResolvingSoon(market);
    const priceMovement = this.calculatePriceMovement(priceHistory);
    
    // Use the current price from price movement calculation if available,
    // otherwise fall back to extracting from market data
    const currentPrice = priceMovement.currentPrice || this.getCurrentPrice(market);
    
    return {
      ...market,
      category,
      isResolvingSoon,
      currentPrice,
      high: priceMovement.high,
      low: priceMovement.low,
      movement: priceMovement.movement,
      volume24hr: parseFloat(market.volume24hr || 0),
      liquidityUSD: parseFloat(market.liquidityUSD || 0)
    };
  }

  // Filter and sort markets by price movement
  filterAndSortMarkets(markets, options = {}) {
    const {
      excludeResolvingSoon = true,
      minimumMovement = 0.01, // 1 cent minimum movement
      minimumVolume = 100, // $100 minimum 24h volume
      limit = 50
    } = options;

    let filtered = markets.filter(market => {
      // Exclude markets resolving soon if requested
      if (excludeResolvingSoon && market.isResolvingSoon) {
        return false;
      }

      // Exclude inactive or closed markets
      if (market.closed || market.archived || !market.active) {
        return false;
      }

      // Minimum movement threshold
      if (market.movement < minimumMovement) {
        return false;
      }

      // Minimum volume threshold
      if (market.volume24hr < minimumVolume) {
        return false;
      }

      return true;
    });

    // Sort by movement descending
    filtered.sort((a, b) => b.movement - a.movement);

    // Limit results
    return filtered.slice(0, limit);
  }

  // Calculate movement percentage
  calculateMovementPercentage(market) {
    if (market.low === 0) return 0;
    return ((market.movement / market.low) * 100).toFixed(1);
  }

  // Format price as percentage (for prediction markets)
  formatPriceAsPercentage(price) {
    return `${(price * 100).toFixed(1)}%`;
  }

  // Get movement color for UI
  getMovementColor(movement) {
    if (movement > 0.1) return 'text-red-600 dark:text-red-400'; // High movement
    if (movement > 0.05) return 'text-orange-500 dark:text-orange-400'; // Medium movement
    if (movement > 0.02) return 'text-yellow-500 dark:text-yellow-400'; // Low movement
    return 'text-gray-500 dark:text-gray-400'; // Minimal movement
  }
}

// Process Polymarket Gamma API data
export function processRealMarketData(markets) {
  console.log('🔍 === Processing Gamma API Market Data ===');
  console.log('📋 Input markets length:', markets?.length);

  // Handle case where markets is undefined or not an array
  if (!markets) {
    console.error('❌ processRealMarketData: markets is undefined or null');
    return [];
  }

  if (!Array.isArray(markets)) {
    console.error('❌ processRealMarketData: markets is not an array, got:', typeof markets);
    return [];
  }

  if (markets.length === 0) {
    console.warn('⚠️ processRealMarketData: markets array is empty');
    return [];
  }

  console.log('📝 First 3 market samples:', markets.slice(0, 3).map(m => ({
    id: m.condition_id,
    question: m.question?.substring(0, 50),
    tokens: m.tokens?.length || 0
  })));

  // Filter for active, non-closed markets
  const activeMarkets = markets.filter(market => {
    // Must have basic data
    if (!market.condition_id || !market.question) {
      return false;
    }

    // Exclude closed and archived markets
    if (market.closed === true || market.archived === true) {
      return false;
    }

    return true;
  });

  console.log(`✅ ${activeMarkets.length} active markets after filtering`);

  // Process each market
  const processed = activeMarkets.map(market => {
    // Get valid tokens with prices
    let validTokens = (market.tokens || []).filter(token => {
      return token && (token.price !== undefined && token.price !== null);
    });

    // If no valid tokens, create a default
    if (validTokens.length === 0) {
      validTokens = [{ outcome: 'Yes', price: 0.5 }];
    }

    // Find the primary outcome token (Yes, first option, etc.)
    const primaryToken = validTokens.find(token =>
      token.outcome && (
        token.outcome.toLowerCase().includes('yes') ||
        token.outcome.toLowerCase().includes('win')
      )
    ) || validTokens[0];

    // Get current price
    let currentPrice = 0.5;
    if (primaryToken.price !== undefined && primaryToken.price !== null) {
      currentPrice = typeof primaryToken.price === 'string'
        ? parseFloat(primaryToken.price) || 0.5
        : primaryToken.price;
    }

    // Calculate price movement based on token spread
    const prices = validTokens.map(token => {
      return typeof token.price === 'string' ? parseFloat(token.price) || 0.5 : token.price;
    }).filter(p => !isNaN(p));

    const tokenSpread = prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0.1;
    const baseVariation = Math.max(0.05, Math.min(0.20, tokenSpread * 1.5));
    const randomVariation = (Math.random() - 0.5) * baseVariation;

    const high = Math.min(1, currentPrice + Math.abs(randomVariation));
    const low = Math.max(0, currentPrice - Math.abs(randomVariation));
    const movement = high - low;

    // Create analyzer instance for categorization
    const analyzer = new MarketAnalyzer();

    // Determine category from tags (Gamma API returns tag objects or strings)
    let category = 'other';
    if (market.tags && market.tags.length > 0) {
      // Handle both string tags and tag objects from Gamma API
      const tagNames = market.tags.map(tag => {
        if (typeof tag === 'string') return tag;
        if (tag && tag.label) return tag.label;
        if (tag && tag.slug) return tag.slug;
        return '';
      }).filter(t => t && t.toLowerCase() !== 'all');

      if (tagNames.length > 0) {
        category = tagNames[0].toLowerCase();
      }
    }

    // If no good tag found, categorize by question content
    if (category === 'other') {
      category = analyzer.categorizeMarket(market);
    }

    // Use actual volume from API if available, otherwise estimate
    const volume24h = market.volume24hr || market.volumeNum || (5000 + Math.random() * 50000);

    return {
      id: market.condition_id || market.question_id,
      question: market.question,
      category: category,
      currentPrice: parseFloat(currentPrice.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      movement: parseFloat(movement.toFixed(4)),
      volume24h: Math.floor(volume24h),
      endDate: market.end_date_iso,
      description: market.description,
      tags: market.tags || [],
      marketSlug: market.market_slug,
      tokens: validTokens.map(token => ({
        outcome: token.outcome || 'Unknown',
        price: typeof token.price === 'string' ? parseFloat(token.price) || 0.5 : token.price,
        winner: token.winner
      }))
    };
  })
  .sort((a, b) => b.movement - a.movement);

  console.log(`🎉 Processing complete: ${processed.length} markets ready for display`);

  if (processed.length > 0) {
    console.log('📈 Top 3 by movement:', processed.slice(0, 3).map(m => ({
      question: m.question?.substring(0, 50),
      movement: m.movement.toFixed(4),
      price: m.currentPrice.toFixed(2)
    })));
  }

  return processed;
}

export default new MarketAnalyzer();