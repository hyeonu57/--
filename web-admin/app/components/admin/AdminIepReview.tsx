"use client";

import React, { useState } from "react";
import { DAYS, PERIODS } from "../../constants/iep";
import {
  AttendanceStatus,
  ClassCategory,
  IEPRecord,
  Student,
  TimetableSlot,
  UserAccount,
} from "../../types/iep";
import {
  formatDateKey,
  formatShortDate,
  getAttendanceBadgeStyle,
  getExactDateFromMondayKey,
  isSlotActiveInWeek,
  resolveCategoryTheme,
} from "../../utils/iepHelpers";

interface AdminIepReviewProps {
  teachersOnly: UserAccount[];
  initialTeacherId: string;
  initialMonday: Date;
  students: Student[];
  categories: ClassCategory[];
  timetable: TimetableSlot[];
  iepRecords: Record<string, IEPRecord>;
  attendanceRecords: Record<string, AttendanceStatus>;
  totalUncheckedIepCount: number;
  onSaveReview: (recordKey: string, checked: boolean, feedback: string) => void;
}

export default function AdminIepReview({
  teachersOnly,
  initialTeacherId,
  initialMonday,
  students,
  categories,
  timetable,
  iepRecords,
  attendanceRecords,
  totalUncheckedIepCount,
  onSaveReview,
}: AdminIepReviewProps) {
  const [reviewTeacherId, setReviewTeacherId] = useState<string>(initialTeacherId);
  const [reviewMonday, setReviewMonday] = useState<Date>(initialMonday);
  const [reviewStudentFilterId, setReviewStudentFilterId] = useState<string>("all");
  const [reviewOnlyUnchecked, setReviewOnlyUnchecked] = useState<boolean>(false);
  const [reviewViewMode, setReviewViewMode] = useState<"timetable" | "files">("timetable");
  const [selectedReviewSlotId, setSelectedReviewSlotId] = useState<string | null>(null);
  const [selectedReviewFileKey, setSelectedReviewFileKey] = useState<string | null>(null);
  const [adminFeedbackDrafts, setAdminFeedbackDrafts] = useState<Record<string, string>>({});
  const [reviewSaveMsg, setReviewSaveMsg] = useState<string>("");

  const selectedTeacher =
    teachersOnly.find((t) => t.id === reviewTeacherId) || teachersOnly[0];

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || "미지정";

  const teacherAssignedStudents = (() => {
    if (!selectedTeacher) return [];
    const teacherSlots = timetable.filter((slot) => slot.teacherId === selectedTeacher.id);
    const assignedIds = new Set<string>();
    teacherSlots.forEach((slot) => slot.studentIds.forEach((id) => assignedIds.add(id)));
    return students.filter((st) => assignedIds.has(st.id));
  })();

  const reviewWeekKey = formatDateKey(reviewMonday);
  const reviewWeekLabel = `${reviewMonday.getFullYear()}년 ${formatShortDate(
    reviewMonday,
    0
  )} (월) ~ ${formatShortDate(reviewMonday, 5)} (토)`;

  const teacherAllSlots = timetable.filter(
    (s) => s.teacherId === selectedTeacher?.id && isSlotActiveInWeek(s, reviewWeekKey)
  );
  const filteredReviewSlots =
    reviewStudentFilterId === "all"
      ? teacherAllSlots
      : teacherAllSlots.filter((s) => s.studentIds.includes(reviewStudentFilterId));

  const teacherSlotIds = new Set(
    timetable.filter((s) => s.teacherId === selectedTeacher?.id).map((s) => s.id)
  );

  const teacherIepList = Object.entries(iepRecords)
    .filter(([key, rec]) => {
      const [, slotId, stId] = key.split("_");
      if (!teacherSlotIds.has(slotId)) return false;
      if (reviewStudentFilterId !== "all" && stId !== reviewStudentFilterId) return false;
      const hasContent = Boolean(
        rec.sessionGoal.trim() ||
          rec.activityContent.trim() ||
          rec.supportStrategy.trim() ||
          rec.evaluation.trim()
      );
      if (!hasContent) return false;
      if (reviewOnlyUnchecked && rec.adminChecked) return false;
      return true;
    })
    .map(([key, rec]) => {
      const [mondayKey, slotId, stId] = key.split("_");
      const slot = timetable.find((s) => s.id === slotId);
      const student = students.find((st) => st.id === stId);
      const exactDate = slot ? getExactDateFromMondayKey(mondayKey, slot.day) : mondayKey;
      const categoryName = slot ? getCategoryName(slot.categoryId) : "수업";
      return {
        key,
        exactDate,
        dayPeriod: slot ? `${slot.day}${slot.period}` : "-",
        categoryName,
        student,
        attendance: attendanceRecords[key],
        record: rec,
      };
    })
    .sort((a, b) => b.exactDate.localeCompare(a.exactDate));

  const moveReviewWeek = (weeks: number) => {
    const next = new Date(reviewMonday);
    next.setDate(reviewMonday.getDate() + weeks * 7);
    setReviewMonday(next);
    setSelectedReviewSlotId(null);
  };

  const handleSaveCard = (recordKey: string, nextCheckedState?: boolean) => {
    const existing = iepRecords[recordKey];
    if (!existing) return;

    const draftText =
      adminFeedbackDrafts[recordKey] !== undefined
        ? adminFeedbackDrafts[recordKey]
        : existing.adminFeedback || "";

    const checkedValue =
      nextCheckedState !== undefined ? nextCheckedState : Boolean(existing.adminChecked);

    onSaveReview(recordKey, checkedValue, draftText.trim());
    setReviewSaveMsg("✅ 관리자 검토 및 피드백이 저장되었습니다.");
    setTimeout(() => setReviewSaveMsg(""), 3000);
  };

  const renderAdminReviewCard = (
    recordKey: string,
    exactDate: string,
    dayPeriod: string,
    categoryName: string,
    student: Student | undefined,
    attendance: AttendanceStatus | undefined,
    rec: IEPRecord
  ) => {
    const currentFeedbackValue =
      adminFeedbackDrafts[recordKey] !== undefined
        ? adminFeedbackDrafts[recordKey]
        : rec.adminFeedback || "";
    const theme = resolveCategoryTheme(categories, categoryName);

    return (
      <div
        key={recordKey}
        className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 ${
          rec.adminChecked ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-800 text-white text-xs font-bold rounded-md">
              {exactDate} ({dayPeriod})
            </span>
            <span
              className={`px-2.5 py-1 text-xs font-extrabold rounded-md border ${theme.pill}`}
            >
              {categoryName}
            </span>
            <span className="text-base font-bold text-slate-800">
              학생: {student?.name || "미상"}
            </span>
            {attendance && (
              <span
                className={`px-2 py-0.5 text-xs font-bold rounded border ${getAttendanceBadgeStyle(
                  attendance
                )}`}
              >
                출결: {attendance}
              </span>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              rec.adminChecked
                ? "bg-emerald-600 text-white"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {rec.adminChecked ? "✅ 확인 완료" : "⏳ 검토 대기"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold text-indigo-700 block mb-1">1. 금주 세부 목표</span>
            <p className="text-slate-800 whitespace-pre-wrap">{rec.sessionGoal || "-"}</p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 block mb-1">3. 지원 전략</span>
            <p className="text-slate-800 whitespace-pre-wrap">{rec.supportStrategy || "-"}</p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold text-blue-700 block mb-1">2. 수업 활동 내용</span>
            <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
              {rec.activityContent || "-"}
            </p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold text-emerald-700 block mb-1">4. 수행 결과 및 반응</span>
            <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
              {rec.evaluation || "-"}
            </p>
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-emerald-900">✍️ 관리자 피드백</label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-900">
              <input
                type="checkbox"
                checked={Boolean(rec.adminChecked)}
                onChange={(e) => handleSaveCard(recordKey, e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              <span>확인 완료</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={currentFeedbackValue}
              onChange={(e) =>
                setAdminFeedbackDrafts((prev) => ({
                  ...prev,
                  [recordKey]: e.target.value,
                }))
              }
              placeholder="피드백을 입력하세요..."
              className="flex-1 px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-xs text-slate-800"
            />
            <button
              type="button"
              onClick={() => handleSaveCard(recordKey, true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
            >
              저장 및 확인
            </button>
          </div>
        </div>
      </div>
    );
  };

  const selectedReviewSlot = selectedReviewSlotId
    ? filteredReviewSlots.find((s) => s.id === selectedReviewSlotId) || null
    : null;

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">
          🕵️ 선생님별 누적 IEP 검토 및 피드백
        </h2>
        {reviewSaveMsg && (
          <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-600 text-white">
            {reviewSaveMsg}
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            {teachersOnly.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setReviewTeacherId(t.id);
                  setReviewStudentFilterId("all");
                  setSelectedReviewSlotId(null);
                  setSelectedReviewFileKey(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  selectedTeacher?.id === t.id
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setReviewOnlyUnchecked((prev) => !prev);
                setReviewViewMode("files");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                reviewOnlyUnchecked
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              미검토만 ({totalUncheckedIepCount})
            </button>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setReviewViewMode("timetable")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  reviewViewMode === "timetable" ? "bg-blue-600 text-white" : "text-slate-600"
                }`}
              >
                시간표
              </button>
              <button
                type="button"
                onClick={() => setReviewViewMode("files")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  reviewViewMode === "files" ? "bg-indigo-600 text-white" : "text-slate-600"
                }`}
              >
                누적 ({teacherIepList.length})
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setReviewStudentFilterId("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold ${
              reviewStudentFilterId === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            전체 학생
          </button>
          {teacherAssignedStudents.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setReviewStudentFilterId(st.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                reviewStudentFilterId === st.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>
      </div>

      {reviewViewMode === "timetable" ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-extrabold text-slate-800">{reviewWeekLabel}</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => moveReviewWeek(-1)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
              >
                ◀ 이전 주
              </button>
              <button
                type="button"
                onClick={() => moveReviewWeek(1)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
              >
                다음 주 ▶
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed min-w-[720px]">
              <thead>
                <tr>
                  <th className="w-16 p-2 bg-slate-100 border border-slate-200 text-xs">교시</th>
                  {DAYS.map((day, idx) => (
                    <th
                      key={day}
                      className="p-2 bg-slate-100 border border-slate-200 text-xs"
                    >
                      {day} ({formatShortDate(reviewMonday, idx)})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period}>
                    <td className="p-2 bg-slate-50 border border-slate-200 text-center text-xs font-bold">
                      {period}교시
                    </td>
                    {DAYS.map((day) => {
                      const slot = filteredReviewSlots.find(
                        (s) => s.day === day && s.period === period
                      );
                      if (!slot) {
                        return (
                          <td
                            key={`${day}-${period}`}
                            className="p-1.5 border border-slate-200 h-20 bg-slate-50/40 text-center text-xs text-slate-300"
                          >
                            -
                          </td>
                        );
                      }
                      const catName = getCategoryName(slot.categoryId);
                      const theme = resolveCategoryTheme(categories, slot.categoryId);
                      return (
                        <td
                          key={`${day}-${period}`}
                          className="p-1.5 border border-slate-200 h-20 align-top"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedReviewSlotId(slot.id)}
                            className={`w-full h-full rounded-xl p-2 text-left border transition ${theme.card}`}
                          >
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${theme.badge}`}
                            >
                              {slot.isMakeupSlot ? `보강·${catName}` : catName}
                            </span>
                            <div className="text-[11px] font-bold text-slate-800 truncate mt-1">
                              {slot.studentIds
                                .map((id) => students.find((s) => s.id === id)?.name || "")
                                .join(", ")}
                            </div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedReviewSlot &&
            selectedReviewSlot.studentIds.map((stId) => {
              const recKey = `${reviewWeekKey}_${selectedReviewSlot.id}_${stId}`;
              const st = students.find((s) => s.id === stId);
              const rec = iepRecords[recKey];
              const att = attendanceRecords[recKey];
              const exactDate = getExactDateFromMondayKey(
                reviewWeekKey,
                selectedReviewSlot.day
              );

              if (!rec) return null;
              return renderAdminReviewCard(
                recKey,
                exactDate,
                `${selectedReviewSlot.day}${selectedReviewSlot.period}`,
                getCategoryName(selectedReviewSlot.categoryId),
                st,
                att,
                rec
              );
            })}
        </div>
      ) : (
        <div className="space-y-3">
          {teacherIepList.map((item) => {
            const isExpanded = selectedReviewFileKey === item.key;
            return (
              <div
                key={item.key}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setSelectedReviewFileKey(isExpanded ? null : item.key)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <span className="font-bold text-sm text-slate-800">
                    {item.exactDate} ({item.dayPeriod}) · {item.categoryName} ·{" "}
                    {item.student?.name}
                  </span>
                  <span className="text-xs font-bold text-indigo-600">
                    {isExpanded ? "접기 ▲" : "열기 ▼"}
                  </span>
                </button>
                {isExpanded && (
                  <div className="p-4 pt-0">
                    {renderAdminReviewCard(
                      item.key,
                      item.exactDate,
                      item.dayPeriod,
                      item.categoryName,
                      item.student,
                      item.attendance,
                      item.record
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}