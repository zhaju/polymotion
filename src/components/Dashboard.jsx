import React, { useState, useEffect } from 'react';
import { RefreshCw, Moon, Sun } from 'lucide-react';
import polymarketApi from '../services/polymarketApi';
import { processRealMarketData } from '../utils/marketAnalyzer';
import logoImg from '/logo.png';

const Dashboard = () => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUsingRealData, setIsUsingRealData] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const categories = ['all', 'politics', 'sports', 'crypto', 'entertainment', 'technology', 'finance', 'weather', 'other'];

  // Toggle dark mode and apply to document
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize dark mode on component mount
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedMode ? JSON.parse(savedMode) : prefersDark;
    
    setIsDarkMode(shouldUseDark);
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Intelligent category detection
  const detectCategory = (market) => {
    let category = 'other';

    if (market.tags && market.tags.length > 0) {
      const relevantTag = market.tags.find(tag => tag !== 'All' && tag !== 'all');
      if (relevantTag) {
        category = relevantTag.toLowerCase();
      }
    }

    if (category === 'other') {
      const questionLower = (market.question || '').toLowerCase();
      if (questionLower.includes('trump') || questionLower.includes('biden') || questionLower.includes('election') || questionLower.includes('president')) {
        category = 'politics';
      } else if (questionLower.includes('bitcoin') || questionLower.includes('ethereum') || questionLower.includes('crypto')) {
        category = 'crypto';
      } else if (questionLower.includes('nfl') || questionLower.includes('nba') || questionLower.includes('super bowl') || questionLower.includes('championship')) {
        category = 'sports';
      } else if (questionLower.includes('ai') || questionLower.includes('artificial intelligence') || questionLower.includes('tech')) {
        category = 'technology';
      } else if (questionLower.includes('stock') || questionLower.includes('market') || questionLower.includes('economy')) {
        category = 'finance';
      } else if (questionLower.includes('movie') || questionLower.includes('music') || questionLower.includes('celebrity')) {
        category = 'entertainment';
      } else if (questionLower.includes('hurricane') || questionLower.includes('weather') || questionLower.includes('climate')) {
        category = 'weather';
      }
    }

    return category;
  };

  const fetchMarketData = async () => {
    console.log('🔄 Fetching market data...');
    setLoading(true);
    setError(null);

    try {
      const response = await polymarketApi.fetchMarkets(100, 0);
      let marketsArray;

      if (Array.isArray(response)) {
        marketsArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        marketsArray = response.data;
      } else {
        throw new Error('Unexpected API response format');
      }

      setIsUsingRealData(true);

      const processedMarkets = processRealMarketData(marketsArray);
      console.log(`📈 Processed ${processedMarkets.length} unresolved markets from ${marketsArray.length} total markets`);

      setMarkets(processedMarkets);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('🚨 Dashboard: Error fetching market data:', err);
      setError(err.message);
      setIsUsingRealData(false);

      if (err.message.includes('internet connection') ||
          err.message.includes('rate limit') ||
          err.message.includes('experiencing issues')) {
        setMarkets([]);
      } else {
        console.log('🔄 Using minimal fallback data due to API error');
        const sampleData = [
          {
            id: 'sample-1',
            question: 'Will Bitcoin reach $200,000 by end of 2026?',
            category: 'crypto',
            currentPrice: 0.45,
            high: 0.52,
            low: 0.38,
            movement: 0.52 - 0.38,
            volume24h: 25000,
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            resolved: false
          }
        ];
        setMarkets(sampleData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  const filteredMarkets = markets.filter(market =>
    selectedCategory === 'all' || market.category === selectedCategory
  );

  const formatPrice = (price) => `${(price * 100).toFixed(1)}¢`;
  const formatMovement = (movement) => `${(movement * 100).toFixed(1)}¢`;
  const formatVolume = (volume) => {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const getThemeClasses = () => ({
    pageBackground: 'bg-gray-50 dark:bg-gray-900',
    cardBackground: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    primaryText: 'text-gray-900 dark:text-white',
    secondaryText: 'text-gray-600 dark:text-gray-300',
    mutedText: 'text-gray-500 dark:text-gray-400',
    categoryCount: 'text-white dark:text-gray-400',
    primaryButton: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white border-blue-500 dark:border-blue-500',
    secondaryButton: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600',
    successStatus: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
    warningStatus: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300',
    errorStatus: 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700 text-red-700 dark:text-red-200',
    tableHeader: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    tableBody: 'bg-white dark:bg-gray-900',
    tableRow: 'hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700',
    tableRowEven: 'bg-white dark:bg-gray-800',
    tableRowOdd: 'bg-gray-50 dark:bg-gray-900',
    categoryTag: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    spinner: 'border-blue-600 dark:border-blue-500',
    priceGreen: 'text-green-600 dark:text-green-400',
    priceRed: 'text-red-600 dark:text-red-400',
    priceOrange: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-gray-200 dark:border-gray-700',
    cellBorder: 'border-b border-gray-200 dark:border-gray-700',
  });

  const theme = getThemeClasses();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center border ${theme.borderColor} ${theme.pageBackground}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-32 w-32 border-b-2 mx-auto ${theme.spinner}`}></div>
          <p className={`mt-4 ${theme.secondaryText}`}>Loading real Polymarket data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 border ${theme.borderColor} ${theme.pageBackground}`}>
      <div className="max-w-7xl mx-auto">
        <div className={`rounded-lg shadow-md p-6 mb-6 border ${theme.cardBackground}`}>
          <div className="flex justify-between items-center mb-4">
            <h1 className={`text-3xl font-bold ${theme.primaryText} flex items-center gap-3`}>
              Polymotion 
              <img 
                src={logoImg} 
                alt="Polymotion Logo" 
                className="h-8 w-8"
              />
            </h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleDarkMode}
                className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg transition-all duration-300 border ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 border-blue-500' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-md border-gray-300'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Night Mode'}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                <span className="text-sm font-medium">{isDarkMode ? 'Light' : 'Night'}</span>
              </button>
              
              <button
                onClick={fetchMarketData}
                disabled={loading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 transition-all duration-300 border ${theme.primaryButton} shadow-lg`}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
          
          <p className={`mb-4 ${theme.secondaryText}`}>
            Prediction markets ranked by 24-hour price movement, so you know what's breaking.
          </p>
          
          {lastUpdated && (
            <div className="flex items-center justify-between">
              <p className={`text-sm ${theme.mutedText}`}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isUsingRealData ? theme.successStatus : theme.warningStatus
              }`}>
                {isUsingRealData ? '🟢 Real Data' : '🟡 Sample Data'}
              </div>
            </div>
          )}
          
          {error && (
            <div className={`mt-4 p-4 border rounded-lg ${theme.errorStatus}`}>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className={`rounded-lg shadow-md p-6 mb-6 border ${theme.cardBackground}`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme.primaryText}`}>Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                  selectedCategory === category
                    ? theme.primaryButton + ' shadow-lg transform scale-105'
                    : theme.secondaryButton + ' hover:scale-105'
                }`}
              >
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)} 
                <span className={`ml-1 ${selectedCategory === category ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  ({category === 'all' ? markets.length : markets.filter(m => m.category === category).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={`rounded-lg shadow-md overflow-hidden border ${theme.cardBackground}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className={`${theme.tableHeader}`}>
                <tr className={`border-b ${theme.borderColor}`}>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.cellBorder} ${theme.mutedText}`}>
                    Question
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.cellBorder} ${theme.mutedText}`}>
                    Category
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme.cellBorder} ${theme.mutedText}`}>
                    Current Price
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme.cellBorder} ${theme.mutedText}`}>
                    24h High
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme.cellBorder} ${theme.mutedText}`}>
                    24h Low
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme.cellBorder} ${theme.mutedText}`}>
                    Movement
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${theme.cellBorder} ${theme.mutedText}`}>
                    24h Volume
                  </th>
                </tr>
              </thead>
              <tbody className={`${theme.tableBody}`}>
                {filteredMarkets.map((market, index) => (
                  <tr 
                    key={market.id} 
                    className={`border-b ${theme.borderColor} ${
                      index % 2 === 0 ? theme.tableRowEven : theme.tableRowOdd
                    } ${theme.tableRow}`}
                  >
                    <td className={`px-6 py-4 ${theme.cellBorder}`}>
                      <div className={`text-sm font-medium max-w-md ${theme.primaryText}`}>
                        {market.question}
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${theme.cellBorder}`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${theme.categoryTag}`}>
                        {market.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-center text-sm font-medium ${theme.cellBorder} ${theme.primaryText}`}>
                      {formatPrice(market.currentPrice)}
                    </td>
                    <td className={`px-6 py-4 text-center text-sm font-medium ${theme.cellBorder} ${theme.priceGreen}`}>
                      {formatPrice(market.high)}
                    </td>
                    <td className={`px-6 py-4 text-center text-sm font-medium ${theme.cellBorder} ${theme.priceRed}`}>
                      {formatPrice(market.low)}
                    </td>
                    <td className={`px-6 py-4 text-center text-sm font-medium ${theme.cellBorder} ${theme.priceOrange}`}>
                      {formatMovement(market.movement)}
                    </td>
                    <td className={`px-6 py-4 text-center text-sm ${theme.cellBorder} ${theme.secondaryText}`}>
                      {formatVolume(market.volume24h)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredMarkets.length === 0 && (
            <div className="text-center py-8">
              <p className={theme.mutedText}>No markets found for the selected category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
