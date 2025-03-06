import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Phone, Mail, MapPin, FileText, User, Building, Users, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPartners } from '../../services/partner';
import { useLanguage } from '../../contexts/LanguageContext';

interface Partner {
  id: string;
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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
      
      // Show/hide header based on scroll direction
      if (currentScrollY < lastScrollY.current - 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current + 10) {
        setIsHeaderVisible(false);
        setIsSearchExpanded(false);
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
    setIsSearchExpanded(false);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setGenderFilter('');
    setStatusFilter('');
    setRoleFilter('');
    setIsFilterOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Title Bar */}
        <div className="bg-white px-4 py-3 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">{t('partners.title')}</h1>
        </div>

        {/* Search Bar - Now separate from header */}
        <div className={`bg-white px-4 py-2 shadow-sm transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`relative flex-1 transition-all duration-300 ${isSearchExpanded ? 'flex-grow' : ''}`}>
              {isSearchExpanded ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('partners.searchPlaceholder')}
                    className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearchExpanded(false);
                    }}
                    className="absolute right-3 top-2.5"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsFilterOpen(true)}
              className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg ${
                typeFilter || genderFilter || statusFilter || roleFilter
                  ? 'bg-blue-50 text-blue-600'
                  : ''
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-12 px-4 pb-20">
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            // Loading Skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow animate-pulse p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : (
            partners.map((partner, index) => (
              <div
                key={partner.code}
                ref={index === partners.length - 1 ? lastPartnerRef : null}
                onClick={() => navigate(`/partners/${partner.id}`)}
                className="bg-white rounded-lg shadow-sm p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{partner.name}</h3>
                    <p className="text-sm text-gray-500">#{partner.code}</p>
                  </div>
                  <div className="flex gap-1">
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

                <div className="space-y-1.5">
                  {partner.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {partner.phone}
                    </div>
                  )}

                  {partner.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {partner.email}
                    </div>
                  )}

                  {partner.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {partner.address}
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    partner.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {partner.isActive ? t('partners.active') : t('partners.inactive')}
                  </span>
                </div>
              </div>
            ))
          )}

          {isLoadingMore && (
            <div className="text-center py-4">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          )}

          {!isLoading && partners.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('partners.noResults')}
            </div>
          )}
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Bộ lọc</h2>
              <button onClick={() => setIsFilterOpen(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại đối tác
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('partners.allTypes')}</option>
                  <option value="Individual">Individual</option>
                  <option value="Company">Company</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới tính
                </label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('partners.allGenders')}</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('partners.allTypes')}</option>
                  <option value="active">{t('partners.active')}</option>
                  <option value="inactive">{t('partners.inactive')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('partners.allTypes')}</option>
                  <option value="partner">{t('partners.partner')}</option>
                  <option value="supplier">{t('partners.supplier')}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Xóa bộ lọc
                </button>
                <button
                  onClick={() => {
                    handleSearch();
                    setIsFilterOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Bottom Safe Area */}
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/partners/add')}
        className="fixed right-4 bottom-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}