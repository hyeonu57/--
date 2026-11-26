"use client";

import React, { useEffect, useState } from "react";
import AdminDashboardAndNotifications from "./components/admin/AdminDashboardAndNotifications";
import AdminIepReview from "./components/admin/AdminIepReview";
import {
  AdminAccountsView,
  AdminCategoriesView,
  AdminStudentsView,
} from "./components/admin/AdminManagementViews";
import AdminWeeklyTasks from "./components/admin/AdminWeeklyTasks";
import AttendanceBookView from "./components/common/AttendanceBookView";
import ConfirmModal from "./components/common/ConfirmModal";
import Header from "./components/common/Header";
import MakeupScheduleModal, {
  MakeupModalPayload,
} from "./components/common/MakeupScheduleModal";
import SessionDetailView from "./components/teacher/SessionDetailView";
import TeacherStudentHistory from "./components/teacher/TeacherStudentHistory";
import TeacherWeeklyTasks from "./components/teacher/TeacherWeeklyTasks";
import {
  DAYS,
  DEFAULT_MIDDLE_TEMPLATES,
  INITIAL_CATEGORIES,
  INITIAL_STUDENTS,
  INITIAL_TIMETABLE,
  INITIAL_USERS,
  PERIODS,
  STORAGE_KEYS,
} from "./constants/iep";
import {
  ActivePage,
  ActivityTemplateItem,
  AttendanceStatus,
  ClassCategory,
  ConfirmDialogState,
  DayOfWeek,
  IEPRecord,
  MakeupNotification,
  ManualMakeupItem,
  Student,
  TimetableSlot,
  UserAccount,
  WeeklyTask,
} from "./types/iep";
import {
  computeStudentAttendanceStats,
  createDefaultAttendanceRecords,
  createDefaultIEPRecords,
  createDefaultWeeklyTasks,
  formatDateKey,
  formatShortDate,
  getDayOfWeekFromDateString,
  getExactDateFromMondayKey,
  getMonday,
  getTargetTeachersForTask,
  getThemeByColorKey,
  isSlotActiveInWeek,
  isTaskCheckedByTeacher,
  normalizeWeeklyTask,
  parseDateStringToLocal,
  resolveCategoryTheme,
} from "./utils/iepHelpers";

const STATIC_FALLBACK_MONDAY = new Date(2026, 10, 23);

export default function Home() {
  const [isStorageLoaded, setIsStorageLoaded] = useState<boolean>(false);

  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [categories, setCategories] = useState<ClassCategory[]>(INITIAL_CATEGORIES);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(INITIAL_TIMETABLE);
  const [iepRecords, setIepRecords] = useState<Record<string, IEPRecord>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [makeupNotifications, setMakeupNotifications] = useState<MakeupNotification[]>([]);
  const [middleTemplates, setMiddleTemplates] = useState<ActivityTemplateItem[]>(
    DEFAULT_MIDDLE_TEMPLATES
  );

  const [manualMakeupItems, setManualMakeupItems] = useState<ManualMakeupItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loginIdInput, setLoginIdInput] = useState<string>("");
  const [loginPwInput, setLoginPwInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  const [activePage, setActivePage] = useState<ActivePage>("timetable");
  const [currentMonday, setCurrentMonday] = useState<Date>(STATIC_FALLBACK_MONDAY);

  const [adminTargetTeacherId, setAdminTargetTeacherId] = useState<string>("t-1");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [historyStudentId, setHistoryStudentId] = useState<string>("");

  // 보강 배정/수정/취소 모달
  const [makeupModalData, setMakeupModalData] = useState<MakeupModalPayload | null>(null);
  const [makeupDateInput, setMakeupDateInput] = useState<string>("");
  const [makeupPeriodInput, setMakeupPeriodInput] = useState<number>(1);
  const [makeupDetailInput, setMakeupDetailInput] = useState<string>("");

  // 시간표 편성 모달
  const [editingCell, setEditingCell] = useState<{
    day: DayOfWeek;
    period: number;
    existingSlot?: TimetableSlot;
  } | null>(null);
  const [modalCategoryId, setModalCategoryId] = useState<string>("cat-4");
  const [modalDetailTitle, setModalDetailTitle] = useState<string>("");
  const [modalStudentIds, setModalStudentIds] = useState<string[]>([]);

  // 공통 확인 모달 & 토스트 메시지
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>("");

  useEffect(() => {
    try {
      const now = new Date();
      const todayMon = getMonday(now);
      setCurrentMonday(todayMon);

      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const savedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const savedTimetable = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
      const savedIepRecords = localStorage.getItem(STORAGE_KEYS.IEP_RECORDS);
      const savedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      const savedWeeklyTasks = localStorage.getItem(STORAGE_KEYS.WEEKLY_TASKS);
      const savedMakeupNotis = localStorage.getItem(STORAGE_KEYS.MAKEUP_NOTIFICATIONS);
      const savedMiddleTemplates = localStorage.getItem(STORAGE_KEYS.MIDDLE_TEMPLATES);

      const parsedUsers: UserAccount[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
      const parsedTeachers = parsedUsers.filter((u) => u.role === "teacher");
      const parsedTimetable: TimetableSlot[] = savedTimetable
        ? JSON.parse(savedTimetable)
        : INITIAL_TIMETABLE;
      const parsedStudents: Student[] = savedStudents
        ? JSON.parse(savedStudents)
        : INITIAL_STUDENTS;

      if (savedUsers) setUsers(parsedUsers);
      if (savedStudents) setStudents(parsedStudents);
      if (savedCategories) {
        const parsedCats: ClassCategory[] = JSON.parse(savedCategories);
        setCategories(
          parsedCats.map((c) => ({
            ...c,
            colorKey: c.colorKey || getThemeByColorKey(undefined, c.name).key,
          }))
        );
      }
      if (savedTimetable) setTimetable(parsedTimetable);

      setIepRecords(
        savedIepRecords ? JSON.parse(savedIepRecords) : createDefaultIEPRecords()
      );
      setAttendanceRecords(
        savedAttendance ? JSON.parse(savedAttendance) : createDefaultAttendanceRecords()
      );

      if (savedWeeklyTasks) {
        const parsedTasks: WeeklyTask[] = JSON.parse(savedWeeklyTasks);
        setWeeklyTasks(parsedTasks.map((t) => normalizeWeeklyTask(t, parsedTeachers)));
      } else {
        setWeeklyTasks(createDefaultWeeklyTasks(todayMon));
      }

      if (savedMakeupNotis) setMakeupNotifications(JSON.parse(savedMakeupNotis));
      if (savedMiddleTemplates) setMiddleTemplates(JSON.parse(savedMiddleTemplates));

      const savedSessionUser = sessionStorage.getItem(STORAGE_KEYS.SESSION_USER);
      const savedSessionPage = sessionStorage.getItem(STORAGE_KEYS.SESSION_PAGE);
      if (savedSessionUser) {
        const sessionUser: UserAccount = JSON.parse(savedSessionUser);
        const validUser = parsedUsers.find((u) => u.id === sessionUser.id);
        if (validUser) {
          setCurrentUser(validUser);
          if (validUser.role === "admin" && parsedTeachers.length > 0) {
            setAdminTargetTeacherId(parsedTeachers[0].id);
          } else if (validUser.role === "teacher") {
            const mySlots = parsedTimetable.filter((s) => s.teacherId === validUser.id);
            const assignedIds = new Set<string>();
            mySlots.forEach((s) => s.studentIds.forEach((id) => assignedIds.add(id)));
            const firstSt = parsedStudents.find((st) => assignedIds.has(st.id));
            if (firstSt) setHistoryStudentId(firstSt.id);
          }

          if (
            savedSessionPage &&
            savedSessionPage !== "detail" &&
            [
              "timetable",
              "teacherHistory",
              "adminReview",
              "weeklyTasks",
              "students",
              "categories",
              "accounts",
              "attendanceBook",
            ].includes(savedSessionPage)
          ) {
            setActivePage(savedSessionPage as ActivePage);
          }
        }
      }
    } catch (error) {
      console.error("스토리지 복원 오류:", error);
    } finally {
      setIsStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
  }, [timetable, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem(STORAGE_KEYS.IEP_RECORDS, JSON.stringify(iepRecords));
  }, [iepRecords, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
  }, [attendanceRecords, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem(STORAGE_KEYS.WEEKLY_TASKS, JSON.stringify(weeklyTasks));
  }, [weeklyTasks, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem(
      STORAGE_KEYS.MAKEUP_NOTIFICATIONS,
      JSON.stringify(makeupNotifications)
    );
  }, [makeupNotifications, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem(STORAGE_KEYS.MIDDLE_TEMPLATES, JSON.stringify(middleTemplates));
  }, [middleTemplates, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded || !currentUser) return;
    sessionStorage.setItem(STORAGE_KEYS.SESSION_PAGE, activePage);
  }, [activePage, currentUser, isStorageLoaded]);

  const showToast = (msg: string, duration = 3500) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(""), duration);
  };

  const handleAddManualMakeup = (item: Omit<ManualMakeupItem, "id" | "createdAt">) => {
    const created: ManualMakeupItem = {
      ...item,
      id: `mup-${Date.now()}`,
      createdAt: formatDateKey(new Date()),
    };
    setManualMakeupItems((prev) => [created, ...prev]);
    showToast("✅ 잔여 미보강이 추가되었습니다.");
  };

  const handleDeleteManualMakeup = (id: string) => {
    setConfirmDialog({
      title: "잔여 미보강 삭제",
      message: "선택한 잔여 미보강 항목을 삭제하시겠습니까?",
      confirmLabel: "삭제",
      danger: true,
      onConfirm: () => {
        setManualMakeupItems((prev) => prev.filter((m) => m.id !== id));
        showToast("🗑️ 잔여 미보강 항목이 삭제되었습니다.");
      },
    });
  };

  const handleDismissAbsentMakeup = (recordKey: string, studentName: string) => {
    setConfirmDialog({
      title: "결석 기반 미보강 삭제(면제)",
      message: `${studentName} 학생의 해당 결석 건에 대한 잔여 미보강을 삭제 처리하시겠습니까?\n(출결 기록은 '출석'으로 면제 처리됩니다.)`,
      confirmLabel: "미보강 삭제",
      danger: true,
      onConfirm: () => {
        setAttendanceRecords((prev) => ({ ...prev, [recordKey]: "출석" }));
        showToast(`🗑️ ${studentName} 학생의 잔여 미보강 건이 삭제 처리되었습니다.`);
      },
    });
  };

  const handleExportBackupJson = () => {
    const now = new Date();
    const backupPayload = {
      exportedAt: now.toISOString(),
      version: "2.2",
      users,
      students,
      categories,
      timetable,
      iepRecords,
      attendanceRecords,
      weeklyTasks,
      makeupNotifications,
      middleTemplates,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IEP_통합백업_${formatDateKey(now)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || "{}"));
        if (!parsed.users || !parsed.students || !parsed.timetable || !parsed.iepRecords) {
          showToast("⚠️ 올바른 IEP 백업 JSON 파일이 아닙니다.");
          return;
        }
        const importedUsers: UserAccount[] = parsed.users;
        const importedTeachers = importedUsers.filter((u) => u.role === "teacher");
        setUsers(importedUsers);
        setStudents(parsed.students);
        if (parsed.categories) setCategories(parsed.categories);
        setTimetable(parsed.timetable);
        setIepRecords(parsed.iepRecords);
        if (parsed.attendanceRecords) setAttendanceRecords(parsed.attendanceRecords);
        if (parsed.weeklyTasks) {
          setWeeklyTasks(
            (parsed.weeklyTasks as WeeklyTask[]).map((t) =>
              normalizeWeeklyTask(t, importedTeachers)
            )
          );
        }
        if (parsed.makeupNotifications) setMakeupNotifications(parsed.makeupNotifications);
        if (parsed.middleTemplates) setMiddleTemplates(parsed.middleTemplates);

        showToast("✅ 백업 파일에서 모든 데이터가 성공적으로 복원되었습니다!", 4500);
      } catch {
        showToast("⚠️ 백업 파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsText(file);
  };

  const teachersOnly = users.filter((u) => u.role === "teacher");
  const activeTeacherId =
    currentUser?.role === "admin" ? adminTargetTeacherId : currentUser?.id || "";
  const activeTeacher = teachersOnly.find((t) => t.id === activeTeacherId) || teachersOnly[0];

  const weekKey = formatDateKey(currentMonday);
  const weekRangeLabel = `${currentMonday.getFullYear()}년 ${formatShortDate(
    currentMonday,
    0
  )} (월) ~ ${formatShortDate(currentMonday, 5)} (토)`;

  const visibleTimetable = timetable.filter(
    (slot) => slot.teacherId === activeTeacher?.id && isSlotActiveInWeek(slot, weekKey)
  );

  const unacknowledgedMakeupList = makeupNotifications.filter((n) => !n.acknowledgedByAdmin);

  const totalUncheckedIepCount = Object.values(iepRecords).filter((rec) => {
    const hasContent = Boolean(
      rec.sessionGoal.trim() ||
        rec.activityContent.trim() ||
        rec.supportStrategy.trim() ||
        rec.evaluation.trim()
    );
    return hasContent && !rec.adminChecked;
  }).length;

  const uncheckedWeeklyTaskCount =
    currentUser?.role === "teacher"
      ? weeklyTasks.filter((task) => {
          const targets = getTargetTeachersForTask(task, teachersOnly);
          const isMine = targets.some((t) => t.id === currentUser.id);
          return isMine && !isTaskCheckedByTeacher(task, currentUser.id);
        }).length
      : 0;

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || "미지정";

  const selectedTeacherSummary = (() => {
    const targetTeacherId = activeTeacher?.id || "";
    const teacherWeekSlots = timetable.filter(
      (s) => s.teacherId === targetTeacherId && isSlotActiveInWeek(s, weekKey)
    );
    const totalSlots = teacherWeekSlots.length;
    let totalStudentSessions = 0;
    let completedIepCount = 0;
    let uncheckedIepForTeacher = 0;
    let weekPresent = 0;
    let weekAbsent = 0;
    let weekMakeup = 0;

    teacherWeekSlots.forEach((slot) => {
      slot.studentIds.forEach((stId) => {
        totalStudentSessions++;
        const k = `${weekKey}_${slot.id}_${stId}`;
        const rec = iepRecords[k];
        const hasContent = Boolean(
          rec?.sessionGoal.trim() ||
            rec?.activityContent.trim() ||
            rec?.supportStrategy.trim() ||
            rec?.evaluation.trim()
        );
        if (hasContent) {
          completedIepCount++;
          if (!rec?.adminChecked) uncheckedIepForTeacher++;
        }

        const att = attendanceRecords[k];
        if (att === "출석") weekPresent++;
        else if (att === "결석") weekAbsent++;
        else if (att === "보강") weekMakeup++;
      });
    });

    const completionRate =
      totalStudentSessions > 0
        ? Math.round((completedIepCount / totalStudentSessions) * 100)
        : 0;

    const uncheckedTasksForTeacher = weeklyTasks.filter((task) => {
      const targets = getTargetTeachersForTask(task, teachersOnly);
      const isTarget = targets.some((t) => t.id === targetTeacherId);
      return isTarget && !isTaskCheckedByTeacher(task, targetTeacherId);
    }).length;

    return {
      totalSlots,
      totalStudentSessions,
      completedIepCount,
      completionRate,
      uncheckedIepForTeacher,
      weekPresent,
      weekAbsent,
      weekMakeup,
      uncheckedTasksForTeacher,
    };
  })();

  // --- 보강 배정/수정/취소 핸들러 ---
  const openCreateMakeupPopup = (
    student: Student,
    slot: TimetableSlot,
    originalDate: string
  ) => {
    const baseDate = parseDateStringToLocal(originalDate) || STATIC_FALLBACK_MONDAY;
    const suggested = new Date(baseDate);
    suggested.setDate(baseDate.getDate() + 3);
    setMakeupDateInput(formatDateKey(suggested));
    setMakeupPeriodInput(slot.period);
    setMakeupDetailInput(
      slot.detailTitle ? `${slot.detailTitle} (보강)` : `${student.name} 보강 수업`
    );
    setMakeupModalData({ mode: "create", student, slot, originalDate });
  };

  const openEditMakeupPopup = (makeupSlot: TimetableSlot) => {
    const stId = makeupSlot.studentIds[0];
    const student = students.find((s) => s.id === stId);
    if (!student) return;
    const scheduledDate = makeupSlot.makeupWeekKey
      ? getExactDateFromMondayKey(makeupSlot.makeupWeekKey, makeupSlot.day)
      : formatDateKey(currentMonday);

    setMakeupDateInput(scheduledDate);
    setMakeupPeriodInput(makeupSlot.period);
    setMakeupDetailInput(makeupSlot.detailTitle || `${student.name} 보강 수업`);
    setMakeupModalData({
      mode: "edit",
      student,
      slot: makeupSlot,
      originalDate: makeupSlot.makeupForDate || scheduledDate,
      editingMakeupSlot: makeupSlot,
    });
  };

  const checkMakeupScheduleConflict = (
    teacherId: string,
    targetDateStr: string,
    targetPeriod: number,
    ignoreSlotId?: string
  ): TimetableSlot | undefined => {
    const parsed = parseDateStringToLocal(targetDateStr);
    if (!parsed) return undefined;
    const targetDay = getDayOfWeekFromDateString(targetDateStr);
    const targetWeekKey = formatDateKey(getMonday(parsed));

    return timetable.find(
      (s) =>
        s.id !== ignoreSlotId &&
        s.teacherId === teacherId &&
        s.day === targetDay &&
        s.period === targetPeriod &&
        isSlotActiveInWeek(s, targetWeekKey)
    );
  };

  const handleConfirmMakeupSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!makeupModalData || !makeupDateInput) return;

    const { mode, student, slot, originalDate, editingMakeupSlot } = makeupModalData;
    const parsedMakeupDate = parseDateStringToLocal(makeupDateInput);
    if (!parsedMakeupDate) return;

    const makeupDay = getDayOfWeekFromDateString(makeupDateInput);
    const makeupWeekKey = formatDateKey(getMonday(parsedMakeupDate));

    if (mode === "edit" && editingMakeupSlot) {
      const oldAttKey = `${editingMakeupSlot.makeupWeekKey}_${editingMakeupSlot.id}_${student.id}`;
      const newAttKey = `${makeupWeekKey}_${editingMakeupSlot.id}_${student.id}`;

      setTimetable((prev) =>
        prev.map((s) =>
          s.id === editingMakeupSlot.id
            ? {
                ...s,
                day: makeupDay,
                period: makeupPeriodInput,
                detailTitle: makeupDetailInput.trim() || `${student.name} 보강`,
                makeupWeekKey,
              }
            : s
        )
      );

      setAttendanceRecords((prev) => {
        const next = { ...prev };
        const prevVal = next[oldAttKey] || "보강";
        delete next[oldAttKey];
        next[newAttKey] = prevVal;
        return next;
      });

      setMakeupNotifications((prev) =>
        prev.map((n) =>
          n.id === editingMakeupSlot.makeupNotificationId ||
          n.makeupSlotId === editingMakeupSlot.id
            ? {
                ...n,
                makeupDate: makeupDateInput,
                makeupDay,
                makeupPeriod: makeupPeriodInput,
                acknowledgedByAdmin: false,
              }
            : n
        )
      );

      setMakeupModalData(null);
      showToast(
        `✅ ${student.name} 보강 일정이 ${makeupDateInput} (${makeupDay}${makeupPeriodInput})로 변경되었습니다.`,
        4500
      );
      return;
    }

    const originRecordKey = `${weekKey}_${slot.id}_${student.id}`;
    setAttendanceRecords((prev) => ({
      ...prev,
      [originRecordKey]: "보강",
    }));

    const makeupSlotId = `makeup-${Date.now()}`;
    const notiId = `mnoti-${Date.now()}`;
    const newMakeupSlot: TimetableSlot = {
      id: makeupSlotId,
      teacherId: slot.teacherId,
      day: makeupDay,
      period: makeupPeriodInput,
      categoryId: slot.categoryId,
      detailTitle: makeupDetailInput.trim() || `${student.name} 보강`,
      studentIds: [student.id],
      isMakeupSlot: true,
      makeupForDate: originalDate,
      makeupWeekKey,
      makeupOriginRecordKey: originRecordKey,
      makeupNotificationId: notiId,
    };

    setTimetable((prev) => [...prev, newMakeupSlot]);
    setAttendanceRecords((prev) => ({
      ...prev,
      [`${makeupWeekKey}_${makeupSlotId}_${student.id}`]: "보강",
    }));

    const teacherObj = teachersOnly.find((t) => t.id === slot.teacherId);
    const newNoti: MakeupNotification = {
      id: notiId,
      teacherId: slot.teacherId,
      teacherName: teacherObj?.name || currentUser?.name || "담당 교사",
      studentId: student.id,
      studentName: student.name,
      categoryName: getCategoryName(slot.categoryId),
      originalDate,
      makeupDate: makeupDateInput,
      makeupDay,
      makeupPeriod: makeupPeriodInput,
      makeupSlotId,
      createdAt: formatDateKey(currentMonday),
      acknowledgedByAdmin: false,
    };

    setMakeupNotifications((prev) => [newNoti, ...prev]);
    setMakeupModalData(null);
    showToast(
      `✅ ${student.name} 보강(${makeupDateInput} ${makeupDay}${makeupPeriodInput})이 시간표와 관리자에게 반영되었습니다.`,
      4500
    );
  };

  const handleCancelMakeupSchedule = () => {
    if (
      !makeupModalData ||
      makeupModalData.mode !== "edit" ||
      !makeupModalData.editingMakeupSlot
    ) {
      return;
    }
    const targetSlot = makeupModalData.editingMakeupSlot;
    const targetStudent = makeupModalData.student;

    setConfirmDialog({
      title: "보강 일정 취소",
      message: `${targetStudent.name} 보강 수업을 취소하시겠습니까?\n원래 수업의 출결은 '결석' 상태로 복원됩니다.`,
      confirmLabel: "보강 취소",
      danger: true,
      onConfirm: () => {
        const stId = targetSlot.studentIds[0];
        setTimetable((prev) => prev.filter((s) => s.id !== targetSlot.id));
        setAttendanceRecords((prev) => {
          const next = { ...prev };
          if (targetSlot.makeupWeekKey && stId) {
            delete next[`${targetSlot.makeupWeekKey}_${targetSlot.id}_${stId}`];
          }
          if (targetSlot.makeupOriginRecordKey) {
            next[targetSlot.makeupOriginRecordKey] = "결석";
          }
          return next;
        });
        setMakeupNotifications((prev) =>
          prev.filter(
            (n) =>
              n.id !== targetSlot.makeupNotificationId && n.makeupSlotId !== targetSlot.id
          )
        );
        if (selectedSlotId === targetSlot.id) {
          setSelectedSlotId(null);
          setActivePage("timetable");
        }
        setMakeupModalData(null);
        showToast(
          `🗑️ ${targetStudent.name} 보강 일정이 취소되어 원래 수업이 결석 상태로 복원되었습니다.`,
          4500
        );
      },
    });
  };

  // --- 로그인 처리 ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedUser = users.find(
      (u) => u.loginId.trim() === loginIdInput.trim() && u.password === loginPwInput
    );

    if (!matchedUser) {
      setLoginError("아이디 또는 비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoginError("");
    setCurrentUser(matchedUser);
    setActivePage("timetable");
    setLoginIdInput("");
    setLoginPwInput("");

    sessionStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(matchedUser));
    sessionStorage.setItem(STORAGE_KEYS.SESSION_PAGE, "timetable");

    if (matchedUser.role === "admin" && teachersOnly.length > 0) {
      setAdminTargetTeacherId(teachersOnly[0].id);
    } else if (matchedUser.role === "teacher") {
      const mySlots = timetable.filter((s) => s.teacherId === matchedUser.id);
      const assignedIds = new Set<string>();
      mySlots.forEach((s) => s.studentIds.forEach((id) => assignedIds.add(id)));
      const firstSt = students.find((st) => assignedIds.has(st.id));
      setHistoryStudentId(firstSt?.id || "");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActivePage("timetable");
    setSelectedSlotId(null);
    setSelectedStudentId(null);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_PAGE);
  };

  // --- 시간표 모달 핸들러 ---
  const handleOpenAdminModal = (
    day: DayOfWeek,
    period: number,
    existingSlot?: TimetableSlot
  ) => {
    setEditingCell({ day, period, existingSlot });
    if (existingSlot) {
      setModalCategoryId(existingSlot.categoryId || categories[0]?.id || "");
      setModalDetailTitle(existingSlot.detailTitle || "");
      setModalStudentIds(existingSlot.studentIds);
    } else {
      setModalCategoryId(categories[0]?.id || "");
      setModalDetailTitle("");
      setModalStudentIds([]);
    }
  };

  const handleSaveTimetableSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell || !modalCategoryId || modalStudentIds.length === 0 || !activeTeacher)
      return;

    if (editingCell.existingSlot) {
      setTimetable((prev) =>
        prev.map((s) =>
          s.id === editingCell.existingSlot!.id
            ? {
                ...s,
                categoryId: modalCategoryId,
                detailTitle: modalDetailTitle.trim(),
                studentIds: modalStudentIds,
              }
            : s
        )
      );
    } else {
      const newSlot: TimetableSlot = {
        id: `slot-${Date.now()}`,
        teacherId: activeTeacher.id,
        day: editingCell.day,
        period: editingCell.period,
        categoryId: modalCategoryId,
        detailTitle: modalDetailTitle.trim(),
        studentIds: modalStudentIds,
      };
      setTimetable((prev) => [...prev, newSlot]);
    }
    setEditingCell(null);
  };

  if (!isStorageLoaded) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm text-slate-500">
        저장된 데이터를 불러오는 중입니다...
      </div>
    );
  }

  // ============================================================================
  // [화면 0] 로그인 화면
  // ============================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md border border-slate-200">
          <div className="mb-6 text-center">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-2">
              차별화된 관리 시스템
            </span>
            <h1 className="text-2xl font-bold text-slate-800">사이언스 특수체육센터</h1>
            <p className="text-sm text-slate-500 mt-1">
              발급받은 관리자 또는 선생님 아이디와 비밀번호를 입력하세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">아이디</label>
              <input
                type="text"
                value={loginIdInput}
                onChange={(e) => {
                  setLoginIdInput(e.target.value);
                  setLoginError("");
                }}
                placeholder="아이디를 입력하세요"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={loginPwInput}
                onChange={(e) => {
                  setLoginPwInput(e.target.value);
                  setLoginError("");
                }}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
            >
              로그인
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
            <p className="font-bold text-slate-600">💡 계정 안내:</p>
            <div className="flex justify-between bg-slate-50 px-3 py-1.5 rounded-lg">
              <span>관리자</span>
              <span className="font-mono font-bold text-slate-700">admin / 1234</span>
            </div>
            {teachersOnly.map((t) => (
              <div
                key={t.id}
                className="flex justify-between bg-slate-50 px-3 py-1.5 rounded-lg"
              >
                <span>{t.name}</span>
                <span className="font-mono font-bold text-slate-700">
                  {t.loginId} / {t.password}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const makeupConflictSlot =
    makeupModalData && makeupDateInput
      ? checkMakeupScheduleConflict(
          makeupModalData.slot.teacherId,
          makeupDateInput,
          makeupPeriodInput,
          makeupModalData.editingMakeupSlot?.id
        )
      : undefined;

  const selectedSlotForDetail =
    activePage === "detail" && selectedSlotId
      ? timetable.find((s) => s.id === selectedSlotId) || null
      : null;

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white flex flex-col">
      <Header
        currentUser={currentUser}
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        onOpenTeacherHistory={() => setActivePage("teacherHistory")}
        onLogout={handleLogout}
        uncheckedWeeklyTaskCount={uncheckedWeeklyTaskCount}
        totalUncheckedIepCount={totalUncheckedIepCount}
        unacknowledgedMakeupCount={unacknowledgedMakeupList.length}
        studentCount={students.length}
        categoryCount={categories.length}
        teacherCount={teachersOnly.length}
        onExportBackup={handleExportBackupJson}
        onImportBackupFile={handleImportBackupFile}
      />

      {/* 라우팅별 뷰 렌더링 */}
      {activePage === "weeklyTasks" &&
        (currentUser.role === "admin" ? (
          <AdminWeeklyTasks
            weeklyTasks={weeklyTasks}
            teachersOnly={teachersOnly}
            onAddTask={(newTask) => setWeeklyTasks((prev) => [newTask, ...prev])}
            onDeleteTask={(taskId) =>
              setWeeklyTasks((prev) => prev.filter((t) => t.id !== taskId))
            }
            onRequestConfirm={setConfirmDialog}
          />
        ) : (
          <TeacherWeeklyTasks
            currentUser={currentUser}
            teachersOnly={teachersOnly}
            weeklyTasks={weeklyTasks}
            onToggleChecked={(taskId, teacherId) =>
              setWeeklyTasks((prev) =>
                prev.map((task) => {
                  if (task.id !== taskId) return task;
                  const currentVal = isTaskCheckedByTeacher(task, teacherId);
                  const nextMap: Record<string, boolean> = {
                    ...(task.checkedByTeachers || {}),
                    [teacherId]: !currentVal,
                  };
                  const targets = getTargetTeachersForTask(task, teachersOnly);
                  const allChecked =
                    targets.length > 0 && targets.every((t) => Boolean(nextMap[t.id]));
                  return {
                    ...task,
                    checkedByTeachers: nextMap,
                    checkedByTeacher: allChecked,
                  };
                })
              )
            }
          />
        ))}

      {activePage === "attendanceBook" && (
  <AttendanceBookView
    currentUser={currentUser}
    students={students}
    timetable={timetable}
    attendanceRecords={attendanceRecords}
    categories={categories}
    users={users}
    manualMakeupItems={manualMakeupItems}
    onSetAttendance={(recordKey, status) =>
      setAttendanceRecords((prev) => ({ ...prev, [recordKey]: status }))
    }
    onAddManualMakeup={handleAddManualMakeup}
    onDeleteManualMakeup={handleDeleteManualMakeup}
    onDismissAbsentMakeup={handleDismissAbsentMakeup}
    onOpenCreateMakeup={openCreateMakeupPopup}
    onOpenEditMakeup={openEditMakeupPopup}
  />
)}


      {currentUser.role === "teacher" && activePage === "teacherHistory" && (
        <TeacherStudentHistory
          currentUser={currentUser}
          initialStudentId={historyStudentId}
          initialMonday={currentMonday}
          students={students}
          categories={categories}
          timetable={timetable}
          iepRecords={iepRecords}
          attendanceRecords={attendanceRecords}
        />
      )}

      {currentUser.role === "admin" && activePage === "adminReview" && (
        <AdminIepReview
          teachersOnly={teachersOnly}
          initialTeacherId={activeTeacher?.id || "t-1"}
          initialMonday={currentMonday}
          students={students}
          categories={categories}
          timetable={timetable}
          iepRecords={iepRecords}
          attendanceRecords={attendanceRecords}
          totalUncheckedIepCount={totalUncheckedIepCount}
          onSaveReview={(recordKey, checked, feedback) => {
            setIepRecords((prev) => {
              const existing = prev[recordKey];
              if (!existing) return prev;
              return {
                ...prev,
                [recordKey]: {
                  ...existing,
                  adminChecked: checked,
                  adminFeedback: feedback,
                  adminCheckedAt: checked ? formatDateKey(currentMonday) : undefined,
                },
              };
            });
          }}
        />
      )}

      {currentUser.role === "admin" && activePage === "students" && (
        <AdminStudentsView
          students={students}
          timetable={timetable}
          attendanceRecords={attendanceRecords}
          onSaveStudent={(student, isEdit) => {
            if (isEdit) {
              setStudents((prev) => prev.map((st) => (st.id === student.id ? student : st)));
            } else {
              setStudents((prev) => [...prev, student]);
            }
          }}
          onDeleteStudent={(studentId) => {
            setStudents((prev) => prev.filter((item) => item.id !== studentId));
            setTimetable((prev) =>
              prev.map((slot) => ({
                ...slot,
                studentIds: slot.studentIds.filter((id) => id !== studentId),
              }))
            );
          }}
          onRequestConfirm={setConfirmDialog}
        />
      )}

      {currentUser.role === "admin" && activePage === "categories" && (
        <AdminCategoriesView
          categories={categories}
          timetable={timetable}
          onAddCategory={(cat) => setCategories((prev) => [...prev, cat])}
          onUpdateCategory={(catId, name, colorKey) =>
            setCategories((prev) =>
              prev.map((c) => (c.id === catId ? { ...c, name, colorKey } : c))
            )
          }
          onDeleteCategory={(catId) =>
            setCategories((prev) => prev.filter((c) => c.id !== catId))
          }
          onRequestConfirm={setConfirmDialog}
        />
      )}

      {currentUser.role === "admin" && activePage === "accounts" && (
        <AdminAccountsView
          users={users}
          onCreateTeacher={(account) => setUsers((prev) => [...prev, account])}
          onUpdatePassword={(userId, newPw) =>
            setUsers((prev) =>
              prev.map((u) => (u.id === userId ? { ...u, password: newPw } : u))
            )
          }
          onDeleteTeacher={(teacherId) => {
            setUsers((prev) => prev.filter((u) => u.id !== teacherId));
            setTimetable((prev) => prev.filter((s) => s.teacherId !== teacherId));
            if (adminTargetTeacherId === teacherId) {
              const remaining = teachersOnly.filter((t) => t.id !== teacherId);
              if (remaining[0]) setAdminTargetTeacherId(remaining[0].id);
            }
          }}
          onRequestConfirm={setConfirmDialog}
        />
      )}

      {activePage === "detail" && selectedSlotForDetail && (
        <SessionDetailView
          currentUser={currentUser}
          selectedSlot={selectedSlotForDetail}
          initialStudentId={selectedStudentId}
          weekKey={weekKey}
          students={students}
          categories={categories}
          timetable={timetable}
          iepRecords={iepRecords}
          attendanceRecords={attendanceRecords}
          middleTemplates={middleTemplates}
          onBackToTimetable={() => setActivePage("timetable")}
          onOpenTeacherHistory={(stId) => {
            setHistoryStudentId(stId);
            setActivePage("teacherHistory");
          }}
          onOpenCreateMakeup={openCreateMakeupPopup}
          onOpenEditMakeup={openEditMakeupPopup}
          onSetAttendance={(recordKey, status) =>
            setAttendanceRecords((prev) => ({ ...prev, [recordKey]: status }))
          }
          onUpdateStudentProfile={(studentId, longGoal, shortGoal, currentStatus) =>
            setStudents((prev) =>
              prev.map((st) =>
                st.id === studentId
                  ? {
                      ...st,
                      longTermGoal: longGoal,
                      shortTermGoal: shortGoal,
                      currentStatusInfo: currentStatus,
                    }
                  : st
              )
            )
          }
          onSaveIepRecord={(recordKey, record) =>
            setIepRecords((prev) => ({ ...prev, [recordKey]: record }))
          }
          onAddMiddleTemplate={(label, text) =>
            setMiddleTemplates((prev) => [
              ...prev,
              { id: `tpl-mid-${Date.now()}`, label, text },
            ])
          }
          onDeleteMiddleTemplate={(tplId) =>
            setMiddleTemplates((prev) => prev.filter((t) => t.id !== tplId))
          }
        />
      )}

      {/* [1페이지] 주간 수업 시간표 메인 화면 */}
      {(activePage === "timetable" ||
        (activePage === "detail" && !selectedSlotForDetail)) && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-5">
          {saveMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold">
              {saveMessage}
            </div>
          )}

          {currentUser.role === "admin" && (
            <AdminDashboardAndNotifications
              teachersOnly={teachersOnly}
              activeTeacher={activeTeacher}
              onSelectTeacher={setAdminTargetTeacherId}
              summary={selectedTeacherSummary}
              onGoReview={() => setActivePage("adminReview")}
              unacknowledgedMakeupList={unacknowledgedMakeupList}
              onAcknowledgeMakeup={(notiId) =>
                setMakeupNotifications((prev) =>
                  prev.map((n) =>
                    n.id === notiId ? { ...n, acknowledgedByAdmin: true } : n
                  )
                )
              }
            />
          )}

          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
              <div className="space-y-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    🗓️ {activeTeacher?.name} 주간 수업 시간표
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    수업 칸을 클릭하면 출결 체크 및 책 인덱스형 IEP 작성 페이지로 이동합니다.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 mr-0.5">
                    수업 색상 범례:
                  </span>
                  {categories.map((cat) => {
                    const theme = resolveCategoryTheme(categories, cat.id);
                    return (
                      <span
                        key={cat.id}
                        className={`px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${theme.pill}`}
                      >
                        {cat.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => {
                    const next = new Date(currentMonday);
                    next.setDate(currentMonday.getDate() - 7);
                    setCurrentMonday(next);
                  }}
                  className="px-3 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200"
                >
                  ◀ 이전 주
                </button>
                <span className="px-3 text-sm font-extrabold text-slate-800 min-w-[210px] text-center">
                  {weekRangeLabel}
                </span>
                <button
                  onClick={() => {
                    const next = new Date(currentMonday);
                    next.setDate(currentMonday.getDate() + 7);
                    setCurrentMonday(next);
                  }}
                  className="px-3 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200"
                >
                  다음 주 ▶
                </button>
                <button
                  onClick={() => setCurrentMonday(getMonday(new Date()))}
                  className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg ml-1"
                >
                  이번 주
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed min-w-[760px]">
                <thead>
                  <tr>
                    <th className="w-16 p-2.5 bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                      교시
                    </th>
                    {DAYS.map((day, idx) => (
                      <th
                        key={day}
                        className={`p-2.5 bg-slate-100 border border-slate-200 text-xs font-bold ${
                          day === "토" ? "text-blue-600" : "text-slate-700"
                        }`}
                      >
                        <div>{day}요일</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                          ({formatShortDate(currentMonday, idx)})
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => (
                    <tr key={period}>
                      <td className="p-2 bg-slate-50 border border-slate-200 text-center text-xs font-bold text-slate-600">
                        {period}교시
                      </td>
                      {DAYS.map((day) => {
                        const slot = visibleTimetable.find(
                          (s) => s.day === day && s.period === period
                        );
                        const catName = slot ? getCategoryName(slot.categoryId) : "";
                        const theme = slot
                          ? resolveCategoryTheme(categories, slot.categoryId)
                          : null;

                        const hasPendingMakeupInSlot = slot
                          ? slot.studentIds.some(
                              (stId) =>
                                computeStudentAttendanceStats(
                                  stId,
                                  attendanceRecords,
                                  timetable
                                ).pendingMakeup > 0
                            )
                          : false;

                        return (
                          <td
                            key={`${day}-${period}`}
                            className="p-1.5 border border-slate-200 h-26 align-top"
                          >
                            {slot && theme ? (
                              <div
                                className={`w-full h-full rounded-xl border p-2 flex flex-col justify-between transition group relative ${theme.card}`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span
                                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${theme.badge}`}
                                    >
                                      {day}
                                      {period}
                                    </span>
                                    <span
                                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border truncate ${theme.pill}`}
                                    >
                                      {slot.isMakeupSlot ? `보강·${catName}` : catName}
                                    </span>
                                    {!slot.isMakeupSlot && hasPendingMakeupInSlot && (
                                      <span
                                        title="미보강 잔여 횟수가 있는 학생이 포함된 수업입니다"
                                        className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-rose-600 text-white shrink-0"
                                      >
                                        보강요청
                                      </span>
                                    )}
                                  </div>

                                  {slot.isMakeupSlot ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditMakeupPopup(slot);
                                      }}
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-600 text-white hover:bg-amber-700 shrink-0"
                                    >
                                      보강수정
                                    </button>
                                  ) : currentUser.role === "admin" ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAdminModal(day, period, slot);
                                      }}
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-white hover:bg-slate-700 shrink-0"
                                    >
                                      편집
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-600 shrink-0">
                                      {slot.studentIds.length}명
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSlotId(slot.id);
                                    setSelectedStudentId(slot.studentIds[0] || null);
                                    setActivePage("detail");
                                  }}
                                  className="text-left w-full flex-1 flex flex-col justify-end mt-1.5"
                                >
                                  <div
                                    className={`text-xs font-bold text-slate-800 leading-snug line-clamp-1 transition ${theme.titleHover}`}
                                  >
                                    {slot.detailTitle || catName}
                                  </div>
                                  <div className="text-[11px] text-slate-600 truncate mt-0.5">
                                    {slot.studentIds
                                      .map(
                                        (id) => students.find((st) => st.id === id)?.name || ""
                                      )
                                      .filter(Boolean)
                                      .join(", ")}
                                  </div>
                                </button>
                              </div>
                            ) : currentUser.role === "admin" ? (
                              <button
                                type="button"
                                onClick={() => handleOpenAdminModal(day, period)}
                                className="w-full h-full rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/40 transition"
                              >
                                <span className="text-base font-bold">+</span>
                                <span className="text-[10px]">수업 배정</span>
                              </button>
                            ) : (
                              <div className="w-full h-full rounded-xl bg-slate-50/50 flex items-center justify-center text-[11px] text-slate-300">
                                -
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}

      {/* 관리자 시간표 배정/편집 모달 */}
      {currentUser.role === "admin" && editingCell && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setEditingCell(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-600">{activeTeacher?.name}</span>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingCell.day}요일 {editingCell.period}교시 수업 설정
                </h3>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTimetableSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  수업 종류 선택 <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = modalCategoryId === cat.id;
                    const theme = resolveCategoryTheme(categories, cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setModalCategoryId(cat.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                          isSelected
                            ? theme.modalActive
                            : `${theme.pill} opacity-85 hover:opacity-100`
                        }`}
                      >
                        {isSelected ? "✓ " : ""}
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  세부 수업 주제 <span className="text-slate-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text"
                  value={modalDetailTitle}
                  onChange={(e) => setModalDetailTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  배정할 학생 선택
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {students.map((st) => {
                    const isChecked = modalStudentIds.includes(st.id);
                    const stStats = computeStudentAttendanceStats(
                      st.id,
                      attendanceRecords,
                      timetable
                    );
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() =>
                          setModalStudentIds((prev) =>
                            prev.includes(st.id)
                              ? prev.filter((id) => id !== st.id)
                              : [...prev, st.id]
                          )
                        }
                        className={`p-2.5 rounded-xl border text-left text-xs transition ${
                          isChecked
                            ? "bg-blue-600 text-white border-blue-600 font-bold"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {isChecked ? "✓ " : ""}
                            {st.name}
                          </span>
                          {stStats.pendingMakeup > 0 && (
                            <span
                              className={`text-[10px] px-1 rounded ${
                                isChecked
                                  ? "bg-white/20 text-white"
                                  : "bg-rose-100 text-rose-700 font-extrabold"
                              }`}
                            >
                              미보강 {stStats.pendingMakeup}
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[10px] mt-0.5 truncate ${
                            isChecked ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {st.schoolGradeClass || st.birthDate}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                {editingCell.existingSlot ? (
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = editingCell.existingSlot!.id;
                      setConfirmDialog({
                        title: "시간표 수업 삭제",
                        message: `${editingCell.day}요일 ${editingCell.period}교시 수업을 시간표에서 삭제하시겠습니까?`,
                        confirmLabel: "삭제",
                        danger: true,
                        onConfirm: () => {
                          setTimetable((prev) => prev.filter((s) => s.id !== targetId));
                          setEditingCell(null);
                        },
                      });
                    }}
                    className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl"
                  >
                    수업 삭제
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCell(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                  >
                    시간표 저장
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 보강 신규 배정 / 수정 / 취소 모달 */}
      <MakeupScheduleModal
        data={makeupModalData}
        dateInput={makeupDateInput}
        periodInput={makeupPeriodInput}
        detailInput={makeupDetailInput}
        conflictSlot={makeupConflictSlot}
        students={students}
        timetable={timetable}
        getCategoryName={getCategoryName}
        onChangeDate={setMakeupDateInput}
        onChangePeriod={setMakeupPeriodInput}
        onChangeDetail={setMakeupDetailInput}
        onSubmit={handleConfirmMakeupSchedule}
        onCancelMakeup={handleCancelMakeupSchedule}
        onClose={() => setMakeupModalData(null)}
      />

      {/* 통일된 확인창 모달 */}
      <ConfirmModal dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
}