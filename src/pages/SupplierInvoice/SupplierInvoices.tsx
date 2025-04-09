import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building, User, FileText, Tag, DollarSign, Plus, Calendar, X, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupplierInvoices } from '../../services/supplierInvoice';
import { getSession } from '../../utils/storage';
import type { SupplierInvoice } from '../../services/supplierInvoice';

export default function SupplierInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastScrollY = useRef(0);

  // Search filters
  const [searchId, setSearchId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [counterpartySearch, setCounterpartySearch] = useState('');
  const [operationType, setOperationType] = useState('');

  const observer = useRef<IntersectionObserver>();
  const lastInvoiceRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore || !node) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      observer.current.observe(node);
    },
    [isLoadingMore, hasMore]
  );

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

  const fetchInvoices = async (pageNumber: number, isNewSearch: boolean = false) => {
    const defaultValues = getSession()?.defaultValues;

    if (!defaultValues?.company?.id) {
      setError('Không thể tải dữ liệu do thiếu thông tin công ty trong phiên làm việc');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const conditions = [];

      if (searchId) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'objectId.presentation',
          value: searchId,
          comparisonOperator: 'contains',
        });
      }

      if (startDate && endDate) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'date',
          value: { start: startDate, end: endDate },
          comparisonOperator: 'between',
        });
      }

      if (authorSearch) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'author.presentation',
          value: authorSearch,
          comparisonOperator: 'contains',
        });
      }

      if (companySearch) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'company.presentation',
          value: companySearch,
          comparisonOperator: 'contains',
        });
      }

      if (counterpartySearch) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'counterparty.presentation',
          value: counterpartySearch,
          comparisonOperator: 'contains',
        });
      }

      if (operationType) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'operationKind.presentation',
          value: operationType,
          comparisonOperator: '=',
        });
      }

      const response = await getSupplierInvoices(pageNumber, 50, conditions);

      if (isNewSearch) {
        setInvoices(response.items);
      } else {
        setInvoices((prev) => [...prev, ...response.items]);
      }

      setHasMore(response.hasMore);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách đơn nhập hàng';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1, true);
  }, []);

  useEffect(() => {
    if (page > 1) {
      setIsLoadingMore(true);
      fetchInvoices(page);
    }
  }, [page]);

  const handleSearch = () => {
    setIsLoading(true);
    setInvoices([]);
    setPage(1);
    setHasMore(true);
    fetchInvoices(1, true);
    setIsSearchExpanded(false);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setSearchId('');
    setStartDate('');
    setEndDate('');
    setAuthorSearch('');
    setCompanySearch('');
    setCounterpartySearch('');
    setOperationType('');
    setIsFilterOpen(false);
    handleSearch();
  };

  const formatCurrency = (amount: number, currency: ObjectId) => {
    const currencyString = currency?.presentation || 'VND';
    const normalizedCurrency = currencyString
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    const currencyMap: { [key: string]: string } = {
      DONG: 'VND',
      VND: 'VND',
      USD: 'USD',
      DOLLAR: 'USD',
      EURO: 'EUR',
      EUR: 'EUR',
      JPY: 'JPY',
      YEN: 'JPY',
      CNY: 'CNY',
    };

    const currencyCode = currencyMap[normalizedCurrency] || 'VND';

    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currencyCode,
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
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-white px-4 py-3 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Danh sách đơn nhập hàng</h1>
        </div>

        <div
          className={`bg-white px-4 py-2 shadow-sm transition-transform duration-300 ${
            isHeaderVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`relative flex-1 transition-all duration-300 ${isSearchExpanded ? 'flex-grow' : ''}`}>
              {isSearchExpanded ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Tìm kiếm đơn nhập hàng..."
                    className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <button
                    onClick={() => {
                      setSearchId('');
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
                startDate || endDate || authorSearch || companySearch || counterpartySearch || operationType
                  ? 'bg-blue-50 text-blue-600'
                  : ''
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-12 px-4 pb-20">
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
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
            invoices.map((invoice, index) => (
              <div
                key={invoice.id}
                ref={index === invoices.length - 1 ? lastInvoiceRef : null}
                onClick={() => navigate(`/supplier-invoices/${invoice.id}`)}
                className="bg-white rounded-lg shadow-sm p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">#{invoice.number}</h3>
                    <p className="text-sm text-gray-500">{formatDate(invoice.date)}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.posted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {invoice.posted ? 'Đã ghi sổ' : 'Chưa ghi sổ'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {invoice.counterparty?.presentation || 'Không xác định'}
                  </div>

                  <div className="flex items-center text-sm font-medium text-blue-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {formatCurrency(invoice.documentAmount, invoice.documentCurrency)}
                  </div>

                  {invoice.employeeResponsible?.presentation && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      {invoice.employeeResponsible.presentation}
                    </div>
                  )}

                  {invoice.comment && (
                    <div className="flex items-start text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-2 mt-0.5" />
                      {invoice.comment}
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

          {!isLoading && invoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">Không tìm thấy đơn nhập hàng</div>
          )}
        </div>
      </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Người lập</label>
                <div className="relative">
                  <input
                    type="text"
                    value={authorSearch}
                    onChange={(e) => setAuthorSearch(e.target.value)}
                    placeholder="Tìm kiếm người lập..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Công ty</label>
                <div className="relative">
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Tìm kiếm công ty..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đối tác</label>
                <div className="relative">
                  <input
                    type="text"
                    value={counterpartySearch}
                    onChange={(e) => setCounterpartySearch(e.target.value)}
                    placeholder="Tìm kiếm đối tác..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại nghiệp vụ</label>
                <div className="relative">
                  <input
                    type="text"
                    value={operationType}
                    onChange={(e) => setOperationType(e.target.value)}
                    placeholder="Chọn loại nghiệp vụ..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
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

            <div className="h-6" />
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/supplier-invoices/add')}
        className="fixed right-4 bottom-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}