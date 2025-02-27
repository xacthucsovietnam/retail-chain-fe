import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Printer,
  Loader2,
  AlertCircle,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrderDetail } from '../../services/order';
import type { OrderDetail } from '../../services/order';
import { formatCurrency } from '../../utils/currency';
import { useLanguage } from '../../contexts/LanguageContext';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setOrder(data);
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

  const handleEdit = () => {
    if (id) {
      navigate(`/orders/edit/${id}`);
    }
  };

  const handleDelete = () => {
    toast.error('Delete functionality not implemented yet');
  };

  const handlePrint = () => {
    toast.error('Print functionality not implemented yet');
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

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Không tìm thấy đơn hàng'}
          </h2>
          <button
            onClick={() => navigate('/orders')}
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
          <h1 className="text-lg font-semibold text-gray-900">Chi tiết đơn hàng</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        {/* Order Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          {/* Order Number and Status */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Số đơn hàng</p>
              <p className="text-base font-medium text-gray-900">#{order.number}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              order.orderState.toLowerCase().includes('delivered') ? 'bg-green-100 text-green-800' :
              order.orderState.toLowerCase().includes('processing') ? 'bg-yellow-100 text-yellow-800' :
              order.orderState.toLowerCase().includes('cancelled') ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {order.orderState}
            </span>
          </div>

          {/* Customer and Employee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Khách hàng</p>
              <p className="text-base text-gray-900">{order.customer}</p>
            </div>

            {order.employeeResponsible && (
              <div>
                <p className="text-sm text-gray-500">Người bán</p>
                <p className="text-base text-gray-900">{order.employeeResponsible}</p>
              </div>
            )}
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-sm text-gray-500">Tổng tiền</p>
              <p className="text-sm font-semibold text-blue-600">
                {formatCurrency(order.documentAmount, order.documentCurrency)}
              </p>
            </div>

            {order.cash !== null && (
              <div>
                <p className="text-sm text-gray-500">Thu tiền mặt</p>
                <p className="text-sm font-medium text-green-600">
                  {formatCurrency(order.cash, order.documentCurrency)}
                </p>
              </div>
            )}

            {order.postPayment !== null && (
              <div>
                <p className="text-sm text-gray-500">Công nợ</p>
                <p className="text-sm font-medium text-red-600">
                  {formatCurrency(order.postPayment, order.documentCurrency)}
                </p>
              </div>
            )}
          </div>

          {order.deliveryAddress && (
            <div>
              <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
              <p className="text-base text-gray-900">{order.deliveryAddress}</p>
            </div>
          )}
        </div>

        {/* Products List */}
        <div className="mt-4">
          <h2 className="text-base font-medium text-gray-900 mb-3">Danh sách sản phẩm</h2>
          <div className="space-y-3">
            {order.products.map((product) => (
              <div key={product.lineNumber} className="bg-white rounded-lg shadow-sm p-3">
                <div className="flex gap-3">
                  {product.picture ? (
                    <img
                      src={product.picture}
                      alt={product.productName}
                      className="h-16 w-16 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
                      }}
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {product.productName}
                      </h3>
                      <p className="text-xs text-gray-500 ml-2">{product.sku}</p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-sm text-gray-700">
                        {product.quantity} {product.unit} x {formatCurrency(product.price, order.documentCurrency)}
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {formatCurrency(product.total, order.documentCurrency)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => navigate('/orders')}
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

        <button
          onClick={handlePrint}
          className="p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Printer className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}