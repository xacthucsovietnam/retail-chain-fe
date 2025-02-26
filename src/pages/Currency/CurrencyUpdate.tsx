import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Tag,
  DollarSign,
  FileText,
  Calculator,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrencyDetail, updateCurrency } from '../../services/currency';
import type { CurrencyDetail, UpdateCurrencyData } from '../../services/currency';

interface FormData {
  id: string;
  code: string;
  name: string;
  fullName: string;
  symbolicPresentation: string;
  mainCurrencyId: string;
  mainCurrencyName: string;
  markup: number;
}

export default function CurrencyUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<CurrencyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    id: '',
    code: '',
    name: '',
    fullName: '',
    symbolicPresentation: '',
    mainCurrencyId: 'cd8e4a47-6236-11ef-a699-00155d058802',
    mainCurrencyName: 'CNY',
    markup: 1
  });

  useEffect(() => {
    const fetchCurrencyDetail = async () => {
      if (!id) {
        setError('Currency ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getCurrencyDetail(id);
        setCurrency(data);
        setFormData({
          id: data.id,
          code: data.code,
          name: data.name,
          fullName: data.fullName,
          symbolicPresentation: data.symbolicPresentation,
          mainCurrencyId: 'cd8e4a47-6236-11ef-a699-00155d058802',
          mainCurrencyName: data.mainCurrency,
          markup: Number(data.markup) || 1
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load currency details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencyDetail();
  }, [id]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

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
      setIsSaving(true);

      const updateData: UpdateCurrencyData = {
        id: formData.id,
        code: formData.code,
        name: formData.name,
        fullName: formData.fullName,
        symbolicPresentation: formData.symbolicPresentation,
        mainCurrencyId: formData.mainCurrencyId,
        mainCurrencyName: formData.mainCurrencyName,
        markup: formData.markup
      };

      await updateCurrency(updateData);
      toast.success('Cập nhật tiền tệ thành công');
      navigate(`/currency/${formData.id}`);
    } catch (error) {
      toast.error('Không thể cập nhật tiền tệ');
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?')) {
        navigate(`/currency/${id}`);
      }
    } else {
      navigate(`/currency/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !currency) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Currency Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            The currency you're looking for could not be found or an error occurred.
          </p>
          <button
            onClick={() => navigate('/currency')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Currencies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cập nhật tiền tệ</h1>
            <p className="text-sm text-gray-500">{formData.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5 inline-block mr-1" />
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isDirty || isSaving}
              className={`px-4 py-2 text-white rounded-md ${
                isDirty ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-5 h-5 inline-block mr-1" />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên tiền tệ *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nhập tên tiền tệ..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Nhập tên đầy đủ..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                onChange={(e) => handleInputChange('symbolicPresentation', e.target.value)}
                placeholder="Nhập ký hiệu..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                onChange={(e) => {
                  handleInputChange('mainCurrencyId', e.target.value);
                  handleInputChange('mainCurrencyName', e.target.options[e.target.selectedIndex].text);
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                onChange={(e) => handleInputChange('markup', Number(e.target.value))}
                min="0"
                step="0.01"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <Calculator className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Xác nhận cập nhật tiền tệ
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn cập nhật tiền tệ này không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
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