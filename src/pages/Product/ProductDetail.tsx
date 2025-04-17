import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getProductDetail } from '../../services/product';
import type { ProductDetail, ProductImage } from '../../services/product';
import { formatCurrency } from '../../utils/currency';
import { useLanguage } from '../../contexts/LanguageContext';
import { DEFAULT_IMAGE_URL } from '../../services/file';
import { deleteSingleObject } from '../../services/deleteObjects';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!id) {
        setError('ID sản phẩm không tồn tại');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProductDetail(id);
        setProduct(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin sản phẩm';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  // Auto-scroll images every 3 seconds if there are multiple images
  useEffect(() => {
    if (!product?.images.length || product.images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex(current => (current + 1) % product.images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [product?.images.length]);

  const handlePrevImage = () => {
    if (!product?.images.length) return;
    setCurrentImageIndex(current => 
      current === 0 ? product.images.length - 1 : current - 1
    );
  };

  const handleNextImage = () => {
    if (!product?.images.length) return;
    setCurrentImageIndex(current => 
      (current + 1) % product.images.length
    );
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      // Fetch ảnh từ URL với CORS headers
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
      });
      if (!response.ok) throw new Error('Không thể tải ảnh');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Kiểm tra user agent để xử lý trên các thiết bị khác nhau
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isAndroid = /Android/.test(navigator.userAgent);
      const isMobile = isIOS || isAndroid;

      if (isMobile) {
        // Trên mobile (iOS và Android), mở blob URL trong tab mới để trình duyệt xử lý tải
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Trên desktop, sử dụng thẻ <a> để tải trực tiếp
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Giải phóng blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error('Không thể tải ảnh');
      console.error('Download error:', error);
    }
  };

  const handleDownloadCurrent = async () => {
    if (!product?.images[currentImageIndex]) return;
    const currentImage = product.images[currentImageIndex];
    const filename = `product-${product.code}-${currentImageIndex + 1}.jpg`;
    await downloadImage(currentImage.url, filename);
  };

  const handleDownloadAll = async () => {
    if (!product?.images.length) return;
    
    for (let i = 0; i < product.images.length; i++) {
      const filename = `product-${product.code}-${i + 1}.jpg`;
      await downloadImage(product.images[i].url, filename);
      // Thêm delay nhỏ để tránh quá tải trên mobile
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleDelete = async () => {
    if (!id || !product) return;

    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?');
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      const objectToDelete = {
        id: id,
        dataType: 'XTSProduct',
        presentation: product.name
      };
      await deleteSingleObject(objectToDelete);
      toast.success('Xóa sản phẩm thành công');
      navigate('/products');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa sản phẩm';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
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
            {error || 'Không tìm thấy sản phẩm'}
          </h2>
          <button
            onClick={() => navigate('/products')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const currentImage = product.images[currentImageIndex]?.url || DEFAULT_IMAGE_URL;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Main Content */}
      <div className="pt-4">
        {/* Image Slider */}
        <div className="relative bg-gray-100">
          <div className="aspect-square relative overflow-hidden">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_IMAGE_URL;
                e.currentTarget.alt = 'Hình ảnh mặc định';
                e.currentTarget.onerror = null;
              }}
            />
            
            {product.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-60"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-60"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Image Controls */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={handleDownloadCurrent}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
              title="Tải ảnh hiện tại"
            >
              <Download className="w-5 h-5 text-gray-700" />
            </button>
            {product.images.length > 1 && (
              <button
                onClick={handleDownloadAll}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                title="Tải tất cả ảnh"
              >
                <FileDown className="w-5 h-5 text-gray-700" />
              </button>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="px-4 py-6 space-y-4">
          <div className="space-y-1">
            <p className="text-lg font-bold text-blue-600">{product.code}</p>
            <p className="text-sm text-gray-500">Tên sản phẩm</p>
            <p className="text-base text-gray-900">{product.name}</p>
          </div>

          <div className="flex justify-between space-x-4">
            <div className="space-y-1 flex-1">
              <p className="text-sm text-gray-500">Đơn vị tính</p>
              <p className="text-base text-gray-900">{product.baseUnit}</p>
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-sm text-gray-500">Giá bán</p>
              <p className="text-base font-semibold text-blue-600">
                {formatCurrency(product.price, 'VND')}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Hệ số Ri</p>
            <p className="text-base text-gray-900">{product.riCoefficient}</p>
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

      {/* Floating Action Buttons - Hàng ngang */}
      <div className="fixed bottom-4 left-0 right-0 px-4 z-50">
        <div className="flex justify-between items-center max-w-screen-xl mx-auto">
          {/* Nút Back và Delete bên trái */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/products')}
              className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Trash2 className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Nút Edit bên phải */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/products/edit/${id}`)}
              className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Pencil className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}