import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  X,
  Package,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupplierInvoiceDetail, updateSupplierInvoice } from '../../services/supplierInvoice';
import type { SupplierInvoiceDetail, UpdateSupplierInvoiceData } from '../../services/supplierInvoice';

interface FormData {
  id: string;
  number: string;
  title: string;
  date: string;
  customerId: string;
  customerName: string;
  contractId: string;
  contractName: string;
  currencyId: string;
  currencyName: string;
  rate: number;
  comment: string;
  employeeId: string;
  employeeName: string;
  externalAccountId: string;
  externalAccountName: string;
  posted: boolean;
  products: Array<{
    productId: string;
    productName: string;
    unitId: string;
    unitName: string;
    quantity: number;
    price: number;
    coefficient: number;
    total: number;
  }>;
}

export default function SupplierInvoiceUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [invoice, setInvoice] = useState<SupplierInvoiceDetail | null>(null);

  const [currencies] = useState([
    { id: 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec', name: 'VND' },
    { id: 'cd8e4a47-6236-11ef-a699-00155d058802', name: 'CNY' }
  ]);
  const [employees] = useState([
    { id: '0a1ae9b8-5b28-11ef-a699-00155d058802', name: 'Test' }
  ]);
  const [externalAccounts] = useState([
    { id: 'b66ac3a4-e850-11ef-9602-f2202b293748', name: '0396492705 / Unknown' }
  ]);

  const [formData, setFormData] = useState<FormData>({
    id: '',
    number: '',
    title: '',
    date: new Date().toISOString().split('T')[0] + 'T00:00:00',
    customerId: '',
    customerName: '',
    contractId: '',
    contractName: '',
    currencyId: 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec',
    currencyName: 'VND',
    rate: 1,
    comment: '',
    employeeId: '0a1ae9b8-5b28-11ef-a699-00155d058802',
    employeeName: 'Test',
    externalAccountId: 'b66ac3a4-e850-11ef-9602-f2202b293748',
    externalAccountName: '0396492705 / Unknown',
    posted: false,
    products: []
  });

  useEffect(() => {
    const fetchInvoiceDetail = async () => {
      if (!id) {
        setError('ID đơn nhận hàng không tồn tại');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getSupplierInvoiceDetail(id);
        setInvoice(data);
        
        setFormData({
          id: data.id,
          number: data.number,
          title: data.number,
          date: data.date,
          customerId: data.counterparty,
          customerName: data.counterparty,
          contractId: data.contract || '',
          contractName: data.contract || '',
          currencyId: getCurrencyIdFromName(data.currency),
          currencyName: data.currency,
          rate: 1,
          comment: data.comment,
          employeeId: data.employeeResponsible || '',
          employeeName: data.employeeResponsible || '',
          externalAccountId: 'b66ac3a4-e850-11ef-9602-f2202b293748',
          externalAccountName: '0396492705 / Unknown',
          posted: data.posted,
          products: data.products.map(product => ({
            productId: product.productId,
            productName: product.productName,
            unitId: '5736c39c-5b28-11ef-a699-00155d058802',
            unitName: product.unit,
            quantity: product.quantity,
            price: product.price,
            coefficient: product.coefficient,
            total: product.total
          }))
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin đơn nhận hàng';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetail();
  }, [id]);

  const getCurrencyIdFromName = (currencyName: string): string => {
    if (currencyName.includes('CNY')) {
      return 'cd8e4a47-6236-11ef-a699-00155d058802';
    }
    return 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec';
  };

  const calculateTotal = () => {
    return formData.products.reduce((sum, product) => sum + product.total, 0);
  };

  const handleAddProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productId: '',
          productName: '',
          unitId: '5736c39c-5b28-11ef-a699-00155d058802',
          unitName: 'c',
          quantity: 1,
          price: 0,
          coefficient: 1,
          total: 0
        }
      ]
    }));
    setIsDirty(true);
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      newProducts[index] = {
        ...newProducts[index],
        [field]: value
      };
      
      if (field === 'quantity' || field === 'price') {
        newProducts[index].total = newProducts[index].quantity * newProducts[index].price;
      }
      
      return { ...prev, products: newProducts };
    });
    setIsDirty(true);
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const validateForm = (): boolean => {
    if (!formData.customerId) {
      toast.error('Vui lòng chọn nhà cung cấp');
      return false;
    }

    if (formData.products.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm');
      return false;
    }

    for (const product of formData.products) {
      if (!product.productId) {
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

  const handleSubmit = () => {
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSaving(true);

      const invoiceData: UpdateSupplierInvoiceData = {
        id: formData.id,
        number: formData.number,
        title: formData.title,
        date: formData.date,
        customerId: formData.customerId,
        customerName: formData.customerName,
        contractId: formData.contractId,
        contractName: formData.contractName,
        currencyId: formData.currencyId,
        currencyName: formData.currencyName,
        rate: formData.rate,
        comment: formData.comment,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        externalAccountId: formData.externalAccountId,
        externalAccountName: formData.externalAccountName,
        amount: calculateTotal(),
        products: formData.products.map(product => ({
          productId: product.productId,
          productName: product.productName,
          unitId: product.unitId,
          unitName: product.unitName,
          quantity: product.quantity,
          price: product.price,
          coefficient: product.coefficient
        })),
        posted: formData.posted
      };

      await updateSupplierInvoice(invoiceData);
      toast.success('Cập nhật đơn nhận hàng thành công');
      navigate(`/supplier-invoices/${formData.id}`);
    } catch (error) {
      toast.error('Không thể cập nhật đơn nhận hàng');
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?')) {
        navigate(`/supplier-invoices/${id}`);
      }
    } else {
      navigate(`/supplier-invoices/${id}`);
    }
  };

  // Mock data for demonstration
  const mockProducts = [
    { id: 'e1e397eb-7ddd-455d-8530-5d630d7769f9', name: 'Áo', price: 150000 },
    { id: 'f2e397eb-7ddd-455d-8530-5d630d7769f9', name: 'Quần', price: 200000 },
    { id: 'g3e397eb-7ddd-455d-8530-5d630d7769f9', name: 'Giày', price: 350000 }
  ];

  const mockSuppliers = [
    { id: '814b6993-d252-11ef-9602-f2202b293748', name: 'Trang Thu' },
    { id: '914b6993-d252-11ef-9602-f2202b293748', name: 'Công ty ABC' }
  ];

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
            onClick={() => navigate('/supplier-invoices')}
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
          <h1 className="text-lg font-semibold text-gray-900">Cập nhật đơn nhận hàng</h1>
          <p className="text-sm text-gray-500">#{formData.number}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        {/* General Information */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày tạo *
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhà cung cấp *
            </label>
            <div className="relative">
              <select
                value={formData.customerId}
                onChange={(e) => {
                  const selected = mockSuppliers.find(s => s.id === e.target.value);
                  if (selected) {
                    handleInputChange('customerId', selected.id);
                    handleInputChange('customerName', selected.name);
                  }
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn nhà cung cấp</option>
                {mockSuppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại tiền tệ
            </label>
            <div className="relative">
              <select
                value={formData.currencyId}
                onChange={(e) => {
                  const selected = currencies.find(c => c.id === e.target.value);
                  if (selected) {
                    handleInputChange('currencyId', selected.id);
                    handleInputChange('currencyName', selected.name);
                    handleInputChange('rate', selected.id === 'cd8e4a47-6236-11ef-a699-00155d058802' ? 113 : 1);
                  }
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {currencies.map(currency => (
                  <option key={currency.id} value={currency.id}>
                    {currency.name}
                  </option>
                ))}
              </select>
              <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tỷ giá
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.rate}
                onChange={(e) => handleInputChange('rate', Number(e.target.value))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

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

        {/* Products List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-medium text-gray-900">Danh sách sản phẩm</h2>
            <button
              onClick={handleAddProduct}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Thêm sản phẩm
            </button>
          </div>

          <div className="space-y-4">
            {formData.products.map((product, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                {/* Product Selection */}
                <div className="flex gap-3 mb-3">
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <select
                      value={product.productId}
                      onChange={(e) => {
                        const selected = mockProducts.find(p => p.id === e.target.value);
                        if (selected) {
                          handleProductChange(index, 'productId', selected.id);
                          handleProductChange(index, 'productName', selected.name);
                          handleProductChange(index, 'price', selected.price);
                          handleProductChange(index, 'total', selected.price * product.quantity);
                        }
                      }}
                      className="w-full text-sm text-gray-900 bg-transparent border-0 p-0 focus:ring-0"
                    >
                      <option value="">Chọn sản phẩm</option>
                      {mockProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(index)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Quantity and Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Số lượng
                    </label>
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, 'quantity', Number(e.target.value))}
                      min="1"
                      className="w-full text-sm text-gray-900 bg-transparent border-0 p-0 focus:ring-0"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Đơn giá
                    </label>
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => handleProductChange(index, 'price', Number(e.target.value))}
                      min="0"
                      step="1000"
                      className="w-full text-sm text-gray-900 bg-transparent border-0 p-0 focus:ring-0"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Thành tiền</span>
                  <span className="text-sm font-medium text-blue-600">
                    {product.total.toLocaleString()} đ
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total Amount */}
          {formData.products.length > 0 && (
            <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Tổng cộng</span>
                <span className="text-base font-semibold text-blue-600">
                  {calculateTotal().toLocaleString()} đ
                </span>
              </div>
            </div>
          )}
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
              Xác nhận cập nhật đơn nhận hàng
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn cập nhật đơn nhận hàng này không?
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