import React from 'react';

export interface CustomDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  isConfirm?: boolean; // true: confirm, false: alert
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  title,
  message,
  isConfirm = true,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  type = 'info'
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onCancel) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  const getConfirmButtonClass = () => {
    const baseClass = 'confirm-ok-btn';
    switch (type) {
      case 'danger':
        return `${baseClass} danger`;
      case 'warning':
        return `${baseClass} warning`;
      case 'success':
        return `${baseClass} success`;
      default:
        return `${baseClass} info`;
    }
  };

  return (
    <div 
      className="confirm-dialog-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="confirm-dialog" data-type={type}>
        <div className="confirm-dialog-header">
          <h4>{title}</h4>
        </div>
        <div className="confirm-dialog-content">
          <p>
            {message.split('\n').map((line, index) => (
              <span key={index}>
                {line}
                {index < message.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>
        <div className="confirm-dialog-footer">
          {isConfirm && onCancel && (
            <button 
              onClick={onCancel}
              className="confirm-cancel-btn"
              type="button"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm}
            className={getConfirmButtonClass()}
            type="button"
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDialog;