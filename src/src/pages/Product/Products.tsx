import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, X } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { t } = useLanguage();

  const observer = useRef<IntersectionObserver>();
  const lastProductRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY.current - 20) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current + 20) {
        setIsHeaderVisible(false);
        setIsSearchExpanded(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProducts = async (pageNumber: number, isNewSearch: boolean = false) => {
    try {
      const response = await getProducts(searchTerm, selectedCategory, pageNumber);
      
      if (isNewSearch) {
        setProducts(response.items);
      } else {
        setProducts(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      toast.error(t('message.productsFailed'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    if (page > 1) {
      setIsLoadingMore(true);
      fetchProducts(page);
    }
  }, [page]);

  const handleSearch = () => {
    setIsLoading(true);
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
    setIsSearchExpanded(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setIsFilterOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
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

          {/* Search and Filter Bar */}
          <div className="flex items-center gap-2">
            <div className={`relative flex-1 transition-all duration-300 ${isSearchExpanded ? 'flex-grow' : ''}`}>
              {isSearchExpanded ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearchExpanded(false);
                    }}
                    className="absolute right-3 top-2.5"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsFilterOpen(true)}
              className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg ${
                selectedCategory ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 px-4 pb-20">
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
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
                ref={index === products.length - 1 ? lastProductRef : null}
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
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 rounded-full mb-1">
                    {product.category}
                  </span>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{product.code}</p>
                  <p className="text-sm font-semibold text-blue-600 mt-1">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {isLoadingMore && (
          <div className="text-center py-4">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Không tìm thấy sản phẩm</p>
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Bộ lọc</h2>
              <button onClick={() => setIsFilterOpen(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả danh mục</option>
                  <option value="clothing">Quần áo</option>
                  <option value="toys">Đồ chơi</option>
                  <option value="accessories">Phụ kiện</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Xóa bộ lọc
                </button>
                <button
                  onClick={() => {
                    handleSearch();
                    setIsFilterOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Bottom Safe Area */}
            <div className="h-6" />
          </div>
        </div>
      )}

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