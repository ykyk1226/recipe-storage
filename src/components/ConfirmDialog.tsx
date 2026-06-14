'use client';

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title = '確認',
  message,
  confirmLabel = '確定',
  cancelLabel = 'キャンセル',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 p-5 flex flex-col space-y-4 animate-in zoom-in-95 duration-200 select-none"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside dialog
      >
        {/* Header Icon + Title */}
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            isDestructive ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-primary-green'
          }`}>
            {isDestructive ? <AlertTriangle size={20} /> : <Info size={20} />}
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {title}
          </h3>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-2 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer ${
              isDestructive 
                ? 'bg-rose-500 hover:bg-rose-600 active:scale-95' 
                : 'bg-primary-green hover:bg-primary-green-hover active:scale-95'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
