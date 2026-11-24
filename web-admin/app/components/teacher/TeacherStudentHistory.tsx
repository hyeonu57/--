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
  calculateAge,
  computeStudentAttendanceStats,
  formatDateKey,
  formatShortDate,
  getAttendanceBadgeStyle,
  getExactDateFromMondayKey,
  getProgressBadgeStyle,
  getProgressEmoji,
  isSlotActiveInWeek,
  parseActivitySections,
  resolveCategoryTheme,
} from "../../utils/iepHelpers";

interface TeacherStudentHistoryProps {
  currentUser: UserAccount;
  initialStudentId: string;
  initialMonday: Date;
  students: Student[];
  categories: ClassCategory[];
  timetable: TimetableSlot[];
  iepRecords: Record<string, IEPRecord>;
  attendanceRecords: Record<string, AttendanceStatus>;
}

export default function TeacherStudentHistory({
  currentUser,
  initialStudentId,
  initialMonday,
  students,
  categories,
  timetable,
  iepRecords,
  attendanceRecords,
}: TeacherStudentHistoryProps) {
  const myAssignedStudents = (() => {
    const teacherSlots = timetable.filter((slot) => slot.teacherId === currentUser.id);
    const assignedIds = new Set<string>();
    teacherSlots.forEach((slot) => slot.studentIds.forEach((id) => assignedIds.add(id)));
    return students.filter((st) => assignedIds.has(st.id));
  })();

  const [historyStudentId, setHistoryStudentId] = useState<string>(
    initialStudentId || myAssignedStudents[0]?.id || ""
  );
  const [historyMonday, setHistoryMonday] = useState<Date>(initialMonday);
  const [historyViewMode, setHistoryViewMode] = useState<"timetable" | "files">("timetable");
  const [selectedHistoryKey, setSelectedHistoryKey] = useState<string | null>(null);

  const targetStudent =
    myAssignedStudents.find((s) => s.id === historyStudentId) || myAssignedStudents[0];
  const targetAge = targetStudent ? calculateAge(targetStudent.birthDate) : null;
  const stats = targetStudent
    ? computeStudentAttendanceStats(targetStudent.id, attendanceRecords, timetable)
    : { present: 0, absent: 0, makeup: 0, pendingMakeup: 0, total: 0 };

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || "미지정";

  const historyWeekKey = formatDateKey(historyMonday);
  const historyWeekLabel = `${historyMonday.getFullYear()}년 ${formatShortDate(
    historyMonday,
    0
  )} (월) ~ ${formatShortDate(historyMonday, 5)} (토)`;

  const studentSlots = targetStudent
    ? timetable.filter(
        (slot) =>
          slot.teacherId === currentUser.id &&
          slot.studentIds.includes(targetStudent.id) &&
          isSlotActiveInWeek(slot, historyWeekKey)
      )
    : [];

  const allSessionKeys = new Set<string>([
    ...Object.keys(iepRecords),
    ...Object.keys(attendanceRecords),
  ]);

  const studentHistoryList = Array.from(allSessionKeys)
    .filter((key) => {
      const [, sId, stId] = key.split("_");
      if (stId !== targetStudent?.id) return false;
      const slot = timetable.find((s) => s.id === sId);
      if (slot && slot.teacherId !== currentUser.id) return false;

      const rec = iepRecords[key];
      const att = attendanceRecords[key];
      const hasIep =
        rec &&
        Boolean(
          rec.sessionGoal.trim() ||
            rec.activityContent.trim() ||
            rec.supportStrategy.trim() ||
            rec.evaluation.trim() ||
            rec.nextPlan.trim()
        );
      return hasIep || Boolean(att);
    })
    .map((key) => {
      const [mondayKey, slotId] = key.split("_");
      const slot = timetable.find((s) => s.id === slotId);
      const exactDate = slot ? getExactDateFromMondayKey(mondayKey, slot.day) : mondayKey;
      const categoryName = slot ? getCategoryName(slot.categoryId) : "수업";
      const theme = resolveCategoryTheme(categories, slot ? slot.categoryId : categoryName);

      return {
        key,
        mondayKey,
        slotId,
        exactDate,
        dayPeriod: slot ? `${slot.day}${slot.period}` : "-",
        categoryName,
        theme,
        attendance: attendanceRecords[key],
        record: iepRecords[key] || {
          sessionGoal: "",
          activityContent: "",
          supportStrategy: "",
          evaluation: "",
          nextPlan: "",
        },
      };
    })
    .sort((a, b) => b.exactDate.localeCompare(a.exactDate));

  const moveHistoryWeek = (weeks: number) => {
    const next = new Date(historyMonday);
    next.setDate(historyMonday.getDate() + weeks * 7);
    setHistoryMonday(next);
    setSelectedHistoryKey(null);
  };

  const activeDetailItem =
    studentHistoryList.find((item) => item.key === selectedHistoryKey) || null;

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className="text-xl font-bold text-slate-800">
          📚 {currentUser.name} 담당 학생 누적 IEP & 출결 조회
        </h2>
        {targetStudent && (
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
          >
            🖨️ {targetStudent.name} 상담 보고서 인쇄 / PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 print:block gap-6">
        <section className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit print:hidden">
          <h3 className="text-sm font-bold text-slate-800 mb-3 pb-2.5 border-b border-slate-100">
            담당 학생 명단 ({myAssignedStudents.length}명)
          </h3>
          <div className="space-y-2">
            {myAssignedStudents.map((st) => {
              const age = calculateAge(st.birthDate);
              const isSelected = st.id === targetStudent?.id;
              const stStats = computeStudentAttendanceStats(
                st.id,
                attendanceRecords,
                timetable
              );

              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setHistoryStudentId(st.id);
                    setSelectedHistoryKey(null);
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left transition ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600"
                      : "bg-slate-50/70 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-800">{st.name}</span>
                      {age !== null && (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          만 {age}세
                        </span>
                      )}
                      {stStats.pendingMakeup > 0 && (
                        <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-full">
                          미보강 {stStats.pendingMakeup}회
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">
                      누적 {stStats.total}회
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-8 space-y-5">
          {targetStudent && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 print:border-slate-400">
                <div className="hidden print:block text-center border-b border-slate-300 pb-3 mb-3">
                  <h1 className="text-lg font-extrabold text-slate-900">
                    사이언스 특수체육센터 개별화 교육(IEP) 상담 보고서
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    담당 교사: {currentUser.name} · 출력일: {formatDateKey(new Date())}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-800">{targetStudent.name}</h3>
                    {targetAge !== null && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                        만 {targetAge}세
                      </span>
                    )}
                    {targetStudent.schoolGradeClass && (
                      <span className="text-xs text-slate-500 font-semibold">
                        ({targetStudent.schoolGradeClass})
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                      미보강 잔여 {stats.pendingMakeup}회
                    </span>
                  </div>
                  <div className="flex gap-1.5 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700">
                      출석 {stats.present}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700">
                      결석 {stats.absent}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700">
                      보강 {stats.makeup}
                    </span>
                  </div>
                </div>
                <div className="text-xs space-y-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <strong>초기 상담:</strong> {targetStudent.initialConsultInfo}
                  </div>
                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                    <strong>현재 상태:</strong> {targetStudent.currentStatusInfo}
                  </div>
                  <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200">
                    <strong>장기목표:</strong> {targetStudent.longTermGoal || "미설정"}
                  </div>
                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                    <strong>단기목표:</strong> {targetStudent.shortTermGoal || "미설정"}
                  </div>
                </div>
              </div>

              <div className="hidden print:block space-y-3">
                <h4 className="text-sm font-extrabold text-slate-800 border-b border-slate-300 pb-1.5">
                  회기별 IEP 수업 및 평가 기록 ({studentHistoryList.length}건)
                </h4>
                {studentHistoryList.map((item) => {
                  const sec = parseActivitySections(item.record);
                  return (
                    <div
                      key={item.key}
                      className="p-4 rounded-xl border border-slate-300 text-xs space-y-2 break-inside-avoid"
                    >
                      <div className="flex items-center justify-between font-bold border-b border-slate-200 pb-1.5">
                        <span>
                          {item.exactDate} ({item.dayPeriod}) · {item.categoryName}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.attendance && <span>출결: {item.attendance}</span>}
                          {item.record.progressStatus && (
                            <span>진전도: {item.record.progressStatus}</span>
                          )}
                        </div>
                      </div>
                      <p>
                        <strong>세부 목표:</strong> {item.record.sessionGoal || "-"}
                      </p>
                      {sec.top || sec.bottom ? (
                        <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg">
                          <p>
                            <strong>[상] 준비·동기유발:</strong> {sec.top || "-"}
                          </p>
                          <p>
                            <strong>[중] 본시수업:</strong> {sec.middle || "-"}
                          </p>
                          <p>
                            <strong>[하] 마무리·피드백:</strong> {sec.bottom || "-"}
                          </p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">
                          <strong>활동 내용:</strong> {item.record.activityContent || "-"}
                        </p>
                      )}
                      <p>
                        <strong>지원 전략:</strong> {item.record.supportStrategy || "-"}
                      </p>
                      <p>
                        <strong>수행 결과:</strong> {item.record.evaluation || "-"}
                      </p>
                      {item.record.adminFeedback && (
                        <p className="text-emerald-900 bg-emerald-50 p-2 rounded">
                          <strong>관리자 피드백:</strong> {item.record.adminFeedback}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 print:hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-base font-bold text-slate-800">
                    📂 {targetStudent.name} 누적 기록
                  </h4>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setHistoryViewMode("timetable")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        historyViewMode === "timetable"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600"
                      }`}
                    >
                      주간 시간표
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryViewMode("files")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        historyViewMode === "files"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600"
                      }`}
                    >
                      누적 요약 ({studentHistoryList.length})
                    </button>
                  </div>
                </div>

                {historyViewMode === "timetable" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-extrabold text-slate-800">
                        {historyWeekLabel}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveHistoryWeek(-1)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        >
                          ◀ 이전 주
                        </button>
                        <button
                          type="button"
                          onClick={() => moveHistoryWeek(1)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        >
                          다음 주 ▶
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse table-fixed min-w-[600px]">
                        <thead>
                          <tr>
                            <th className="w-14 p-2 bg-slate-100 border border-slate-200 text-[11px]">
                              교시
                            </th>
                            {DAYS.map((day, idx) => (
                              <th
                                key={day}
                                className="p-2 bg-slate-100 border border-slate-200 text-[11px]"
                              >
                                {day} ({formatShortDate(historyMonday, idx)})
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {PERIODS.map((period) => (
                            <tr key={period}>
                              <td className="p-1.5 bg-slate-50 border border-slate-200 text-center text-[11px] font-bold">
                                {period}교시
                              </td>
                              {DAYS.map((day) => {
                                const slot = studentSlots.find(
                                  (s) => s.day === day && s.period === period
                                );
                                if (!slot) {
                                  return (
                                    <td
                                      key={`${day}-${period}`}
                                      className="p-1 border border-slate-200 h-16 bg-slate-50/40 text-center text-[10px] text-slate-300"
                                    >
                                      -
                                    </td>
                                  );
                                }
                                const catName = getCategoryName(slot.categoryId);
                                const theme = resolveCategoryTheme(categories, slot.categoryId);
                                const sessionKey = `${historyWeekKey}_${slot.id}_${targetStudent.id}`;
                                const rec = iepRecords[sessionKey];
                                const att = attendanceRecords[sessionKey];
                                return (
                                  <td
                                    key={`${day}-${period}`}
                                    className="p-1 border border-slate-200 h-16 align-top"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setSelectedHistoryKey(sessionKey)}
                                      className={`w-full h-full rounded-lg p-1.5 text-left border ${theme.card}`}
                                    >
                                      <span
                                        className={`text-[10px] font-extrabold px-1 rounded ${theme.badge}`}
                                      >
                                        {slot.isMakeupSlot ? `보강·${catName}` : catName}
                                      </span>
                                      <div className="text-[10px] truncate mt-1 text-slate-700">
                                        {att ? `[${att}] ` : ""}
                                        {rec?.activityContent ? "IEP 있음" : "미작성"}
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

                    {selectedHistoryKey && iepRecords[selectedHistoryKey] && (
                      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs space-y-2">
                        <div className="flex justify-between font-bold text-indigo-900">
                          <span>선택된 회기 IEP 상세</span>
                          <button type="button" onClick={() => setSelectedHistoryKey(null)}>
                            닫기 ✕
                          </button>
                        </div>
                        <p>
                          <strong>목표:</strong>{" "}
                          {iepRecords[selectedHistoryKey].sessionGoal || "-"}
                        </p>
                        <p className="whitespace-pre-wrap">
                          <strong>활동:</strong>{" "}
                          {iepRecords[selectedHistoryKey].activityContent || "-"}
                        </p>
                        <p className="whitespace-pre-wrap">
                          <strong>지원:</strong>{" "}
                          {iepRecords[selectedHistoryKey].supportStrategy || "-"}
                        </p>
                        <p className="whitespace-pre-wrap">
                          <strong>결과:</strong>{" "}
                          {iepRecords[selectedHistoryKey].evaluation || "-"}
                        </p>
                        {iepRecords[selectedHistoryKey].adminFeedback && (
                          <p className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-emerald-900">
                            <strong>관리자 피드백:</strong>{" "}
                            {iepRecords[selectedHistoryKey].adminFeedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentHistoryList.map((item) => {
                      const isExpanded = activeDetailItem?.key === item.key;
                      const sec = parseActivitySections(item.record);
                      return (
                        <div
                          key={item.key}
                          className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryKey(isExpanded ? null : item.key)}
                            className="w-full p-4 flex flex-wrap items-center justify-between gap-2 text-left"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-slate-800">
                                {item.exactDate} ({item.dayPeriod}) · {item.categoryName} IEP
                              </span>
                              {item.attendance && (
                                <span
                                  className={`px-2 py-0.5 text-[11px] font-bold rounded border ${getAttendanceBadgeStyle(
                                    item.attendance
                                  )}`}
                                >
                                  {item.attendance}
                                </span>
                              )}
                              {item.record.progressStatus && (
                                <span
                                  className={`px-2 py-0.5 text-[11px] font-bold rounded border ${getProgressBadgeStyle(
                                    item.record.progressStatus
                                  )}`}
                                >
                                  {getProgressEmoji(item.record.progressStatus)}{" "}
                                  {item.record.progressStatus}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-indigo-600">
                              {isExpanded ? "접기 ▲" : "열기 ▼"}
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-slate-200 text-xs space-y-2 bg-white">
                              <p>
                                <strong>세부 목표:</strong> {item.record.sessionGoal || "-"}
                              </p>
                              {sec.top || sec.bottom ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200">
                                    <span className="font-bold text-sky-900 block mb-0.5">
                                      상 · 준비운동/동기유발
                                    </span>
                                    <p className="whitespace-pre-wrap">{sec.top || "-"}</p>
                                  </div>
                                  <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                                    <span className="font-bold text-indigo-900 block mb-0.5">
                                      중 · 본시수업
                                    </span>
                                    <p className="whitespace-pre-wrap">{sec.middle || "-"}</p>
                                  </div>
                                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                                    <span className="font-bold text-emerald-900 block mb-0.5">
                                      하 · 마무리/피드백
                                    </span>
                                    <p className="whitespace-pre-wrap">{sec.bottom || "-"}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap">
                                  <strong>활동 내용:</strong> {item.record.activityContent || "-"}
                                </p>
                              )}
                              <p className="whitespace-pre-wrap">
                                <strong>지원 전략:</strong> {item.record.supportStrategy || "-"}
                              </p>
                              <p className="whitespace-pre-wrap">
                                <strong>수행 결과:</strong> {item.record.evaluation || "-"}
                              </p>
                              {item.record.adminFeedback && (
                                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950">
                                  <strong>✍️ 관리자 피드백:</strong> {item.record.adminFeedback}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}