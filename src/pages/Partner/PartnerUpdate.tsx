import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPartnerDetail, updatePartner } from '../../services/partner';
import type { PartnerDetail } from '../../services/partner';

interface FormData {
  id: string;
  code: string;
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
  };
  options: {
    byContract: boolean;
    byOrder: boolean;
    byDocument: boolean;
  };
}

export default function PartnerUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    id: '',
    code: '',
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
      isSupplier: false
    },
    options: {
      byContract: false,
      byOrder: true,
      byDocument: true
    }
  });

  useEffect(() => {
    const fetchPartnerDetail = async () => {
      if (!id) {
        setError('Partner ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getPartnerDetail(id);
        setPreviewUrl(data.picture || '');
        
        setFormData({
          id: data.id,
          code: data.code,
          picture: data.picture || '',
          name: data.name,
          fullName: data.description,
          email: data.email || '',
          phone: data.phone || '',
          gender: data.gender || 'Male',
          dateOfBirth: data.dateOfBirth || '',
          address: data.address || '',
          notes: data.notes || '',
          types: {
            isCustomer: data.isCustomer,
            isSupplier: data.isVendor
          },
          options: {
            byContract: data.doOperationsByContracts,
            byOrder: data.doOperationsByOrders,
            byDocument: data.doOperationsByDocuments
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load partner details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartnerDetail();
  }, [id]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ảnh không được vượt quá 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        setFormData(prev => ({ ...prev, picture: result }));
        setIsDirty(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: keyof FormData | string, value: any) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent as keyof typeof prev],
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
    setIsDirty(true);
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
      setIsSaving(true);

      await updatePartner({
        id: formData.id,
        code: formData.code,
        name: formData.name,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth || new Date().toISOString(),
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        notes: formData.notes,
        gender: formData.gender,
        picture: formData.picture,
        isCustomer: formData.types.isCustomer,
        isVendor: formData.types.isSupplier,
        doOperationsByContracts: formData.options.byContract,
        doOperationsByOrders: formData.options.byOrder,
        doOperationsByDocuments: formData.options.byDocument
      });

      toast.success('Cập nhật khách hàng thành công');
      navigate(`/partners/${formData.id}`);
    } catch (error) {
      toast.error('Không thể cập nhật khách hàng');
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
          <button
            onClick={() => navigate('/partners')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Cập nhật khách hàng</h1>
          <p className="text-sm text-gray-500">#{formData.code}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        {/* Avatar Upload */}
        <div className="mb-6 flex justify-center">
          <div 
            onClick={handleImageClick}
            className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400"
          >
            {previewUrl ? (
              <div className="relative w-full h-full">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-full"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewUrl('');
                    setFormData(prev => ({ ...prev, picture: '' }));
                    setIsDirty(true);
                  }}
                  className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <span className="mt-1 block text-xs font-medium text-gray-600">
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

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nhập họ tên"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Nhập email"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Điện thoại
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Nhập số điện thoại"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giới tính
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="Male"
                  checked={formData.gender === 'Male'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Nam</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="Female"
                  checked={formData.gender === 'Female'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Nữ</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày sinh
            </label>
            <input
              type="date"
              value={formData.dateOfBirth.split('T')[0]}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Nhập địa chỉ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Nhập ghi chú"
            />
          </div>

          {/* Partner Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại đối tác
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.types.isCustomer}
                  onChange={(e) => handleInputChange('types.isCustomer', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Khách hàng</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.types.isSupplier}
                  onChange={(e) => handleInputChange('types.isSupplier', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Nhà cung cấp</span>
              </label>
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tùy chọn bổ sung
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.options.byContract}
                  onChange={(e) => handleInputChange('options.byContract', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Theo hợp đồng</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.options.byOrder}
                  onChange={(e) => handleInputChange('options.byOrder', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Theo đơn hàng</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.options.byDocument}
                  onChange={(e) => handleInputChange('options.byDocument', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Theo chứng từ</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => navigate(`/partners/${id}`)}
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
              Xác nhận cập nhật khách hàng
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn cập nhật thông tin khách hàng này không?
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