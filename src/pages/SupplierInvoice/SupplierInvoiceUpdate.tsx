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
import type { SupplierInvoiceDetail, UpdateSupplierInvoiceData, CreateSupplierInvoiceProduct } from '../../services/supplierInvoice';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [invoice, setInvoice] = useState<SupplierInvoiceDetail | null>(null);

  const [currencies, setCurrencies] = useState([
    { id: 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec', name: 'VND' },
    { id: 'cd8e4a47-6236-11ef-a699-00155d058802', name: 'CNY' }
  ]);
  const [employees, setEmployees] = useState([
    { id: '0a1ae9b8-5b28-11ef-a699-00155d058802', name: 'Test' }
  ]);
  const [externalAccounts, setExternalAccounts] = useState([
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
        setError('Invoice ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getSupplierInvoiceDetail(id);
        setInvoice(data);
        
        // Map the API data to our form data structure
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
          rate: 1, // Default rate, should be retrieved from the API
          comment: data.comment,
          employeeId: data.employeeResponsible || '',
          employeeName: data.employeeResponsible || '',
          externalAccountId: 'b66ac3a4-e850-11ef-9602-f2202b293748', // Default value
          externalAccountName: '0396492705 / Unknown', // Default value
          posted: data.posted,
          products: data.products.map(product => ({
            productId: product.productId,
            productName: product.productName,
            unitId: '5736c39c-5b28-11ef-a699-00155d058802', // Default unit ID
            unitName: product.unit,
            quantity: product.quantity,
            price: product.price,
            coefficient: product.coefficient,
            total: product.total
          }))
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load invoice details';
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
    return 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec'; // Default to VND
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
      
      // Recalculate total if quantity or price changes
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

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCurrency = currencies.find(c => c.id === e.target.value);
    if (selectedCurrency) {
      setFormData(prev => ({
        ...prev,
        currencyId: selectedCurrency.id,
        currencyName: selectedCurrency.name,
        rate: selectedCurrency.id === 'cd8e4a47-6236-11ef-a699-00155d058802' ? 113 : 1 // Set rate to 113 for CNY, 1 for VND
      }));
      setIsDirty(true);
    }
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmployee = employees.find(emp => emp.id === e.target.value);
    if (selectedEmployee) {
      setFormData(prev => ({
        ...prev,
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name
      }));
      setIsDirty(true);
    }
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

  const handleSave = () => {
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cập nhật đơn nhận hàng</h1>
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
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className={`px-4 py-2 text-white rounded-md ${
                isDirty ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-5 h-5 inline-block mr-1" />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

        {/* General Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày tạo *
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={formData.date.slice(0, 16)}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Chọn nhà cung cấp</option>
                {mockSuppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại tiền tệ
            </label>
            <div className="relative">
              <select
                value={formData.currencyId}
                onChange={handleCurrencyChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhân viên phụ trách
            </label>
            <div className="relative">
              <select
                value={formData.employeeId}
                onChange={handleEmployeeChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <div className="relative">
              <select
                value={formData.posted ? 'posted' : 'draft'}
                onChange={(e) => handleInputChange('posted', e.target.value === 'posted')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="draft">Nháp</option>
                <option value="posted">Đã ghi sổ</option>
              </select>
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <div className="relative">
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                rows={3}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Nhập ghi chú..."
              />
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2  className="text-lg font-medium text-gray-900">Danh sách sản phẩm</h2>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn vị tính</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
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
                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                      >
                        <option value="">Chọn sản phẩm</option>
                        {mockProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={product.unitName}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 rounded-md bg-gray-50"
                      />
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
                  <td colSpan={5} className="px-4 py-3 text-right font-medium">
                    Tổng cộng:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">
                    {calculateTotal().toLocaleString()}
                  </td>
                  <td></td>
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
              Xác nhận cập nhật đơn nhận hàng
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn cập nhật đơn nhận hàng này không?
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