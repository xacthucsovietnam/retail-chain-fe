import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Package
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

  const handleBack = () => {
    navigate('/products');
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
            onClick={handleBack}
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Product Information */}
      <div className="bg-white">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
                e.currentTarget.alt = 'Fallback product image';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Mã</p>
            <p className="text-base text-gray-900">{product.code}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Sản phẩm</p>
            <p className="text-base text-gray-900">{product.name}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Loại sản phẩm</p>
            <p className="text-base text-gray-900">{product.category}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Đơn vị</p>
            <p className="text-base text-gray-900">{product.baseUnit}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Hệ số Ri</p>
            <p className="text-base text-gray-900">{product.riCoefficient}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Giá bán</p>
            <p className="text-base font-semibold text-blue-600">
              {formatCurrency(product.price, 'VND')}
            </p>
          </div>

          {product.description && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Mô tả</p>
              <p className="text-base text-gray-900">{product.description}</p>
            </div>
          )}

          {product.comment && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Ghi chú</p>
              <p className="text-base text-gray-900">{product.comment}</p>
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