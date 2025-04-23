import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  FileText,
  DollarSign,
  Receipt,
} from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { createCashReceipt, CreateCashReceiptData } from '../../services/cashReceipt';
import { getCustomerDropdownData, getOrders } from '../../services/order';
import type { CustomerDropdownItem, Order } from '../../services/order';
import { getSession } from '../../utils/storage';

// Update FormData to allow amount to be undefined
interface FormData extends Omit<CreateCashReceiptData, 'amount'> {
  amount: number | undefined; // Allow undefined for amount
  contractId?: string;
  contractName?: string;
}

export default function CashReceiptAdd() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = (location.state as any)?.orderData;

  // Initialize form data
  const getInitialFormData = useCallback((): FormData => {
    const session = getSession();
    const employeeResponsible = session?.defaultValues?.employeeResponsible;

    return {
      date: new Date().toISOString(),
      operationKindId: '',
      operationKindName: '',
      customerId: orderData?.customerId || '',
      customerName: orderData?.customerName || '',
      amount: orderData?.postPayment || undefined, // Initialize as undefined if no orderData
      comment: '',
      employeeId: employeeResponsible?.id || '',
      employeeName: employeeResponsible?.presentation || '',
      cashAccountId: '',
      cashAccountName: '',
      cashFlowItemId: '',
      cashFlowItemName: '',
      documentBasisId: orderData?.orderId || '',
      documentBasisName: orderData?.orderNumber ? `Đơn hàng #${orderData.orderNumber}` : '',
      contractId: '',
      contractName: '',
    };
  }, [orderData]);

  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFetchingCustomers, setIsFetchingCustomers] = useState(false);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);

  // Log orderData for debugging
  useEffect(() => {
    if (orderData) {
      console.log('Order data received:', JSON.stringify(orderData, null, 2));
    }
  }, [orderData]);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
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
    };

    fetchDropdownData();
  }, []);

  // Handle form changes
  const updateFormData = useCallback((key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;
    setShowConfirmation(true);
  }, [validateForm]);

  const handleConfirmSubmit = useCallback(async () => {
    try {
      setIsLoading(true);
      const createData: CreateCashReceiptData = {
        date: formData.date,
        operationKindId: undefined,
        operationKindName: undefined,
        customerId: formData.customerId,
        customerName: formData.customerName,
        amount: formData.amount ?? 0, // Default to 0 if undefined (though validation ensures it's not)
        comment: formData.comment || undefined,
        employeeId: formData.employeeId || undefined,
        employeeName: formData.employeeName || undefined,
        cashAccountId: undefined,
        cashAccountName: undefined,
        cashFlowItemId: undefined,
        cashFlowItemName: undefined,
        documentBasisId: formData.documentBasisId || undefined,
        documentBasisName: formData.documentBasisName || undefined,
      };

      const result = await createCashReceipt(createData);
      toast.success(`Tạo phiếu thu #${result.number} thành công`);
      navigate(`/cash-receipts/${result.id}`);
    } catch (error) {
      toast.error(`Không thể tạo phiếu thu: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  }, [formData, navigate]);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Main Content */}
      <div className="pt-4 px-4">
        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày thu *</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={formData.date.slice(0, 16)}
                readOnly
                className="block w-full pl-12 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
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
                  if (!orderData && option) {
                    updateFormData('customerId', option.value);
                    updateFormData('customerName', option.label);
                  }
                }}
                placeholder="Chọn khách hàng..."
                isLoading={isFetchingCustomers}
                isDisabled={!!orderData}
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
                value={formData.amount ?? ''} // Use empty string if undefined
                onChange={e => {
                  if (!orderData) {
                    const value = e.target.value;
                    updateFormData('amount', value === '' ? undefined : Number(value));
                  }
                }}
                min="0"
                step="1000"
                readOnly={!!orderData}
                className={`block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm ${
                  orderData ? 'bg-gray-50' : 'focus:ring-blue-500 focus:border-blue-500'
                }`}
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
                  if (!orderData && option) {
                    updateFormData('documentBasisId', option.value);
                    updateFormData('documentBasisName', option.label);
                  } else {
                    updateFormData('documentBasisId', '');
                    updateFormData('documentBasisName', '');
                  }
                }}
                placeholder="Chọn chứng từ..."
                isLoading={isFetchingOrders}
                isDisabled={!!orderData}
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
                onChange={e => updateFormData('comment', e.target.value)}
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
          onClick={() => navigate('/cash-receipts')}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Xác nhận tạo phiếu thu</h3>
            <p className="text-sm text-gray-600 mb-6">Bạn có chắc chắn muốn tạo phiếu thu này không?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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