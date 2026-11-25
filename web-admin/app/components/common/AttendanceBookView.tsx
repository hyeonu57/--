"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DAYS } from "../../constants/iep";
import {
  AttendanceStatus,
  ClassCategory,
  DayOfWeek,
  ManualMakeupItem,
  Student,
  TimetableSlot,
  UserAccount,
} from "../../types/iep";
import {
  calculateAge,
  computeStudentAttendanceStats,
  formatDateKey,
  getMonday,
  isSlotActiveInWeek,
} from "../../utils/iepHelpers";

interface AttendanceBookViewProps {
  currentUser: UserAccount;
  students: Student[];
  timetable: TimetableSlot[];
  attendanceRecords: Record<string, AttendanceStatus>;
  categories: ClassCategory[];
  users: UserAccount[];
  manualMakeupItems: ManualMakeupItem[];
  onSetAttendance: (recordKey: string, status: AttendanceStatus) => void;
  onAddManualMakeup: (item: Omit<ManualMakeupItem, "id" | "createdAt">) => void;
  onDeleteManualMakeup: (id: string) => void;
  onDismissAbsentMakeup: (recordKey: string, studentName: string) => void;
  onOpenCreateMakeup: (
    student: Student,
    slot: TimetableSlot,
    originalDate: string,
    manualMakeupId?: string
  ) => void;
  onOpenEditMakeup: (makeupSlot: TimetableSlot) => void;
}

interface DaySessionItem {
  recordKey: string;
  slot: TimetableSlot;
  categoryName: string;
  teacherName: string;
  status?: AttendanceStatus;
}

const WEEKDAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_INDEX_TO_KOREAN: Record<number, DayOfWeek> = {
  1: "월",
  2: "화",
  3: "수",
  4: "목",
  5: "금",
  6: "토",
};

export default function AttendanceBookView({
  currentUser,
  students,
  timetable,
  attendanceRecords,
  categories,
  users,
  manualMakeupItems,
  onSetAttendance,
  onAddManualMakeup,
  onDeleteManualMakeup,
  onDismissAbsentMakeup,
  onOpenCreateMakeup,
  onOpenEditMakeup,
}: AttendanceBookViewProps) {
  const teachersOnly = useMemo(() => users.filter((u) => u.role === "teacher"), [users]);

  const accessibleStudents = useMemo(() => {
    if (currentUser.role === "admin") return students;
    const assignedIds = new Set<string>();
    timetable
      .filter((s) => s.teacherId === currentUser.id)
      .forEach((s) => s.studentIds.forEach((id) => assignedIds.add(id)));
    return students.filter((st) => assignedIds.has(st.id));
  }, [currentUser, students, timetable]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(11);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [showAllStudentsSummary, setShowAllStudentsSummary] = useState<boolean>(false);

  // 잔여 미보강 수동 추가 폼 상태
  const [showAddMakeupForm, setShowAddMakeupForm] = useState<boolean>(false);
  const [newMakeupTeacherId, setNewMakeupTeacherId] = useState<string>("");
  const [newMakeupCategoryId, setNewMakeupCategoryId] = useState<string>("");
  const [newMakeupDate, setNewMakeupDate] = useState<string>("2026-11-25");
  const [newMakeupMemo, setNewMakeupMemo] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
    setNewMakeupDate(formatDateKey(now));
  }, []);

  useEffect(() => {
    if (
      accessibleStudents.length > 0 &&
      (!selectedStudentId || !accessibleStudents.some((s) => s.id === selectedStudentId))
    ) {
      setSelectedStudentId(accessibleStudents[0].id);
    }
  }, [accessibleStudents, selectedStudentId]);

  useEffect(() => {
    if (currentUser.role === "teacher") {
      setNewMakeupTeacherId(currentUser.id);
    } else if (!newMakeupTeacherId && teachersOnly[0]) {
      setNewMakeupTeacherId(teachersOnly[0].id);
    }
    if (!newMakeupCategoryId && categories[0]) {
      setNewMakeupCategoryId(categories[0].id);
    }
  }, [currentUser, teachersOnly, categories, newMakeupTeacherId, newMakeupCategoryId]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return accessibleStudents;
    return accessibleStudents.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        (st.schoolGradeClass || "").toLowerCase().includes(q)
    );
  }, [accessibleStudents, searchQuery]);

  const selectedStudent =
    accessibleStudents.find((st) => st.id === selectedStudentId) || accessibleStudents[0];

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || "미지정";

  const getTeacherName = (teacherId: string) =>
    users.find((u) => u.id === teacherId)?.name || "담당 교사";

  const calcStudentMonthStats = (studentId: string, year: number, month: number) => {
    const lastDay = new Date(year, month, 0).getDate();
    let totalSessions = 0;
    let presentCount = 0;
    let absentCount = 0;
    let makeupCount = 0;
    let uncheckedCount = 0;

    for (let d = 1; d <= lastDay; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayKor = DAY_INDEX_TO_KOREAN[dateObj.getDay()];
      if (!dayKor || !DAYS.includes(dayKor)) continue;

      const weekKey = formatDateKey(getMonday(dateObj));
      const daySlots = timetable.filter(
        (slot) =>
          slot.day === dayKor &&
          slot.studentIds.includes(studentId) &&
          isSlotActiveInWeek(slot, weekKey)
      );

      daySlots.forEach((slot) => {
        const recordKey = `${weekKey}_${slot.id}_${studentId}`;
        const status = attendanceRecords[recordKey];
        totalSessions++;
        if (status === "출석") presentCount++;
        else if (status === "결석") absentCount++;
        else if (status === "보강") makeupCount++;
        else uncheckedCount++;
      });
    }

    const attendanceRate =
      totalSessions > 0
        ? Math.round(((presentCount + makeupCount) / totalSessions) * 100)
        : 0;

    return {
      totalSessions,
      presentCount,
      absentCount,
      makeupCount,
      uncheckedCount,
      attendanceRate,
    };
  };

  const allStudentsMonthRows = useMemo(() => {
    return accessibleStudents.map((st) => {
      const mStats = calcStudentMonthStats(st.id, viewYear, viewMonth);
      const totalStats = computeStudentAttendanceStats(
        st.id,
        attendanceRecords,
        timetable,
        manualMakeupItems
      );
      return {
        student: st,
        ...mStats,
        pendingMakeup: totalStats.pendingMakeup,
      };
    });
  }, [accessibleStudents, viewYear, viewMonth, timetable, attendanceRecords, manualMakeupItems]);

  const { calendarCells, monthSummary } = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth, 0);
    const startWeekday = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const cells: Array<{
      date: Date | null;
      dateKey: string;
      dayNum: number;
      sessions: DaySessionItem[];
    }> = [];

    for (let i = 0; i < startWeekday; i++) {
      cells.push({ date: null, dateKey: `empty-start-${i}`, dayNum: 0, sessions: [] });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(viewYear, viewMonth - 1, d);
      const dateKey = formatDateKey(dateObj);
      const dayKor = DAY_INDEX_TO_KOREAN[dateObj.getDay()];
      const sessions: DaySessionItem[] = [];

      if (selectedStudent && dayKor && DAYS.includes(dayKor)) {
        const weekKey = formatDateKey(getMonday(dateObj));
        const daySlots = timetable
          .filter(
            (slot) =>
              slot.day === dayKor &&
              slot.studentIds.includes(selectedStudent.id) &&
              isSlotActiveInWeek(slot, weekKey)
          )
          .sort((a, b) => a.period - b.period);

        daySlots.forEach((slot) => {
          const recordKey = `${weekKey}_${slot.id}_${selectedStudent.id}`;
          sessions.push({
            recordKey,
            slot,
            categoryName: getCategoryName(slot.categoryId),
            teacherName: getTeacherName(slot.teacherId),
            status: attendanceRecords[recordKey],
          });
        });
      }

      cells.push({
        date: dateObj,
        dateKey,
        dayNum: d,
        sessions,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        date: null,
        dateKey: `empty-end-${cells.length}`,
        dayNum: 0,
        sessions: [],
      });
    }

    const summary = selectedStudent
      ? calcStudentMonthStats(selectedStudent.id, viewYear, viewMonth)
      : {
          totalSessions: 0,
          presentCount: 0,
          absentCount: 0,
          makeupCount: 0,
          uncheckedCount: 0,
          attendanceRate: 0,
        };

    return { calendarCells: cells, monthSummary: summary };
  }, [viewYear, viewMonth, selectedStudent, timetable, attendanceRecords, categories, users]);

  // 선택 학생의 미배정 잔여 미보강 목록(수동 추가 + 결석 기록)
  const pendingMakeupEntries = useMemo(() => {
    if (!selectedStudent) return [];
    const list: Array<{
      id: string;
      source: "manual" | "absent";
      baseDate: string;
      teacherId: string;
      categoryId: string;
      detailTitle: string;
      recordKey?: string;
      manualItem?: ManualMakeupItem;
      slotForModal: TimetableSlot;
    }> = [];

    // 1) 수동 추가된 미배정 잔여 미보강
    manualMakeupItems
      .filter((m) => m.studentId === selectedStudent.id && !m.scheduledSlotId)
      .forEach((m) => {
        const baseSlot =
          timetable.find(
            (s) => s.teacherId === m.teacherId && s.studentIds.includes(selectedStudent.id)
          ) ||
          ({
            id: `manual-slot-${m.id}`,
            teacherId: m.teacherId,
            day: "월",
            period: 1,
            categoryId: m.categoryId,
            detailTitle: m.memo || "잔여 보강 수업",
            studentIds: [selectedStudent.id],
          } as TimetableSlot);

        list.push({
          id: m.id,
          source: "manual",
          baseDate: m.baseDate,
          teacherId: m.teacherId,
          categoryId: m.categoryId,
          detailTitle: m.memo || "수동 추가 잔여 보강",
          manualItem: m,
          slotForModal: {
            ...baseSlot,
            categoryId: m.categoryId || baseSlot.categoryId,
            detailTitle: m.memo || baseSlot.detailTitle,
          },
        });
      });

    // 2) 결석 상태인데 아직 보강 슬롯이 연결되지 않은 기록
    Object.entries(attendanceRecords).forEach(([key, status]) => {
      if (status !== "결석" || !key.endsWith(`_${selectedStudent.id}`)) return;
      const hasLinkedMakeup = timetable.some(
        (s) => s.isMakeupSlot && s.makeupOriginRecordKey === key
      );
      if (hasLinkedMakeup) return;

      const [weekKey, slotId] = key.split("_");
      const slot = timetable.find((s) => s.id === slotId);
      if (!slot) return;

      list.push({
        id: key,
        source: "absent",
        baseDate: weekKey,
        teacherId: slot.teacherId,
        categoryId: slot.categoryId,
        detailTitle: slot.detailTitle || `${slot.day}요일 ${slot.period}교시 결석 보강`,
        recordKey: key,
        slotForModal: slot,
      });
    });

    return list;
  }, [selectedStudent, manualMakeupItems, attendanceRecords, timetable]);

  const handleCreateManualMakeupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const teacherId =
      currentUser.role === "teacher"
        ? currentUser.id
        : newMakeupTeacherId || teachersOnly[0]?.id || "t-1";
    const categoryId = newMakeupCategoryId || categories[0]?.id || "cat-1";

    onAddManualMakeup({
      studentId: selectedStudent.id,
      teacherId,
      categoryId,
      baseDate: newMakeupDate || formatDateKey(new Date()),
      memo: newMakeupMemo.trim() || undefined,
    });
    setNewMakeupMemo("");
    setShowAddMakeupForm(false);
  };

  const handlePrevMonth = () => {
    setSelectedDateKey(null);
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDateKey(null);
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
    setSelectedDateKey(formatDateKey(now));
  };

  const selectedDayCell = selectedDateKey
    ? calendarCells.find((c) => c.date && c.dateKey === selectedDateKey)
    : null;

  const overallStats = selectedStudent
    ? computeStudentAttendanceStats(
        selectedStudent.id,
        attendanceRecords,
        timetable,
        manualMakeupItems
      )
    : null;

  const findLinkedMakeupSlot = (recordKey: string) =>
    timetable.find((s) => s.isMakeupSlot && s.makeupOriginRecordKey === recordKey);

  const getOriginDateLabel = (slot: TimetableSlot) => {
    if (!slot.isMakeupSlot || !slot.makeupOriginRecordKey) return null;
    const weekPart = slot.makeupOriginRecordKey.split("_")[0];
    return `${weekPart} (${slot.makeupForDate || slot.day}요일 수업) 보강`;
  };

  const getStatusChipStyle = (status?: AttendanceStatus) => {
    if (status === "출석") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (status === "결석") return "bg-rose-100 text-rose-800 border-rose-200";
    if (status === "보강") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-5">
      {/* 상단 공통 월 선택 & 전체 학생 월간 요약표 토글 바 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-800">
            📅 학생별 월간 출석부
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            월간 출결 달력 · 전체 요약 비교 · 잔여 미보강 추가/배치/삭제
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAllStudentsSummary((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition ${
              showAllStudentsSummary
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            }`}
          >
            {showAllStudentsSummary
              ? "📊 전체 학생 월간 요약표 닫기"
              : "📊 전체 학생 월간 요약표 보기"}
          </button>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="px-2.5 py-1 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200"
            >
              ◀ 이전 달
            </button>
            <span className="px-2.5 text-xs sm:text-sm font-extrabold text-slate-800 min-w-[105px] text-center">
              {viewYear}년 {viewMonth}월
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="px-2.5 py-1 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200"
            >
              다음 달 ▶
            </button>
            <button
              type="button"
              onClick={handleJumpToday}
              className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg"
            >
              이번 달
            </button>
          </div>
        </div>
      </div>

      {/* 전체 학생 월간 출결 요약표 */}
      {showAllStudentsSummary && (
        <section className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">
                📊 {viewYear}년 {viewMonth}월 전체 학생 출결 요약표
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                행을 클릭하면 해당 학생의 월간 달력으로 바로 이동합니다.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              총 {allStudentsMonthRows.length}명
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[680px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-2.5 border border-slate-200 text-left font-extrabold">
                    학생명
                  </th>
                  <th className="p-2.5 border border-slate-200 text-left font-extrabold">
                    학교·반 / 나이
                  </th>
                  <th className="p-2.5 border border-slate-200 text-center font-extrabold">
                    이달 수업
                  </th>
                  <th className="p-2.5 border border-slate-200 text-center font-extrabold text-emerald-700">
                    출석
                  </th>
                  <th className="p-2.5 border border-slate-200 text-center font-extrabold text-rose-700">
                    결석
                  </th>
                  <th className="p-2.5 border border-slate-200 text-center font-extrabold text-amber-700">
                    보강
                  </th>
                  <th className="p-2.5 border border-slate-200 text-center font-extrabold text-slate-500">
                    미체크
                  </th>
                  <th className="p-2.5 border border-slate-200 text-center font-extrabold text-rose-600">
                    미보강 잔여
                  </th>
                  <th className="p-2.5 border border-slate-200 text-center font-extrabold text-blue-700">
                    이달 출석률
                  </th>
                </tr>
              </thead>
              <tbody>
                {allStudentsMonthRows.map((row) => {
                  const isCurrent = selectedStudent?.id === row.student.id;
                  return (
                    <tr
                      key={row.student.id}
                      onClick={() => {
                        setSelectedStudentId(row.student.id);
                        setSelectedDateKey(null);
                        setShowAllStudentsSummary(false);
                      }}
                      className={`cursor-pointer transition ${
                        isCurrent ? "bg-blue-50/80 font-bold" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="p-2.5 border border-slate-200 font-extrabold text-slate-800">
                        {row.student.name}
                      </td>
                      <td className="p-2.5 border border-slate-200 text-slate-600">
                        {row.student.schoolGradeClass ||
                          `만 ${calculateAge(row.student.birthDate)}세`}
                      </td>
                      <td className="p-2.5 border border-slate-200 text-center font-bold">
                        {row.totalSessions}회
                      </td>
                      <td className="p-2.5 border border-slate-200 text-center font-extrabold text-emerald-700">
                        {row.presentCount}회
                      </td>
                      <td className="p-2.5 border border-slate-200 text-center font-extrabold text-rose-700">
                        {row.absentCount}회
                      </td>
                      <td className="p-2.5 border border-slate-200 text-center font-extrabold text-amber-700">
                        {row.makeupCount}회
                      </td>
                      <td className="p-2.5 border border-slate-200 text-center text-slate-500">
                        {row.uncheckedCount}회
                      </td>
                      <td className="p-2.5 border border-slate-200 text-center">
                        {row.pendingMakeup > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[11px]">
                            {row.pendingMakeup}회
                          </span>
                        ) : (
                          <span className="text-slate-400">0회</span>
                        )}
                      </td>
                      <td className="p-2.5 border border-slate-200 text-center font-extrabold text-blue-700">
                        {row.attendanceRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3 h-fit">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="학생 이름 · 학교 검색..."
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                표시할 학생이 없습니다.
              </div>
            ) : (
              filteredStudents.map((st) => {
                const isSelected = selectedStudent?.id === st.id;
                const stats = computeStudentAttendanceStats(
                  st.id,
                  attendanceRecords,
                  timetable,
                  manualMakeupItems
                );
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(st.id);
                      setSelectedDateKey(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{st.name}</span>
                      {stats.pendingMakeup > 0 && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          미보강 {stats.pendingMakeup}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 truncate ${
                        isSelected ? "text-blue-100" : "text-slate-500"
                      }`}
                    >
                      {st.schoolGradeClass || `만 ${calculateAge(st.birthDate)}세`}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="lg:col-span-9 space-y-4">
          {!selectedStudent ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-400">
              좌측에서 학생을 선택해 주세요.
            </div>
          ) : (
            <>
              {/* 선택 학생 정보 + 잔여 미보강 추가 버튼 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-slate-800">
                        {selectedStudent.name}
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {selectedStudent.schoolGradeClass ||
                          `만 ${calculateAge(selectedStudent.birthDate)}세`}
                      </span>
                    </div>
                    {overallStats && (
                      <p className="text-xs text-slate-500 mt-1">
                        누적 전체: 출석 {overallStats.present}회 · 결석 {overallStats.absent}회 ·
                        보강 {overallStats.makeup}회 ·{" "}
                        <span className="font-extrabold text-rose-600">
                          미보강 잔여 {overallStats.pendingMakeup}회
                        </span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddMakeupForm((prev) => !prev)}
                    className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white transition"
                  >
                    {showAddMakeupForm ? "닫기 ✕" : "+ 잔여 미보강 추가"}
                  </button>
                </div>

                {/* 잔여 미보강 수동 추가 폼 */}
                {showAddMakeupForm && (
                  <form
                    onSubmit={handleCreateManualMakeupSubmit}
                    className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end"
                  >
                    {currentUser.role === "admin" && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          담당 교사
                        </label>
                        <select
                          value={newMakeupTeacherId}
                          onChange={(e) => setNewMakeupTeacherId(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        >
                          {teachersOnly.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        수업 종류
                      </label>
                      <select
                        value={newMakeupCategoryId}
                        onChange={(e) => setNewMakeupCategoryId(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        기준 날짜
                      </label>
                      <input
                        type="date"
                        value={newMakeupDate}
                        onChange={(e) => setNewMakeupDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        required
                      />
                    </div>

                    <div className={currentUser.role === "admin" ? "" : "lg:col-span-2"}>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        메모 (선택)
                      </label>
                      <input
                        type="text"
                        value={newMakeupMemo}
                        onChange={(e) => setNewMakeupMemo(e.target.value)}
                        placeholder="예: 이월 보강 1회"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-extrabold transition"
                    >
                      추가 등록
                    </button>
                  </form>
                )}

                {/* 잔여 미보강 목록: 주간 시간표에 바로 추가 & 관리자 삭제 */}
                {pendingMakeupEntries.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-extrabold text-rose-700">
                      ⚠️ 잔여 미보강 목록 ({pendingMakeupEntries.length}건) — 주간 시간표에
                      배치하거나 관리할 수 있습니다.
                    </div>
                    <div className="space-y-1.5">
                      {pendingMakeupEntries.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-50/50 border border-rose-200 text-xs"
                        >
                          <div>
                            <span className="font-extrabold text-slate-800">
                              [{item.source === "manual" ? "직접추가" : "결석연계"}]{" "}
                              {getCategoryName(item.categoryId)}
                            </span>
                            <span className="text-slate-600 ml-1.5">
                              · 기준: {item.baseDate} · 담당: {getTeacherName(item.teacherId)}
                              {item.detailTitle ? ` · ${item.detailTitle}` : ""}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                onOpenCreateMakeup(
                                  selectedStudent,
                                  item.slotForModal,
                                  item.baseDate,
                                  item.source === "manual" ? item.id : undefined
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold transition"
                            >
                              + 주간 시간표에 추가
                            </button>

                            {currentUser.role === "admin" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.source === "manual") {
                                    onDeleteManualMakeup(item.id);
                                  } else if (item.recordKey) {
                                    onDismissAbsentMakeup(
                                      item.recordKey,
                                      selectedStudent.name
                                    );
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold transition"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 해당 월 요약 카드 5개 */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400">이달 총 수업</div>
                  <div className="text-xl font-extrabold text-slate-800 mt-1">
                    {monthSummary.totalSessions}회
                  </div>
                </div>
                <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-3.5">
                  <div className="text-[11px] font-bold text-emerald-700">출석</div>
                  <div className="text-xl font-extrabold text-emerald-800 mt-1">
                    {monthSummary.presentCount}회
                  </div>
                </div>
                <div className="bg-rose-50/70 rounded-2xl border border-rose-200 p-3.5">
                  <div className="text-[11px] font-bold text-rose-700">결석</div>
                  <div className="text-xl font-extrabold text-rose-800 mt-1">
                    {monthSummary.absentCount}회
                  </div>
                </div>
                <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-3.5">
                  <div className="text-[11px] font-bold text-amber-700">보강</div>
                  <div className="text-xl font-extrabold text-amber-800 mt-1">
                    {monthSummary.makeupCount}회
                  </div>
                </div>
                <div className="bg-blue-50/70 rounded-2xl border border-blue-200 p-3.5 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-bold text-blue-700">이달 출석률</div>
                  <div className="text-xl font-extrabold text-blue-800 mt-1">
                    {monthSummary.attendanceRate}%
                  </div>
                </div>
              </div>

              {/* 월간 달력 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="grid grid-cols-7 border-t border-l border-slate-200 rounded-xl overflow-hidden">
                  {WEEKDAY_HEADERS.map((w, idx) => (
                    <div
                      key={w}
                      className={`py-2 text-center text-xs font-extrabold bg-slate-100 border-r border-b border-slate-200 ${
                        idx === 0
                          ? "text-rose-600"
                          : idx === 6
                          ? "text-blue-600"
                          : "text-slate-700"
                      }`}
                    >
                      {w}
                    </div>
                  ))}

                  {calendarCells.map((cell) => {
                    if (!cell.date) {
                      return (
                        <div
                          key={cell.dateKey}
                          className="min-h-[96px] bg-slate-50/70 border-r border-b border-slate-200"
                        />
                      );
                    }

                    const weekday = cell.date.getDay();
                    const isSelected = selectedDateKey === cell.dateKey;
                    const hasSessions = cell.sessions.length > 0;

                    return (
                      <button
                        key={cell.dateKey}
                        type="button"
                        onClick={() => setSelectedDateKey(cell.dateKey)}
                        className={`min-h-[96px] p-1.5 border-r border-b border-slate-200 text-left flex flex-col justify-between transition ${
                          isSelected
                            ? "bg-blue-50/80 ring-2 ring-inset ring-blue-500"
                            : hasSessions
                            ? "bg-white hover:bg-slate-50"
                            : "bg-white/60 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-extrabold ${
                              weekday === 0
                                ? "text-rose-500"
                                : weekday === 6
                                ? "text-blue-600"
                                : "text-slate-700"
                            }`}
                          >
                            {cell.dayNum}
                          </span>
                          {hasSessions && (
                            <span className="text-[10px] font-bold text-slate-400">
                              {cell.sessions.length}건
                            </span>
                          )}
                        </div>

                        <div className="w-full space-y-1 mt-1">
                          {cell.sessions.map((item) => (
                            <div
                              key={item.recordKey}
                              className={`px-1.5 py-0.5 rounded border text-[10px] font-bold truncate ${getStatusChipStyle(
                                item.status
                              )}`}
                            >
                              {item.slot.isMakeupSlot ? "보강·" : ""}
                              {item.slot.period}교시 · {item.status || "미체크"}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 선택 날짜 상세 패널 */}
              {selectedDayCell && (
                <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-800">
                      📌 {selectedDayCell.dateKey} (
                      {WEEKDAY_HEADERS[selectedDayCell.date!.getDay()]}요일) 수업 출결 및 보강
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSelectedDateKey(null)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-700"
                    >
                      닫기 ✕
                    </button>
                  </div>

                  {selectedDayCell.sessions.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">
                      해당 날짜에 배정된 수업이 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayCell.sessions.map((item) => {
                        const linkedMakeup = findLinkedMakeupSlot(item.recordKey);
                        const originLabel = getOriginDateLabel(item.slot);

                        return (
                          <div
                            key={item.recordKey}
                            className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                          >
                            <div className="space-y-1">
                              <div className="text-xs font-extrabold text-slate-800">
                                {item.slot.period}교시 · {item.categoryName}
                                {item.slot.isMakeupSlot && (
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">
                                    보강수업
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                담당: {item.teacherName}
                                {item.slot.detailTitle ? ` · ${item.slot.detailTitle}` : ""}
                              </div>
                              {originLabel && (
                                <div className="text-[11px] font-bold text-amber-700">
                                  🔗 연결 정보: {originLabel}
                                </div>
                              )}
                              {linkedMakeup && (
                                <div className="text-[11px] font-bold text-blue-700">
                                  🔗 연결된 보강: {linkedMakeup.makeupWeekKey || "예정"} (
                                  {linkedMakeup.day}요일 {linkedMakeup.period}교시)
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {(["출석", "결석", "보강"] as AttendanceStatus[]).map((st) => {
                                const active = item.status === st;
                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => onSetAttendance(item.recordKey, st)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition ${
                                      active
                                        ? st === "출석"
                                          ? "bg-emerald-600 text-white border-emerald-600"
                                          : st === "결석"
                                          ? "bg-rose-600 text-white border-rose-600"
                                          : "bg-amber-600 text-white border-amber-600"
                                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                                    }`}
                                  >
                                    {st}
                                  </button>
                                );
                              })}

                              {item.slot.isMakeupSlot ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenEditMakeup(item.slot)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition"
                                >
                                  ✏️ 보강 수정/취소
                                </button>
                              ) : linkedMakeup ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenEditMakeup(linkedMakeup)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition"
                                >
                                  🔗 보강 일정 관리
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenCreateMakeup(
                                      selectedStudent,
                                      item.slot,
                                      selectedDayCell.dateKey
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-slate-800 text-white hover:bg-slate-700 transition"
                                >
                                  + 보강 일정 잡기
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
