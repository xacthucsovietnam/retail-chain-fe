import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  FileText,
  DollarSign,
  Receipt,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { getCashReceiptDetail, updateCashReceipt, UpdateCashReceiptData, XTSCashReceipt } from '../../services/cashReceipt';
import { getCustomerDropdownData, getOrders } from '../../services/order';
import type { CustomerDropdownItem, Order } from '../../services/order';
import { getSession } from '../../utils/storage';

// Update FormData to allow amount to be undefined and include all fields from XTSCashReceipt
interface FormData extends Omit<UpdateCashReceiptData, 'amount' | 'paymentDetails'> {
  amount: number | undefined; // Allow undefined for amount
}

export default function CashReceiptUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Memoize session data to prevent re-creation on every render
  const session = useMemo(() => getSession(), []);
  const employeeResponsible = useMemo(() => session?.defaultValues?.employeeResponsible, [session]);

  const [receipt, setReceipt] = useState<XTSCashReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(true); // Initialize to true to enable Save button
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFetchingCustomers, setIsFetchingCustomers] = useState(false);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    id: '',
    number: '',
    title: '',
    date: new Date().toISOString(),
    operationKindId: '',
    operationKindName: '',
    customerId: '',
    customerName: '',
    amount: undefined,
    comment: '',
    employeeId: '',
    employeeName: '',
    cashAccountId: '',
    cashAccountName: '',
    cashFlowItemId: '',
    cashFlowItemName: '',
    contractId: '',
    contractName: '',
    documentBasisId: '',
    documentBasisName: '',
  });

  // Fetch cash receipt details
  const fetchReceiptDetail = useCallback(async () => {
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

      // Map all fields from XTSCashReceipt to formData, including those not shown in the UI
      setFormData({
        id: data.objectId.id,
        number: data.number,
        title: data.number,
        date: data.date,
        operationKindId: data.operationKind?.id ?? '',
        operationKindName: data.operationKind?.presentation ?? '',
        customerId: data.counterparty?.id ?? '',
        customerName: data.counterparty?.presentation ?? '',
        amount: data.documentAmount,
        comment: data.comment ?? '',
        employeeId: employeeResponsible?.id || '',
        employeeName: employeeResponsible?.presentation || '',
        cashAccountId: data.cashAccount?.id ?? '',
        cashAccountName: data.cashAccount?.presentation ?? '',
        cashFlowItemId: data.cashFlowItem?.id ?? '',
        cashFlowItemName: data.cashFlowItem?.presentation ?? '',
        contractId: data.paymentDetails[0]?.contract?.id ?? '',
        contractName: data.paymentDetails[0]?.contract?.presentation ?? '',
        documentBasisId: data.documentBasis?.id ?? '',
        documentBasisName: data.documentBasis?.presentation ?? '',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải chi tiết phiếu thu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [id, employeeResponsible]);

  // Fetch dropdown data
  const fetchDropdownData = useCallback(async () => {
    try {
      setIsFetchingCustomers(true);
      const customerData = await getCustomerDropdownData();
      setCustomers(customerData);
    } catch {
      toast.error('Không thể tải danh sách khách hàng');
    } finally {
      setIsFetchingCustomers(false);
    }

    try {
      setIsFetchingOrders(true);
      const orderDataResponse = await getOrders(1, 1000);
      setOrders(orderDataResponse.items);
    } catch {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setIsFetchingOrders(false);
    }
  }, []);

  // Call APIs on mount
  useEffect(() => {
    fetchReceiptDetail();
    fetchDropdownData();
  }, [fetchReceiptDetail, fetchDropdownData]);

  // Handle form changes
  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    if (!formData.customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return false;
    }
    if (formData.amount === undefined || formData.amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return false;
    }
    return true;
  }, [formData]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;
    setShowConfirmation(true);
  }, [validateForm]);

  const handleConfirmSubmit = useCallback(async () => {
    if (!receipt) return; // Ensure receipt is available

    try {
      setIsSaving(true);
      const updateData: UpdateCashReceiptData = {
        id: formData.id,
        number: formData.number,
        title: formData.title,
        date: formData.date,
        // Preserve original values for fields not shown in the UI
        operationKindId: formData.operationKindId || undefined,
        operationKindName: formData.operationKindName || undefined,
        customerId: formData.customerId,
        customerName: formData.customerName,
        amount: formData.amount ?? 0, // Validation ensures it's not undefined
        comment: formData.comment || undefined,
        employeeId: formData.employeeId || undefined,
        employeeName: formData.employeeName || undefined,
        cashAccountId: formData.cashAccountId || undefined,
        cashAccountName: formData.cashAccountName || undefined,
        cashFlowItemId: formData.cashFlowItemId || undefined,
        cashFlowItemName: formData.cashFlowItemName || undefined,
        contractId: formData.contractId || undefined,
        contractName: formData.contractName || undefined,
        documentBasisId: formData.documentBasisId || undefined,
        documentBasisName: formData.documentBasisName || undefined,
        // Construct paymentDetails if contractId exists
        paymentDetails: formData.contractId
          ? [
              {
                _type: 'XTSCashReceiptPaymentDetails',
                _lineNumber: 1,
                contract: {
                  _type: 'XTSObjectId',
                  dataType: 'XTSCounterpartyContract',
                  id: formData.contractId,
                  presentation: formData.contractName || '',
                  url: receipt.paymentDetails[0]?.contract?.url ?? '',
                },
                document: {
                  _type: 'XTSObjectId',
                  dataType: receipt.paymentDetails[0]?.document?.dataType ?? '',
                  id: receipt.paymentDetails[0]?.document?.id ?? '',
                  presentation: receipt.paymentDetails[0]?.document?.presentation ?? '',
                  url: receipt.paymentDetails[0]?.document?.url ?? '',
                },
                paymentAmount: formData.amount ?? 0,
                settlementsAmount: formData.amount ?? 0,
                rate: receipt.paymentDetails[0]?.rate ?? 1,
                multiplicity: receipt.paymentDetails[0]?.multiplicity ?? 1,
                advanceFlag: receipt.paymentDetails[0]?.advanceFlag ?? false,
                docOrder: {
                  _type: 'XTSObjectId',
                  dataType: 'XTSOrder',
                  id: formData.documentBasisId || '',
                  presentation: formData.documentBasisName || '',
                  url: receipt.paymentDetails[0]?.docOrder?.url ?? '',
                },
              },
            ]
          : [],
      };

      await updateCashReceipt(updateData);
      toast.success('Cập nhật phiếu thu thành công');
      navigate(`/cash-receipts/${formData.id}`);
    } catch (error) {
      toast.error('Không thể cập nhật phiếu thu: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'));
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  }, [formData, navigate, receipt]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (isDirty) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?')) {
        navigate(`/cash-receipts/${id}`);
      }
    } else {
      navigate(`/cash-receipts/${id}`);
    }
  }, [isDirty, navigate, id]);

  // Dropdown options
  const customerOptions = customers.map(customer => ({
    value: customer.id,
    label: `${customer.code ? `${customer.code} - ` : ''}${customer.name}`,
  }));

  const orderOptions = orders.map(order => ({
    value: order.id,
    label: `Đơn hàng #${order.number}`,
  }));

  // Selected values for dropdowns
  const selectedCustomer = customerOptions.find(option => option.value === formData.customerId);
  const selectedOrder = orderOptions.find(option => option.value === formData.documentBasisId);

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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error || 'Không tìm thấy phiếu thu'}</h2>
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
          <h1 className="text-lg font-semibold text-gray-900">Cập nhật phiếu thu</h1>
          <p className="text-sm text-gray-500">#{formData.number}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4">
        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày thu *</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={formData.date.slice(0, 16)}
                onChange={e => handleInputChange('date', e.target.value)}
                className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <Calendar className="absolute left-4 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng *</label>
            <div className="relative">
              <Select
                options={customerOptions}
                value={selectedCustomer}
                onChange={option => {
                  if (option) {
                    handleInputChange('customerId', option.value);
                    handleInputChange('customerName', option.label);
                  }
                }}
                placeholder="Chọn khách hàng..."
                isLoading={isFetchingCustomers}
                className="text-sm"
                classNamePrefix="react-select"
                noOptionsMessage={() => "Không tìm thấy khách hàng"}
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền *</label>
            <div className="relative">
              <input
                type="number"
                value={formData.amount ?? ''}
                onChange={e => {
                  const value = e.target.value;
                  handleInputChange('amount', value === '' ? undefined : Number(value));
                }}
                min="0"
                step="1000"
                className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <DollarSign className="absolute left-4 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Source Document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chứng từ gốc</label>
            <div className="relative">
              <Select
                options={orderOptions}
                value={selectedOrder}
                onChange={option => {
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
                noOptionsMessage={() => "Không tìm thấy chứng từ"}
              />
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <div className="relative">
              <textarea
                value={formData.comment || ''}
                onChange={e => handleInputChange('comment', e.target.value)}
                rows={4}
                className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Nhập ghi chú..."
              />
              <FileText className="absolute left-4 top-2.5 h-5 w-5 text-gray-400" />
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
            !isSaving
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          <Save className="h-6 w-6" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Xác nhận cập nhật phiếu thu</h3>
            <p className="text-sm text-gray-500 mb-4">Bạn có chắc chắn muốn cập nhật phiếu thu này không?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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