import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  FileText,
  DollarSign,
  Loader2,
  AlertCircle,
  Printer,
  CreditCard,
  Truck,
  Tag,
  Building,
  Phone,
  Pencil,
  Trash2
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
            {error || 'Order Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            The order you're looking for could not be found or an error occurred.
          </p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/orders')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </button>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Order
          </button>
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Order Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{order.title}</h2>
            <p className="text-sm text-gray-500">#{order.number}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.orderState.toLowerCase().includes('delivered') ? 'bg-green-100 text-green-800' :
            order.orderState.toLowerCase().includes('processing') ? 'bg-yellow-100 text-yellow-800' :
            order.orderState.toLowerCase().includes('cancelled') ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {order.orderState}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">Order Date</span>
              </div>
              <p className="text-lg text-gray-900">{formatDate(order.date)}</p>
            </div>

            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <User className="w-4 h-4 mr-2" />
                <span className="text-sm">Customer</span>
              </div>
              <p className="text-lg text-gray-900">{order.customer}</p>
            </div>

            {order.phone && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="text-sm">Phone</span>
                </div>
                <p className="text-lg text-gray-900">{order.phone}</p>
              </div>
            )}

            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <Building className="w-4 h-4 mr-2" />
                <span className="text-sm">Company</span>
              </div>
              <p className="text-lg text-gray-900">{order.company}</p>
            </div>

            {order.deliveryAddress && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Truck className="w-4 h-4 mr-2" />
                  <span className="text-sm">Delivery Address</span>
                </div>
                <p className="text-lg text-gray-900">{order.deliveryAddress}</p>
              </div>
            )}

            {order.comment && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm">Notes</span>
                </div>
                <p className="text-lg text-gray-900">{order.comment}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <Tag className="w-4 h-4 mr-2" />
                <span className="text-sm">Order Type</span>
              </div>
              <p className="text-lg text-gray-900">{order.operationType}</p>
            </div>

            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <Tag className="w-4 h-4 mr-2" />
                <span className="text-sm">Price Kind</span>
              </div>
              <p className="text-lg text-gray-900">{order.priceKind}</p>
            </div>

            {order.employeeResponsible && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm">Responsible Employee</span>
                </div>
                <p className="text-lg text-gray-900">{order.employeeResponsible}</p>
              </div>
            )}

            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <DollarSign className="w-4 h-4 mr-2" />
                <span className="text-sm">Total Amount</span>
              </div>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(order.documentAmount, order.documentCurrency)}
              </p>
            </div>

            {order.cash !== null && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span className="text-sm">Cash Payment</span>
                </div>
                <p className="text-lg font-medium text-green-600">
                  {formatCurrency(order.cash, order.documentCurrency)}
                </p>
              </div>
            )}

            {order.bankTransfer !== null && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span className="text-sm">Bank Transfer</span>
                </div>
                <p className="text-lg font-medium text-green-600">
                  {formatCurrency(order.bankTransfer, order.documentCurrency)}
                </p>
              </div>
            )}

            {order.postPayment !== null && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span className="text-sm">Post Payment</span>
                </div>
                <p className="text-lg font-medium text-red-600">
                  {formatCurrency(order.postPayment, order.documentCurrency)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Products</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No.
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.products.map((product) => (
                <tr key={product.lineNumber} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.lineNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.picture ? (
                        <img
                          src={product.picture}
                          alt={product.productName}
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
                            e.currentTarget.alt = 'Fallback product image';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {product.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {product.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatCurrency(product.price, order.documentCurrency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {product.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                    {formatCurrency(product.total, order.documentCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={5} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  Total Amount
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                  {formatCurrency(order.documentAmount, order.documentCurrency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}