import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Building,
  Calendar,
  Loader2,
  AlertCircle,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPartnerDetail } from '../../services/partner';
import type { PartnerDetail } from '../../services/partner';

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartnerDetail = async () => {
      if (!id) {
        setError('ID khách hàng không tồn tại');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getPartnerDetail(id);
        setPartner(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin khách hàng';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartnerDetail();
  }, [id]);

  const handleEdit = () => {
    if (id) {
      navigate(`/partners/edit/${id}`);
    }
  };

  const handleDelete = () => {
    toast.error('Chức năng xóa chưa được triển khai');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Không tìm thấy khách hàng'}
          </h2>
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
          <h1 className="text-lg font-semibold text-gray-900">Chi tiết khách hàng</h1>
          <p className="text-sm text-gray-500">#{partner.code}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-4 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              {partner.picture ? (
                <img
                  src={partner.picture}
                  alt={partner.name}
                  className="h-16 w-16 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
                  }}
                />
              ) : (
                <User className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{partner.name}</h2>
              <p className="text-sm text-gray-500">{partner.description}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {partner.isCustomer && (
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Khách hàng
              </span>
            )}
            {partner.isVendor && (
              <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                Nhà cung cấp
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              partner.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {partner.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
            </span>
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
                <p className="text-base text-gray-900">{partner.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base text-gray-900">{partner.email || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Địa chỉ</p>
                <p className="text-base text-gray-900">{partner.address || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Ngày sinh</p>
                <p className="text-base text-gray-900">{formatDate(partner.dateOfBirth)}</p>
              </div>
            </div>

            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Giới tính</p>
                <p className="text-base text-gray-900">
                  {partner.gender === 'Male' ? 'Nam' : partner.gender === 'Female' ? 'Nữ' : 'Chưa cập nhật'}
                </p>
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
                <p className="text-sm text-gray-500">Tổng doanh thu</p>
                <p className="text-base font-medium text-blue-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(15000000)}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Tổng công nợ</p>
                <p className="text-base font-medium text-red-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(5000000)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Operation Settings */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-base font-medium text-gray-900 mb-4">Thiết lập giao dịch</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              {partner.doOperationsByContracts ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-3" />
              )}
              <span className="text-gray-700">Theo hợp đồng</span>
            </div>

            <div className="flex items-center">
              {partner.doOperationsByOrders ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-3" />
              )}
              <span className="text-gray-700">Theo đơn hàng</span>
            </div>

            <div className="flex items-center">
              {partner.doOperationsByDocuments ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-3" />
              )}
              <span className="text-gray-700">Theo chứng từ</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(partner.notes || partner.employeeResponsible) && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-base font-medium text-gray-900 mb-4">Thông tin bổ sung</h3>
            
            <div className="space-y-3">
              {partner.employeeResponsible && (
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Nhân viên phụ trách</p>
                    <p className="text-base text-gray-900">{partner.employeeResponsible}</p>
                  </div>
                </div>
              )}

              {partner.notes && (
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Ghi chú</p>
                    <p className="text-base text-gray-900 whitespace-pre-line">{partner.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => navigate('/partners')}
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