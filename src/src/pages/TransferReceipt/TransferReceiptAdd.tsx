import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  FileText,
  DollarSign,
  Tag,
  CreditCard,
  Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createTransferReceipt } from '../../services/transferReceipt';
import type { CreateTransferReceiptData } from '../../services/transferReceipt';

interface FormData {
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
  documentBasisId: string;
  documentBasisName: string;
}

const initialFormData: FormData = {
  date: new Date().toISOString().split('T')[0] + 'T00:00:00',
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
  cashFlowItemName: 'Nhận tiền từ người mua',
  documentBasisId: '',
  documentBasisName: ''
};

export default function TransferReceiptAdd() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
      setIsLoading(true);

      const createData: CreateTransferReceiptData = {
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
        cashFlowItemName: formData.cashFlowItemName,
        documentBasisId: formData.documentBasisId,
        documentBasisName: formData.documentBasisName
      };

      const result = await createTransferReceipt(createData);
      toast.success('Tạo phiếu thu chuyển khoản thành công');
      navigate(`/transfer-receipts/${result.id}`);
    } catch (error) {
      toast.error('Không thể tạo phiếu thu chuyển khoản');
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Thêm mới</h1>
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
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  customerName: e.target.value,
                  customerId: '12e8c6f0-d253-11ef-9602-f2202b293748' // Mock ID for demo
                }))}
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
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  operationKindId: e.target.value,
                  operationKindName: e.target.options[e.target.selectedIndex].text 
                }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
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
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  bankAccountId: e.target.value,
                  bankAccountName: e.target.options[e.target.selectedIndex].text 
                }))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="583efa7c-6237-11ef-a699-00155d058802">Tài khoản VND</option>
              </select>
              <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Source Document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chứng từ gốc
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.documentBasisName}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  documentBasisName: e.target.value,
                  documentBasisId: e.target.value ? '88956252-f459-11ef-9602-f2202b293748' : '' // Mock ID for demo
                }))}
                placeholder="Chọn chứng từ..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <Receipt className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
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
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
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
          onClick={() => navigate('/transfer-receipts')}
          className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Save className="h-6 w-6" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Xác nhận tạo phiếu thu
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn tạo phiếu thu chuyển khoản này không?
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
                disabled={isLoading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}