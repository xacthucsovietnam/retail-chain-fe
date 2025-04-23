import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Wallet, DollarSign, FileText, Receipt, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTransferReceipts, PaymentReceipt } from '../../services/transferReceipt';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TransferCollection() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchNumber, setSearchNumber] = useState('');
  const { t } = useLanguage();

  const observer = useRef<IntersectionObserver>();
  const lastReceiptRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoadingMore, hasMore]
  );

  const fetchReceipts = async (pageNumber: number, isNewSearch: boolean = false) => {
    try {
      const conditions = searchNumber
        ? [
            {
              _type: 'XTSCondition',
              property: 'number',
              value: searchNumber,
              comparisonOperator: 'contains',
            },
          ]
        : [];

      const response = await getTransferReceipts(pageNumber, 20, conditions);

      if (isNewSearch) {
        setReceipts(response.items);
      } else {
        setReceipts((prev) => [...prev, ...response.items]);
      }

      setHasMore(response.hasMore);
    } catch (error) {
      toast.error(t('transferCollection.fetchError'));
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
  }, [searchNumber]);

  useEffect(() => {
    if (page > 1) {
      setIsLoadingMore(true);
      fetchReceipts(page);
    }
  }, [page]);

  const formatCurrency = (amount: number, currencyString: string = 'VND') => {
    const currencyMap: { [key: string]: string } = {
      đồng: 'VND',
      USD: 'USD',
      Dollar: 'USD',
      Euro: 'EUR',
      EUR: 'EUR',
      JPY: 'JPY',
      Yen: 'JPY',
    };

    const currencyCode = currencyMap[currencyString] || 'VND';

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
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        {/* Title Bar */}
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">{t('transferCollection.title')}</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="relative">
            <input
              type="text"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              placeholder={t('Tìm kiếm . . .')}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
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
            receipts.map((receipt, index) => (
              <div
                key={receipt.objectId.id}
                ref={index === receipts.length - 1 ? lastReceiptRef : null}
                onClick={() => navigate(`/transfer-receipts/${receipt.objectId.id}`)}
                className="bg-white rounded-lg shadow-sm p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">#{receipt.number || 'N/A'}</h3>
                    <p className="text-sm text-gray-500">{formatDate(receipt.date)}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {receipt.operationKind?.presentation || 'N/A'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {receipt.counterparty?.presentation || 'Không có thông tin khách hàng'}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Wallet className="h-4 w-4 mr-2" />
                    {receipt.bankAccount?.presentation || 'Không có thông tin ngân hàng'}
                  </div>

                  <div className="flex items-center text-sm font-medium text-blue-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {formatCurrency(receipt.documentAmount, receipt.cashCurrency?.presentation)}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    {receipt.cashFlowItem?.presentation || 'Không có mục dòng tiền'}
                  </div>

                  {receipt.documentBasis?.presentation && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Receipt className="h-4 w-4 mr-2" />
                      {receipt.documentBasis.presentation}
                    </div>
                  )}

                  {receipt.author?.presentation && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      {t('transferCollection.author')}: {receipt.author.presentation}
                    </div>
                  )}

                  {receipt.comment && (
                    <div className="flex items-start text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-2 mt-0.5" />
                      {receipt.comment}
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
            <div className="text-center py-8 text-gray-500">{t('transferCollection.noReceipts')}</div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/transfer-receipts/add')}
        className="fixed right-4 bottom-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}