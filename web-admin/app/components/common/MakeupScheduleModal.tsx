"use client";

import React from "react";
import { PERIODS } from "../../constants/iep";
import { Student, TimetableSlot } from "../../types/iep";
import { getDayOfWeekFromDateString } from "../../utils/iepHelpers";

export interface MakeupModalPayload {
  mode: "create" | "edit";
  student: Student;
  slot: TimetableSlot;
  originalDate: string;
  editingMakeupSlot?: TimetableSlot;
}

interface MakeupScheduleModalProps {
  data: MakeupModalPayload | null;
  dateInput: string;
  periodInput: number;
  detailInput: string;
  conflictSlot?: TimetableSlot;
  students: Student[];
  getCategoryName: (catId: string) => string;
  onChangeDate: (val: string) => void;
  onChangePeriod: (val: number) => void;
  onChangeDetail: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelMakeup: () => void;
  onClose: () => void;
}

export default function MakeupScheduleModal({
  data,
  dateInput,
  periodInput,
  detailInput,
  conflictSlot,
  students,
  getCategoryName,
  onChangeDate,
  onChangePeriod,
  onChangeDetail,
  onSubmit,
  onCancelMakeup,
  onClose,
}: MakeupScheduleModalProps) {
  if (!data) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-extrabold text-amber-600">
              {data.mode === "edit" ? "보강 일정 수정 · 취소" : "보강 일정 배정"}
            </span>
            <h3 className="text-lg font-bold text-slate-800">
              {data.student.name} 보강 날짜 선택
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="text-xs bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
            기준 결석일: <strong>{data.originalDate}</strong> ·{" "}
            <strong>{getCategoryName(data.slot.categoryId)}</strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                보강 날짜 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => onChangeDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">보강 교시</label>
              <select
                value={periodInput}
                onChange={(e) => onChangePeriod(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p}교시
                  </option>
                ))}
              </select>
            </div>
          </div>

          {conflictSlot && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-0.5">
              <p className="font-extrabold">
                ⚠️ 해당 시간({getDayOfWeekFromDateString(dateInput)}요일 {periodInput}교시)에 기존
                수업이 있습니다!
              </p>
              <p>
                기존 수업: {getCategoryName(conflictSlot.categoryId)} (
                {conflictSlot.studentIds
                  .map((id) => students.find((s) => s.id === id)?.name || "")
                  .join(", ")}
                ) — 다른 교시를 선택하시는 것을 권장합니다.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">보강 수업 메모</label>
            <input
              type="text"
              value={detailInput}
              onChange={(e) => onChangeDetail(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {data.mode === "edit" ? (
              <button
                type="button"
                onClick={onCancelMakeup}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl"
              >
                보강 취소
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                닫기
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl"
              >
                {data.mode === "edit"
                  ? "보강 일정 변경 저장"
                  : "시간표 반영 및 관리자 알림"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}