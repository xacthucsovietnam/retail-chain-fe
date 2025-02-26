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
  Wallet,
  Receipt,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCashReceiptDetail, updateCashReceipt } from '../../services/cashReceipt';
import type { CashReceiptDetail, UpdateCashReceiptData } from '../../services/cashReceipt';

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
  cashAccountId: string;
  cashAccountName: string;
  cashFlowItemId: string;
  cashFlowItemName: string;
  contractId: string;
  contractName: string;
}

export default function CashReceiptUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<CashReceiptDetail | null>(null);
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
    cashAccountId: 'c5bb0ec3-a7db-44fe-9a44-23a5a69df5ca',
    cashAccountName: 'Quỹ tiền mặt chính',
    cashFlowItemId: '6ceda0e4-5b28-11ef-a699-00155d058802',
    cashFlowItemName: 'Nhận tiền từ người mua',
    contractId: '',
    contractName: ''
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
        const data = await getCashReceiptDetail(id);
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
          cashAccountId: 'c5bb0ec3-a7db-44fe-9a44-23a5a69df5ca',
          cashAccountName: 'Quỹ tiền mặt chính',
          cashFlowItemId: '6ceda0e4-5b28-11ef-a699-00155d058802',
          cashFlowItemName: 'Nhận tiền từ người mua',
          contractId: '',
          contractName: ''
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

      const updateData: UpdateCashReceiptData = {
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
        cashAccountId: formData.cashAccountId,
        cashAccountName: formData.cashAccountName,
        cashFlowItemId: formData.cashFlowItemId,
        cashFlowItemName: formData.cashFlowItemName,
        contractId: formData.contractId,
        contractName: formData.contractName
      };

      await updateCashReceipt(updateData);
      toast.success('Cập nhật phiếu thu thành công');
      navigate(`/cash-receipts/${formData.id}`);
    } catch (error) {
      toast.error('Không thể cập nhật phiếu thu');
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?')) {
        navigate(`/cash-receipts/${id}`);
      }
    } else {
      navigate(`/cash-receipts/${id}`);
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
          <p className="text-gray-600 mb-4">
            The receipt you're looking for could not be found or an error occurred.
          </p>
          <button
            onClick={() => navigate('/cash-receipts')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cash Receipts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cập nhật phiếu thu</h1>
            <p className="text-sm text-gray-500">#{formData.number}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5 inline-block mr-1" />
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isDirty || isSaving}
              className={`px-4 py-2 text-white rounded-md ${
                isDirty ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-5 h-5 inline-block mr-1" />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Cash Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quỹ tiền
            </label>
            <div className="relative">
              <select
                value={formData.cashAccountId}
                onChange={(e) => {
                  handleInputChange('cashAccountId', e.target.value);
                  handleInputChange('cashAccountName', e.target.options[e.target.selectedIndex].text);
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="c5bb0ec3-a7db-44fe-9a44-23a5a69df5ca">Quỹ tiền mặt chính</option>
              </select>
              <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Contract */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hợp đồng
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.contractName}
                onChange={(e) => {
                  handleInputChange('contractName', e.target.value);
                  handleInputChange('contractId', '12e8c6ef-d253-11ef-9602-f2202b293748');
                }}
                placeholder="Chọn hợp đồng..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <Receipt className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <div className="relative">
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                rows={3}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập ghi chú..."
              />
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Xác nhận cập nhật phiếu thu
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn cập nhật phiếu thu này không?
            </p>
            <div className="flex justify-end gap -3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
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