import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full ${maxWidth} rounded-2xl border border-border-default bg-bg-surface shadow-2xl p-6 text-text-primary`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <h3 className="text-lg font-bold text-text-primary">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 max-h-[80vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
};
