import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-5 w-5 text-gray-500" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'vi' | 'en' | 'zh')}
        className="bg-white border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="vi">Tiếng Việt</option>
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
    </div>
  );
}