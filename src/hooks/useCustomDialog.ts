import { useState } from 'react';

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  isConfirm: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

export const useCustomDialog = () => {
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const showAlert = (
    title: string, 
    message: string, 
    type: 'info' | 'warning' | 'danger' | 'success' = 'info'
  ) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      isConfirm: false,
      confirmText: '확인',
      onConfirm: () => {
        setDialogState(null);
      },
      type
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'info' | 'warning' | 'danger' | 'success' = 'warning'
  ) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      isConfirm: true,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: () => {
        onConfirm();
        setDialogState(null);
      },
      onCancel: () => {
        setDialogState(null);
      },
      type
    });
  };

  const hideDialog = () => {
    setDialogState(null);
  };

  return {
    dialogState,
    showAlert,
    showConfirm,
    hideDialog
  };
};