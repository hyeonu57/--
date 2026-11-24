"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DAYS } from "../../constants/iep";
import {
  AttendanceStatus,
  ClassCategory,
  DayOfWeek,
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
  onSetAttendance: (recordKey: string, status: AttendanceStatus) => void;
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
  onSetAttendance,
}: AttendanceBookViewProps) {
  // 선생님 모드면 본인 수업에 배정된 학생만 필터링
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
  const [viewMonth, setViewMonth] = useState<number>(11); // 1 ~ 12
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
  }, []);

  useEffect(() => {
    if (
      accessibleStudents.length > 0 &&
      (!selectedStudentId || !accessibleStudents.some((s) => s.id === selectedStudentId))
    ) {
      setSelectedStudentId(accessibleStudents[0].id);
    }
  }, [accessibleStudents, selectedStudentId]);

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

  // 해당 월의 달력 칸(일요일 시작 7열 그리드)과 날짜별 수업 매핑 계산
  const { calendarCells, monthSummary } = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth, 0);
    const startWeekday = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)
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

    let totalSessions = 0;
    let presentCount = 0;
    let absentCount = 0;
    let makeupCount = 0;
    let uncheckedCount = 0;

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(viewYear, viewMonth - 1, d);
      const dateKey = formatDateKey(dateObj);
      const weekday = dateObj.getDay();
      const dayKor = DAY_INDEX_TO_KOREAN[weekday];
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
          const status = attendanceRecords[recordKey];
          totalSessions++;
          if (status === "출석") presentCount++;
          else if (status === "결석") absentCount++;
          else if (status === "보강") makeupCount++;
          else uncheckedCount++;

          sessions.push({
            recordKey,
            slot,
            categoryName: getCategoryName(slot.categoryId),
            teacherName: getTeacherName(slot.teacherId),
            status,
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

    const attendanceRate =
      totalSessions > 0
        ? Math.round(((presentCount + makeupCount) / totalSessions) * 100)
        : 0;

    return {
      calendarCells: cells,
      monthSummary: {
        totalSessions,
        presentCount,
        absentCount,
        makeupCount,
        uncheckedCount,
        attendanceRate,
      },
    };
  }, [viewYear, viewMonth, selectedStudent, timetable, attendanceRecords, categories, users]);

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
    ? computeStudentAttendanceStats(selectedStudent.id, attendanceRecords, timetable)
    : null;

  const getStatusChipStyle = (status?: AttendanceStatus) => {
    if (status === "출석") {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (status === "결석") {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    if (status === "보강") {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 왼쪽: 학생 선택 목록 */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3 h-fit">
          <div>
            <h2 className="text-base font-bold text-slate-800">📅 학생별 출석부</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.role === "admin"
                ? "전체 등록 학생의 월간 출결 달력"
                : "담당 학생의 월간 출결 달력"}
            </p>
          </div>

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
                  timetable
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

        {/* 오른쪽: 월간 달력 & 출결 요약 */}
        <section className="lg:col-span-9 space-y-4">
          {!selectedStudent ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-400">
              좌측에서 학생을 선택해 주세요.
            </div>
          ) : (
            <>
              {/* 학생 헤더 + 월 이동 컨트롤 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-800">
                      {selectedStudent.name} 출석부
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {selectedStudent.schoolGradeClass ||
                        `만 ${calculateAge(selectedStudent.birthDate)}세`}
                    </span>
                  </div>
                  {overallStats && (
                    <p className="text-xs text-slate-500 mt-1">
                      누적 전체: 출석 {overallStats.present}회 · 결석 {overallStats.absent}회 ·
                      보강 {overallStats.makeup}회 (미보강 잔여 {overallStats.pendingMakeup}회)
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="px-3 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200"
                  >
                    ◀ 이전 달
                  </button>
                  <span className="px-3 text-sm font-extrabold text-slate-800 min-w-[115px] text-center">
                    {viewYear}년 {viewMonth}월
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="px-3 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200"
                  >
                    다음 달 ▶
                  </button>
                  <button
                    type="button"
                    onClick={handleJumpToday}
                    className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg ml-1"
                  >
                    이번 달
                  </button>
                </div>
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

              {/* 월간 달력 본문 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-slate-600">
                    날짜 칸을 클릭하면 해당 날짜의 출결 상태를 바로 변경할 수 있습니다.
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      ● 출석
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      ● 결석
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      ● 보강
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      ● 미체크
                    </span>
                  </div>
                </div>

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
                              {item.slot.period}교시 · {item.status || "미체크"}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 선택한 날짜의 상세 출결 & 빠른 상태 변경 패널 */}
              {selectedDayCell && (
                <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-800">
                      📌 {selectedDayCell.dateKey} ({WEEKDAY_HEADERS[selectedDayCell.date!.getDay()]}
                      요일) 수업 출결 상세
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
                      {selectedDayCell.sessions.map((item) => (
                        <div
                          key={item.recordKey}
                          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <div>
                            <div className="text-xs font-extrabold text-slate-800">
                              {item.slot.period}교시 · {item.categoryName}
                              {item.slot.isMakeupSlot && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">
                                  보강수업
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              담당: {item.teacherName}
                              {item.slot.detailTitle ? ` · ${item.slot.detailTitle}` : ""}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
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
                          </div>
                        </div>
                      ))}
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