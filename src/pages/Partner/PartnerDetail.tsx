import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Building,
  Calendar,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  FileSearch,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPartnerDetail } from '../../services/partner';
import type { PartnerDetail } from '../../services/partner';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setPartner(data);
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

  const handleEdit = () => {
    if (id) {
      navigate(`/partners/edit/${id}`);
    }
  };

  const handleDelete = () => {
    toast.error('Delete functionality not implemented yet');
  };

  const handleRelatedDocuments = () => {
    toast.error('Related documents functionality not implemented yet');
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
            {error || 'Partner Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            The partner you're looking for could not be found or an error occurred.
          </p>
          <button
            onClick={() => navigate('/partners')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Partners
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header with back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/partners')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Partners
        </button>

        <div className="flex gap-2">
           Continuing the PartnerDetail.tsx file content exactly where we left off:

```tsx
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </button>

          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>

          <button
            onClick={handleRelatedDocuments}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FileSearch className="w-4 h-4 mr-2" />
            Related Documents
          </button>
        </div>
      </div>

      {/* Partner Information Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{partner.name}</h1>
              <p className="text-sm text-gray-500">#{partner.code}</p>
            </div>
            <div className="flex gap-2">
              {partner.isCustomer && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Customer
                </span>
              )}
              {partner.isVendor && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  Supplier
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                partner.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {partner.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Building className="w-4 h-4 mr-2" />
                  <span className="text-sm">Partner Type</span>
                </div>
                <p className="text-lg text-gray-900">{partner.type}</p>
              </div>

              {partner.dateOfBirth && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Date of Birth</span>
                  </div>
                  <p className="text-lg text-gray-900">{new Date(partner.dateOfBirth).toLocaleDateString()}</p>
                </div>
              )}

              {partner.gender && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm">Gender</span>
                  </div>
                  <p className="text-lg text-gray-900">{partner.gender}</p>
                </div>
              )}

              {partner.phone && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Phone className="w-4 h-4 mr-2" />
                    <span className="text-sm">Phone Number</span>
                  </div>
                  <p className="text-lg text-gray-900">{partner.phone}</p>
                </div>
              )}

              {partner.email && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="text-sm">Email</span>
                  </div>
                  <p className="text-lg text-gray-900">{partner.email}</p>
                </div>
              )}

              {partner.address && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">Address</span>
                  </div>
                  <p className="text-lg text-gray-900">{partner.address}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm">Operation Settings</span>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    {partner.doOperationsByContracts ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-gray-700">Operations by Contracts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {partner.doOperationsByOrders ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-gray-700">Operations by Orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {partner.doOperationsByDocuments ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-gray-700">Operations by Documents</span>
                  </div>
                </div>
              </div>

              {partner.taxId && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm">Tax ID</span>
                  </div>
                  <p className="text-lg text-gray-900">{partner.taxId}</p>
                </div>
              )}

              {partner.employeeResponsible && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm">Responsible Employee</span>
                  </div>
                  <p className="text-lg text-gray-900">{partner.employeeResponsible}</p>
                </div>
              )}

              {partner.notes && (
                <div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm">Notes</span>
                  </div>
                  <p className="text-lg text-gray-900 whitespace-pre-line">{partner.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}