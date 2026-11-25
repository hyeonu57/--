import {
  BASIC_ROUTINE_BOTTOM,
  BASIC_ROUTINE_TOP,
  COLOR_PALETTE,
  DAYS,
} from "../constants/iep";
import {
  AttendanceStatus,
  CategoryTheme,
  ClassCategory,
  ColorKey,
  DayOfWeek,
  GoalProgressStatus,
  IEPRecord,
  ManualMakeupItem,
  TimetableSlot,
  UserAccount,
  WeeklyTask,
} from "../types/iep";

export function getThemeByColorKey(colorKey?: ColorKey, fallbackSeed = ""): CategoryTheme {
  if (colorKey) {
    const found = COLOR_PALETTE.find((item) => item.key === colorKey);
    if (found) return found;
  }
  const normalized = fallbackSeed.trim();
  if (normalized === "수중") return COLOR_PALETTE[0];
  if (normalized === "PT") return COLOR_PALETTE[1];
  if (normalized === "재활") return COLOR_PALETTE[2];
  if (normalized === "특수체육") return COLOR_PALETTE[3];

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

export function resolveCategoryTheme(
  categories: ClassCategory[],
  catIdOrName: string
): CategoryTheme {
  const byId = categories.find((c) => c.id === catIdOrName);
  if (byId) return getThemeByColorKey(byId.colorKey, byId.name);
  const byName = categories.find((c) => c.name === catIdOrName);
  if (byName) return getThemeByColorKey(byName.colorKey, byName.name);
  return getThemeByColorKey(undefined, catIdOrName);
}

export function buildCombinedActivityText(
  top?: string,
  middle?: string,
  bottom?: string
): string {
  const parts: string[] = [];
  if (top?.trim()) parts.push(`[상 - 준비운동 및 동기유발]\n${top.trim()}`);
  if (middle?.trim()) parts.push(`[중 - 본시수업]\n${middle.trim()}`);
  if (bottom?.trim()) parts.push(`[하 - 마무리 운동 및 금일 피드백]\n${bottom.trim()}`);
  return parts.join("\n\n");
}

export function parseActivitySections(rec: IEPRecord): {
  top: string;
  middle: string;
  bottom: string;
} {
  if (
    rec.activityTop !== undefined ||
    rec.activityMiddle !== undefined ||
    rec.activityBottom !== undefined
  ) {
    return {
      top: rec.activityTop || "",
      middle: rec.activityMiddle || "",
      bottom: rec.activityBottom || "",
    };
  }
  return {
    top: "",
    middle: rec.activityContent || "",
    bottom: "",
  };
}

export function calculateAge(birthDateStr: string): number | null {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateStringToLocal(dateStr: string): Date | null {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function getDayOfWeekFromDateString(dateStr: string): DayOfWeek {
  const d = parseDateStringToLocal(dateStr);
  if (!d) return "토";
  const jsDay = d.getDay();
  if (jsDay === 0) return "토";
  return DAYS[jsDay - 1] || "토";
}

export function formatShortDate(monday: Date, offsetDays: number): string {
  const d = new Date(monday);
  d.setDate(monday.getDate() + offsetDays);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function getExactDateFromMondayKey(mondayKey: string, day: DayOfWeek): string {
  const [y, m, d] = mondayKey.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const offset = DAYS.indexOf(day);
  base.setDate(base.getDate() + (offset >= 0 ? offset : 0));
  return formatDateKey(base);
}

export function getWeekLabelByMonday(monday: Date): string {
  const year = monday.getFullYear();
  const month = monday.getMonth() + 1;
  const weekNumber = Math.ceil(monday.getDate() / 7);
  const startStr = `${month}/${monday.getDate()}`;
  const satDate = new Date(monday);
  satDate.setDate(monday.getDate() + 5);
  const endStr = `${satDate.getMonth() + 1}/${satDate.getDate()}`;
  return `${year}년 ${month}월 ${weekNumber}주차 (${startStr}~${endStr})`;
}

export function getWeekInfoFromDateString(dateStr: string) {
  const parsed = parseDateStringToLocal(dateStr) || new Date();
  const mon = getMonday(parsed);
  return {
    weekLabel: getWeekLabelByMonday(mon),
    weekStartDate: formatDateKey(mon),
  };
}

export function isSlotActiveInWeek(slot: TimetableSlot, targetWeekKey: string): boolean {
  if (!slot.isMakeupSlot) return true;
  return slot.makeupWeekKey === targetWeekKey;
}

export function computeStudentAttendanceStats(
  studentId: string,
  attendanceRecords: Record<string, AttendanceStatus>,
  timetable: TimetableSlot[],
  manualMakeupItems: ManualMakeupItem[] = []
) {
  let present = 0;
  let absent = 0;
  let makeup = 0;

  Object.entries(attendanceRecords).forEach(([key, status]) => {
    if (!key.endsWith(`_${studentId}`)) return;
    if (status === "출석") present++;
    else if (status === "결석") absent++;
    else if (status === "보강") makeup++;
  });

  const activeMakeupSlotsForStudent = timetable.filter(
    (s) => s.isMakeupSlot && s.studentIds.includes(studentId)
  ).length;

  const makeupCount = Math.max(makeup, activeMakeupSlotsForStudent);
  const absentPending = Math.max(0, absent - makeupCount);

  // 아직 시간표 보강 슬롯으로 배정되지 않은 수동 미보강 건수
  const unscheduledManualCount = manualMakeupItems.filter(
    (item) => item.studentId === studentId && !item.scheduledSlotId
  ).length;

  const pendingMakeup = absentPending + unscheduledManualCount;

  return {
    present,
    absent,
    makeup: makeupCount,
    pendingMakeup,
    unscheduledManualCount,
    total: present + absent + makeupCount,
  };
}

export function getTargetTeachersForTask(
  task: Pick<WeeklyTask, "assignee">,
  teachers: UserAccount[]
): UserAccount[] {
  const trimmedAssignee = task.assignee.trim();
  if (trimmedAssignee === "전체 선생님" || trimmedAssignee === "전체 교사") {
    return teachers;
  }
  const normalizedTarget = trimmedAssignee.replace(/\s*선생님$/, "");
  const matched = teachers.filter(
    (t) =>
      t.name === trimmedAssignee ||
      t.name.replace(/\s*선생님$/, "") === normalizedTarget
  );
  return matched.length > 0 ? matched : teachers;
}

export function isTaskCheckedByTeacher(task: WeeklyTask, teacherId: string): boolean {
  if (
    task.checkedByTeachers &&
    Object.prototype.hasOwnProperty.call(task.checkedByTeachers, teacherId)
  ) {
    return Boolean(task.checkedByTeachers[teacherId]);
  }
  return Boolean(task.checkedByTeacher);
}

export function normalizeWeeklyTask(raw: WeeklyTask, teachers: UserAccount[]): WeeklyTask {
  const map: Record<string, boolean> = { ...(raw.checkedByTeachers || {}) };
  if (raw.checkedByTeacher && Object.keys(map).length === 0) {
    getTargetTeachersForTask(raw, teachers).forEach((t) => {
      map[t.id] = true;
    });
  }
  const targets = getTargetTeachersForTask(raw, teachers);
  const allChecked = targets.length > 0 && targets.every((t) => Boolean(map[t.id]));

  return {
    ...raw,
    checkedByTeachers: map,
    checkedByTeacher: allChecked,
  };
}

export function getAttendanceBadgeStyle(status?: AttendanceStatus): string {
  if (status === "출석") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "결석") return "bg-rose-100 text-rose-800 border-rose-200";
  if (status === "보강") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
}

export function getProgressBadgeStyle(status?: GoalProgressStatus): string {
  if (status === "달성 완료") return "bg-emerald-600 text-white border-emerald-600";
  if (status === "진행 중(향상)") return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "지원 필요") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
}

export function getProgressEmoji(status?: GoalProgressStatus): string {
  if (status === "달성 완료") return "🏆";
  if (status === "진행 중(향상)") return "📈";
  if (status === "지원 필요") return "🤝";
  return "•";
}

export function createDefaultWeeklyTasks(baseMonday: Date): WeeklyTask[] {
  return [
    {
      id: "wt-default-1",
      weekLabel: getWeekLabelByMonday(baseMonday),
      weekStartDate: formatDateKey(baseMonday),
      title: "주간 IEP 상담 일지 및 목표 진전도 점검",
      detail:
        "1. 담당 학생별 금주 수업 활동 내용(상·중·하) 및 아이의 반응을 기록해 주세요.\n2. 목표 달성 진전도(달성 완료 / 진행 중 / 지원 필요)를 선택해 주세요.\n3. 금요일 수업 종료 전까지 작성을 완료해 주시기 바랍니다.",
      assignee: "전체 선생님",
      createdAt: formatDateKey(new Date()),
      checkedByTeacher: false,
      checkedByTeachers: {},
    },
  ];
}

export function createDefaultIEPRecords(): Record<string, IEPRecord> {
  const thisMon = getMonday(new Date());
  const lastMon = new Date(thisMon);
  lastMon.setDate(thisMon.getDate() - 7);

  const thisMonKey = formatDateKey(thisMon);
  const lastMonKey = formatDateKey(lastMon);

  const top1 = "발목 및 고관절 스트레칭 5분, 오늘 보행 과제 시범 및 동기유발";
  const mid1 = "높이 5cm 평균대 위 발자국 스티커를 따라 앞·뒤로 걷기 및 반환점 색깔 콘 터치";
  const bot1 = "호흡 가다듬기 및 매트 이완 스트레칭, 오늘 활동 소감 나누기";

  return {
    [`${lastMonKey}_slot-1_st-1`]: {
      sessionGoal: "낮은 평균대(높이 5cm) 위에서 양팔을 벌리고 흔들림 없이 3m 보행하기",
      activityTop: top1,
      activityMiddle: mid1,
      activityBottom: bot1,
      activityContent: buildCombinedActivityText(top1, mid1, bot1),
      supportStrategy:
        "시각적 발자국 스티커 부착으로 보폭 가이드 제공, 출발 전 1회 시범 후 언어적 격려 위주 최소 촉진",
      evaluation:
        "시각적 단서 제공 시 흔들림 없이 3m 전 구간 보행 완수함. 마지막 지점에서 속도가 빨라지는 경향이 있어 천천히 멈추는 연습 필요.",
      progressStatus: "달성 완료",
      nextPlan:
        "다음 차시에는 평균대 높이를 10cm로 상향하고, 중간 지점에서 정지해 5초간 균형을 유지한 뒤 콩주머니를 목표 바구니에 던지는 과제 추가하기",
      adminChecked: true,
      adminFeedback:
        "시각적 단서 활용이 매우 효과적이네요. 다음 주 높이 상향 시 안전 매트 배치도 함께 확인 부탁드립니다.",
      adminCheckedAt: formatDateKey(lastMon),
    },
    [`${thisMonKey}_slot-1_st-1`]: {
      sessionGoal: "높이 10cm 평균대 중간 지점에서 정지 후 5초간 균형 유지하기",
      activityTop: BASIC_ROUTINE_TOP,
      activityMiddle: "10cm 평균대 중앙 색깔 표식에서 양팔을 벌리고 5초 정지 균형 훈련 진행",
      activityBottom: BASIC_ROUTINE_BOTTOM,
      activityContent: buildCombinedActivityText(
        BASIC_ROUTINE_TOP,
        "10cm 평균대 중앙 색깔 표식에서 양팔을 벌리고 5초 정지 균형 훈련 진행",
        BASIC_ROUTINE_BOTTOM
      ),
      supportStrategy:
        "교사가 정면에서 손바닥 시각 신호로 정지 타이밍 안내 및 5초 카운트 시각 타이머 활용",
      evaluation:
        "보조 없이 4초간 균형 유지 성공. 표적 바구니 던지기 활동에 높은 흥미를 보임.",
      progressStatus: "진행 중(향상)",
      nextPlan: "평균대 끝 지점 한 발 서기 3초 도전 및 1.5m 거리 표적 맞히기 연계 진행",
      adminChecked: false,
      adminFeedback: "",
    },
  };
}

export function createDefaultAttendanceRecords(): Record<string, AttendanceStatus> {
  const thisMon = getMonday(new Date());
  const lastMon = new Date(thisMon);
  lastMon.setDate(thisMon.getDate() - 7);

  return {
    [`${formatDateKey(lastMon)}_slot-1_st-1`]: "출석",
    [`${formatDateKey(thisMon)}_slot-1_st-1`]: "출석",
  };
}