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
  DollarSign,
  User,
  Building,
  Receipt,
  Save,
  Printer,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupplierInvoiceDetail, updateSupplierInvoice } from '../../services/supplierInvoice';
import { getProductPrices, createProductPrice } from '../../utils/productPrice';
import type { SupplierInvoiceDetail as ISupplierInvoiceDetail, SupplierProduct } from '../../services/supplierInvoice';
import { getSession } from '../../utils/storage';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { printPlugin } from '@react-pdf-viewer/print';
import { getFilePlugin } from '@react-pdf-viewer/get-file';
import { deleteSingleObject } from '../../services/deleteObjects';

export default function SupplierInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<ISupplierInvoiceDetail | null>(null);
  const [productPrices, setProductPrices] = useState<Map<string, { price?: number | null; oldPrice?: number }>>(new Map());
  const [originalProductPrices, setOriginalProductPrices] = useState<Map<string, { price?: number | null; oldPrice?: number }>>(new Map());
  const [isPriceChanged, setIsPriceChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(1.1);
  const [fillExistingPrices, setFillExistingPrices] = useState(true);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const isReturnFromCustomer = invoice?.operationKind?.id === 'ReturnFromCustomer';

  // Initialize PDF viewer plugins
  const zoomPluginInstance = zoomPlugin();
  const printPluginInstance = printPlugin();
  const getFilePluginInstance = getFilePlugin();

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [], // Hide sidebar
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const { ZoomOut, ZoomIn, Download, Print } = slots;
          return (
            <div className="flex items-center gap-2 p-2">
              <ZoomOut />
              <ZoomIn />
              <Download />
              <Print />
            </div>
          );
        }}
      </Toolbar>
    ),
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('ID đơn nhận hàng không tồn tại');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const invoiceData = await getSupplierInvoiceDetail(id);
        setInvoice(invoiceData);

        const productIds = invoiceData.inventory.map((product) => product.product.id);
        const pricesMap = await getProductPrices(productIds);
        setProductPrices(pricesMap);
        setOriginalProductPrices(new Map(pricesMap));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin đơn nhận hàng';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const areMapsEqual = (map1: Map<string, { price?: number | null; oldPrice?: number }>, map2: Map<string, { price?: number | null; oldPrice?: number }>) => {
    if (map1.size !== map2.size) return false;
    for (const [key, value] of map1) {
      const map2Value = map2.get(key);
      if (map2Value === undefined || value.price !== map2Value.price || value.oldPrice !== map2Value.oldPrice) {
        return false;
      }
    }
    return true;
  };

  const calculateSellingPrice = (price: number, exchangeRate: number, profitMargin: number): number => {
    return Math.ceil(price * exchangeRate * profitMargin);
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/supplier-invoices/edit/${id}`);
    }
  };

  const handleDelete = async () => {
    if (!id || !invoice) return;

    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa đơn nhận hàng này không?');
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      const objectToDelete = {
        id: id,
        dataType: 'XTSSupplierInvoice',
        presentation: `#${invoice.number}`,
      };
      await deleteSingleObject(objectToDelete);
      toast.success('Xóa đơn nhận hàng thành công');
      navigate('/supplier-invoices');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa đơn nhận hàng';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetPrices = () => {
    setIsPriceModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsPriceModalOpen(false);
  };

  const handleConfirmPrices = () => {
    if (!invoice) return;

    const newExchangeRate = isNaN(exchangeRate) ? 0 : exchangeRate;
    const newProfitMargin = isNaN(profitMargin) ? 1.1 : profitMargin;

    if (newExchangeRate < 0) {
      toast.error('Tỷ giá không được nhỏ hơn 0');
      return;
    }
    if (newProfitMargin < 1.01) {
      toast.error('Hệ số lợi nhuận phải lớn hơn 1');
      return;
    }

    const shouldFillExistingPrices = fillExistingPrices;
    const newProductPrices = new Map(productPrices);

    invoice.inventory.forEach((product) => {
      const currentPriceData = newProductPrices.get(product.product.id);
      if (shouldFillExistingPrices || !currentPriceData?.price) {
        const sellingPrice = calculateSellingPrice(product.price, newExchangeRate, newProfitMargin);
        newProductPrices.set(product.product.id, {
          price: sellingPrice,
          oldPrice: currentPriceData?.oldPrice,
        });
      }
    });

    const hasChanged = !areMapsEqual(newProductPrices, originalProductPrices);
    setIsPriceChanged(hasChanged);

    setProductPrices(newProductPrices);
    setIsPriceModalOpen(false);
  };

  const defaultValues = getSession()?.defaultValues || {};

  const handleSavePrices = async () => {
    if (!invoice || !id) return;

    try {
      const kindOfPriceId = defaultValues.priceKind?.id;
      const documentBasisId = id;
      const currencyId = invoice.documentCurrency.id;

      const productsToRegister = invoice.inventory
        .map((product) => {
          const priceData = productPrices.get(product.product.id);
          if (priceData?.price !== undefined && priceData?.price !== null) {
            return {
              productId: product.product.id,
              characteristicId: product.characteristic?.id || '',
              measurementUnitId: product.uom?.id || '',
              kindOfPriceId: kindOfPriceId,
              price: priceData.price,
              oldPrice: priceData.oldPrice || 0,
              currencyId: currencyId,
              currencyOldId: '',
            };
          }
          return null;
        })
        .filter((product): product is NonNullable<typeof product> => product !== null);

      if (productsToRegister.length === 0) {
        toast.error('Không có sản phẩm nào để đăng ký giá');
        return;
      }

      const uniqueProductsMap = new Map<string, typeof productsToRegister[0]>();
      productsToRegister.forEach((product) => {
        uniqueProductsMap.set(product.productId, product);
      });

      const uniqueProducts = Array.from(uniqueProductsMap.values());

      if (uniqueProducts.length === 0) {
        toast.error('Không có sản phẩm hợp lệ để đăng ký giá sau khi loại bỏ trùng lặp');
        return;
      }

      await createProductPrice({
        documentBasisId: documentBasisId,
        products: uniqueProducts,
        comment: 'Cập nhật giá bán từ SupplierInvoiceDetail',
      });

      if (!invoice.posted) {
        const updateData = {
          id: invoice.id,
          number: invoice.number,
          title: `#${invoice.number}`,
          date: invoice.date,
          posted: true,
          operationKindId: invoice.operationKind.id,
          operationKindPresentation: invoice.operationKind.presentation,
          companyId: invoice.company.id,
          companyName: invoice.company.presentation,
          counterpartyId: invoice.counterparty.id,
          counterpartyName: invoice.counterparty.presentation,
          contractId: invoice.contract.id || '',
          contractName: invoice.contract.presentation || '',
          currencyId: invoice.documentCurrency.id,
          currencyName: invoice.documentCurrency.presentation,
          amount: invoice.documentAmount,
          vatTaxationId: invoice.vatTaxation.id,
          vatTaxationName: invoice.vatTaxation.presentation,
          rate: invoice.rate || 1,
          multiplicity: invoice.multiplicity,
          comment: invoice.comment || '',
          employeeId: invoice.employeeResponsible.id,
          employeeName: invoice.employeeResponsible.presentation,
          structuralUnitId: invoice.structuralUnit.id || '',
          structuralUnitName: invoice.structuralUnit.presentation || '',
          products: invoice.inventory.map((product) => ({
            lineNumber: product.lineNumber,
            product: product.product,
            characteristic: product.characteristic,
            uom: product.uom,
            quantity: product.quantity,
            price: product.price,
            amount: product.amount,
            discountsMarkupsAmount: product.discountsMarkupsAmount,
            vatAmount: product.vatAmount,
            vatRate: product.vatRate,
            total: product.total,
            sku: product.sku,
            coefficient: product.coefficient,
            priceOriginal: product.priceOriginal,
            vatRateRate: product.vatRateRate,
            picture: product.picture,
            comment: product.comment,
          })),
        };

        await updateSupplierInvoice(updateData);
        toast.success('Đã ghi sổ đơn nhận hàng và lưu giá bán thành công');
      } else {
        toast.success('Lưu giá bán thành công');
      }

      const updatedInvoice = await getSupplierInvoiceDetail(id);
      setInvoice(updatedInvoice);

      const productIds = updatedInvoice.inventory.map((product) => product.product.id);
      const updatedPricesMap = await getProductPrices(productIds);
      setProductPrices(updatedPricesMap);
      setOriginalProductPrices(new Map(updatedPricesMap));

      setExchangeRate(0);
      setProfitMargin(1.1);
      setIsPriceChanged(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lưu giá bán thất bại';
      toast.error(errorMessage);
    }
  };

  const handlePriceChange = (productId: string, value: string) => {
    const newProductPrices = new Map(productPrices);
    const currentPriceData = newProductPrices.get(productId) || { oldPrice: 0 };
    
    // If the input is empty, set price to null
    const newPrice = value === '' ? null : Number(value);
    
    // Only update if the value is empty or a non-negative number
    if (value === '' || (!isNaN(newPrice) && newPrice >= 0)) {
      newProductPrices.set(productId, {
        price: newPrice,
        oldPrice: currentPriceData.oldPrice,
      });
      setProductPrices(newProductPrices);

      const hasChanged = !areMapsEqual(newProductPrices, originalProductPrices);
      setIsPriceChanged(hasChanged);
    }
  };

  const handlePrint = () => {
    if (!id || !invoice) return;

    const baseUrl = import.meta.env.VITE_FILE_BASE_URL;
    const operationKindId = invoice.operationKind?.id || 'ReceiptFromSupplier';
    let pdfUrl = '';

    if (operationKindId === 'ReceiptFromSupplier') {
      pdfUrl = `${baseUrl}/${id}.pdf?print-form-id=${id}&data-type=XTSSupplierInvoice&template-name=ExternalPrintForm.PF_SupplierInvoice`;
    } else if (operationKindId === 'ReturnFromCustomer') {
      pdfUrl = `${baseUrl}/${id}.pdf?print-form-id=${id}&data-type=XTSSalesInvoice&template-name=ExternalPrintForm.PF_SalesInvoice`;
    } else {
      toast.error('Không xác định được loại hoạt động để in');
      return;
    }

    setShowPdfViewer(true);
    setInvoice((prev) => (prev ? { ...prev, pdfUrl } : null));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: ObjectId | string) => {
    let currencyString: string;
    if (typeof currency === 'string') {
      currencyString = currency;
    } else {
      currencyString = currency?.presentation || 'VND';
    }

    const normalizedCurrency = currencyString
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    const currencyMap: { [key: string]: string } = {
      DONG: 'VND',
      VND: 'VND',
      USD: 'USD',
      DOLLAR: 'USD',
      EURO: 'EUR',
      EUR: 'EUR',
      JPY: 'JPY',
      YEN: 'JPY',
      CNY: 'CNY',
    };

    const currencyCode = currencyMap[normalizedCurrency] || 'VND';

    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch (error) {
      return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currencyString;
    }
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error || 'Không tìm thấy đơn nhận hàng'}</h2>
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

  const pdfUrl =
    invoice.pdfUrl ||
    `${import.meta.env.VITE_FILE_BASE_URL}/${id}.pdf?print-form-id=${id}&data-type=XTSSupplierInvoice&template-name=ExternalPrintForm.PF_SupplierInvoice`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Chi tiết đơn nhận hàng</h1>
          <p className="text-sm text-gray-500">#{invoice.number}</p>
        </div>
      </div>

      <div className="pt-4 px-4">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500">Ngày tạo</p>
              <p className="text-base text-gray-900">{formatDate(invoice.date)}</p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                invoice.posted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {invoice.posted ? 'Đã ghi sổ' : 'Chưa ghi sổ'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Người lập</p>
                <p className="text-base text-gray-900">{invoice.author?.presentation || 'Không xác định'}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Building className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Nhà cung cấp</p>
                <p className="text-base text-gray-900">{invoice.counterparty.presentation}</p>
              </div>
            </div>

            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Tổng tiền</p>
                <p className="text-base font-medium text-blue-600">{formatCurrency(invoice.documentAmount, invoice.documentCurrency)}</p>
              </div>
            </div>

            {invoice.documentBasis?.presentation && (
              <div className="flex items-center">
                <Receipt className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Đơn đặt hàng</p>
                  <p className="text-base text-gray-900">{invoice.documentBasis.presentation}</p>
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

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Danh sách sản phẩm</h2>

          <div className="space-y-4">
            {invoice.inventory.map((product) => {
              const priceData = productPrices.get(product.product.id);
              const sellingPrice = priceData?.price;

              return (
                <div key={product.lineNumber} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.picture?.id ? (
                        <img
                          src={`${import.meta.env.VITE_FILE_BASE_URL}/${product.picture.id}`}
                          alt={product.product.presentation}
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
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{product.product.presentation}</h3>

                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>SKU:</span>
                          <span>{product.sku}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Số lượng:</span>
                          <span>{product.quantity} {product.uom?.presentation || ''}</span>
                        </div>
                        {!isReturnFromCustomer && (
                          <div className="flex justify-between">
                            <span>Đơn giá nhập/chiếc:</span>
                            <span>{formatCurrency(product.price, invoice.documentCurrency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Đơn giá bán/chiếc:</span>
                          {isPriceChanged ? (
                            <input
                              type="number"
                              value={sellingPrice !== undefined && sellingPrice !== null ? sellingPrice : ''}
                              onChange={(e) => handlePriceChange(product.product.id, e.target.value)}
                              className="w-32 text-right border rounded-md px-2 py-1 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Nhập giá bán"
                            />
                          ) : (
                            <span className={sellingPrice === undefined || sellingPrice === null ? 'text-red-500' : ''}>
                              {sellingPrice !== undefined && sellingPrice !== null
                                ? formatCurrency(sellingPrice, 'VND')
                                : 'Chưa có giá bán'}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between font-medium text-blue-600">
                          <span>Thành tiền:</span>
                          <span>{formatCurrency(product.total, invoice.documentCurrency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Tổng cộng</span>
              <span className="text-lg font-semibold text-blue-600">{formatCurrency(invoice.documentAmount, invoice.documentCurrency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 left-0 right-0 px-4 z-50">
        <div className="flex justify-between items-center max-w-screen-xl mx-auto">
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/supplier-invoices')}
              className="p-2 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              title="Xóa"
            >
              {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Chỉnh sửa"
            >
              <Pencil className="h-5 w-5" />
            </button>
            {!isReturnFromCustomer && (
              <button
                onClick={handleSetPrices}
                className="p-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                title="Đặt giá bán"
              >
                <DollarSign className="h-5 w-5" />
              </button>
            )}
            {invoice.posted && (
              <button
                onClick={handlePrint}
                className="p-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                title="In"
              >
                <Printer className="h-5 w-5" />
              </button>
            )}
            {isPriceChanged && (
              <button
                onClick={handleSavePrices}
                className="p-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                title="Lưu giá bán"
              >
                <Save className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {isPriceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Đặt giá bán</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tỷ giá</label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setExchangeRate(NaN);
                    } else {
                      setExchangeRate(Number(value));
                    }
                  }}
                  onFocus={(e) => {
                    if (exchangeRate === 0 || isNaN(exchangeRate)) {
                      setExchangeRate(NaN);
                      e.target.value = '';
                    }
                  }}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hệ số lợi nhuận</label>
                <input
                  type="number"
                  value={profitMargin}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setProfitMargin(NaN);
                    } else {
                      setProfitMargin(Number(value));
                    }
                  }}
                  onFocus={(e) => {
                    if (profitMargin === 1.1 || isNaN(profitMargin)) {
                      setProfitMargin(NaN);
                      e.target.value = '';
                    }
                  }}
                  min="1.01"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={fillExistingPrices}
                  onChange={(e) => setFillExistingPrices(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Điền lại những mặt hàng có giá</label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmPrices}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {showPdfViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center sm:items-center">
          <div className="bg-white rounded-lg w-full max-w-4xl sm:h-[90vh] h-[calc(100vh-56px)] mt-[56px] sm:mt-0 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Xem trước đơn nhận hàng #{invoice.number}</h3>
              <button onClick={() => setShowPdfViewer(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                  fileUrl={pdfUrl}
                  plugins={[defaultLayoutPluginInstance, zoomPluginInstance, printPluginInstance, getFilePluginInstance]}
                />
              </Worker>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}