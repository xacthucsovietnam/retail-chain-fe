import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Building, User, Users, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees } from '../../services/employee';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

interface Employee {
    id: string;
    name: string;
    description: string;
    personalInfo: string;
    company: string;
    manager: string;
    isActive: boolean;
}

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
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
  const lastEmployeeRef = useCallback((node: HTMLDivElement) => {
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

  const fetchEmployees = async (pageNumber: number, isNewSearch: boolean = false) => {
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

      const response = await getEmployees(pageNumber, 50, conditions);
      
      if (isNewSearch) {
        setEmployees(response.items);
      } else {
        setEmployees(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      toast.error(t('message.employeesFailed'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setEmployees([]);
    setPage(1);
    setHasMore(true);
    fetchEmployees(1, true);
  }, []);

  useEffect(() => {
    if (page > 1) {
      setIsLoadingMore(true);
      fetchEmployees(page);
    }
  }, [page]);

  const handleSearch = () => {
    setIsLoading(true);
    setEmployees([]);
    setPage(1);
    setHasMore(true);
    fetchEmployees(1, true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-transform duration-300">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-gray-800">{t('employees.title')}</h2>
            <button
              onClick={() => navigate('/employees/add')}
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
                placeholder={t('employees.searchPlaceholder')}
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
                    <option value="">{t('employees.allTypes')}</option>
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
                    <option value="">{t('employees.allGenders')}</option>
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
                    <option value="">{t('employees.allTypes')}</option>
                    <option value="active">{t('employees.active')}</option>
                    <option value="inactive">{t('employees.inactive')}</option>
                  </select>
                  <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                  >
                    <option value="">{t('employees.allTypes')}</option>
                    <option value="partner">{t('employees.partner')}</option>
                    <option value="supplier">{t('employees.supplier')}</option>
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
              {isLoading ? t('employees.searching') : t('employees.search')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('employees.title')}</h2>
          <button
            onClick={() => navigate('/employees/add')}
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
              placeholder={t('employees.searchPlaceholder')}
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
              <option value="">{t('employees.allTypes')}</option>
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
              <option value="">{t('employees.allGenders')}</option>
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
              <option value="">{t('employees.allTypes')}</option>
              <option value="partner">{t('employees.partner')}</option>
              <option value="supplier">{t('employees.supplier')}</option>
            </select>
            <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? t('employees.searching') : t('employees.search')}
        </button>
      </div>

      {/* Employees List */}
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
            {employees.map((employee, index) => (
              <div
                key={employee.id}
                ref={index === employees.length - 1 ? lastEmployeeRef : null}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => navigate(`/employees/${employee.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.isActive ? t('employees.active') : t('employees.inactive')}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="text-sm">{employee.company}</span>
                  </div>

                  {employee.personalInfo && (
                    <div className="flex items-center text-gray-700">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-sm">{employee.personalInfo}</span>
                    </div>
                  )}

                  {employee.manager && (
                    <div className="flex items-center text-gray-700">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm">Manager: {employee.manager}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoadingMore && (
          <div className="text-center py-4">{t('employees.loadingMore')}</div>
        )}

        {!isLoading && employees.length === 0 && (
          <div className="text-center py-8 text-gray-500">{t('employees.noResults')}</div>
        )}
      </div>
    </div>
  );
}