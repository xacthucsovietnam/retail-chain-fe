import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Building,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployeeDetail } from '../../services/employee';
import type { EmployeeDetail } from '../../services/employee';

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleEdit = () => {
    if (id) {
      navigate(`/employees/edit/${id}`);
    }
  };

  const handleDelete = () => {
    toast.error('Chức năng xóa chưa được triển khai');
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
          <h1 className="text-lg font-semibold text-gray-900">Chi tiết nhân viên</h1>
          <p className="text-sm text-gray-500">{employee.name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{employee.name}</h2>
              <p className="text-sm text-gray-500">{employee.company}</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-base font-medium text-gray-900 mb-4">Thông tin liên hệ</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="text-base text-gray-900">0123456789</p>
              </div>
            </div>

            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base text-gray-900">employee@example.com</p>
              </div>
            </div>

            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Địa chỉ</p>
                <p className="text-base text-gray-900">123 Đường ABC, Quận XYZ, TP.HCM</p>
              </div>
            </div>

            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Ngày vào làm</p>
                <p className="text-base text-gray-900">01/01/2024</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-base font-medium text-gray-900 mb-4">Thông tin tài chính</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Lương cơ bản</p>
                <p className="text-base font-medium text-blue-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(5000000)}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Tài khoản ngân hàng</p>
                <p className="text-base text-gray-900">123456789</p>
                <p className="text-sm text-gray-500">Ngân hàng ABC</p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-base font-medium text-gray-900 mb-4">Thông tin công ty</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Building className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Phòng ban</p>
                <p className="text-base text-gray-900">{employee.company}</p>
              </div>
            </div>

            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Chức vụ</p>
                <p className="text-base text-gray-900">Nhân viên</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => navigate('/employees')}
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