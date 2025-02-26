import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  // Continuing with the TransferReceiptDetail.tsx file content:
  CreditCard,
  Tag,
  Building,
  Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getTransferReceiptDetail } from '../../services/transferReceipt';
import type { TransferReceiptDetail as ITransferReceiptDetail } from '../../services/transferReceipt';
import { formatCurrency } from '../../utils/currency';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TransferReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<ITransferReceiptDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchReceiptDetail = async () => {
      if (!id) {
        setError('Transfer receipt ID is missing');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTransferReceiptDetail(id);
        setReceipt(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load transfer receipt details';
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
      navigate(`/transfer-receipts/edit/${id}`);
    }
  };

  const handleDelete = () => {
    toast.error('Delete functionality not implemented yet');
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
            {error || 'Transfer Receipt Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            The transfer receipt you're looking for could not be found or an error occurred.
          </p>
          <button
            onClick={() => navigate('/transfer-receipts')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Transfer Receipts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header with back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/transfer-receipts')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Transfer Receipts
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </button>

          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Receipt Information Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transfer Receipt Details</h1>
              <p className="text-sm text-gray-500">#{receipt.number}</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {receipt.transactionType}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">Date</span>
                </div>
                <p className="text-lg text-gray-900">{formatDate(receipt.date)}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm">Customer</span>
                </div>
                <p className="text-lg text-gray-900">{receipt.customer}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Receipt className="w-4 h-4 mr-2" />
                  <span className="text-sm">Order</span>
                </div>
                <p className="text-lg text-gray-900">{receipt.order || 'Not associated with an order'}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Tag className="w-4 h-4 mr-2" />
                  <span className="text-sm">Transaction Type</span>
                </div>
                <p className="text-lg text-gray-900">{receipt.transactionType}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Building className="w-4 h-4 mr-2" />
                  <span className="text-sm">Bank Account</span>
                </div>
                <p className="text-lg text-gray-900">{receipt.bankAccount}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className="text-sm">Amount</span>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(receipt.amount, receipt.currency)}
                </p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span className="text-sm">Currency</span>
                </div>
                <p className="text-lg text-gray-900">{receipt.currency}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm">Author</span>
                </div>
                <p className="text-lg text-gray-900">{receipt.collector || 'Not specified'}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm">Notes</span>
                </div>
                <p className="text-lg text-gray-900 whitespace-pre-line">
                  {receipt.notes || 'No notes available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}