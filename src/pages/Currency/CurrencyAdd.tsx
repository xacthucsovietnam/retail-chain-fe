import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Tag,
  DollarSign,
  FileText,
  Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createCurrency } from '../../services/currency';

interface FormData {
  name: string;
  fullName: string;
  symbolicPresentation: string;
  mainCurrencyId: string;
  mainCurrencyName: string;
  markup: number;
}

const initialFormData: FormData = {
  name: '',
  fullName: '',
  symbolicPresentation: '',
  mainCurrencyId: 'cd8e4a47-6236-11ef-a699-00155d058802',
  mainCurrencyName: 'CNY',
  markup: 1
};

export default function CurrencyAdd() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên tiền tệ');
      return false;
    }

    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập tên đầy đủ');
      return false;
    }

    if (!formData.symbolicPresentation.trim()) {
      toast.error('Vui lòng nhập ký hiệu');
      return false;
    }

    if (formData.markup < 0) {
      toast.error('Tỷ lệ không được âm');
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
      setIsLoading(true);
      await createCurrency(formData);
      toast.success('Tạo tiền tệ thành công');
      navigate('/currency');
    } catch (error) {
      toast.error('Không thể tạo tiền tệ');
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Thêm mới</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên tiền tệ *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên tiền tệ..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên đầy đủ *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Nhập tên đầy đủ..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ký hiệu *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.symbolicPresentation}
                onChange={(e) => setFormData(prev => ({ ...prev, symbolicPresentation: e.target.value }))}
                placeholder="Nhập ký hiệu..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Main Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiền tệ chính
            </label>
            <div className="relative">
              <select
                value={formData.mainCurrencyId}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  mainCurrencyId: e.target.value,
                  mainCurrencyName: e.target.options[e.target.selectedIndex].text
                }))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cd8e4a47-6236-11ef-a699-00155d058802">CNY</option>
                <option value="c26a4d87-c6e2-4aca-ab05-1b02be6ecaec">VND</option>
              </select>
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Markup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tỷ lệ
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.markup}
                onChange={(e) => setFormData(prev => ({ ...prev, markup: Number(e.target.value) }))}
                min="0"
                step="0.01"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <Calculator className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => navigate('/currency')}
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
              Xác nhận thêm tiền tệ
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn thêm tiền tệ này không?
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