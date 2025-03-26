import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Loader2,
  AlertCircle,
  Plus,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getProductDetail, updateProduct, getCategories, getMeasurementUnits } from '../../services/product';
import type { ProductDetail, Category, MeasurementUnit, UpdateProductData } from '../../services/product';
import { DEFAULT_IMAGE_URL } from '../../services/file';

const MAX_IMAGES = 5;
const MAX_DESCRIPTION_LENGTH = 500;

interface FormData extends UpdateProductData {
  newImages: File[];
  deletedImageIds: string[];
}

export default function ProductUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    id: '',
    name: '',
    code: '',
    description: '',
    category: '',
    measurementUnit: '',
    riCoefficient: 1,
    price: 0,
    comment: '',
    picture: '',
    newImages: [],
    deletedImageIds: []
  });

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('Product ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Load all required data in parallel
        const [productData, categoryData, unitData] = await Promise.all([
          getProductDetail(id),
          getCategories(),
          getMeasurementUnits()
        ]);

        setProduct(productData);
        setCategories(categoryData);
        setMeasurementUnits(unitData);

        setFormData({
          id: productData.id,
          name: productData.name,
          code: productData.code,
          description: productData.description,
          category: productData.category,
          measurementUnit: productData.baseUnit,
          riCoefficient: productData.riCoefficient,
          price: productData.price,
          comment: productData.comment,
          picture: productData.imageUrl || '',
          newImages: [],
          deletedImageIds: []
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load product details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate total number of images
    const currentImageCount = (product?.images?.length || 0) - formData.deletedImageIds.length + formData.newImages.length;
    if (currentImageCount + files.length > MAX_IMAGES) {
      toast.error(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh`);
      return;
    }

    // Validate each file
    const validFiles = files.filter(file => {
      // Check file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        toast.error(`${file.name} không phải là file ảnh hợp lệ`);
        return false;
      }

      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} vượt quá kích thước cho phép (5MB)`);
        return false;
      }

      return true;
    });

    if (validFiles.length) {
      setFormData(prev => ({
        ...prev,
        newImages: [...prev.newImages, ...validFiles]
      }));
      setIsDirty(true);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      deletedImageIds: [...prev.deletedImageIds, imageId]
    }));
    setIsDirty(true);
  };

  const handleRemoveNewImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã sản phẩm');
      return false;
    }

    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return false;
    }

    if (!formData.category) {
      toast.error('Vui lòng chọn loại sản phẩm');
      return false;
    }

    if (formData.price <= 0) {
      toast.error('Giá bán phải lớn hơn 0');
      return false;
    }

    if (!formData.measurementUnit) {
      toast.error('Vui lòng chọn đơn vị tính');
      return false;
    }

    if (formData.riCoefficient <= 0) {
      toast.error('Hệ số ri phải lớn hơn 0');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSaving(true);
      await updateProduct(formData);
      toast.success('Cập nhật sản phẩm thành công');
      navigate(`/products/${formData.id}`);
    } catch (error) {
      toast.error('Không thể cập nhật sản phẩm');
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?')) {
        navigate(`/products/${id}`);
      }
    } else {
      navigate(`/products/${id}`);
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

  const remainingImageCount = MAX_IMAGES - 
    ((product.images?.length || 0) - formData.deletedImageIds.length + formData.newImages.length);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Cập nhật sản phẩm</h1>
          <p className="text-sm text-gray-500">{product.code}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        {/* Image Gallery */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hình ảnh ({MAX_IMAGES - remainingImageCount}/{MAX_IMAGES})
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Existing Images */}
            {product.images
              .filter(img => !formData.deletedImageIds.includes(img.id))
              .map((image) => (
                <div key={image.id} className="relative aspect-square">
                  <img
                    src={image.url}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button
                      onClick={() => window.open(image.url, '_blank')}
                      className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                      title="Tải xuống"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                      title="Xóa"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

            {/* New Images */}
            {formData.newImages.map((file, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`New image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => handleRemoveNewImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Upload Button */}
            {remainingImageCount > 0 && (
              <div className="aspect-square">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                >
                  <Plus className="w-6 h-6 text-gray-400" />
                  <span className="mt-1 text-xs text-gray-500">
                    Thêm ảnh ({remainingImageCount} còn lại)
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã sản phẩm *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="Nhập mã sản phẩm"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên sản phẩm *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nhập tên sản phẩm"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại sản phẩm *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Chọn loại sản phẩm</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá bán *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', Number(e.target.value))}
              min="0"
              step="1000"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đơn vị tính *
            </label>
            <select
              value={formData.measurementUnit}
              onChange={(e) => handleInputChange('measurementUnit', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Chọn đơn vị</option>
              {measurementUnits.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hệ số ri
            </label>
            <input
              type="number"
              value={formData.riCoefficient}
              onChange={(e) => handleInputChange('riCoefficient', Number(e.target.value))}
              min="1"
              step="1"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                  handleInputChange('description', e.target.value);
                }
              }}
              placeholder="Nhập mô tả sản phẩm"
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500 text-right">
              {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
            </p>
          </div>
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
          onClick={handleSubmit}
          disabled={!isDirty || isSaving}
          className={`p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDirty ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          <Save className="h-6 w-6" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Xác nhận cập nhật sản phẩm
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn cập nhật sản phẩm này không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
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