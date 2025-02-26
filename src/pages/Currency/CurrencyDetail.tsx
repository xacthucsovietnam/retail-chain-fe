import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  Tag,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrencyDetail } from '../../services/currency';
import type { CurrencyDetail as ICurrencyDetail } from '../../services/currency';

export default function CurrencyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<ICurrencyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/currency')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Currencies
        </button>
        <button
          onClick={() => navigate(`/currency/edit/${id}`)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Edit Currency
        </button>
      </div>

      {/* Currency Information */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currency.name}</h1>
              <p className="text-sm text-gray-500">{currency.fullName}</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {currency.code}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className="text-sm">Symbol</span>
                </div>
                <p className="text-lg text-gray-900">{currency.symbolicPresentation}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Tag className="w-4 h-4 mr-2" />
                  <span className="text-sm">Main Currency</span>
                </div>
                <p className="text-lg text-gray-900">{currency.mainCurrency}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm">Markup</span>
                </div>
                <p className="text-lg text-gray-900">{currency.markup}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}