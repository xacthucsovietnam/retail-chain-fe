// src/components/ProductAddPopup.tsx
import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createProduct, type CreateProductData } from '../services/product';

interface ProductAddPopupProps {
  onClose: () => void;
  onProductAdded: (product: { id: string; presentation: string }) => void;
}

export default function ProductAddPopup({ onClose, onProductAdded }: ProductAddPopupProps) {
  const [formData, setFormData] = useState<CreateProductData>({
    images: [],
    code: '',
    name: '',
    category: '', // Để trống vì không sử dụng trên giao diện
    purchasePrice: 0, // Không sử dụng trên giao diện, để mặc định
    sellingPrice: 0,
    measurementUnit: "5736c39c-5b28-11ef-a699-00155d058802", // Giá trị mặc định cố định
    riCoefficient: 1,
    description: '', // Không sử dụng trên giao diện, để trống
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sellingPrice' || name === 'riCoefficient' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã hàng');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên hàng');
      return;
    }
    if (isNaN(formData.riCoefficient) || formData.riCoefficient <= 0) {
      toast.error('Hệ số Ri phải là số dương');
      return;
    }
    if (isNaN(formData.sellingPrice) || formData.sellingPrice < 0) {
      toast.error('Giá bán phải là số không âm');
      return;
    }

    setIsLoading(true);
    try {
      const newProduct = await createProduct(formData);
      toast.success('Thêm sản phẩm thành công');
      onProductAdded(newProduct);
      onClose();
    } catch (error) {
      toast.error('Không thể thêm sản phẩm');
      console.error('Error creating product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Thêm sản phẩm mới</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mã hàng */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã hàng *</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Tên hàng */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên hàng *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Hệ số Ri */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Hệ số Ri *</label>
            <input
              type="number"
              name="riCoefficient"
              value={formData.riCoefficient}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Giá bán */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Giá bán (VND) *</label>
            <input
              type="number"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleInputChange}
              min="0"
              step="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Thêm sản phẩm'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}