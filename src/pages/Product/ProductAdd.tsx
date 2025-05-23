import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  Upload,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createProduct } from '../../services/product';
import { getSession } from '../../utils/storage';

interface FormData {
  images: File[];
  code: string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  riCoefficient: number;
  measurementUnit: string;
  description: string;
}

const MAX_IMAGES = 20;
const MAX_DESCRIPTION_LENGTH = 500;
const session = getSession();
const defaultValues = session?.defaultValues || {};

export default function ProductAdd() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    images: [],
    code: '',
    name: '',
    purchasePrice: 0,
    sellingPrice: 0,
    riCoefficient: 1, // Đổi giá trị mặc định từ 1.1 thành 1
    measurementUnit: defaultValues.productsUOM.id,
    description: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + formData.images.length > MAX_IMAGES) {
      toast.error(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh`);
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} không phải là file ảnh hợp lệ`);
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));

    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã sản phẩm');
      return false;
    }

    if (formData.name.trim().length < 3) {
      toast.error('Tên sản phẩm phải có ít nhất 3 ký tự');
      return false;
    }

    if (formData.sellingPrice <= 0) {
      toast.error('Giá bán phải lớn hơn 0');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsLoading(true);
      await createProduct(formData);
      toast.success('Thêm sản phẩm thành công');
      navigate('/products');
    } catch (error) {
      toast.error('Không thể thêm sản phẩm');
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleSellingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value < 0) return; // Không cho phép số âm
    setFormData(prev => ({ ...prev, sellingPrice: value }));
  };

  const handleSellingPriceFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (formData.sellingPrice === 0) {
      e.target.value = ''; // Xóa số 0 khi focus
    }
  };

  const handleSellingPriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setFormData(prev => ({ ...prev, sellingPrice: 0 })); // Nếu để trống, đặt lại về 0
    }
  };

  const handleRiCoefficientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value < 0) return; // Không cho phép số âm
    setFormData(prev => ({ ...prev, riCoefficient: Math.round(value) })); // Làm tròn về số nguyên
  };

  const handleRiCoefficientFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (formData.riCoefficient === 1) {
      e.target.value = ''; // Xóa số 1 khi focus
    }
  };

  const handleRiCoefficientBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setFormData(prev => ({ ...prev, riCoefficient: 1 })); // Nếu để trống, đặt lại về 1
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Thêm mới sản phẩm</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-3 px-4">
        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hình ảnh (Tải tối đa 20 ảnh)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {formData.images.length < MAX_IMAGES && (
              <div className="aspect-square">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                >
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="mt-1 text-xs text-gray-500">Tải ảnh</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
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
              Mã *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nhập tên sản phẩm"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá bán *
            </label>
            <input
              type="number"
              value={formData.sellingPrice}
              onChange={handleSellingPriceChange}
              onFocus={handleSellingPriceFocus}
              onBlur={handleSellingPriceBlur}
              min="0"
              step="1"
              placeholder="Nhập giá bán"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hệ số ri
            </label>
            <input
              type="number"
              value={formData.riCoefficient}
              onChange={handleRiCoefficientChange}
              onFocus={handleRiCoefficientFocus}
              onBlur={handleRiCoefficientBlur}
              min="0"
              step="1" // Đổi step từ 0.1 thành 1 để chỉ cho phép số nguyên
              placeholder="Nhập hệ số ri"
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
                  setFormData(prev => ({ ...prev, description: e.target.value }));
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
          onClick={() => navigate('/products')}
          className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Save className="h-6 w-6" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Xác nhận thêm sản phẩm
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn thêm sản phẩm này không?
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
                disabled={isLoading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}