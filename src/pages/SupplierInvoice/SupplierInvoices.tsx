import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building, User, Users, FileText, Tag, DollarSign, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupplierInvoices } from '../../services/supplierInvoice';
import { useLanguage } from '../../contexts/LanguageContext';

interface SupplierInvoice {
    id: string;
    number: string;
    date: string;
    author: string;
    contract: string;
    counterparty: string;
    operationType: string;
    amount: number;
    currency: string;
    employeeResponsible: string;
    vatTaxation: string;
    structuralUnit: string;
    orderBasis: string;
    comment: string;
    posted: boolean;
}

export default function SupplierInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilter, setShowFilter] = useState(true);
  const lastScrollY = useRef(0);
  const { t } = useLanguage();

  // Search filters
  const [searchId, setSearchId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [counterpartySearch, setCounterpartySearch] = useState('');
  const [operationType, setOperationType] = useState('');

  const observer = useRef<IntersectionObserver>();
  const lastInvoiceRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore || !node) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    observer.current.observe(node);
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

  const fetchInvoices = async (pageNumber: number, isNewSearch: boolean = false) => {
    try {
      const conditions = [];

      if (searchId) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'objectId.presentation',
          value: searchId,
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

      if (authorSearch) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'author.presentation',
          value: authorSearch,
          comparisonOperator: 'contains'
        });
      }

      if (companySearch) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'company.presentation',
          value: companySearch,
          comparisonOperator: 'contains'
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

      const response = await getSupplierInvoices(pageNumber, 50, conditions);
      
      if (isNewSearch) {
        setInvoices(response.items);
      } else {
        setInvoices(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      toast.error(t('supplierInvoices.failed'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setInvoices([]);
    setPage(1);
    setHasMore(true);
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
  };

  const handleInvoiceClick = (invoiceId: string) => {
    navigate(`/supplier-invoices/${invoiceId}`);
  };

  const formatCurrency = (amount: number, currencyString: string) => {
    const normalizedCurrency = currencyString
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    const currencyMap: { [key: string]: string } = {
      'DONG': 'VND',
      'VND': 'VND',
      'USD': 'USD',
      'DOLLAR': 'USD',
      'EURO': 'EUR',
      'EUR': 'EUR',
      'JPY': 'JPY',
      'YEN': 'JPY'
    };

    const currencyCode = currencyMap[normalizedCurrency] || 'VND';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-transform duration-300">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-gray-800">{t('supplierInvoices.title')}</h2>
            <button
              onClick={() => navigate('/supplier-invoices/add')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm mới
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder={t('supplierInvoices.searchPlaceholder')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            <div className={`space-y-3 overflow-hidden transition-all duration-300 ${showFilter ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('supplierInvoices.startDate')}</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('supplierInvoices.endDate')}</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={authorSearch}
                  onChange={(e) => setAuthorSearch(e.target.value)}
                  placeholder={t('supplierInvoices.authorPlaceholder')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder={t('supplierInvoices.companyPlaceholder')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={counterpartySearch}
                  onChange={(e) => setCounterpartySearch(e.target.value)}
                  placeholder={t('supplierInvoices.counterpartyPlaceholder')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value)}
                  placeholder={t('supplierInvoices.operationType')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? t('supplierInvoices.searching') : t('supplierInvoices.search')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('supplierInvoices.title')}</h2>
          <button
            onClick={() => navigate('/supplier-invoices/add')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm mới
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder={t('supplierInvoices.searchPlaceholder')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              value={authorSearch}
              onChange={(e) => setAuthorSearch(e.target.value)}
              placeholder={t('supplierInvoices.authorPlaceholder')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <input
              type="text"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              placeholder={t('supplierInvoices.companyPlaceholder')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              value={counterpartySearch}
              onChange={(e) => setCounterpartySearch(e.target.value)}
              placeholder={t('supplierInvoices.counterpartyPlaceholder')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              placeholder={t('supplierInvoices.operationType')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? t('supplierInvoices.searching') : t('supplierInvoices.search')}
        </button>
      </div>

      {/* Invoices List */}
      <div className="md:bg-white md:rounded-lg md:shadow-md md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-20 md:mt-0">
            {[...Array(4)].map((_, index) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-20 md:mt-0">
            {invoices.map((invoice, index) => (
              <div
                key={invoice.id}
                ref={index === invoices.length - 1 ? lastInvoiceRef : null}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => handleInvoiceClick(invoice.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">#{invoice.number}</h3>
                    <p className="text-sm text-gray-600">{formatDate(invoice.date)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    invoice.posted
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.posted ? t('supplierInvoices.status.posted') : t('supplierInvoices.status.draft')}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm">{t('supplierInvoices.author')}: {invoice.author}</span>
                  </div>

                  {invoice.contract && (
                    <div className="flex items-center text-gray-700">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="text-sm">{t('supplierInvoices.contract')}: {invoice.contract}</span>
                    </div>
                  )}

                  <div className="flex items-center text-gray-700">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="text-sm">{t('supplierInvoices.counterparty')}: {invoice.counterparty}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Tag className="h-4 w-4 mr-2" />
                    <span className="text-sm">{invoice.operationType}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium text-blue-600">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </span>
                  </div>

                  {invoice.employeeResponsible && (
                    <div className="flex items-center text-gray-700">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-sm">{t('supplierInvoices.responsible')}: {invoice.employeeResponsible}</span>
                    </div>
                  )}

                  {invoice.vatTaxation && (
                    <div className="flex items-center text-gray-700">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="text-sm">{t('supplierInvoices.vat')}: {invoice.vatTaxation}</span>
                    </div>
                  )}

                  {invoice.structuralUnit && (
                    <div className="flex items-center text-gray-700">
                      <Building className="h-4 w-4 mr-2" />
                      <span className="text-sm">{t('supplierInvoices.unit')}: {invoice.structuralUnit}</span>
                    </div>
                  )}

                  {invoice.orderBasis && (
                    <div className="flex items-center text-gray-700">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="text-sm">{t('supplierInvoices.order')}: {invoice.orderBasis}</span>
                    </div>
                  )}

                  {invoice.comment && (
                    <div className="flex items-start text-gray-700">
                      <FileText className="h-4 w-4 mr-2 mt-1" />
                      <span className="text-sm">{invoice.comment}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoadingMore && (
          <div className="text-center py-4">{t('supplierInvoices.loadingMore')}</div>
        )}

        {!isLoading && invoices.length === 0 && (
          <div className="text-center py-8 text-gray-500">{t('supplierInvoices.noResults')}</div>
        )}
      </div>
    </div>
  );
}