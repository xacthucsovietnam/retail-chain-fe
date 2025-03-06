import React, { useState, useEffect } from 'react';
import { Search, ArrowDownToLine, ArrowUpToLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getReportData } from '../../services/overview';
import { useLanguage } from '../../contexts/LanguageContext';

interface ReportData {
  salesOrders: number;
  salesAmount: number;
  receiptCash: number;
  receiptBank: number;
  postPayment: number;
  orderToPrepay: number;
  orderPreparing: number;
  orderTransporting: number;
}

export default function Dashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const fetchReportData = async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const response = await getReportData(
        start || '0001-01-01T00:00:00',
        end || '0001-01-01T00:00:00'
      );
      setReportData(response.reportData);
    } catch (error) {
      toast.error(t('message.reportFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(startDate, endDate);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-8">
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
        {/* Date Selection - Optimized for mobile */}
        <div className="flex items-end gap-1.5 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex gap-1.5">
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Từ</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-1.5 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Đến</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-1.5 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => fetchReportData(startDate, endDate)}
            disabled={isLoading}
            className="h-[32px] px-2.5 flex items-center justify-center border border-transparent rounded-md bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Search className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Stats Groups - Mobile Optimized */}
        <div className="space-y-4">
          {/* Sales Overview - 2 cards per row */}
          <div>
            <h2 className="text-[11px] font-medium text-gray-700 mb-1.5">Bán hàng</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-[10px] text-gray-500">Doanh thu</p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">
                  {reportData ? formatCurrency(reportData.salesAmount) : '---'}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-[10px] text-gray-500">Đơn hàng</p>
                <p className="text-xs font-bold text-green-600 mt-0.5">
                  {reportData ? reportData.salesOrders.toLocaleString() : '---'}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Collection - 3 cards per row */}
          <div>
            <h2 className="text-[11px] font-medium text-gray-700 mb-1.5">Thu tiền</h2>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-purple-50 rounded-lg p-1.5">
                <p className="text-[10px] text-gray-500">Tiền mặt</p>
                <p className="text-xs font-bold text-purple-600 mt-0.5">
                  {reportData ? formatCurrency(reportData.receiptCash) : '---'}
                </p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-1.5">
                <p className="text-[10px] text-gray-500">Chuyển khoản</p>
                <p className="text-xs font-bold text-indigo-600 mt-0.5">
                  {reportData ? formatCurrency(reportData.receiptBank) : '---'}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-1.5">
                <p className="text-[10px] text-gray-500">Công nợ</p>
                <p className="text-xs font-bold text-red-600 mt-0.5">
                  {reportData ? formatCurrency(reportData.postPayment) : '---'}
                </p>
              </div>
            </div>
          </div>

          {/* Order Status - 3 cards per row */}
          <div>
            <h2 className="text-[11px] font-medium text-gray-700 mb-1.5">Trạng thái</h2>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-yellow-50 rounded-lg p-1.5">
                <p className="text-[10px] text-gray-500">Chờ thanh toán</p>
                <p className="text-xs font-bold text-yellow-600 mt-0.5">
                  {reportData ? reportData.orderToPrepay.toLocaleString() : '---'}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-1.5">
                <p className="text-[10px] text-gray-500">Đang chuẩn bị</p>
                <p className="text-xs font-bold text-orange-600 mt-0.5">
                  {reportData ? reportData.orderPreparing.toLocaleString() : '---'}
                </p>
              </div>
              <div className="bg-cyan-50 rounded-lg p-1.5">
                <p className="text-[10px] text-gray-500">Đang vận chuyển</p>
                <p className="text-xs font-bold text-cyan-600 mt-0.5">
                  {reportData ? reportData.orderTransporting.toLocaleString() : '---'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile Optimized */}
          <div className="space-y-3 mt-4">
            {/* Transaction Actions */}
            <div>
              <h2 className="text-[11px] font-medium text-gray-700 mb-1.5">Giao dịch</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/orders/add')}
                  className="flex items-center justify-center px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowUpToLine className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Bán</span>
                </button>
                <button
                  onClick={() => navigate('/supplier-invoices/add')}
                  className="flex items-center justify-center px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Mua</span>
                </button>
              </div>
            </div>

            {/* Cash Management */}
            <div>
              <h2 className="text-[11px] font-medium text-gray-700 mb-1.5">Tiền mặt</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/cash-receipts/add')}
                  className="flex items-center justify-center px-2.5 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Thu</span>
                </button>
                <button
                  disabled
                  className="flex items-center justify-center px-2.5 py-1.5 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  <ArrowUpToLine className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Chi</span>
                </button>
              </div>
            </div>

            {/* Bank Transfer Management */}
            <div>
              <h2 className="text-[11px] font-medium text-gray-700 mb-1.5">Chuyển khoản</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/transfer-receipts/add')}
                  className="flex items-center justify-center px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Thu</span>
                </button>
                <button
                  disabled
                  className="flex items-center justify-center px-2.5 py-1.5 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  <ArrowUpToLine className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Chi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}