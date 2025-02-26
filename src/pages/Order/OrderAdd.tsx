import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building,
  User,
  Calendar,
  FileText,
  DollarSign,
  Tag,
  CreditCard,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createOrder } from '../../services/order';
import type { CreateOrderProduct } from '../../services/order';
import { useLanguage } from '../../contexts/LanguageContext';

interface OrderProduct {
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
  companyId: string;
  customerId: string;
  customerName: string;
  orderType: string;
  priceType: string;
  contractId: string;
  employeeId: string;
  employeeName: string;
  externalAccountId: string;
  deliveryDate: string;
  deliveryAddress: string;
  deliveryNotes: string;
  taxType: string;
  cashAmount: number;
  transferAmount: number;
  postPayAmount: number;
  paymentNotes: string;
  products: OrderProduct[];
}

export default function OrderAdd() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    companyId: '',
    customerId: '',
    customerName: '',
    orderType: 'OrderForSale', // Default to "Đơn hàng bán"
    priceType: '1a1fb49c-5b28-11ef-a699-00155d058802', // Default to "Giá bán lẻ"
    contractId: '',
    employeeId: '',
    employeeName: '',
    externalAccountId: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryAddress: '',
    deliveryNotes: '',
    taxType: 'NotTaxableByVAT', // Default to "Không chịu thuế"
    cashAmount: 0,
    transferAmount: 0,
    postPayAmount: 0,
    paymentNotes: '',
    products: []
  });

  const [companies, setCompanies] = useState([
    { id: 'a4e5cb74-5b27-11ef-a699-00155d058802', name: 'Cửa hàng Dung-Baby' }
  ]);

  const [orderTypes] = useState([
    { id: 'OrderForSale', name: 'Đơn hàng bán' }
  ]);

  const [priceTypes] = useState([
    { id: '1a1fb49c-5b28-11ef-a699-00155d058802', name: 'Giá bán lẻ' }
  ]);

  const [taxTypes] = useState([
    { id: 'NotTaxableByVAT', name: 'Không chịu thuế (không thuế GTGT)' }
  ]);

  const calculateTotal = (products: OrderProduct[]) => {
    return products.reduce((sum, product) => sum + product.total, 0);
  };

  const handleAddProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
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
      return { ...prev, products: newProducts };
    });
  };

  const validateForm = (): boolean => {
    if (!formData.companyId) {
      toast.error('Vui lòng chọn công ty');
      return false;
    }

    if (!formData.customerId) {
      toast.error('Vui lòng chọn khách hàng');
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

  const handleSave = async () => {
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    try {
      setIsLoading(true);

      const orderProducts: CreateOrderProduct[] = formData.products.map(product => ({
        productId: product.id,
        productName: product.name,
        quantity: product.quantity,
        price: product.price,
        unitId: product.unitId,
        unitName: product.unitName,
        coefficient: product.coefficient,
        sku: product.sku
      }));

      const result = await createOrder({
        customerId: formData.customerId,
        customerName: formData.customerName,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        orderState: 'Editing',
        deliveryAddress: formData.deliveryAddress,
        comment: formData.deliveryNotes,
        documentAmount: calculateTotal(formData.products),
        products: orderProducts
      });

      toast.success('Tạo đơn hàng thành công');
      navigate(`/orders/${result.id}`);
    } catch (error) {
      toast.error('Không thể tạo đơn hàng');
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thêm mới đơn hàng</h1>
            <p className="text-sm text-gray-500">Trạng thái: Đang soạn</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5 inline-block mr-1" />
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Save className="w-5 h-5 inline-block mr-1" />
              Lưu
            </button>
          </div>
        </div>

        {/* General Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Công ty/Cửa hàng *
            </label>
            <select
              value={formData.companyId}
              onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Chọn công ty</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khách hàng *
            </label>
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại đơn hàng
            </label>
            <select
              value={formData.orderType}
              onChange={(e) => setFormData(prev => ({ ...prev, orderType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {orderTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại giá
            </label>
            <select
              value={formData.priceType}
              onChange={(e) => setFormData(prev => ({ ...prev, priceType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {priceTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hợp đồng
            </label>
            <select
              value={formData.contractId}
              onChange={(e) => setFormData(prev => ({ ...prev, contractId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Chọn hợp đồng</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhân viên phụ trách
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Chọn nhân viên</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tài khoản ngoài
            </label>
            <select
              value={formData.externalAccountId}
              onChange={(e) => setFormData(prev => ({ ...prev, externalAccountId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Chọn tài khoản</option>
            </select>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày giao hàng
            </label>
            <input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ giao hàng
            </label>
            <textarea
              value={formData.deliveryAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú giao hàng
            </label>
            <textarea
              value={formData.deliveryNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryNotes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Payment Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại thuế
            </label>
            <select
              value={formData.taxType}
              onChange={(e) => setFormData(prev => ({ ...prev, taxType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {taxTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiền mặt
            </label>
            <input
              type="number"
              value={formData.cashAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, cashAmount: Number(e.target.value) }))}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chuyển khoản
            </label>
            <input
              type="number"
              value={formData.transferAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, transferAmount: Number(e.target.value) }))}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thanh toán sau
            </label>
            <input
              type="number"
              value={formData.postPayAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, postPayAmount: Number(e.target.value) }))}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú thanh toán
            </label>
            <textarea
              value={formData.paymentNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentNotes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="mb-8">
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn vị tính</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
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
                        <option value="">Chọn đơn vị</option>
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
                      <input
                        type="text"
                        value={product.notes}
                        onChange={(e) => handleProductChange(index, 'notes', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                      />
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
                    {calculateTotal(formData.products).toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Xác nhận tạo đơn hàng
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn tạo đơn hàng này không?
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
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
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