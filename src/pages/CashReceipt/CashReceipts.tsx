import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, DollarSign, FileText, Wallet, Receipt, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCashReceipts, XTSCashReceipt } from '../../services/cashReceipt';

export default function CashReceipts() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<XTSCashReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchNumber, setSearchNumber] = useState('');

  // Intersection Observer để tải thêm dữ liệu
  const observer = useRef<IntersectionObserver>();
  const lastReceiptRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading || isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prevPage => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, isLoadingMore, hasMore]
  );

  // Hàm tạo điều kiện tìm kiếm
  const buildConditions = () => {
    const conditions: any[] = [];
    if (searchNumber) {
      conditions.push({
        _type: 'XTSCondition',
        property: 'number',
        value: searchNumber,
        comparisonOperator: 'contains',
      });
    }
    return conditions;
  };

  // Hàm tải danh sách phiếu thu
  const fetchReceipts = useCallback(
    async (pageNumber: number, isNewSearch: boolean = false) => {
      try {
        setIsLoadingMore(pageNumber > 1);
        const response = await getCashReceipts(pageNumber, 20, buildConditions());
        setReceipts(prev => (isNewSearch ? response.items : [...prev, ...response.items]));
        setHasMore(response.hasMore);
      } catch (error) {
        toast.error(`Không thể tải danh sách phiếu thu: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchNumber]
  );

  // Tải dữ liệu ban đầu
  useEffect(() => {
    setIsLoading(true);
    setReceipts([]);
    setPage(1);
    setHasMore(true);
    fetchReceipts(1, true);
  }, [fetchReceipts]);

  // Tải thêm dữ liệu khi chuyển trang
  useEffect(() => {
    if (page > 1) fetchReceipts(page);
  }, [page, fetchReceipts]);

  // Xử lý tìm kiếm
  const handleSearch = () => {
    setIsLoading(true);
    setReceipts([]);
    setPage(1);
    setHasMore(true);
    fetchReceipts(1, true);
  };

  // Định dạng tiền tệ
  const formatCurrency = (amount: number, currencyString: string): string => {
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
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currencyCode }).format(amount);
    } catch (error) {
      console.error(`Error formatting currency ${currencyString}:`, error);
      return `${new Intl.NumberFormat('vi-VN').format(amount)} ${currencyString}`;
    }
  };

  // Định dạng ngày
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        {/* Title Bar */}
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Danh sách phiếu thu tiền mặt</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchNumber}
              onChange={e => setSearchNumber(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm kiếm phiếu thu..."
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
          ) : receipts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Không tìm thấy phiếu thu</div>
          ) : (
            receipts.map((receipt, index) => (
              <div
                key={receipt.objectId.id}
                ref={index === receipts.length - 1 ? lastReceiptRef : null}
                onClick={() => navigate(`/cash-receipts/${receipt.objectId.id}`)}
                className="bg-white rounded-lg shadow-sm p-4 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">#{receipt.number}</h3>
                    <p className="text-sm text-gray-500">{formatDate(receipt.date)}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {receipt.operationKind.presentation}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {receipt.counterparty.presentation}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Wallet className="h-4 w-4 mr-2" />
                    {receipt.cashAccount.presentation}
                  </div>

                  <div className="flex items-center text-sm font-medium text-blue-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {formatCurrency(receipt.documentAmount, receipt.cashCurrency.presentation)}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    {receipt.cashFlowItem.presentation}
                  </div>

                  {receipt.documentBasis && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Receipt className="h-4 w-4 mr-2" />
                      {receipt.documentBasis.presentation}
                    </div>
                  )}

                  {receipt.paymentDetails.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-2" />
                      {receipt.paymentDetails[0].contract.presentation}
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
        </div>
      </div>

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