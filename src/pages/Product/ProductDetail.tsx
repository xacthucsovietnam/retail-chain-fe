import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  Package,
  Tag,
  DollarSign,
  Ruler
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getProductDetail } from '../../services/product';
import type { ProductDetail } from '../../services/product';
import { formatCurrency } from '../../utils/currency';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!id) {
        setError('Product ID is missing');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProductDetail(id);
        setProduct(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('product.detail.loadError');
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetail();
  }, [id, t]);

  const handleEdit = () => {
    if (id) {
      navigate(`/products/edit/${id}`);
    }
  };

  const handleDelete = () => {
    toast.error('Delete functionality not implemented yet');
  };

  const handleDownloadImage = async () => {
    if (!product?.imageUrl) {
      toast.error(t('product.detail.noImage'));
      return;
    }

    try {
      const response = await fetch(product.imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.code}-image.${blob.type.split('/')[1]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download image';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || t('product.detail.notFound')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('product.detail.loadError')}
          </p>
          <button
            onClick={() => navigate('/products')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('product.detail.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/products')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('product.detail.back')}
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Pencil className="w-4 h-4 mr-2" />
            {t('product.detail.edit')}
          </button>

          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('product.detail.delete')}
          </button>

          {product.imageUrl && (
            <button
              onClick={handleDownloadImage}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('product.detail.downloadImage')}
            </button>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Product image */}
        <div className="aspect-w-16 aspect-h-9 bg-gray-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="object-contain w-full h-64"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
                e.currentTarget.alt = 'Fallback product image';
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product information */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Tag className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('product.detail.code')}</span>
                </div>
                <p className="text-lg font-medium text-gray-900">{product.code}</p>
              </div>
              
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Package className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('product.detail.name')}</span>
                </div>
                <p className="text-lg text-gray-900">{product.name}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Tag className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('product.detail.category')}</span>
                </div>
                <p className="text-lg text-gray-900">{product.category}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('product.detail.price')}</span>
                </div>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(product.price, 'VND')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Ruler className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('product.detail.baseUnit')}</span>
                </div>
                <p className="text-lg text-gray-900">{product.baseUnit}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Ruler className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('product.detail.riCoefficient')}</span>
                </div>
                <p className="text-lg text-gray-900">{product.riCoefficient}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm">{t('product.detail.description')}</span>
                </div>
                <p className="text-lg text-gray-900">
                  {product.description || t('product.detail.noDescription')}
                </p>
              </div>

              {product.comment && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm">{t('product.detail.notes')}</span>
                  </div>
                  <p className="text-lg text-gray-900">{product.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}