"use client";

import React from "react";
import { ConfirmDialogState } from "../../types/iep";

interface ConfirmModalProps {
  dialog: ConfirmDialogState | null;
  onClose: () => void;
}

export default function ConfirmModal({ dialog, onClose }: ConfirmModalProps) {
  if (!dialog) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">{dialog.title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {dialog.message}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              dialog.onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition ${
              dialog.danger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {dialog.confirmLabel || "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}