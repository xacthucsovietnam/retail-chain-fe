import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Package,
  User,
  Calendar,
  FileText,
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrderDetail, updateOrder } from '../../services/order';
import type { OrderDetail, UpdateOrderData, UpdateOrderProduct } from '../../services/order';
import { useLanguage } from '../../contexts/LanguageContext';

interface OrderProduct {
  lineNumber: number;
  id: string;
  sku: string;
  name: string;
  unitId: string;
  unitName: string;
  quantity: number;
  price: number;
  total: number;
  coefficient: number;
  notes: string;
}

interface FormData {
  id: string;
  number: string;
  title: string;
  customerId: string;
  customerName: string;
  employeeId: string;
  employeeName: string;
  orderState: string;
  deliveryAddress: string;
  comment: string;
  documentAmount: number;
  products: OrderProduct[];
  date: string;
  contractId: string;
  contractName: string;
  externalAccountId: string;
  externalAccountName: string;
  cashAmount: number;
  transferAmount: number;
  postPayAmount: number;
  paymentNotes: string;
}

const orderStates = [
  { id: 'Editing', name: 'Đang soạn' },
  { id: 'Processing', name: 'Đang xử lý' },
  { id: 'Completed', name: 'Hoàn thành' },
  { id: 'Cancelled', name: 'Đã hủy' }
];

export default function OrderUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    id: '',
    number: '',
    title: '',
    customerId: '',
    customerName: '',
    employeeId: '',
    employeeName: '',
    orderState: '',
    deliveryAddress: '',
    comment: '',
    documentAmount: 0,
    products: [],
    date: new Date().toISOString(),
    contractId: '',
    contractName: '',
    externalAccountId: '',
    externalAccountName: '',
    cashAmount: 0,
    transferAmount: 0,
    postPayAmount: 0,
    paymentNotes: ''
  });

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) {
        setError('Order ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getOrderDetail(id);
        setFormData({
          id: data.id,
          number: data.number,
          title: data.title,
          customerId: data.customer,
          customerName: data.customer,
          employeeId: data.employeeResponsible || '',
          employeeName: data.employeeResponsible || '',
          orderState: data.orderState,
          deliveryAddress: data.deliveryAddress || '',
          comment: data.comment || '',
          documentAmount: data.documentAmount,
          date: data.date,
          contractId: data.contract || '',
          contractName: data.contract || '',
          externalAccountId: '',
          externalAccountName: '',
          cashAmount: data.cash || 0,
          transferAmount: data.bankTransfer || 0,
          postPayAmount: data.postPayment || 0,
          paymentNotes: data.paymentNote || '',
          products: data.products.map(p => ({
            lineNumber: p.lineNumber,
            id: p.productId,
            sku: p.sku,
            name: p.productName,
            unitId: p.unit,
            unitName: p.unit,
            quantity: p.quantity,
            price: p.price,
            total: p.total,
            coefficient: p.coefficient,
            notes: ''
          }))
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load order details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  const calculateTotal = (products: OrderProduct[]) => {
    return products.reduce((sum, product) => sum + product.total, 0);
  };

  const handleAddProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          lineNumber: prev.products.length + 1,
          id: '',
          sku: '',
          name: '',
          unitId: '',
          unitName: '',
          quantity: 1,
          price: 0,
          total: 0,
          coefficient: 1,
          notes: ''
        }
      ]
    }));
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleProductChange = (index: number, field: keyof OrderProduct, value: any) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      newProducts[index] = {
        ...newProducts[index],
        [field]: value,
        total: field === 'quantity' || field === 'price' 
          ? Number(value) * (field === 'quantity' ? newProducts[index].price : newProducts[index].quantity)
          : newProducts[index].total
      };
      return { 
        ...prev, 
        products: newProducts,
        documentAmount: calculateTotal(newProducts)
      };
    });
  };

  const validateForm = (): boolean => {
    if (!formData.customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return false;
    }

    if (!formData.orderState) {
      toast.error('Vui lòng chọn trạng thái đơn hàng');
      return false;
    }

    if (formData.products.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm');
      return false;
    }

    for (const product of formData.products) {
      if (!product.id) {
        toast.error('Vui lòng chọn sản phẩm');
        return false;
      }

      if (product.quantity <= 0) {
        toast.error('Số lượng phải lớn hơn 0');
        return false;
      }

      if (product.price < 0) {
        toast.error('Đơn giá không được âm');
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    try {
      setIsSaving(true);

      const orderProducts: UpdateOrderProduct[] = formData.products.map(product => ({
        lineNumber: product.lineNumber,
        productId: product.id,
        productName: product.name,
        quantity: product.quantity,
        price: product.price,
        unitId: product.unitId,
        unitName: product.unitName,
        coefficient: product.coefficient,
        sku: product.sku
      }));

      await updateOrder({
        id: formData.id,
        number: formData.number,
        title: formData.title,
        customerId: formData.customerId,
        customerName: formData.customerName,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        orderState: formData.orderState,
        deliveryAddress: formData.deliveryAddress,
        comment: formData.comment,
        documentAmount: formData.documentAmount,
        products: orderProducts,
        date: formData.date,
        contractId: formData.contractId,
        contractName: formData.contractName,
        externalAccountId: formData.externalAccountId,
        externalAccountName: formData.externalAccountName,
        cashAmount: formData.cashAmount,
        transferAmount: formData.transferAmount,
        postPayAmount: formData.postPayAmount,
        paymentNotes: formData.paymentNotes
      });

      toast.success('Cập nhật đơn hàng thành công');
      navigate(`/orders/${formData.id}`);
    } catch (error) {
      toast.error('Không thể cập nhật đơn hàng');
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  };

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
            onClick={() => navigate('/orders')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - General Information */}
        <div className="lg:w-2/5">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cập nhật đơn hàng</h1>
                <p className="text-sm text-gray-500">#{formData.number}</p>
              </div>
            </div>

            <div className="space-y-4">
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
                      customerName: e.target.value
                    }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Chọn khách hàng..."
                  />
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái đơn hàng *
                </label>
                <div className="relative">
                  <select
                    value={formData.orderState}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      orderState: e.target.value
                    }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  >
                    {orderStates.map(state => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  <Package className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Employee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhân viên phụ trách
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.employeeName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      employeeName: e.target.value
                    }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Chọn nhân viên..."
                  />
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ giao hàng
                </label>
                <textarea
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    deliveryAddress: e.target.value
                  }))}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Nhập địa chỉ giao hàng..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    comment: e.target.value
                  }))}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Nhập ghi chú..."
                />
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổng tiền
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.documentAmount.toLocaleString()}
                    readOnly
                    className="block w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày tạo *
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.date.slice(0, 16)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      date: e.target.value
                    }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigate('/orders')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <ArrowLeft className="w-5 h-5 inline-block mr-1" />
                Quay lại
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 flex-1"
              >
                <Save className="w-5 h-5 inline-block mr-1" />
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Products List */}
        <div className="lg:w-3/5">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Danh sách sản phẩm</h2>
              <button
                onClick={handleAddProduct}
                className="px-3 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 inline-block mr-1" />
                Thêm sản phẩm
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã SP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ĐVT</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SL</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.products.map((product, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={product.sku}
                          onChange={(e) => handleProductChange(index, 'sku', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={product.unitId}
                          onChange={(e) => handleProductChange(index, 'unitId', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                        >
                          <option value="">{product.unitName || 'Chọn ĐVT'}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(index, 'quantity', Number(e.target.value))}
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => handleProductChange(index, 'price', Number(e.target.value))}
                          min="0"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {product.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveProduct(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-4 py-3 text-right font-medium">
                      Tổng cộng:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">
                      {formData.documentAmount.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Xác nhận cập nhật đơn hàng
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn cập nhật đơn hàng này không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSave}
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