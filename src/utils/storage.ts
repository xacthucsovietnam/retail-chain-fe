// src/utils/storage.ts
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'user_session';
const SECRET_KEY = 'your-secret-key-here'; // Nên lưu trong .env

export const encryptData = (data: any): string => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

export const decryptData = (encryptedData: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedData ? JSON.parse(decryptedData) : null;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

export const setSession = (data: any): void => {
  try {
    const encrypted = encryptData(data);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to save session:', error);
    throw error;
  }
};

export const getSession = (): any => {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;
  return decryptData(encrypted);
};

export const clearSession = (): void => {
  console.log('Clearing session from localStorage'); // Debug log
  localStorage.removeItem(STORAGE_KEY);
};                                                                                                                                                                                                                                                     