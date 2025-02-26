import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, User, CreditCard, DollarSign, FileText, Tag, Wallet, Receipt, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTransferReceipts } from '../../services/transferReceipt';
import { useLanguage } from '../../contexts/LanguageContext';

interface TransferReceipt {
  id: string;
  number: string;
  date: string;
  author: string;
  comment: string;
  company: string;
  counterparty: string;
  operationType: string;
  bankAccount: string;
  amount: number;
  currency: string;
  purpose: string;
  sourceDocument: string;
}

export default function TransferCollection() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<TransferReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilter, setShowFilter] = useState(true);
  const lastScrollY = useRef(0);
  const { t } = useLanguage();

  // Search filters
  const [searchNumber, setSearchNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [counterpartySearch, setCounterpartySearch] = useState('');
  const [operationType, setOperationType] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [purpose, setPurpose] = useState('');
  const [sourceDocument, setSourceDocument] = useState('');
  const [author, setAuthor] = useState('');

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

      if (bankAccount) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'bankAccount.presentation',
          value: bankAccount,
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

      if (author) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'author.presentation',
          value: author,
          comparisonOperator: 'contains'
        });
      }

      const response = await getTransferReceipts(pageNumber, 20, conditions);
      
      if (isNewSearch) {
        setReceipts(response.items);
      } else {
        setReceipts(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      toast.error('Không thể tải danh sách phiếu thu chuyển khoản');
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
  };

  const handleReceiptClick = (receiptId: string) => {
    navigate(`/transfer-receipts/${receiptId}`);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-transform duration-300">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-gray-800">{t('transfer.title')}</h2>
            <button
              onClick={() => navigate('/transfer-receipts/add')}
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
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                placeholder={t('transfer.searchPlaceholder')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            <div className={`space-y-3 overflow-hidden transition-all duration-300 ${showFilter ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('transfer.startDate')}</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('transfer.endDate')}</label>
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
                  value={counterpartySearch}
                  onChange={(e) => setCounterpartySearch(e.target.value)}
                  placeholder={t('transfer.counterpartyPlaceholder')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={operationType}
                    onChange={(e) => setOperationType(e.target.value)}
                    placeholder={t('transfer.operationType')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder={t('transfer.bankAccount')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder={t('transfer.minAmount')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder={t('transfer.maxAmount')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder={t('transfer.currency')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder={t('transfer.purpose')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={sourceDocument}
                  onChange={(e) => setSourceDocument(e.target.value)}
                  placeholder={t('transfer.sourceDocument')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <Receipt className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={t('transfer.author')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? t('transfer.searching') : t('transfer.search')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('transfer.title')}</h2>
          <button
            onClick={() => navigate('/transfer-receipts/add')}
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
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              placeholder={t('transfer.searchPlaceholder')}
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
              value={counterpartySearch}
              onChange={(e) => setCounterpartySearch(e.target.value)}
              placeholder={t('transfer.counterpartyPlaceholder')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <input
              type="text"
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              placeholder={t('transfer.operationType')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder={t('transfer.bankAccount')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder={t('transfer.minAmount')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder={t('transfer.maxAmount')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder={t('transfer.currency')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={t('transfer.purpose')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              value={sourceDocument}
              onChange={(e) => setSourceDocument(e.target.value)}
              placeholder={t('transfer.sourceDocument')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <Receipt className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t('transfer.author')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? t('transfer.searching') : t('transfer.search')}
        </button>
      </div>

      {/* Receipts List */}
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
            {receipts.map((receipt, index) => (
              <div
                key={receipt.number}
                ref={index === receipts.length - 1 ? lastReceiptRef : null}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => handleReceiptClick(receipt.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">#{receipt.number}</h3>
                    <p className="text-sm text-gray-600">{formatDate(receipt.date)}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {receipt.operationType}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm">{receipt.counterparty}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Wallet className="h-4 w-4 mr-2" />
                    <span className="text-sm">{receipt.bankAccount}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium text-blue-600">
                      {formatCurrency(receipt.amount, receipt.currency)}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="text-sm">{receipt.purpose}</span>
                  </div>

                  {receipt.sourceDocument && (
                    <div className="flex items-center text-gray-700">
                      <Receipt className="h-4 w-4 mr-2" />
                      <span className="text-sm">{receipt.sourceDocument}</span>
                    </div>
                  )}

                  <div className="flex items-center text-gray-700">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm">{t('transfer.authorLabel')}: {receipt.author}</span>
                  </div>

                  {receipt.comment && (
                    <div className="flex items-start text-gray-700">
                      <FileText className="h-4 w-4 mr-2 mt-1" />
                      <span className="text-sm">{receipt.comment}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoadingMore && (
          <div className="text-center py-4">{t('transfer.loadingMore')}</div>
        )}

        {!isLoading && receipts.length === 0 && (
          <div className="text-center py-8 text-gray-500">{t('transfer.noResults')}</div>
        )}
      </div>
    </div>
  );
}