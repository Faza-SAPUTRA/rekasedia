import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ children, isOpen, onClose }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="globalModalOverlay animate-fade-in" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="globalModal" 
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInUp 0.4s ease both' }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
