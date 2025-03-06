import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Calendar, User, DollarSign, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrders } from '../../services/order';
import { useLanguage } from '../../contexts/LanguageContext';

interface Order {
  id: string;
  number: string;
  date: string;
  customerName: string;
  status: string;
  totalAmount: number;
  totalProducts: number;
  notes: string;
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { t } = useLanguage();

  // Search filters
  const [searchNumber, setSearchNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const observer = useRef<IntersectionObserver>();
  const lastOrderRef = useCallback((node: HTMLDivElement) => {
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
      
      // Show/hide header based on scroll direction
      if (currentScrollY < lastScrollY.current - 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current + 10) {
        setIsHeaderVisible(false);
        setIsSearchExpanded(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchOrders = async (pageNumber: number, isNewSearch: boolean = false) => {
    try {
      const conditions = [];
      
      if (searchNumber) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'number',
          value: searchNumber,
          comparisonOperator: 'contains'
        });
      }

      if (startDate && endDate) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'date',
          value: { start: startDate, end: endDate },
          comparisonOperator: 'between'
        });
      }

      if (customerSearch) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'customer.presentation',
          value: customerSearch,
          comparisonOperator: 'contains'
        });
      }

      if (statusFilter) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'orderState.presentation',
          value: statusFilter,
          comparisonOperator: '='
        });
      }

      if (minPrice || maxPrice) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'documentAmount',
          value: { min: Number(minPrice) || 0, max: Number(maxPrice) || Infinity },
          comparisonOperator: 'between'
        });
      }

      const response = await getOrders(pageNumber, 20, conditions);
      
      if (isNewSearch) {
        setOrders(response.items);
      } else {
        setOrders(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      toast.error(t('message.ordersFailed'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setOrders([]);
    setPage(1);
    setHasMore(true);
    fetchOrders(1, true);
  }, []);

  useEffect(() => {
    if (page > 1) {
      setIsLoadingMore(true);
      fetchOrders(page);
    }
  }, [page]);

  const handleSearch = () => {
    setIsLoading(true);
    setOrders([]);
    setPage(1);
    setHasMore(true);
    fetchOrders(1, true);
    setIsSearchExpanded(false);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setSearchNumber('');
    setStartDate('');
    setEndDate('');
    setCustomerSearch('');
    setStatusFilter('');
    setMinPrice('');
    setMaxPrice('');
    setIsFilterOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('đang soạn')) {
      return 'bg-[#FFC107]/10 text-[#FFC107]';
    }
    if (statusLower.includes('đã giao hàng')) {
      return 'bg-[#FF9800]/10 text-[#FF9800]';
    }
    if (statusLower.includes('chờ trả trước')) {
      return 'bg-[#2196F3]/10 text-[#2196F3]';
    }
    if (statusLower.includes('đang chuẩn bị')) {
      return 'bg-[#4CAF50]/10 text-[#4CAF50]';
    }
    if (statusLower.includes('đã hủy')) {
      return 'bg-[#F44336]/10 text-[#F44336]';
    }
    if (statusLower.includes('đã hoàn thành')) {
      return 'bg-[#9C27B0]/10 text-[#9C27B0]';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Title Bar */}
        <div className="bg-white px-4 py-3 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Danh sách đơn hàng</h1>
        </div>

        {/* Search Bar - Now separate from header */}
        <div className={`bg-white px-4 py-2 shadow-sm transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                placeholder="Tìm kiếm theo mã đơn hàng..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            <button
              onClick={() => setIsFilterOpen(true)}
              className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg ${
                startDate || endDate || customerSearch || statusFilter || minPrice || maxPrice
                  ? 'bg-blue-50 text-blue-600'
                  : ''
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Adjusted padding to account for fixed header and search bar */}
      <div className="pt-12 px-4 pb-20">
        {isLoading ? (
          // Loading Skeletons
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Orders List
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div
                key={order.id}
                ref={index === orders.length - 1 ? lastOrderRef : null}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">#{order.number}</h3>
                    <p className="text-xs text-gray-500">{formatDate(order.date)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-1.5" />
                    {order.customerName}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {order.totalProducts} sản phẩm
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>

                  {order.notes && (
                    <p className="text-xs text-gray-500 italic line-clamp-2">
                      {order.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isLoadingMore && (
              <div className="text-center py-4">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            )}

            {!isLoading && orders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Không tìm thấy đơn hàng</p>
              </div>
            )}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Tìm kiếm khách hàng..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Đang soạn">Đang soạn</option>
                  <option value="Đã giao hàng">Đã giao hàng</option>
                  <option value="Chờ trả trước">Chờ trả trước</option>
                  <option value="Đang chuẩn bị">Đang chuẩn bị</option>
                  <option value="Đã hủy">Đã hủy</option>
                  <option value="Đã hoàn thành">Đã hoàn thành</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá từ</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Giá tối thiểu"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến giá</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Giá tối đa"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Xóa bộ lọc
                </button>
                <button
                  onClick={handleSearch}
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
        onClick={() => navigate('/orders/add')}
        className="fixed right-4 bottom-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}