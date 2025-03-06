import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, User, DollarSign, FileText, Tag, Wallet, Receipt, Plus, X, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCashReceipts } from '../../services/cashReceipt';
import type { CashReceipt } from '../../services/cashReceipt';

export default function CashReceipts() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<CashReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const lastScrollY = useRef(0);

  // Search filters
  const [searchNumber, setSearchNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [counterpartySearch, setCounterpartySearch] = useState('');
  const [operationType, setOperationType] = useState('');
  const [cashAccount, setCashAccount] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [purpose, setPurpose] = useState('');
  const [sourceDocument, setSourceDocument] = useState('');

  const observer = useRef<IntersectionObserver>();
  const lastReceiptRef = useCallback((node: HTMLDivElement) => {
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

  const fetchReceipts = async (pageNumber: number, isNewSearch: boolean = false) => {
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

      if (counterpartySearch) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'counterparty.presentation',
          value: counterpartySearch,
          comparisonOperator: 'contains'
        });
      }

      if (operationType) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'operationKind.presentation',
          value: operationType,
          comparisonOperator: '='
        });
      }

      if (cashAccount) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'cashAccount.presentation',
          value: cashAccount,
          comparisonOperator: '='
        });
      }

      if (minAmount || maxAmount) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'documentAmount',
          value: { min: Number(minAmount) || 0, max: Number(maxAmount) || Infinity },
          comparisonOperator: 'between'
        });
      }

      if (currency) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'cashCurrency.presentation',
          value: currency,
          comparisonOperator: '='
        });
      }

      if (purpose) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'cashFlowItem.presentation',
          value: purpose,
          comparisonOperator: '='
        });
      }

      if (sourceDocument) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'documentBasis.presentation',
          value: sourceDocument,
          comparisonOperator: 'contains'
        });
      }

      const response = await getCashReceipts(pageNumber, 20, conditions);
      
      if (isNewSearch) {
        setReceipts(response.items);
      } else {
        setReceipts(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      toast.error('Không thể tải danh sách phiếu thu');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setReceipts([]);
    setPage(1);
    setHasMore(true);
    fetchReceipts(1, true);
  }, []);

  useEffect(() => {
    if (page > 1) {
      setIsLoadingMore(true);
      fetchReceipts(page);
    }
  }, [page]);

  const handleSearch = () => {
    setIsLoading(true);
    setReceipts([]);
    setPage(1);
    setHasMore(true);
    fetchReceipts(1, true);
    setIsSearchExpanded(false);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setSearchNumber('');
    setStartDate('');
    setEndDate('');
    setCounterpartySearch('');
    setOperationType('');
    setCashAccount('');
    setMinAmount('');
    setMaxAmount('');
    setCurrency('');
    setPurpose('');
    setSourceDocument('');
    setIsFilterOpen(false);
  };

  const formatCurrency = (amount: number, currencyString: string) => {
    const currencyMap: { [key: string]: string } = {
      'Đồng': 'VND',
      'USD': 'USD',
      'Dollar': 'USD',
      'Euro': 'EUR',
      'EUR': 'EUR',
      'JPY': 'JPY',
      'Yen': 'JPY'
    };

    const currencyCode = currencyMap[currencyString] || 'VND';

    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currencyCode
      }).format(amount);
    } catch (error) {
      return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currencyString;
    }
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
          <h1 className="text-lg font-semibold text-gray-900">Danh sách phiếu thu tiền mặt</h1>
        </div>

        {/* Search Bar */}
        <div className={`bg-white px-4 py-2 shadow-sm transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`relative flex-1 transition-all duration-300 ${isSearchExpanded ? 'flex-grow' : ''}`}>
              {isSearchExpanded ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value)}
                    placeholder="Tìm kiếm phiếu thu..."
                    className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <button
                    onClick={() => {
                      setSearchNumber('');
                      setIsSearchExpanded(false);
                    }}
                    className="absolute right-3 top-2.5"
                  >
                    <X className="h-4 w-4 text-gray-400" />
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
                startDate || endDate || counterpartySearch || operationType || cashAccount || minAmount || maxAmount || currency || purpose || sourceDocument
                  ? 'bg-blue-50 text-blue-600'
                  : ''
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-12 px-4 pb-20">
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            // Loading Skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow animate-pulse p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : (
            receipts.map((receipt, index) => (
              <div
                key={receipt.number}
                ref={index === receipts.length - 1 ? lastReceiptRef : null}
                onClick={() => navigate(`/cash-receipts/${receipt.id}`)}
                className="bg-white rounded-lg shadow-sm p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">#{receipt.number}</h3>
                    <p className="text-sm text-gray-500">{formatDate(receipt.date)}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {receipt.operationType}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {receipt.counterparty}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Wallet className="h-4 w-4 mr-2" />
                    {receipt.cashAccount}
                  </div>

                  <div className="flex items-center text-sm font-medium text-blue-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {formatCurrency(receipt.amount, receipt.currency)}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    {receipt.purpose}
                  </div>

                  {receipt.sourceDocument && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Receipt className="h-4 w-4 mr-2" />
                      {receipt.sourceDocument}
                    </div>
                  )}

                  {receipt.notes && (
                    <div className="flex items-start text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-2 mt-0.5" />
                      {receipt.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoadingMore && (
            <div className="text-center py-4">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          )}

          {!isLoading && receipts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy phiếu thu
            </div>
          )}
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
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
                    value={counterpartySearch}
                    onChange={(e) => setCounterpartySearch(e.target.value)}
                    placeholder="Tìm kiếm khách hàng..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại thu</label>
                <div className="relative">
                  <input
                    type="text"
                    value={operationType}
                    onChange={(e) => setOperationType(e.target.value)}
                    placeholder="Chọn loại thu..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quỹ tiền</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cashAccount}
                    onChange={(e) => setCashAccount(e.target.value)}
                    placeholder="Chọn quỹ tiền..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền tối thiểu</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      placeholder="Nhập số tiền..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền tối đa</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      placeholder="Nhập số tiền..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 border-t">
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
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/cash-receipts/add')}
        className="fixed right-4 bottom-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}