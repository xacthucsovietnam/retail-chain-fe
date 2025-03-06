import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  DollarSign,
  CreditCard,
  Tag,
  FileText,
  Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCashReceiptDetail } from '../../services/cashReceipt';
import type { CashReceiptDetail } from '../../services/cashReceipt';
import { formatCurrency } from '../../utils/currency';

export default function CashReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<CashReceiptDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceiptDetail = async () => {
      if (!id) {
        setError('ID phiếu thu không tồn tại');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCashReceiptDetail(id);
        setReceipt(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin phiếu thu';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceiptDetail();
  }, [id]);

  const handleEdit = () => {
    if (id) {
      navigate(`/cash-receipts/edit/${id}`);
    }
  };

  const handleDelete = () => {
    toast.error('Chức năng xóa chưa được triển khai');
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Không tìm thấy phiếu thu'}
          </h2>
          <button
            onClick={() => navigate('/cash-receipts')}
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
          <h1 className="text-lg font-semibold text-gray-900">Chi tiết phiếu thu</h1>
          <p className="text-sm text-gray-500">#{receipt.number}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-sm text-gray-500">Số phiếu thu</p>
              <p className="text-base font-medium text-gray-900">#{receipt.number}</p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {receipt.transactionType}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Ngày thu</p>
                <p className="text-base text-gray-900">{formatDate(receipt.date)}</p>
              </div>
            </div>

            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Khách hàng</p>
                <p className="text-base text-gray-900">{receipt.customer}</p>
              </div>
            </div>

            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Số tiền</p>
                <p className="text-base font-medium text-blue-600">
                  {formatCurrency(receipt.amount, receipt.currency)}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Tag className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Loại thu</p>
                <p className="text-base text-gray-900">{receipt.transactionType}</p>
              </div>
            </div>

            {receipt.collector && (
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Người thu</p>
                  <p className="text-base text-gray-900">{receipt.collector}</p>
                </div>
              </div>
            )}

            {receipt.order && (
              <div className="flex items-center">
                <Receipt className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Đơn hàng</p>
                  <p className="text-base text-gray-900">{receipt.order}</p>
                </div>
              </div>
            )}

            {receipt.notes && (
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Ghi chú</p>
                  <p className="text-base text-gray-900 whitespace-pre-line">{receipt.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => navigate('/cash-receipts')}
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