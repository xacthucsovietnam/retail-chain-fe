import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Upload,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createPartner } from '../../services/partner';

interface FormData {
  picture: string;
  name: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  notes: string;
  types: {
    isCustomer: boolean;
    isSupplier: boolean;
    isOther: boolean;
  };
  options: {
    byContract: boolean;
    byOrder: boolean;
    byDocument: boolean;
  };
}

const initialFormData: FormData = {
  picture: '',
  name: '',
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  notes: '',
  types: {
    isCustomer: true,
    isSupplier: false,
    isOther: false
  },
  options: {
    byContract: false,
    byOrder: true,
    byDocument: true
  }
};

export default function PartnerAdd() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Ảnh không được vượt quá 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        setFormData(prev => ({ ...prev, picture: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Email không hợp lệ');
      return false;
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      toast.error('Số điện thoại không hợp lệ');
      return false;
    }

    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      if (birthDate > new Date()) {
        toast.error('Ngày sinh không được lớn hơn ngày hiện tại');
        return false;
      }
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

      const result = await createPartner({
        name: formData.name,
        fullName: formData.fullName || formData.name,
        dateOfBirth: formData.dateOfBirth || new Date().toISOString(),
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        notes: formData.notes,
        gender: formData.gender || 'Male',
        picture: formData.picture
      });

      toast.success('Thêm đối tác thành công');
      navigate(`/partners/${result.id}`);
    } catch (error) {
      toast.error('Không thể thêm đối tác');
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Thêm mới đối tác</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/partners')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <ArrowLeft className="w-5 h-5 inline-block mr-1" />
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Save className="w-5 h-5 inline-block mr-1" />
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh đại diện
              </label>
              <div 
                onClick={handleImageClick}
                className="relative w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400"
              >
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewUrl('');
                        setFormData(prev => ({ ...prev, picture: '' }));
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium text-gray-600">
                      Chọn ảnh
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập họ tên..."
                />
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập email..."
                />
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập số điện thoại..."
                />
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giới tính
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="Male"
                    checked={formData.gender === 'Male'}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Nam</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="Female"
                    checked={formData.gender === 'Female'}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Nữ</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày sinh
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <div className="relative">
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập địa chỉ..."
                />
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <div className="relative">
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập ghi chú..."
                />
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Partner Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại đối tác
              </label>
              <div className="space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.types.isCustomer}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      types: { ...prev.types, isCustomer: e.target.checked }
                    }))}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Khách hàng</span>
                </label>
                <br />
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.types.isSupplier}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      types: { ...prev.types, isSupplier: e.target.checked }
                    }))}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Nhà cung cấp</span>
                </label>
                <br />
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.types.isOther}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      types: { ...prev.types, isOther: e.target.checked }
                    }))}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Khác</span>
                </label>
              </div>
            </div>

            {/* Additional Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tùy chọn bổ sung
              </label>
              <div className="space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.options.byContract}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, byContract: e.target.checked }
                    }))}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Theo hợp đồng</span>
                </label>
                <br />
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.options.byOrder}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, byOrder: e.target.checked }
                    }))}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Theo đơn hàng</span>
                </label>
                <br />
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.options.byDocument}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, byDocument: e.target.checked }
                    }))}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Theo chứng từ</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Xác nhận thêm đối tác
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn thêm đối tác này không?
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
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
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