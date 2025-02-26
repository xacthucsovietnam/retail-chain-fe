import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, DollarSign, Tag, FileText, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrencies } from '../../services/currency';
import type { Currency as ICurrency } from '../../services/currency';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Currency() {
  const navigate = useNavigate();
  const [currencies, setCurrencies] = useState<ICurrency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  const observer = useRef<IntersectionObserver>();
  const lastCurrencyRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore]);

  const fetchCurrencies = async (pageNumber: number, isNewSearch: boolean = false) => {
    try {
      const conditions = [];
      if (searchTerm) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'description',
          value: searchTerm,
          comparisonOperator: 'contains'
        });
      }

      const response = await getCurrencies(pageNumber, 20, conditions);
      
      if (isNewSearch) {
        setCurrencies(response.items);
      } else {
        setCurrencies(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      toast.error('Failed to load currencies');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setCurrencies([]);
    setPage(1);
    setHasMore(true);
    fetchCurrencies(1, true);
  }, []);

  useEffect(() => {
    if (page > 1) {
      setIsLoadingMore(true);
      fetchCurrencies(page);
    }
  }, [page]);

  const handleSearch = () => {
    setIsLoading(true);
    setCurrencies([]);
    setPage(1);
    setHasMore(true);
    fetchCurrencies(1, true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Currencies</h2>
          <button
            onClick={() => navigate('/currency/add')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </button>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search currencies..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Currency List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currencies.map((currency, index) => (
              <div
                key={currency.id}
                ref={index === currencies.length - 1 ? lastCurrencyRef : null}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => navigate(`/currency/${currency.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{currency.name}</h3>
                    <p className="text-sm text-gray-600">{currency.fullName}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {currency.code}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span className="text-sm">Symbol: {currency.symbolicPresentation}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Tag className="h-4 w-4 mr-2" />
                    <span className="text-sm">Main Currency: {currency.mainCurrency}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="text-sm">Markup: {currency.markup}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoadingMore && (
          <div className="text-center py-4">Loading more...</div>
        )}

        {!isLoading && currencies.length === 0 && (
          <div className="text-center py-8 text-gray-500">No currencies found</div>
        )}
      </div>
    </div>
  );
}