import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  FileText,
  DollarSign,
  Tag,
  Receipt
} from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { createTransferReceipt } from '../../services/transferReceipt';
import { getCustomerDropdownData, getOrders } from '../../services/order';
import type { CreateTransferReceiptData } from '../../services/transferReceipt';
import type { CustomerDropdownItem, Order } from '../../services/order';
import { getSession } from '../../utils/storage';

interface FormData {
  date: string;
  operationKindId: string;
  operationKindName: string;
  customerId: string;
  customerName: string;
  amount: number;
  comment: string;
  employeeId?: string;
  employeeName?: string;
  cashFlowItemId?: string;
  cashFlowItemName?: string;
  documentBasisId?: string;
  documentBasisName?: string;
}

export default function TransferReceiptAdd() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = (location.state as any)?.orderData;

  // Lấy dữ liệu từ session
  const getInitialFormData = (): FormData => {
    const session = getSession();
    const employeeResponsible = session?.defaultValues?.employeeResponsible;

    return {
      date: new Date().toISOString(),
      operationKindId: 'FromCustomer',
      operationKindName: 'Từ khách hàng',
      customerId: orderData?.customerId || '',
      customerName: orderData?.customerName || '',
      amount: orderData?.postPayment || 0,
      comment: '',
      employeeId: employeeResponsible?.id || '',
      employeeName: employeeResponsible?.presentation || '',
      cashFlowItemId: '6ceda0e4-5b28-11ef-a699-00155d058802', // Giữ nguyên vì không có trong session
      cashFlowItemName: 'Nhận tiền từ người mua', // Giữ nguyên vì không có trong session
      documentBasisId: orderData?.orderId || '',
      documentBasisName: orderData?.orderNumber ? `Đơn hàng #${orderData.orderNumber}` : ''
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFetchingCustomers, setIsFetchingCustomers] = useState(false);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);

  // Log orderData khi mở từ OrderDetail.tsx
  useEffect(() => {
    if (orderData) {
      console.log('Order data received from OrderDetail.tsx:', JSON.stringify(orderData, null, 2));
    } else {
      console.log('No order data received from OrderDetail.tsx');
    }
  }, [orderData]);

  // Tải dữ liệu dropdown cho khách hàng và đơn hàng
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setIsFetchingCustomers(true);
        const customerData = await getCustomerDropdownData();
        setCustomers(customerData);
      } catch (error) {
        toast.error('Không thể tải danh sách khách hàng');
      } finally {
        setIsFetchingCustomers(false);
      }

      try {
        setIsFetchingOrders(true);
        const orderDataResponse = await getOrders(1, 1000); // Lấy tối đa 1000 đơn hàng
        setOrders(orderDataResponse.items);
      } catch (error) {
        toast.error('Không thể tải danh sách đơn hàng');
      } finally {
        setIsFetchingOrders(false);
      }
    };

    fetchDropdownData();
  }, []);

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

  const customerOptions = customers.map(customer => ({
    value: customer.id,
    label: `${customer.code ? `${customer.code} - ` : ''}${customer.name}`
  }));

  const orderOptions = orders.map(order => ({
    value: order.id,
    label: `Đơn hàng #${order.number}`
  }));

  const selectedCustomer = customerOptions.find(option => option.value === formData.customerId);
  const selectedOrder = orderOptions.find(option => option.value === formData.documentBasisId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Thêm mới phiếu thu chuyển khoản</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        {/* Form Fields */}
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
                readOnly
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
                  if (!orderData && option) {
                    setFormData(prev => ({
                      ...prev,
                      customerId: option.value,
                      customerName: option.label
                    }));
                  }
                }}
                placeholder="Chọn khách hàng..."
                isLoading={isFetchingCustomers}
                isDisabled={!!orderData}
                className="text-sm"
                classNamePrefix="react-select"
              />
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
                <option value="FromCustomer">Từ khách hàng</option>
                <option value="FromSupplier">Từ người bán</option>
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
                onChange={(e) => {
                  if (!orderData) {
                    setFormData(prev => ({ ...prev, amount: Number(e.target.value) }));
                  }
                }}
                min="0"
                step="1000"
                readOnly={!!orderData}
                className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm ${orderData ? 'bg-gray-50' : 'focus:ring-blue-500 focus:border-blue-500'}`}
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
                  if (!orderData && option) {
                    setFormData(prev => ({
                      ...prev,
                      documentBasisId: option.value,
                      documentBasisName: option.label
                    }));
                  }
                }}
                placeholder="Chọn chứng từ..."
                isLoading={isFetchingOrders}
                isDisabled={!!orderData}
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
              Xác nhận tạo phiếu thu chuyển khoản
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