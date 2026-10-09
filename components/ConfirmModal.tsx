'use client';

import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isDestructive = true,
  onConfirm,
}) => {
  return (
    <AlertDialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-200" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#352C56] bg-[#1E1834] p-6 shadow-2xl transition-all duration-200 focus:outline-none">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                isDestructive
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-[#6967EB]/15 text-[#6967EB] border border-[#6967EB]/30'
              }`}
            >
              {isDestructive ? (
                <Trash2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialog.Title className="text-lg font-bold text-white font-sans">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-[#9D96B8] leading-relaxed">
                {description}
              </AlertDialog.Description>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-[#272041] border border-[#352C56] text-[#C5C0DC] text-sm font-semibold hover:bg-[#322954] hover:text-white transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-md cursor-pointer ${
                  isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-[#6967EB] hover:bg-[#5856d6] text-white'
                }`}
              >
                {confirmText}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
