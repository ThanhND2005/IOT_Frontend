import { useContext } from 'react';
import { ToastContext } from './ToastContext';
import type { ToastContextType } from './toastTypes';

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
