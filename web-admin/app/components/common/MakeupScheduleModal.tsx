"use client";

import React, { useMemo, useState } from "react";
import { DAYS, PERIODS } from "../../constants/iep";
import { DayOfWeek, Student, TimetableSlot } from "../../types/iep";
import {
  formatDateKey,
  getExactDateFromMondayKey,
  getMonday,
  isSlotActiveInWeek,
  parseDateStringToLocal,
} from "../../utils/iepHelpers";

export interface MakeupModalPayload {
  mode: "create" | "edit";
  student: Student;
  slot: TimetableSlot;
  originalDate: string;
  editingMakeupSlot?: TimetableSlot;
  manualMakeupId?: string;
}

export interface ManualMakeupItem {
  id: string;
  studentId: string;
  teacherId: string;
  categoryId: string;
  baseDate: string; // YYYY-MM-DD
  memo?: string;
  createdAt: string;
  scheduledSlotId?: string; // 주간 시간표에 보강 슬롯으로 배정된 경우 연결
}

interface MakeupScheduleModalProps {
  data: MakeupModalPayload | null;
  dateInput: string;
  periodInput: number;
  detailInput: string;
  conflictSlot?: TimetableSlot;
  students: Student[];
  timetable: TimetableSlot[];
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
  timetable,
  getCategoryName,
  onChangeDate,
  onChangePeriod,
  onChangeDetail,
  onSubmit,
  onCancelMakeup,
  onClose,
}: MakeupScheduleModalProps) {
  const [showTimetablePicker, setShowTimetablePicker] = useState<boolean>(true);

  // 현재 입력된 날짜(또는 원래 날짜)가 속한 주의 월요일 키 계산
  const referenceMonday = useMemo(() => {
    if (!data) return new Date(2026, 10, 23);
    const parsed =
      parseDateStringToLocal(dateInput) ||
      parseDateStringToLocal(data.originalDate) ||
      new Date(2026, 10, 23);
    return getMonday(parsed);
  }, [data, dateInput]);

  const referenceWeekKey = formatDateKey(referenceMonday);

  // 해당 선생님의 해당 주차 활성 슬롯 목록
  const teacherWeekSlots = useMemo(() => {
    if (!data) return [];
    const ignoreId = data.editingMakeupSlot?.id;
    return timetable.filter(
      (s) =>
        s.id !== ignoreId &&
        s.teacherId === data.slot.teacherId &&
        isSlotActiveInWeek(s, referenceWeekKey)
    );
  }, [data, timetable, referenceWeekKey]);

  if (!data) return null;

  const selectedDateObj = parseDateStringToLocal(dateInput);
  const selectedDayKor: DayOfWeek | null = (() => {
    if (!selectedDateObj) return null;
    const map: Record<number, DayOfWeek> = {
      1: "월",
      2: "화",
      3: "수",
      4: "목",
      5: "금",
      6: "토",
    };
    return map[selectedDateObj.getDay()] || null;
  })();

  const handleSelectEmptyCell = (day: DayOfWeek, period: number) => {
    const exactDate = getExactDateFromMondayKey(referenceWeekKey, day);
    onChangeDate(exactDate);
    onChangePeriod(period);
  };

  const handleShiftWeek = (deltaWeeks: number) => {
    const base = parseDateStringToLocal(dateInput) || referenceMonday;
    const shifted = new Date(base);
    shifted.setDate(base.getDate() + deltaWeeks * 7);
    // 요일을 유지한 채 주만 이동
    const targetDay: DayOfWeek = selectedDayKor || data.slot.day;
    const nextMonKey = formatDateKey(getMonday(shifted));
    onChangeDate(getExactDateFromMondayKey(nextMonKey, targetDay));
  };

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-extrabold text-amber-700">
              {data.mode === "edit" ? "보강 일정 수정 / 취소" : "보강 일정 배정"}
            </span>
            <h3 className="text-lg font-bold text-slate-800">
              {data.student.name} · {getCategoryName(data.slot.categoryId)} 보강
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

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
          <div>
            • 기준 결석일: <span className="font-bold">{data.originalDate}</span> (
            {data.slot.day}요일 {data.slot.period}교시)
          </div>
          <div>
            • 안내: 아래 <span className="font-bold">주간 시간표에서 빈 칸을 클릭</span>하면
            보강 날짜와 교시가 자동으로 선택됩니다.
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* 주간 시간표 빈 칸 선택 영역 */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/60 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-800">
                  🗓️ 주간 시간표 빈 시간 선택 ({referenceWeekKey} 주)
                </span>
                <button
                  type="button"
                  onClick={() => setShowTimetablePicker((prev) => !prev)}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  {showTimetablePicker ? "접기" : "펼치기"}
                </button>
              </div>

              {showTimetablePicker && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleShiftWeek(-1)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    ◀ 이전 주
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShiftWeek(1)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    다음 주 ▶
                  </button>
                </div>
              )}
            </div>

            {showTimetablePicker && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed min-w-[520px] text-[11px]">
                  <thead>
                    <tr>
                      <th className="w-12 p-1.5 bg-slate-100 border border-slate-200 font-bold text-slate-600">
                        교시
                      </th>
                      {DAYS.map((day) => (
                        <th
                          key={day}
                          className="p-1.5 bg-slate-100 border border-slate-200 font-bold text-slate-700"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((period) => (
                      <tr key={period}>
                        <td className="p-1 bg-slate-50 border border-slate-200 text-center font-bold text-slate-600">
                          {period}교시
                        </td>
                        {DAYS.map((day) => {
                          const occupied = teacherWeekSlots.find(
                            (s) => s.day === day && s.period === period
                          );
                          const isSelectedCell =
                            selectedDayKor === day && periodInput === period;

                          if (occupied) {
                            const names = occupied.studentIds
                              .map((id) => students.find((st) => st.id === id)?.name || "")
                              .filter(Boolean)
                              .join(", ");
                            return (
                              <td
                                key={`${day}-${period}`}
                                className="p-1 border border-slate-200 bg-slate-200/70 align-middle"
                              >
                                <div className="px-1.5 py-1 rounded bg-slate-300/80 text-slate-600 font-semibold truncate text-[10px]">
                                  수업중 · {names || getCategoryName(occupied.categoryId)}
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={`${day}-${period}`}
                              className="p-1 border border-slate-200 bg-white align-middle"
                            >
                              <button
                                type="button"
                                onClick={() => handleSelectEmptyCell(day, period)}
                                className={`w-full py-1 px-1 rounded border text-[10px] font-extrabold transition ${
                                  isSelectedCell
                                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                    : "border-dashed border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-100"
                                }`}
                              >
                                {isSelectedCell ? "✓ 선택됨" : "+ 빈 시간"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                보강 교시 <span className="text-rose-500">*</span>
              </label>
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
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-semibold">
              ⚠️ 선택한 날짜·교시에 이미 수업(
              {getCategoryName(conflictSlot.categoryId)} ·{" "}
              {conflictSlot.studentIds
                .map((id) => students.find((st) => st.id === id)?.name || "")
                .filter(Boolean)
                .join(", ")}
              )이 있습니다. 그래도 진행하면 해당 시간에 보강 수업이 추가됩니다.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              보강 메모 / 수업명
            </label>
            <input
              type="text"
              value={detailInput}
              onChange={(e) => onChangeDetail(e.target.value)}
              placeholder="예: 감각통합 보강 수업"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            {data.mode === "edit" ? (
              <button
                type="button"
                onClick={onCancelMakeup}
                className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl"
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
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
              >
                {data.mode === "edit"
                  ? "보강 일정 변경 저장"
                  : "보강 저장 (시간표 반영 및 관리자 알림)"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}