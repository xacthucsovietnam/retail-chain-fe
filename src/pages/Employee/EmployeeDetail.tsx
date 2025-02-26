import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  User,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployeeDetail } from '../../services/employee';
import type { EmployeeDetail } from '../../services/employee';
import { useLanguage } from '../../contexts/LanguageContext';

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchEmployeeDetail = async () => {
      if (!id) {
        setError('Employee ID is missing');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getEmployeeDetail(id);
        setEmployee(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load employee details';
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
    toast.error('Delete functionality not implemented yet');
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
            {error || 'Employee Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            The employee you're looking for could not be found or an error occurred.
          </p>
          <button
            onClick={() => navigate('/employees')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
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
          onClick={() => navigate('/employees')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Employees
        </button>

        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Employee Information Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Building className="w-4 h-4 mr-2" />
                  <span className="text-sm">Company</span>
                </div>
                <p className="text-lg text-gray-900">{employee.company}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}