import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  AlertCircle,
  Package,
  Tag,
  DollarSign,
  User,
  Building,
  FileCheck,
  Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupplierInvoiceDetail } from '../../services/supplierInvoice';
import type { SupplierInvoiceDetail as ISupplierInvoiceDetail } from '../../services/supplierInvoice';
import { formatCurrency } from '../../utils/currency';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SupplierInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<ISupplierInvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

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

  const handleEdit = () => {
    if (id) {
      navigate(`/supplier-invoices/edit/${id}`);
    }
  };

  const handleDelete = () => {
    toast.error('Chức năng xóa chưa được triển khai');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Không tìm thấy đơn nhận hàng'}
          </h2>
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
          <h1 className="text-lg font-semibold text-gray-900">Chi tiết đơn nhận hàng</h1>
          <p className="text-sm text-gray-500">#{invoice.number}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500">Ngày tạo</p>
              <p className="text-base text-gray-900">{formatDate(invoice.date)}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              invoice.posted
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {invoice.posted ? 'Đã ghi sổ' : 'Nháp'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Người lập</p>
                <p className="text-base text-gray-900">{invoice.author}</p>
              </div>
            </div>

            {invoice.contract && (
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Hợp đồng</p>
                  <p className="text-base text-gray-900">{invoice.contract}</p>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <Building className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Nhà cung cấp</p>
                <p className="text-base text-gray-900">{invoice.counterparty}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Tag className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Loại nghiệp vụ</p>
                <p className="text-base text-gray-900">{invoice.operationType}</p>
              </div>
            </div>

            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Tổng tiền</p>
                <p className="text-base font-medium text-blue-600">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </p>
              </div>
            </div>

            {invoice.employeeResponsible && (
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Nhân viên phụ trách</p>
                  <p className="text-base text-gray-900">{invoice.employeeResponsible}</p>
                </div>
              </div>
            )}

            {invoice.vatTaxation && (
              <div className="flex items-center">
                <FileCheck className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Thuế GTGT</p>
                  <p className="text-base text-gray-900">{invoice.vatTaxation}</p>
                </div>
              </div>
            )}

            {invoice.orderBasis && (
              <div className="flex items-center">
                <Receipt className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Đơn đặt hàng</p>
                  <p className="text-base text-gray-900">{invoice.orderBasis}</p>
                </div>
              </div>
            )}

            {invoice.comment && (
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Ghi chú</p>
                  <p className="text-base text-gray-900 whitespace-pre-line">{invoice.comment}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Danh sách sản phẩm</h2>
          
          <div className="space-y-4">
            {invoice.products.map((product) => (
              <div key={product.lineNumber} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex gap-3">
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.picture ? (
                      <img
                        src={product.picture}
                        alt={product.productName}
                        className="h-full w-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
                          e.currentTarget.alt = 'Hình ảnh mặc định';
                        }}
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {product.productName}
                    </h3>
                    
                    <div className="text-sm text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Số lượng:</span>
                        <span>{product.quantity} {product.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Đơn giá:</span>
                        <span>{formatCurrency(product.price, invoice.currency)}</span>
                      </div>
                      <div className="flex justify-between font-medium text-blue-600">
                        <span>Thành tiền:</span>
                        <span>{formatCurrency(product.total, invoice.currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Tổng cộng</span>
              <span className="text-lg font-semibold text-blue-600">
                {formatCurrency(invoice.amount, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => navigate('/supplier-invoices')}
          className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <button
          onClick={handleEdit}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Pencil className="h-6 w-6" />
        </button>

        <button
          onClick={handleDelete}
          className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Trash2 className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}