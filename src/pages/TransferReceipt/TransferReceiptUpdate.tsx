import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, FileText, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { getTransferReceiptDetail, updateTransferReceipt, UpdateTransferReceiptData } from '../../services/transferReceipt';
import { getCustomerDropdownData, getOrders } from '../../services/order';

interface CustomerDropdownItem {
  id: string;
  code?: string;
  name: string;
}

interface Order {
  id: string;
  number: string;
}

interface FormData {
  id: string;
  number: string;
  title: string;
  date: string;
  customerId: string;
  customerName: string;
  amount: number | string;
  comment: string;
  documentBasisId?: string;
  documentBasisName?: string;
  // Lưu trữ các trường không hiển thị để gửi lại trong update
  operationKindId: string;
  operationKindName: string;
  bankAccountId: string;
  bankAccountName: string;
  cashFlowItemId: string;
  cashFlowItemName: string;
  employeeId?: string;
  employeeName?: string;
  paymentDetails?: UpdateTransferReceiptData['paymentDetails'];
}

export default function TransferReceiptUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFetchingCustomers, setIsFetchingCustomers] = useState(false);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    id: '',
    number: '',
    title: '',
    date: new Date().toISOString(),
    customerId: '',
    customerName: '',
    amount: '',
    comment: '',
    documentBasisId: '',
    documentBasisName: '',
    operationKindId: '',
    operationKindName: '',
    bankAccountId: '',
    bankAccountName: '',
    cashFlowItemId: '',
    cashFlowItemName: '',
    employeeId: '',
    employeeName: '',
    paymentDetails: []
  });

  const fetchData = useCallback(async () => {
    if (!id) {
      setError('Receipt ID is missing');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch receipt detail
      const data = await getTransferReceiptDetail(id);
      setFormData({
        id: data.id,
        number: data.number,
        title: data.number,
        date: data.date,
        customerId: data.customerId,
        customerName: data.customer,
        amount: data.amount,
        comment: data.notes || '',
        documentBasisId: data.documentBasisId,
        documentBasisName: data.order || '',
        operationKindId: '', // Should map from API
        operationKindName: data.transactionType || '',
        bankAccountId: '', // Should map from API
        bankAccountName: data.bankAccount || '',
        cashFlowItemId: '', // Should map from API
        cashFlowItemName: data.transactionType || '',
        employeeId: '', // Should map from API
        employeeName: data.collector || '',
        paymentDetails: [] // Should fetch from API if needed
      });

      // Fetch dropdown data
      setIsFetchingCustomers(true);
      const customerData = await getCustomerDropdownData();
      setCustomers(customerData);
      setIsFetchingCustomers(false);

      setIsFetchingOrders(true);
      const orderDataResponse = await getOrders(1, 1000);
      setOrders(orderDataResponse.items);
      setIsFetchingOrders(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load receipt details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = useCallback((field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!formData.customerId && !formData.customerName) {
      toast.error('Vui lòng chọn khách hàng');
      return false;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return false;
    }

    return true;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;
    setShowConfirmation(true);
  }, [validateForm]);

  const handleConfirmSubmit = useCallback(async () => {
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
        amount: Number(formData.amount),
        comment: formData.comment,
        bankAccountId: formData.bankAccountId,
        bankAccountName: formData.bankAccountName,
        cashFlowItemId: formData.cashFlowItemId,
        cashFlowItemName: formData.cashFlowItemName,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        documentBasisId: formData.documentBasisId,
        documentBasisName: formData.documentBasisName,
        paymentDetails: formData.paymentDetails
      };

      await updateTransferReceipt(updateData);
      toast.success('Cập nhật phiếu thu chuyển khoản thành công');
      navigate(`/transfer-receipts/${formData.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật phiếu thu chuyển khoản';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  }, [formData, navigate]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?')) {
        navigate(`/transfer-receipts/${id}`);
      }
    } else {
      navigate(`/transfer-receipts/${id}`);
    }
  }, [isDirty, navigate, id]);

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: `${customer.code ? `${customer.code} - ` : ''}${customer.name}`,
  }));

  const orderOptions = orders.map((order) => ({
    value: order.id,
    label: `Đơn hàng #${order.number}`,
  }));

  const selectedCustomer = customerOptions.find((option) => option.value === formData.customerId);
  const selectedOrder = orderOptions.find((option) => option.value === formData.documentBasisId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
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
              <Select
                options={customerOptions}
                value={selectedCustomer}
                onChange={(option) => {
                  if (option) {
                    handleInputChange('customerId', option.value);
                    handleInputChange('customerName', option.label);
                  }
                }}
                placeholder="Chọn khách hàng..."
                isLoading={isFetchingCustomers}
                className="text-sm"
                classNamePrefix="react-select"
              />
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
                onChange={(e) => handleInputChange('amount', e.target.value)}
                min=""
                step="1000"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập số tiền..."
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Source Document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chứng từ gốc
            </label>
            <div className="relative">
              <Select
                options={orderOptions}
                value={selectedOrder}
                onChange={(option) => {
                  if (option) {
                    handleInputChange('documentBasisId', option.value);
                    handleInputChange('documentBasisName', option.label);
                  } else {
                    handleInputChange('documentBasisId', '');
                    handleInputChange('documentBasisName', '');
                  }
                }}
                placeholder="Chọn chứng từ..."
                isLoading={isFetchingOrders}
                isClearable
                className="text-sm"
                classNamePrefix="react-select"
              />
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
          disabled={isSaving}
          className={`p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDirty
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              : 'bg-blue-400 text-white hover:bg-blue-500 focus:ring-blue-400'
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