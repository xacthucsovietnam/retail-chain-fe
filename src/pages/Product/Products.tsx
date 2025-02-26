import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts } from '../../services/product';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../utils/currency';

interface Product {
  id: string;
  imageUrl: string;
  category: string;
  name: string;
  code: string;
  price: number;
}

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
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
      if (currentScrollY < lastScrollY.current - 100) {
        setShowFilter(true);
      } else if (currentScrollY > lastScrollY.current + 10) {
        setShowFilter(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProducts = async (pageNumber: number, isNewSearch: boolean = false) => {
    try {
      const response = await getProducts(searchTerm, selectedCategory, pageNumber);
      setProducts(prev => isNewSearch ? response.items : [...prev, ...response.items]);
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
  };

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-transform duration-300">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-gray-800">{t('products.title')}</h2>
            <button
              onClick={() => navigate('/products/add')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('products.newProduct')}
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('products.searchPlaceholder')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            <div className={`overflow-hidden transition-all duration-300 ${showFilter ? 'max-h-20 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                    >
                      <option value="">{t('products.allCategories')}</option>
                      <option value="clothing">{t('products.categoryClothing')}</option>
                      <option value="toys">{t('products.categoryToys')}</option>
                      <option value="accessories">{t('products.categoryAccessories')}</option>
                    </select>
                    <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? t('products.searching') : t('products.search')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('products.title')}</h2>
          <button
            onClick={() => navigate('/products/add')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Product
          </button>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('products.searchPlaceholder')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="w-48">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
              >
                <option value="">{t('products.allCategories')}</option>
                <option value="clothing">{t('products.categoryClothing')}</option>
                <option value="toys">{t('products.categoryToys')}</option>
                <option value="accessories">{t('products.categoryAccessories')}</option>
              </select>
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? t('products.searching') : t('products.search')}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="md:bg-white md:rounded-lg md:shadow-md md:p-6">
        {isLoading ? (
          <div className="text-center py-8">{t('products.loading')}</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mt-20 md:mt-0">
            {products.map((product, index) => (
              <div
                key={`${product.code}-${index}`}
                ref={index === products.length - 1 ? lastProductRef : null}
                className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                    alt={product.name}
                    className="object-cover w-full h-32 sm:h-48"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
                      e.currentTarget.alt = 'Fallback product image';
                    }}
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full mb-1 sm:mb-2">
                    {product.category}
                  </span>
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">{product.code}</p>
                  <p className="text-sm sm:text-lg font-bold text-blue-600">{formatCurrency(product.price, 'VND')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoadingMore && (
          <div className="text-center py-4">{t('products.loadingMore')}</div>
        )}

        {!isLoading && products.length === 0 && (
          <div className="text-center py-8 text-gray-500">{t('products.noResults')}</div>
        )}
      </div>
    </div>
  );
}

export default Products;