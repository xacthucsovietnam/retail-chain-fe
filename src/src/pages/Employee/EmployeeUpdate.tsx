import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Building,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployeeDetail, updateEmployee } from '../../services/employee';
import type { EmployeeDetail, UpdateEmployeeData } from '../../services/employee';

interface FormData {
  id: string;
  name: string;
  isActive: boolean;
}

export default function EmployeeUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    id: '',
    name: '',
    isActive: true
  });

  useEffect(() => {
    const fetchEmployeeDetail = async () => {
      if (!id) {
        setError('ID nhân viên không tồn tại');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getEmployeeDetail(id);
        setEmployee(data);
        setFormData({
          id: data.id,
          name: data.name,
          isActive: true
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin nhân viên';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeDetail();
  }, [id]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên nhân viên');
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

      await updateEmployee({
        id: formData.id,
        name: formData.name.trim(),
        individualId: formData.id,
        isActive: formData.isActive,
        managerId: null,
        companyId: null
      });

      toast.success('Cập nhật thông tin nhân viên thành công');
      navigate(`/employees/${formData.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật thông tin nhân viên';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?')) {
        navigate(`/employees/${id}`);
      }
    } else {
      navigate(`/employees/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Không tìm thấy nhân viên'}
          </h2>
          <button
            onClick={() => navigate('/employees')}
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
          <h1 className="text-lg font-semibold text-gray-900">Cập nhật nhân viên</h1>
          <p className="text-sm text-gray-500">{employee.name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 px-4">
        {/* Profile Image */}
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Employee Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên nhân viên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập tên nhân viên"
              />
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Công ty
            </label>
            <div className="relative">
              <input
                type="text"
                value={employee.company}
                readOnly
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
              />
              <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Đang hoạt động</span>
            </label>
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
              Xác nhận cập nhật nhân viên
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn cập nhật thông tin nhân viên này không?
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