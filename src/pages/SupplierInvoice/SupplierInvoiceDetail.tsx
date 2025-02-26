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
        setError('Invoice ID is missing');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getSupplierInvoiceDetail(id);
        setInvoice(data);
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

  const handleEdit = () => {
    if (id) {
      navigate(`/supplier-invoices/edit/${id}`);
    }
  };

  const handleDelete = () => {
    toast.error('Delete functionality not implemented yet');
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
            {error || 'Invoice Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            The supplier invoice you're looking for could not be found or an error occurred.
          </p>
          <button
            onClick={() => navigate('/supplier-invoices')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Supplier Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/supplier-invoices')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Supplier Invoices
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

      {/* Invoice Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">#{invoice.number}</h2>
            <p className="text-sm text-gray-500">{formatDate(invoice.date)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            invoice.posted
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {invoice.posted ? t('supplierInvoices.status.posted') : t('supplierInvoices.status.draft')}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <User className="w-4 h-4 mr-2" />
                <span className="text-sm">{t('supplierInvoices.author')}</span>
              </div>
              <p className="text-lg text-gray-900">{invoice.author}</p>
            </div>

            {invoice.contract && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('supplierInvoices.contract')}</span>
                </div>
                <p className="text-lg text-gray-900">{invoice.contract}</p>
              </div>
            )}

            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <Building className="w-4 h-4 mr-2" />
                <span className="text-sm">{t('supplierInvoices.counterparty')}</span>
              </div>
              <p className="text-lg text-gray-900">{invoice.counterparty}</p>
            </div>

            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <Tag className="w-4 h-4 mr-2" />
                <span className="text-sm">Operation Type</span>
              </div>
              <p className="text-lg text-gray-900">{invoice.operationType}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center text-gray-600 mb-1">
                <DollarSign className="w-4 h-4 mr-2" />
                <span className="text-sm">Total Amount</span>
              </div>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(invoice.amount, invoice.currency)}
              </p>
            </div>

            {invoice.employeeResponsible && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('supplierInvoices.responsible')}</span>
                </div>
                <p className="text-lg text-gray-900">{invoice.employeeResponsible}</p>
              </div>
            )}

            {invoice.vatTaxation && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <FileCheck className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('supplierInvoices.vat')}</span>
                </div>
                <p className="text-lg text-gray-900">{invoice.vatTaxation}</p>
              </div>
            )}

            {invoice.orderBasis && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Receipt className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('supplierInvoices.order')}</span>
                </div>
                <p className="text-lg text-gray-900">{invoice.orderBasis}</p>
              </div>
            )}

            {invoice.comment && (
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm">Notes</span>
                </div>
                <p className="text-lg text-gray-900 whitespace-pre-line">{invoice.comment}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Products</h2>
        
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
              {invoice.products.map((product) => (
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
                          loading="lazy"
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
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {product.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {formatCurrency(product.price, invoice.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {product.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                    {formatCurrency(product.total, invoice.currency)}
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
                  {formatCurrency(invoice.amount, invoice.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}