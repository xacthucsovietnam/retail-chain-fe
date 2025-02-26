import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Phone, Mail, MapPin, FileText, User, Building, Users, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPartners } from '../../services/partner';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

interface Partner {
  id: string; // Add id field
  code: string;
  name: string;
  type: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isActive: boolean;
  isPartner: boolean;
  isVendor: boolean;
}

export default function Partners() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilter, setShowFilter] = useState(true);
  const lastScrollY = useRef(0);
  const { t } = useLanguage();

  // Search filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const observer = useRef<IntersectionObserver>();
  const lastPartnerRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY.current - 100) {
        setShowFilter(true);
      } else if (currentScrollY > lastScrollY.current + 10) {
        setShowFilter(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPartners = async (pageNumber: number, isNewSearch: boolean = false) => {
    try {
      const conditions = [];

      if (searchTerm) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'objectId.presentation',
          value: searchTerm,
          comparisonOperator: 'contains'
        });
      }

      if (typeFilter) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'counterpartyKind.presentation',
          value: typeFilter,
          comparisonOperator: '='
        });
      }

      if (genderFilter) {
        conditions.push({
          _type: 'XTSCondition',
          property: 'gender.presentation',
          value: genderFilter,
          comparisonOperator: '='
        });
      }

      if (statusFilter === 'active') {
        conditions.push({
          _type: 'XTSCondition',
          property: 'invalid',
          value: false,
          comparisonOperator: '='
        });
      } else if (statusFilter === 'inactive') {
        conditions.push({
          _type: 'XTSCondition',
          property: 'invalid',
          value: true,
          comparisonOperator: '='
        });
      }

      if (roleFilter === 'partner') {
        conditions.push({
          _type: 'XTSCondition',
          property: 'partner',
          value: true,
          comparisonOperator: '='
        });
      } else if (roleFilter === 'supplier') {
        conditions.push({
          _type: 'XTSCondition',
          property: 'vendor',
          value: true,
          comparisonOperator: '='
        });
      }

      const response = await getPartners(pageNumber, 50, conditions);
      
      if (isNewSearch) {
        setPartners(response.items);
      } else {
        setPartners(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      toast.error(t('message.partnersFailed'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setPartners([]);
    setPage(1);
    setHasMore(true);
    fetchPartners(1, true);
  }, []);

  useEffect(() => {
    if (page > 1) {
      setIsLoadingMore(true);
      fetchPartners(page);
    }
  }, [page]);

  const handleSearch = () => {
    setIsLoading(true);
    setPartners([]);
    setPage(1);
    setHasMore(true);
    fetchPartners(1, true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-transform duration-300">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-gray-800">{t('partners.title')}</h2>
            <button
              onClick={() => navigate('/partners/add')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm mới
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('partners.searchPlaceholder')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            <div className={`space-y-3 overflow-hidden transition-all duration-300 ${showFilter ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                  >
                    <option value="">{t('partners.allTypes')}</option>
                    <option value="Individual">Individual</option>
                    <option value="Company">Company</option>
                  </select>
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                <div className="relative">
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                  >
                    <option value="">{t('partners.allGenders')}</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                  >
                    <option value="">{t('partners.allTypes')}</option>
                    <option value="active">{t('partners.active')}</option>
                    <option value="inactive">{t('partners.inactive')}</option>
                  </select>
                  <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                  >
                    <option value="">{t('partners.allTypes')}</option>
                    <option value="partner">{t('partners.partner')}</option>
                    <option value="supplier">{t('partners.supplier')}</option>
                  </select>
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? t('partners.searching') : t('partners.search')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('partners.title')}</h2>
          <button
            onClick={() => navigate('/partners/add')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm mới
          </button>
        </div>
        
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="relative col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('partners.searchPlaceholder')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
            >
              <option value="">{t('partners.allTypes')}</option>
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
            </select>
            <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
            >
              <option value="">{t('partners.allGenders')}</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
            >
              <option value="">{t('partners.allTypes')}</option>
              <option value="partner">{t('partners.partner')}</option>
              <option value="supplier">{t('partners.supplier')}</option>
            </select>
            <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? t('partners.searching') : t('partners.search')}
        </button>
      </div>

      {/* Partners List */}
      <div className="md:bg-white md:rounded-lg md:shadow-md md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-20 md:mt-0">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-20 md:mt-0">
            {partners.map((partner, index) => (
              <div
                key={partner.code}
                ref={index === partners.length - 1 ? lastPartnerRef : null}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => navigate(`/partners/${partner.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{partner.name}</h3>
                    <p className="text-sm text-gray-600">#{partner.code}</p>
                  </div>
                  <div className="flex gap-2">
                    {partner.isPartner && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {t('partners.partner')}
                      </span>
                    )}
                    {partner.isVendor && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        {t('partners.supplier')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="text-sm">{partner.type}</span>
                  </div>

                  {partner.phone && (
                    <div className="flex items-center text-gray-700">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="text-sm">{partner.phone}</span>
                    </div>
                  )}

                  {partner.email && (
                    <div className="flex items-center text-gray-700">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="text-sm">{partner.email}</span>
                    </div>
                  )}

                  {partner.address && (
                    <div className="flex items-center text-gray-700">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">{partner.address}</span>
                    </div>
                  )}

                  {partner.notes && (
                    <div className="flex items-start text-gray-700">
                      <FileText className="h-4 w-4 mr-2 mt-1" />
                      <span className="text-sm">{partner.notes}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    partner.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {partner.isActive ? t('partners.active') : t('partners.inactive')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoadingMore && (
          <div className="text-center py-4">{t('partners.loadingMore')}</div>
        )}

        {!isLoading && partners.length === 0 && (
          <div className="text-center py-8 text-gray-500">{t('partners.noResults')}</div>
        )}
      </div>
    </div>
  );
}