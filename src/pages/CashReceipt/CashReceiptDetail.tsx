import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  DollarSign,
  Tag,
  FileText,
  Receipt,
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCashReceiptDetail, XTSCashReceipt } from '../../services/cashReceipt';

export default function CashReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<XTSCashReceipt | null>(null);
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

  const formatCurrency = (amount: number, currencyString: string | null): string => {
    const currencyMap: { [key: string]: string } = {
      đồng: 'VND',
      USD: 'USD',
      Dollar: 'USD',
      Euro: 'EUR',
      EUR: 'EUR',
      JPY: 'JPY',
      Yen: 'JPY',
    };

    const currencyCode = currencyString ? currencyMap[currencyString] || 'VND' : 'VND';
    try {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currencyCode }).format(amount);
    } catch (error) {
      console.error(`Error formatting currency ${currencyString}:`, error);
      return `${new Intl.NumberFormat('vi-VN').format(amount)} ${currencyCode}`;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
              {receipt.operationKind?.presentation ?? 'Không xác định'}
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
                <p className="text-base text-gray-900">{receipt.counterparty?.presentation ?? 'Không xác định'}</p>
              </div>
            </div>

            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Số tiền</p>
                <p className="text-base font-medium text-blue-600">
                  {formatCurrency(receipt.documentAmount, receipt.cashCurrency?.presentation ?? 'VND')}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Tag className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Loại thu</p>
                <p className="text-base text-gray-900">{receipt.operationKind?.presentation ?? 'Không xác định'}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Wallet className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Quỹ tiền</p>
                <p className="text-base text-gray-900">{receipt.cashAccount?.presentation ?? 'Không xác định'}</p>
              </div>
            </div>

            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Mục đích</p>
                <p className="text-base text-gray-900">{receipt.cashFlowItem?.presentation ?? 'Không xác định'}</p>
              </div>
            </div>

            {receipt.documentBasis && (
              <div className="flex items-center">
                <Receipt className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Tài liệu nguồn</p>
                  <p className="text-base text-gray-900">{receipt.documentBasis?.presentation ?? 'Không xác định'}</p>
                </div>
              </div>
            )}

            {receipt.paymentDetails.length > 0 && (
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Hợp đồng</p>
                  <p className="text-base text-gray-900">{receipt.paymentDetails[0].contract?.presentation ?? 'Không xác định'}</p>
                </div>
              </div>
            )}

            {receipt.comment && (
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Ghi chú</p>
                  <p className="text-base text-gray-900 whitespace-pre-line">{receipt.comment}</p>
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