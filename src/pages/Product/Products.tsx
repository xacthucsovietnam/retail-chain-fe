import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts } from '../../services/product';
import { useLanguage } from '../../contexts/LanguageContext';
import { DEFAULT_IMAGE_URL } from '../../services/file';

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
  imageUrl: string;
}

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'description' | 'sku'>('sku'); // Thay đổi mặc định thành 'sku'
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<{ term: string; type: 'description' | 'sku' }>({
    term: '',
    type: 'sku', // Cập nhật để đồng bộ với giá trị mặc định
  });
  const radioContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Fetch products
  const fetchProducts = useCallback(
    async (pageNum: number, search: string, type: 'description' | 'sku', reset: boolean = false) => {
      if (isLoading || (!hasMore && !reset)) return;

      try {
        setIsLoading(true);
        const response = await getProducts(search, '', pageNum, 20, type);
        setProducts((prev) => (reset || pageNum === 1 ? response.items : [...prev, ...response.items]));
        setHasMore(response.hasMore);
        lastSearchRef.current = { term: search, type };
      } catch (error) {
        toast.error(t('message.productsFailed'));
      } finally {
        setIsLoading(false);
        setIsSearchLoading(false);
        if (pageNum === 1) setIsInitialLoadDone(true);
      }
    },
    [isLoading, hasMore, t]
  );

  // Initial fetch (only once)
  useEffect(() => {
    if (!isInitialLoadDone) {
      fetchProducts(1, '', 'sku', true); // Cập nhật type thành 'sku'
    }
  }, [fetchProducts, isInitialLoadDone]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsSearchLoading(true);

    if (isSearchFocused && newSearchTerm !== lastSearchRef.current.term) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        if (newSearchTerm !== lastSearchRef.current.term || searchType !== lastSearchRef.current.type) {
          setPage(1);
          setHasMore(true);
          fetchProducts(1, newSearchTerm, searchType, true);
        } else {
          setIsSearchLoading(false);
        }
      }, 2000);
    } else {
      setIsSearchLoading(false);
    }
  };

  // Handle blur (when search input loses focus)
  const handleSearchBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const relatedTarget = e.relatedTarget as Node;
    const radioContainer = radioContainerRef.current;

    // If the focus moves to the radio container or its children, keep the search focused
    if (radioContainer && relatedTarget && radioContainer.contains(relatedTarget)) {
      return;
    }

    setTimeout(() => setIsSearchFocused(false), 200);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (
      searchTerm !== lastSearchRef.current.term ||
      searchType !== lastSearchRef.current.type
    ) {
      setPage(1);
      setHasMore(true);
      fetchProducts(1, searchTerm, searchType, true);
    } else {
      setIsSearchLoading(false);
    }
  };

  // Handle focus on radio container to keep search focused
  const handleRadioFocus = () => {
    setIsSearchFocused(true);
  };

  // Handle search type change
  const handleSearchTypeChange = (type: 'description' | 'sku') => {
    setSearchType(type);
    if (searchTerm && (type !== lastSearchRef.current.type || searchTerm !== lastSearchRef.current.term)) {
      setIsSearchLoading(true);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setPage(1);
      setHasMore(true);
      fetchProducts(1, searchTerm, type, true);
    }
  };

  // Infinite scroll
  const lastProductElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || !hasMore || products.length < 16) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchProducts(nextPage, lastSearchRef.current.term, lastSearchRef.current.type);
          }
        },
        { threshold: 0.1 }
      );

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, products.length, page, fetchProducts]
  );

  // Clean up
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setPage(1);
    setHasMore(true);
    fetchProducts(1, '', searchType, true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="px-4 py-3">
          {/* Title and Add Button */}
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h1>
            <button
              onClick={() => navigate('/products/add')}
              className="p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="flex items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={handleSearchBlur}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              {searchTerm && (
                <button onClick={clearSearch} className="absolute right-3 top-2.5">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Radio Buttons */}
            {isSearchFocused && (
              <div
                ref={radioContainerRef}
                className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md p-3 mt-1 z-10"
                onFocus={handleRadioFocus}
              >
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="searchType"
                    value="description"
                    checked={searchType === 'description'}
                    onChange={() => handleSearchTypeChange('description')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    tabIndex={0}
                  />
                  <span className="text-sm text-gray-700">Theo tên</span>
                </label>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="radio"
                    name="searchType"
                    value="sku"
                    checked={searchType === 'sku'} // Đặt mặc định là checked cho 'sku'
                    onChange={() => handleSearchTypeChange('sku')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    tabIndex={0}
                  />
                  <span className="text-sm text-gray-700">Theo mã</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 px-4 pb-20 relative">
        {isSearchLoading && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {isLoading && products.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow animate-pulse">
                <div className="h-32 bg-gray-200 rounded-t-lg" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : (
            products.map((product, index) => (
              <div
                key={product.id}
                ref={index === products.length - 5 ? lastProductElementRef : null}
                onClick={() => navigate(`/products/${product.id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden active:scale-95 transition-transform"
              >
                <div className="aspect-square">
                  <img
                    src={product.imageUrl || DEFAULT_IMAGE_URL}
                    alt={`${product.name || 'Sản phẩm'}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_IMAGE_URL;
                      e.currentTarget.alt = 'Hình ảnh mặc định';
                      e.currentTarget.onerror = null;
                    }}
                  />
                </div>
                <div className="p-2">
                  <h3 className="text-sm font-medium text-gray-700 line-clamp-2">{product.name}</h3>
                  <p className="text-sm font-medium text-black-700 mt-0.5">{product.code}</p>
                  <p className="text-sm font-semibold text-blue-600 mt-1">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && products.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Không tìm thấy sản phẩm</p>
          </div>
        )}

        {isLoading && products.length > 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500">Đang tải thêm...</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/products/add')}
        className="fixed right-4 bottom-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}