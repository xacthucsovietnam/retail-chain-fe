import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Printer,
  Loader2,
  AlertCircle,
  Package,
  CreditCard,
  DollarSign,
  Truck,
  X,
  Check,
  FileText,
  Files,
  Plus,
  ArrowUpToLine,
  ArrowDownToLine
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrderDetail, updateOrder, getRelatedDocuments, type RelatedDocument } from '../../services/order';
import type { OrderDetail } from '../../services/order';
import { formatCurrency } from '../../utils/currency';
import { useLanguage } from '../../contexts/LanguageContext';
import { DEFAULT_IMAGE_URL } from '../../services/file';

interface PaymentFormData {
  cash: number;
  bankTransfer: number;
  credit: number;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRelatedDocs, setShowRelatedDocs] = useState(false);
  const [relatedDocs, setRelatedDocs] = useState<RelatedDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const { t } = useLanguage();
  const [isReturnMode, setIsReturnMode] = useState(false);

  const [paymentData, setPaymentData] = useState<PaymentFormData>({
    cash: 0,
    bankTransfer: 0,
    credit: 0
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
        setOrder(data);
        setPaymentData({
          cash: data.cash || 0,
          bankTransfer: data.bankTransfer || 0,
          credit: data.documentAmount - (data.cash || 0) - (data.bankTransfer || 0)
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

  const handlePrint = () => {
  if (!id) {
    toast.error('Order ID is missing');
    return;
  }

  // Construct the PDF URL
  const baseUrl = 'https://app.xts.vn/dungbaby-service/hs/apps/files/';
  const queryParams = new URLSearchParams({
    id: id,
    'data-type': 'XTSOrder',
    'template-name': 'ExternalPrintForm.PF_SalesOrder'
  });
  const pdfUrl = `${baseUrl}${id}.pdf?${queryParams.toString()}`;

  // Open PDF in current tab
  try {
    window.open(pdfUrl, '_blank');
  } catch (error) {
    console.error('Failed to open PDF:', error);
    toast.error('Không thể mở file PDF. Vui lòng thử lại sau.');
  }
  };
  
  const handleSellMore = () => {
    if (!order) return;

    // Store order data in sessionStorage for the new order form
    sessionStorage.setItem('newOrderData', JSON.stringify({
      customerId: order.customer,
      customerName: order.customer,
      employeeId: order.employeeResponsible || '',
      employeeName: order.employeeResponsible || '',
      deliveryAddress: order.deliveryAddress || '',
      isReturnOrder: false
    }));

    navigate('/orders/add');
  };

  const handleReturnItems = () => {
    if (!order) return;

    // Store order data and products in sessionStorage for the return order
    sessionStorage.setItem('newOrderData', JSON.stringify({
      customerId: order.customer,
      customerName: order.customer,
      employeeId: order.employeeResponsible || '',
      employeeName: order.employeeResponsible || '',
      deliveryAddress: order.deliveryAddress || '',
      isReturnOrder: true,
      originalProducts: order.products
    }));

    navigate('/orders/add');
  };

  const handlePaymentChange = (field: keyof PaymentFormData, value: number) => {
    const newValue = Math.max(0, value);

    setPaymentData(prev => {
      const total = order?.documentAmount || 0;
      let newPaymentData = { ...prev, [field]: newValue };

      if (field === 'cash' || field === 'bankTransfer') {
        const credit = total - newPaymentData.cash - newPaymentData.bankTransfer;
        newPaymentData.credit = Math.max(0, credit);

        if (credit < 0) {
          newPaymentData[field] = total - (field === 'cash' ? newPaymentData.bankTransfer : newPaymentData.cash);
          newPaymentData.credit = 0;
        }
      }

      return newPaymentData;
    });
  };

  const handleQuickFill = (field: 'cash' | 'bankTransfer') => {
    if (!order) return;

    setPaymentData({
      cash: field === 'cash' ? order.documentAmount : 0,
      bankTransfer: field === 'bankTransfer' ? order.documentAmount : 0,
      credit: 0
    });
  };

  const handleShowRelatedDocs = async () => {
    if (!order) return;

    try {
      setIsLoadingDocs(true);
      const docs = await getRelatedDocuments(order.id, order.number);
      setRelatedDocs(docs);
      setShowRelatedDocs(true);
    } catch (error) {
      toast.error('Không thể tải danh sách chứng từ liên quan');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const getNextOrderState = (currentState: string, action: 'payment' | 'delivery'): string => {
    const lowerState = currentState.toLowerCase();

    if (action === 'payment') {
      if (lowerState.includes('đang soạn') || lowerState.includes('chờ trả trước')) {
        return 'Preparing';
      }
    } else if (action === 'delivery') {
      if (lowerState.includes('đang chuẩn bị')) {
        return 'Delivered';
      }
    }

    return currentState;
  };

  const handleConfirmPayment = async () => {
    if (!order || !id) return;

    try {
      setIsProcessing(true);

      const nextState = getNextOrderState(order.orderState, 'payment');

      await updateOrder({
        id: order.id,
        number: order.number,
        title: order.title,
        customerId: order.customer,
        customerName: order.customer,
        employeeId: order.employeeResponsible || '',
        employeeName: order.employeeResponsible || '',
        orderState: nextState,
        deliveryAddress: order.deliveryAddress || '',
        comment: order.comment || '',
        documentAmount: order.documentAmount,
        products: order.products.map(p => ({
          lineNumber: p.lineNumber,
          productId: p.productId,
          productName: p.productName,
          quantity: p.quantity,
          price: p.price,
          unitId: '5736c39c-5b28-11ef-a699-00155d058802',
          unitName: p.unit,
          coefficient: p.coefficient,
          sku: p.sku
        })),
        date: order.date,
        contractId: '',
        contractName: '',
        externalAccountId: '',
        externalAccountName: '',
        cashAmount: paymentData.cash,
        transferAmount: paymentData.bankTransfer,
        postPayAmount: paymentData.credit,
        paymentNotes: ''
      });

      toast.success('Payment updated successfully');
      setShowPaymentModal(false);
      setShowConfirmation(false);

      const updatedOrder = await getOrderDetail(id);
      setOrder(updatedOrder);
    } catch (error) {
      toast.error('Failed to update payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelivery = async () => {
    if (!order || !id) return;

    try {
      setIsProcessing(true);

      const nextState = getNextOrderState(order.orderState, 'delivery');

      await updateOrder({
        id: order.id,
        number: order.number,
        title: order.title,
        customerId: order.customer,
        customerName: order.customer,
        employeeId: order.employeeResponsible || '',
        employeeName: order.employeeResponsible || '',
        orderState: nextState,
        deliveryAddress: order.deliveryAddress || '',
        comment: order.comment || '',
        documentAmount: order.documentAmount,
        products: order.products.map(p => ({
          lineNumber: p.lineNumber,
          productId: p.productId,
          productName: p.productName,
          quantity: p.quantity,
          price: p.price,
          unitId: '5736c39c-5b28-11ef-a699-00155d058802',
          unitName: p.unit,
          coefficient: p.coefficient,
          sku: p.sku
        })),
        date: order.date,
        contractId: '',
        contractName: '',
        externalAccountId: '',
        externalAccountName: '',
        cashAmount: order.cash || 0,
        transferAmount: order.bankTransfer || 0,
        postPayAmount: order.postPayment || 0,
        paymentNotes: ''
      });

      toast.success('Order marked as delivered');

      const updatedOrder = await getOrderDetail(id);
      setOrder(updatedOrder);
    } catch (error) {
      toast.error('Failed to update delivery status');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('đang soạn')) {
      return 'bg-[#FFC107]/10 text-[#FFC107]';
    }
    if (statusLower.includes('đã giao hàng')) {
      return 'bg-[#FF9800]/10 text-[#FF9800]';
    }
    if (statusLower.includes('chờ trả trước')) {
      return 'bg-[#2196F3]/10 text-[#2196F3]';
    }
    if (statusLower.includes('đang chuẩn bị')) {
      return 'bg-[#4CAF50]/10 text-[#4CAF50]';
    }
    if (statusLower.includes('đã hủy')) {
      return 'bg-[#F44336]/10 text-[#F44336]';
    }
    if (statusLower.includes('đã hoàn thành')) {
      return 'bg-[#9C27B0]/10 text-[#9C27B0]';
    }
    return 'bg-gray-100 text-gray-800';
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

  const getActionButtons = () => {
    if (!order) return null;

    const status = order.orderState.toLowerCase();
    const buttons = [];

    // Back button is always present
    buttons.push(
      <button
        key="back"
        onClick={() => navigate('/orders')}
        className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
    );

    // Related Documents button is always present
    buttons.push(
      <button
        key="related"
        onClick={handleShowRelatedDocs}
        disabled={isLoadingDocs}
        className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <Files className="h-6 w-6" />
      </button>
    );

    if (status.includes('đang soạn') || status.includes('chờ trả trước')) {
      buttons.push(
        <button
          key="edit"
          onClick={() => navigate(`/orders/edit/${id}`)}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Pencil className="h-6 w-6" />
        </button>,
        <button
          key="pay"
          onClick={() => setShowPaymentModal(true)}
          className="p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <CreditCard className="h-6 w-6" />
        </button>,
        <button
          key="delete"
          onClick={() => toast.error('Delete functionality not implemented')}
          className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Trash2 className="h-6 w-6" />
        </button>
      );
    } else if (status.includes('đang chuẩn bị')) {
      buttons.push(
        <button
          key="deliver"
          onClick={handleDelivery}
          disabled={isProcessing}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Truck className="h-6 w-6" />
        </button>,
        <button
          key="print"
          onClick={handlePrint}
          className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Printer className="h-6 w-6" />
        </button>,
        <button
          key="delete"
          onClick={() => toast.error('Delete functionality not implemented')}
          className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Trash2 className="h-6 w-6" />
        </button>
      );
    } else if (status.includes('đã giao hàng') || status.includes('đã hoàn thành')) {
      buttons.push(
        <button
          key="print"
          onClick={handlePrint}
          className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Printer className="h-6 w-6" />
        </button>
      );
    }

    return buttons;
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header */}
      <div className="fixed top-12 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-bold text-gray-900 mt-1">#{order.number}</div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.orderState)}`}>
              {order.orderState}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-12 px-4">
        {/* Order Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="text-sm text-gray-500">Ngày đặt hàng</div>
              <div className="text-sm font-medium">{formatDate(order.date)}</div>
            </div>

            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div className="text-sm text-gray-500">Khách hàng</div>
              <div className="text-sm font-medium text-right">{order.customer}</div>
            </div>

            {order.employeeResponsible && (
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="text-sm text-gray-500">Nhân viên bán hàng</div>
                <div className="text-sm font-medium">{order.employeeResponsible}</div>
              </div>
            )}

            {order.deliveryAddress && (
              <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                <div className="text-sm text-gray-500">Địa chỉ giao hàng</div>
                <div className="text-sm font-medium text-right max-w-[60%]">{order.deliveryAddress}</div>
              </div>
            )}

            {order.comment && (
              <div className="flex justify-between items-start">
                <div className="text-sm text-gray-500">Ghi chú</div>
                <div className="text-sm font-medium text-right max-w-[60%]">{order.comment}</div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <div>Tổng tiền</div>
              <div className="text-blue-600">{formatCurrency(order.documentAmount, order.documentCurrency)}</div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Tiền mặt</div>
                  <div className="text-sm font-medium text-green-600">
                    {formatCurrency(order.cash || 0, order.documentCurrency)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Chuyển khoản</div>
                  <div className="text-sm font-medium text-blue-600">
                    {formatCurrency(order.bankTransfer || 0, order.documentCurrency)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Công nợ</div>
                  <div className="text-sm font-medium text-red-600">
                    {formatCurrency(order.postPayment || 0, order.documentCurrency)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <h2 className="px-4 py-3 text-base font-medium text-gray-900 border-b border-gray-200">
            Danh sách sản phẩm
          </h2>

          <div className="divide-y divide-gray-200">
            {order.products.map((product, index) => (
              <div key={product.lineNumber} className="p-4">
                <div className="flex gap-3">
                  {/* Product Image */}
                  <div className="h-20 w-20 bg-gray-100 rounded-lg flex-shrink-0">
                    {product.picture ? (
                      <img
                        src={product.picture}
                        alt={product.productName}
                        className="h-full w-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_IMAGE_URL;
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Product Number and Name */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">#{index + 1}</span>
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {product.productName}
                          </h3>
                        </div>
                        {/* SKU Code */}
                        <p className="text-sm text-gray-500 mt-0.5">SKU: {product.sku}</p>
                      </div>
                    </div>

                    {/* Price Information */}
                    <div className="mt-2 text-sm">
                      <div className="flex items-center justify-between text-gray-500">
                        <div className="flex items-center gap-1">
                          <span>{product.quantity}</span>
                          <span>{product.unit}</span>
                          <span>x</span>
                          <span>{formatCurrency(product.price, order.documentCurrency)}</span>
                          <span>/{product.unit}</span>
                        </div>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(product.total, order.documentCurrency)}
                        </span>
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
        {getActionButtons()}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Thanh toán</h3>
              <button onClick={() => setShowPaymentModal(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổng tiền
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrency(order.documentAmount, order.documentCurrency)}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    Tiền mặt
                  </label>
                  <button
                    onClick={() => handleQuickFill('cash')}
                    className="text-xs text-blue-600"
                  >
                    Điền toàn bộ
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={paymentData.cash}
                    onChange={(e) => handlePaymentChange('cash', Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    Chuyển khoản
                  </label>
                  <button
                    onClick={() => handleQuickFill('bankTransfer')}
                    className="text-xs text-blue-600"
                  >
                    Điền toàn bộ
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={paymentData.bankTransfer}
                    onChange={(e) => handlePaymentChange('bankTransfer', Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Công nợ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrency(paymentData.credit, order.documentCurrency)}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Documents Modal */}
      {showRelatedDocs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-hidden md:flex md:items-center md:justify-center">
          <div className="absolute inset-0 flex flex-col md:static md:max-w-2xl md:w-full md:mx-4 md:rounded-lg">
            <div className="bg-white mt-[56px] md:mt-0 flex-1 overflow-hidden flex flex-col md:rounded-lg">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium">Danh sách chứng từ liên quan</h3>
                <button onClick={() => setShowRelatedDocs(false)}>
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingDocs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : relatedDocs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Không có chứng từ liên quan
                  </div>
                ) : (
                  <div className="space-y-4">
                    {relatedDocs.map((doc) => (
                      <div key={doc.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.presentation}</p>
                            <p className="text-xs text-gray-500">{formatDate(doc.date)}</p>
                          </div>
                          <span className="text-sm font-medium text-blue-600">
                            {formatCurrency(doc.documentAmount, doc.documentCurrency)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Đối tác: {doc.counterparty}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-3">
                  <button
                    onClick={handleSellMore}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <ArrowUpToLine className="h-4 w-4" />
                    <span>Bán thêm</span>
                  </button>
                  <button
                    onClick={handleReturnItems}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    <span>Trả hàng</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Xác nhận thanh toán
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn cập nhật thông tin thanh toán không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
              >
                {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}