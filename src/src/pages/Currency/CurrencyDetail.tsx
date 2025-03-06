import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  DollarSign,
  Tag,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrencyDetail } from '../../services/currency';
import type { CurrencyDetail } from '../../services/currency';
import { useLanguage } from '../../contexts/LanguageContext';

export default function CurrencyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<CurrencyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchCurrencyDetail = async () => {
      if (!id) {
        setError('ID tiền tệ không tồn tại');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCurrencyDetail(id);
        setCurrency(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin tiền tệ';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencyDetail();
  }, [id]);

  const handleEdit = () => {
    if (id) {
      navigate(`/currency/edit/${id}`);
    }
  };

  const handleDelete = () => {
    toast.error('Chức năng xóa chưa được triển khai');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !currency) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Không tìm thấy tiền tệ'}
          </h2>
          <button
            onClick={() => navigate('/currency')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Chi tiết tiền tệ</h1>
          <p className="text-sm text-gray-500">#{currency.code}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{currency.name}</h2>
              <p className="text-sm text-gray-500">{currency.fullName}</p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {currency.code}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <DollarSign className="w-4 h-4 mr-2" />
                <span className="text-sm">Ký hiệu</span>
              </div>
              <p className="text-base text-gray-900">{currency.symbolicPresentation}</p>
            </div>

            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <Tag className="w-4 h-4 mr-2" />
                <span className="text-sm">Tiền tệ chính</span>
              </div>
              <p className="text-base text-gray-900">{currency.mainCurrency}</p>
            </div>

            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <FileText className="w-4 h-4 mr-2" />
                <span className="text-sm">Tỷ lệ</span>
              </div>
              <p className="text-base text-gray-900">{currency.markup}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => navigate('/currency')}
          className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <button
          onClick={handleEdit}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Pencil className="h-6 w-6" />
        </button>

        <button
          onClick={handleDelete}
          className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Trash2 className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}