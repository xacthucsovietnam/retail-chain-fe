/**
 * Normalizes a currency string by removing diacritics and converting to uppercase
 */
export const normalizeCurrency = (currencyString: string): string => {
  return currencyString
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
};

/**
 * Maps common currency presentations to ISO currency codes
 */
export const getCurrencyCode = (currencyString: string): string => {
  const normalized = normalizeCurrency(currencyString);
  
  const currencyMap: { [key: string]: string } = {
    'DONG': 'VND',
    'VND': 'VND',
    'USD': 'USD',
    'DOLLAR': 'USD',
    'EURO': 'EUR',
    'EUR': 'EUR',
    'JPY': 'JPY',
    'YEN': 'JPY'
  };

  return currencyMap[normalized] || 'VND';
};

/**
 * Formats a currency amount with proper currency symbol
 */
export const formatCurrency = (amount: number, currencyString: string): string => {
  const currencyCode = getCurrencyCode(currencyString);

  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  } catch (error) {
    // Fallback formatting without currency symbol if formatting fails
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currencyString;
  }
};