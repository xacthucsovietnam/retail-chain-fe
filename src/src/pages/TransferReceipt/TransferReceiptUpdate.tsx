import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  FileText,
  DollarSign,
  Tag,
  CreditCard,
  Receipt,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getTransferReceiptDetail, updateTransferReceipt } from '../../services/transferReceipt';
import type { TransferReceiptDetail, UpdateTransferReceiptData } from '../../services/transferReceipt';

interface FormData {
  id: string;
  number: string;
  title: string;
  date: string;
  operationKindId: string;
  operationKindName: string;
  customerId: string;
  customerName: string;
  amount: number;
  comment: string;
  employeeId: string;
  employeeName: string;
  bankAccountId: string;
  bankAccountName: string;
  cashFlowItemId: string;
  cashFlowItemName: string;
}

export default function TransferReceiptUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<TransferReceiptDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    id: '',
    number: '',
    title: '',
    date: new Date().toISOString(),
    operationKindId: 'FromSupplier',
    operationKindName: 'Từ người bán',
    customerId: '',
    customerName: '',
    amount: 0,
    comment: '',
    employeeId: '0a1ae9b8-5b28-11ef-a699-00155d058802',
    employeeName: 'Test',
    bankAccountId: '583efa7c-6237-11ef-a699-00155d058802',
    bankAccountName: 'Tài khoản VND',
    cashFlowItemId: '6ceda0e4-5b28-11ef-a699-00155d058802',
    cashFlowItemName: 'Nhận tiền từ người mua'
  });

  useEffect(() => {
    const fetchReceiptDetail = async () => {
      if (!id) {
        setError('Receipt ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getTransferReceiptDetail(id);
        setReceipt(data);
        setFormData({
          id: data.id,
          number: data.number,
          title: data.number,
          date: data.date,
          operationKindId: 'FromSupplier',
          operationKindName: data.transactionType,
          customerId: data.customer,
          customerName: data.customer,
          amount: data.amount,
          comment: data.notes || '',
          employeeId: '0a1ae9b8-5b28-11ef-a699-00155d058802',
          employeeName: data.collector || '',
          bankAccountId: '583efa7c-6237-11ef-a699-00155d058802',
          bankAccountName: data.bankAccount || 'Tài khoản VND',
          cashFlowItemId: '6ceda0e4-5b28-11ef-a699-00155d058802',
          cashFlowItemName: 'Nhận tiền từ người mua'
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load receipt details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceiptDetail();
  }, [id]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const validateForm = (): boolean => {
    if (!formData.customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return false;
    }

    if (formData.amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return false;
    }

    if (!formData.operationKindId) {
      toast.error('Vui lòng chọn loại nghiệp vụ');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSaving(true);

      const updateData: UpdateTransferReceiptData = {
        id: formData.id,
        number: formData.number,
        title: formData.title,
        date: formData.date,
        operationKindId: formData.operationKindId,
        operationKindName: formData.operationKindName,
        customerId: formData.customerId,
        customerName: formData.customerName,
        amount: formData.amount,
        comment: formData.comment,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        bankAccountId: formData.bankAccountId,
        bankAccountName: formData.bankAccountName,
        cashFlowItemId: formData.cashFlowItemId,
        cashFlowItemName: formData.cashFlowItemName
      };

      await updateTransferReceipt(updateData);
      toast.success('Cập nhật phiếu thu chuyển khoản thành công');
      navigate(`/transfer-receipts/${formData.id}`);
    } catch (error) {
      toast.error('Không thể cập nhật phiếu thu chuyển khoản');
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?')) {
        navigate(`/transfer-receipts/${id}`);
      }
    } else {
      navigate(`/transfer-receipts/${id}`);
    }
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
            {error || 'Receipt Not Found'}
          </h2>
          <button
            onClick={() => navigate('/transfer-receipts')}
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
          <h1 className="text-lg font-semibold text-gray-900">Cập nhật đơn thu tiền mặt</h1>
          <p className="text-sm text-gray-500">#{formData.number}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày thu *
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={formData.date.slice(0, 16)}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khách hàng *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Chọn khách hàng..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Operation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại nghiệp vụ *
            </label>
            <div className="relative">
              <select
                value={formData.operationKindId}
                onChange={(e) => {
                  handleInputChange('operationKindId', e.target.value);
                  handleInputChange('operationKindName', e.target.options[e.target.selectedIndex].text);
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="FromSupplier">Từ người bán</option>
                <option value="FromCustomer">Từ khách hàng</option>
              </select>
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền *
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', Number(e.target.value))}
                min="0"
                step="1000"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Bank Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tài khoản ngân hàng
            </label>
            <div className="relative">
              <select
                value={formData.bankAccountId}
                onChange={(e) => {
                  handleInputChange('bankAccountId', e.target.value);
                  handleInputChange('bankAccountName', e.target.options[e.target.selectedIndex].text);
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="583efa7c-6237-11ef-a699-00155d058802">Tài khoản VND</option>
              </select>
              <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <div className="relative">
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                rows={3}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Nhập ghi chú..."
              />
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleBack}
          className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={!isDirty || isSaving}
          className={`p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDirty ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          <Save className="h-6 w-6" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Xác nhận cập nhật phiếu thu
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn cập nhật phiếu thu chuyển khoản này không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
              >
                {isSaving ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}