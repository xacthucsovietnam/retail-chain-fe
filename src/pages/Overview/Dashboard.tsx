import React, { useState, useEffect } from 'react';
import { Calendar, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReportData } from '../../services/overview';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

interface ReportData {
  salesOrders: number;
  salesAmount: number;
  receiptCash: number;
  receiptBank: number;
  postPayment: number;
}

export default function Dashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 16));
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleConfirm = () => {
    fetchReportData(startDate, endDate);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">{t('overview.title')}</h2>
        
        {/* Date Selection Section */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.startDate')}</label>
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
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.endDate')}</label>
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
          
          <div className="flex items-end">
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                'Loading...'
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  {t('overview.confirm')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-blue-50 rounded-lg p-3 sm:p-6">
            <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">{t('overview.revenue')}</h3>
            <p className="text-lg sm:text-2xl font-bold text-blue-600">
              {reportData ? formatCurrency(reportData.salesAmount) : '---'}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-3 sm:p-6">
            <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">{t('overview.orderQuantity')}</h3>
            <p className="text-lg sm:text-2xl font-bold text-green-600">
              {reportData ? reportData.salesOrders.toLocaleString() : '---'}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-3 sm:p-6">
            <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">{t('overview.cashCollection')}</h3>
            <p className="text-lg sm:text-2xl font-bold text-purple-600">
              {reportData ? formatCurrency(reportData.receiptCash) : '---'}
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-3 sm:p-6">
            <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">{t('overview.transfer')}</h3>
            <p className="text-lg sm:text-2xl font-bold text-orange-600">
              {reportData ? formatCurrency(reportData.receiptBank) : '---'}
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-3 sm:p-6">
            <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">{t('overview.debt')}</h3>
            <p className="text-lg sm:text-2xl font-bold text-red-600">
              {reportData ? formatCurrency(reportData.postPayment) : '---'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}