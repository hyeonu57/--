"use client";

import React, { useState, useEffect, useRef } from "react";

// --- 데이터 타입 정의 ---
type Role = "admin" | "teacher";
type DayOfWeek = "월" | "화" | "수" | "목" | "금" | "토";
type AttendanceStatus = "출석" | "결석" | "보강";
type GoalProgressStatus = "달성 완료" | "진행 중(향상)" | "지원 필요";
type IepBookTab = "profile" | "prev" | "today" | "next";

type ColorKey =
  | "cyan"
  | "emerald"
  | "violet"
  | "amber"
  | "rose"
  | "teal"
  | "sky"
  | "fuchsia"
  | "lime"
  | "orange";

const DAYS: DayOfWeek[] = ["월", "화", "수", "목", "금", "토"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// localStorage & sessionStorage 저장 키 상수
const STORAGE_KEYS = {
  USERS: "iep_portal_users_v1",
  STUDENTS: "iep_portal_students_v1",
  CATEGORIES: "iep_portal_categories_v1",
  TIMETABLE: "iep_portal_timetable_v1",
  IEP_RECORDS: "iep_portal_iep_records_v1",
  ATTENDANCE: "iep_portal_attendance_v1",
  WEEKLY_TASKS: "iep_portal_weekly_tasks_v1",
  SESSION_USER: "iep_portal_session_user_v1",
  SESSION_PAGE: "iep_portal_session_page_v1",
};

// 자주 쓰는 IEP 문구 템플릿
const ACTIVITY_TEMPLATES: { label: string; text: string }[] = [
  {
    label: "기본 루틴(준비·본·정리)",
    text: "1) 준비운동: 관절 가동성 및 스트레칭 (5분)\n2) 본 활동: \n3) 정리운동: 호흡 조절 및 오늘 활동 소감 나누기 (5분)",
  },
  {
    label: "균형·협응 순환 활동",
    text: "1) 준비운동: 가벼운 제자리 걷기 및 몸풀기\n2) 본 활동: 평균대 보행 → 콘 터치 → 표적 던지기 순환 코스(3회 반복)\n3) 정리운동: 매트 스트레칭 및 이완",
  },
  {
    label: "수중 적응·부력 활동",
    text: "1) 풀사이드 스트레칭 및 입수 전 호흡 안내\n2) 본 활동: 수중 걷기, 발차기 및 부력 기구 활용 균형 유지\n3) 정리운동: 온수 샤워 및 컨디션 확인",
  },
];

const SUPPORT_TEMPLATES: { label: string; text: string }[] = [
  {
    label: "시각적 단서·타이머",
    text: "시각적 동선 표시 및 시각 타이머를 제공하여 과제 순서와 대기 시간을 명확히 안내함.",
  },
  {
    label: "단계적 촉진(최소→적절)",
    text: "시범 → 언어적 안내 → 부분 신체적 촉진 순으로 단계화하고, 독립 수행 시 즉시 긍정적 피드백 제공.",
  },
  {
    label: "난이도·교구 조절",
    text: "학생의 피로도와 수행 정확도에 맞춰 교구 크기·거리·반복 횟수를 유연하게 조절함.",
  },
];

interface UserAccount {
  id: string;
  loginId: string;
  password: string;
  name: string;
  role: Role;
}

interface Student {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  schoolGradeClass?: string;
  initialConsultInfo: string;
  currentStatusInfo: string;
  longTermGoal: string;
  shortTermGoal: string;
}

interface ClassCategory {
  id: string;
  name: string;
  colorKey?: ColorKey;
}

interface TimetableSlot {
  id: string;
  teacherId: string;
  day: DayOfWeek;
  period: number;
  categoryId: string;
  detailTitle?: string;
  studentIds: string[];
}

interface IEPRecord {
  sessionGoal: string;
  activityContent: string;
  supportStrategy: string;
  evaluation: string;
  progressStatus?: GoalProgressStatus;
  nextPlan: string;
  adminChecked?: boolean;
  adminFeedback?: string;
  adminCheckedAt?: string;
}

interface WeeklyTask {
  id: string;
  weekLabel: string;
  weekStartDate: string;
  title: string;
  detail: string;
  assignee: string;
  createdAt: string;
  checkedByTeacher: boolean;
  checkedByTeachers?: Record<string, boolean>;
}

interface CategoryTheme {
  key: ColorKey;
  label: string;
  swatch: string;
  card: string;
  badge: string;
  pill: string;
  titleHover: string;
  modalActive: string;
}

// --- 검정·흰색 제외한 10가지 색상 팔레트 ---
const COLOR_PALETTE: CategoryTheme[] = [
  {
    key: "cyan",
    label: "시안",
    swatch: "bg-cyan-500",
    card: "bg-cyan-50/90 hover:bg-cyan-100/90 border-cyan-300",
    badge: "bg-cyan-600 text-white",
    pill: "bg-cyan-100 text-cyan-900 border-cyan-200",
    titleHover: "group-hover:text-cyan-800",
    modalActive: "bg-cyan-600 text-white border-cyan-600 shadow-sm",
  },
  {
    key: "emerald",
    label: "에메랄드",
    swatch: "bg-emerald-500",
    card: "bg-emerald-50/90 hover:bg-emerald-100/90 border-emerald-300",
    badge: "bg-emerald-600 text-white",
    pill: "bg-emerald-100 text-emerald-900 border-emerald-200",
    titleHover: "group-hover:text-emerald-800",
    modalActive: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
  },
  {
    key: "violet",
    label: "바이올렛",
    swatch: "bg-violet-500",
    card: "bg-violet-50/90 hover:bg-violet-100/90 border-violet-300",
    badge: "bg-violet-600 text-white",
    pill: "bg-violet-100 text-violet-900 border-violet-200",
    titleHover: "group-hover:text-violet-800",
    modalActive: "bg-violet-600 text-white border-violet-600 shadow-sm",
  },
  {
    key: "amber",
    label: "앰버",
    swatch: "bg-amber-500",
    card: "bg-amber-50/90 hover:bg-amber-100/90 border-amber-300",
    badge: "bg-amber-600 text-white",
    pill: "bg-amber-100 text-amber-900 border-amber-200",
    titleHover: "group-hover:text-amber-800",
    modalActive: "bg-amber-600 text-white border-amber-600 shadow-sm",
  },
  {
    key: "rose",
    label: "로즈",
    swatch: "bg-rose-500",
    card: "bg-rose-50/90 hover:bg-rose-100/90 border-rose-300",
    badge: "bg-rose-600 text-white",
    pill: "bg-rose-100 text-rose-900 border-rose-200",
    titleHover: "group-hover:text-rose-800",
    modalActive: "bg-rose-600 text-white border-rose-600 shadow-sm",
  },
  {
    key: "teal",
    label: "틸",
    swatch: "bg-teal-500",
    card: "bg-teal-50/90 hover:bg-teal-100/90 border-teal-300",
    badge: "bg-teal-600 text-white",
    pill: "bg-teal-100 text-teal-900 border-teal-200",
    titleHover: "group-hover:text-teal-800",
    modalActive: "bg-teal-600 text-white border-teal-600 shadow-sm",
  },
  {
    key: "sky",
    label: "스카이",
    swatch: "bg-sky-500",
    card: "bg-sky-50/90 hover:bg-sky-100/90 border-sky-300",
    badge: "bg-sky-600 text-white",
    pill: "bg-sky-100 text-sky-900 border-sky-200",
    titleHover: "group-hover:text-sky-800",
    modalActive: "bg-sky-600 text-white border-sky-600 shadow-sm",
  },
  {
    key: "fuchsia",
    label: "푸시아",
    swatch: "bg-fuchsia-500",
    card: "bg-fuchsia-50/90 hover:bg-fuchsia-100/90 border-fuchsia-300",
    badge: "bg-fuchsia-600 text-white",
    pill: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200",
    titleHover: "group-hover:text-fuchsia-800",
    modalActive: "bg-fuchsia-600 text-white border-fuchsia-600 shadow-sm",
  },
  {
    key: "lime",
    label: "라임",
    swatch: "bg-lime-500",
    card: "bg-lime-50/90 hover:bg-lime-100/90 border-lime-300",
    badge: "bg-lime-600 text-white",
    pill: "bg-lime-100 text-lime-900 border-lime-200",
    titleHover: "group-hover:text-lime-800",
    modalActive: "bg-lime-600 text-white border-lime-600 shadow-sm",
  },
  {
    key: "orange",
    label: "오렌지",
    swatch: "bg-orange-500",
    card: "bg-orange-50/90 hover:bg-orange-100/90 border-orange-300",
    badge: "bg-orange-600 text-white",
    pill: "bg-orange-100 text-orange-900 border-orange-200",
    titleHover: "group-hover:text-orange-800",
    modalActive: "bg-orange-600 text-white border-orange-600 shadow-sm",
  },
];

function getThemeByColorKey(colorKey?: ColorKey, fallbackSeed = ""): CategoryTheme {
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

// --- 초기 계정 및 테스트 데이터 ---
const INITIAL_USERS: UserAccount[] = [
  { id: "admin-1", loginId: "admin", password: "1234", name: "총괄 관리자", role: "admin" },
  { id: "t-1", loginId: "teacher1", password: "1234", name: "정현우 선생님", role: "teacher" },
  { id: "t-2", loginId: "teacher2", password: "1234", name: "김휘원 선생님", role: "teacher" },
];

const INITIAL_CATEGORIES: ClassCategory[] = [
  { id: "cat-1", name: "수중", colorKey: "cyan" },
  { id: "cat-2", name: "PT", colorKey: "emerald" },
  { id: "cat-3", name: "재활", colorKey: "violet" },
  { id: "cat-4", name: "특수체육", colorKey: "amber" },
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: "st-1",
    name: "민규빈",
    birthDate: "2016-05-14",
    schoolGradeClass: "경산초등학교 4학년 2반",
    initialConsultInfo:
      "초기 상담(2026.03): 상지 협응력 양호, 청각 지시보다 시각적 단서 제공 시 과제 이해도가 높음.",
    currentStatusInfo:
      "최근 낮은 평균대 보행 안정감 향상됨. 피로 누적 시 집중력이 다소 떨어져 15분 단위 휴식 권장.",
    longTermGoal:
      "다양한 지지면 환경에서 독립적으로 동적 균형을 유지하며 이동 움직임 수행하기",
    shortTermGoal:
      "높이 10cm 평균대 위에서 양팔을 벌리고 5초간 정적 균형 유지 후 끝까지 보행하기",
  },
  {
    id: "st-2",
    name: "김서연",
    birthDate: "2016-09-22",
    schoolGradeClass: "경산초등학교 4학년 2반",
    initialConsultInfo:
      "초기 상담(2026.03): 새로운 환경에 낯가림이 있으나 라포 형성 후 규칙적인 활동 선호.",
    currentStatusInfo:
      "짝 활동 및 릴레이 게임에 높은 흥미를 보임. 물에 대한 두려움이 줄어 수중 호흡 연습 가능.",
    longTermGoal: "소집단 규칙 게임에 자발적으로 참여하며 기초 체력 및 협응력 증진하기",
    shortTermGoal: "교사의 시범 후 2단계 연속 동작(던지고 받기)을 5회 중 4회 이상 성공하기",
  },
  {
    id: "st-3",
    name: "박도윤",
    birthDate: "2015-03-08",
    schoolGradeClass: "영남초등학교 5학년 1반",
    initialConsultInfo:
      "초기 상담(2026.04): 대근육 활동 의욕이 매우 높으나 순서 기다리기 및 충동 조절 지원 필요.",
    currentStatusInfo:
      "타이머 시각 자료 활용 시 대기 시간이 크게 개선됨. 하체 근력 트레이닝 강도 상향 가능.",
    longTermGoal: "게임 규칙과 순서를 준수하며 근지구력 및 조절된 신체 움직임 발휘하기",
    shortTermGoal:
      "시각 타이머 안내에 따라 30초 대기 후 스쿼트 및 점프 동작 10회 완수하기",
  },
  {
    id: "st-4",
    name: "이하은",
    birthDate: "2017-11-30",
    schoolGradeClass: "",
    initialConsultInfo:
      "초기 상담(2026.05): 소도구 조작 경험이 적고 근긴장도가 다소 낮음. 긍정적 칭찬에 반응 우수.",
    currentStatusInfo:
      "큰 짐볼 및 스펀지 공 잡기 성공률 80% 도달. 작은 크기의 공으로 점진적 난이도 조정 중.",
    longTermGoal: "다양한 크기와 무게의 공을 조작하며 눈-손 협응력 및 상지 근력 기르기",
    shortTermGoal: "2m 거리에서 굴러오는 배구공 크기의 공을 두 손으로 정확히 포구하기",
  },
];

const INITIAL_TIMETABLE: TimetableSlot[] = [
  {
    id: "slot-1",
    teacherId: "t-1",
    day: "월",
    period: 1,
    categoryId: "cat-4",
    detailTitle: "기초 이동 및 균형",
    studentIds: ["st-1", "st-2"],
  },
  {
    id: "slot-2",
    teacherId: "t-1",
    day: "수",
    period: 2,
    categoryId: "cat-1",
    detailTitle: "수중 적응 및 부력 균형",
    studentIds: ["st-1", "st-3"],
  },
  {
    id: "slot-3",
    teacherId: "t-1",
    day: "금",
    period: 3,
    categoryId: "cat-3",
    detailTitle: "코어 및 자세 안정화",
    studentIds: ["st-2"],
  },
  {
    id: "slot-4",
    teacherId: "t-2",
    day: "화",
    period: 1,
    categoryId: "cat-2",
    detailTitle: "개별 근력 트레이닝",
    studentIds: ["st-3", "st-4"],
  },
  {
    id: "slot-5",
    teacherId: "t-2",
    day: "목",
    period: 2,
    categoryId: "cat-4",
    detailTitle: "소도구 조작 활동",
    studentIds: ["st-4"],
  },
];

// --- 생년월일 기준 만 나이 자동 계산 ---
function calculateAge(birthDateStr: string): number | null {
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

// --- 실제 달력 날짜 계산 유틸리티 ---
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatShortDate(monday: Date, offsetDays: number): string {
  const d = new Date(monday);
  d.setDate(monday.getDate() + offsetDays);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getExactDateFromMondayKey(mondayKey: string, day: DayOfWeek): string {
  const [y, m, d] = mondayKey.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const offset = DAYS.indexOf(day);
  base.setDate(base.getDate() + (offset >= 0 ? offset : 0));
  return formatDateKey(base);
}

function getWeekLabelByMonday(monday: Date): string {
  const year = monday.getFullYear();
  const month = monday.getMonth() + 1;
  const weekNumber = Math.ceil(monday.getDate() / 7);
  const startStr = `${month}/${monday.getDate()}`;
  const satDate = new Date(monday);
  satDate.setDate(monday.getDate() + 5);
  const endStr = `${satDate.getMonth() + 1}/${satDate.getDate()}`;
  return `${year}년 ${month}월 ${weekNumber}주차 (${startStr}~${endStr})`;
}

function getWeekInfoFromDateString(dateStr: string) {
  const parts = dateStr.split("-").map(Number);
  const parsed =
    parts.length === 3 && !parts.some(Number.isNaN)
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date();
  const mon = getMonday(parsed);
  return {
    weekLabel: getWeekLabelByMonday(mon),
    weekStartDate: formatDateKey(mon),
  };
}

// --- 주간 업무 대상 선생님 및 확인 상태 헬퍼 ---
function getTargetTeachersForTask(
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

function isTaskCheckedByTeacher(task: WeeklyTask, teacherId: string): boolean {
  if (
    task.checkedByTeachers &&
    Object.prototype.hasOwnProperty.call(task.checkedByTeachers, teacherId)
  ) {
    return Boolean(task.checkedByTeachers[teacherId]);
  }
  return Boolean(task.checkedByTeacher);
}

function normalizeWeeklyTask(raw: WeeklyTask, teachers: UserAccount[]): WeeklyTask {
  const map: Record<string, boolean> = { ...(raw.checkedByTeachers || {}) };
  if (raw.checkedByTeacher && Object.keys(map).length === 0) {
    getTargetTeachersForTask(raw, teachers).forEach((t) => {
      map[t.id] = true;
    });
  }
  const targets = getTargetTeachersForTask(raw, teachers);
  const allChecked =
    targets.length > 0 && targets.every((t) => Boolean(map[t.id]));

  return {
    ...raw,
    checkedByTeachers: map,
    checkedByTeacher: allChecked,
  };
}

function createDefaultWeeklyTasks(baseMonday: Date): WeeklyTask[] {
  return [
    {
      id: "wt-default-1",
      weekLabel: getWeekLabelByMonday(baseMonday),
      weekStartDate: formatDateKey(baseMonday),
      title: "주간 IEP 상담 일지 및 목표 진전도 점검",
      detail:
        "1. 담당 학생별 금주 수업 활동 내용 및 아이의 반응을 기록해 주세요.\n2. 목표 달성 진전도(달성 완료 / 진행 중 / 지원 필요)를 선택해 주세요.\n3. 금요일 수업 종료 전까지 작성을 완료해 주시기 바랍니다.",
      assignee: "전체 선생님",
      createdAt: formatDateKey(new Date()),
      checkedByTeacher: false,
      checkedByTeachers: {},
    },
  ];
}

// --- 출결 및 목표 달성도 배지 스타일 헬퍼 ---
function getAttendanceBadgeStyle(status?: AttendanceStatus) {
  if (status === "출석") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "결석") return "bg-rose-100 text-rose-800 border-rose-200";
  if (status === "보강") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
}

function getProgressBadgeStyle(status?: GoalProgressStatus) {
  if (status === "달성 완료") return "bg-emerald-600 text-white border-emerald-600";
  if (status === "진행 중(향상)") return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "지원 필요") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
}

function getProgressEmoji(status?: GoalProgressStatus) {
  if (status === "달성 완료") return "🏆";
  if (status === "진행 중(향상)") return "📈";
  if (status === "지원 필요") return "🤝";
  return "•";
}

// --- 초기 샘플 IEP/출결 생성 함수 ---
function createDefaultIEPRecords(): Record<string, IEPRecord> {
  const thisMon = getMonday(new Date());
  const lastMon = new Date(thisMon);
  lastMon.setDate(thisMon.getDate() - 7);

  const thisMonKey = formatDateKey(thisMon);
  const lastMonKey = formatDateKey(lastMon);

  return {
    [`${lastMonKey}_slot-1_st-1`]: {
      sessionGoal: "낮은 평균대(높이 5cm) 위에서 양팔을 벌리고 흔들림 없이 3m 보행하기",
      activityContent:
        "1) 준비운동: 발목 및 고관절 스트레칭 5분\n2) 본 활동: 높이 5cm 평균대 위 발자국 스티커를 따라 앞·뒤로 걷기 및 반환점 색깔 콘 터치하기\n3) 정리운동: 호흡 가다듬기 및 소감 나누기",
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
      activityContent:
        "낮은 평균대 워킹 워밍업 후 10cm 평균대 중앙 색깔 표식에서 양팔을 벌리고 5초 정지 균형 훈련 진행",
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

function createDefaultAttendanceRecords(): Record<string, AttendanceStatus> {
  const thisMon = getMonday(new Date());
  const lastMon = new Date(thisMon);
  lastMon.setDate(thisMon.getDate() - 7);

  return {
    [`${formatDateKey(lastMon)}_slot-1_st-1`]: "출석",
    [`${formatDateKey(thisMon)}_slot-1_st-1`]: "출석",
  };
}

export default function Home() {
  const [isStorageLoaded, setIsStorageLoaded] = useState<boolean>(false);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [categories, setCategories] = useState<ClassCategory[]>(INITIAL_CATEGORIES);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(INITIAL_TIMETABLE);
  const [iepRecords, setIepRecords] = useState<Record<string, IEPRecord>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loginIdInput, setLoginIdInput] = useState<string>("");
  const [loginPwInput, setLoginPwInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  const [activePage, setActivePage] = useState<
    | "timetable"
    | "detail"
    | "teacherHistory"
    | "adminReview"
    | "weeklyTasks"
    | "students"
    | "categories"
    | "accounts"
  >("timetable");

  const [currentMonday, setCurrentMonday] = useState<Date>(() => new Date(2026, 10, 23));
  const [historyMonday, setHistoryMonday] = useState<Date>(() => new Date(2026, 10, 23));
  const [reviewMonday, setReviewMonday] = useState<Date>(() => new Date(2026, 10, 23));

  const [adminTargetTeacherId, setAdminTargetTeacherId] = useState<string>("t-1");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [iepIndexTab, setIepIndexTab] = useState<IepBookTab>("today");

  const [historyStudentId, setHistoryStudentId] = useState<string>("");
  const [historyViewMode, setHistoryViewMode] = useState<"timetable" | "files">("timetable");
  const [selectedHistoryKey, setSelectedHistoryKey] = useState<string | null>(null);

  const [reviewTeacherId, setReviewTeacherId] = useState<string>("t-1");
  const [reviewStudentFilterId, setReviewStudentFilterId] = useState<string>("all");
  const [reviewOnlyUnchecked, setReviewOnlyUnchecked] = useState<boolean>(false);
  const [reviewViewMode, setReviewViewMode] = useState<"timetable" | "files">("timetable");
  const [selectedReviewSlotId, setSelectedReviewSlotId] = useState<string | null>(null);
  const [selectedReviewFileKey, setSelectedReviewFileKey] = useState<string | null>(null);
  const [adminFeedbackDrafts, setAdminFeedbackDrafts] = useState<Record<string, string>>({});
  const [reviewSaveMsg, setReviewSaveMsg] = useState<string>("");

  const [taskDateInput, setTaskDateInput] = useState<string>("2026-11-24");
  const [taskTitleInput, setTaskTitleInput] = useState<string>("");
  const [taskDetailInput, setTaskDetailInput] = useState<string>("");
  const [taskAssigneeInput, setTaskAssigneeInput] = useState<string>("전체 선생님");
  const [weeklyTaskMessage, setWeeklyTaskMessage] = useState<string>("");
  const [popupTaskId, setPopupTaskId] = useState<string | null>(null);

  const [isEditingGoalsAndStatus, setIsEditingGoalsAndStatus] = useState<boolean>(false);
  const [goalLongInput, setGoalLongInput] = useState<string>("");
  const [goalShortInput, setGoalShortInput] = useState<string>("");
  const [statusInput, setStatusInput] = useState<string>("");
  const [profileSaveMsg, setProfileSaveMsg] = useState<string>("");

  const [editingCell, setEditingCell] = useState<{
    day: DayOfWeek;
    period: number;
    existingSlot?: TimetableSlot;
  } | null>(null);
  const [modalCategoryId, setModalCategoryId] = useState<string>("cat-4");
  const [modalDetailTitle, setModalDetailTitle] = useState<string>("");
  const [modalStudentIds, setModalStudentIds] = useState<string[]>([]);

  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentNameInput, setStudentNameInput] = useState<string>("");
  const [studentBirthInput, setStudentBirthInput] = useState<string>("2016-01-01");
  const [studentSchoolInput, setStudentSchoolInput] = useState<string>("");
  const [studentInitialConsultInput, setStudentInitialConsultInput] = useState<string>("");
  const [studentCurrentStatusInput, setStudentCurrentStatusInput] = useState<string>("");
  const [studentLongGoalInput, setStudentLongGoalInput] = useState<string>("");
  const [studentShortGoalInput, setStudentShortGoalInput] = useState<string>("");
  const [studentMessage, setStudentMessage] = useState<string>("");

  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryColorKey, setNewCategoryColorKey] = useState<ColorKey>("sky");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");
  const [editingCategoryColorKey, setEditingCategoryColorKey] = useState<ColorKey>("cyan");
  const [categoryMessage, setCategoryMessage] = useState<string>("");

  const [newTeacherName, setNewTeacherName] = useState<string>("");
  const [newTeacherLoginId, setNewTeacherLoginId] = useState<string>("");
  const [newTeacherPassword, setNewTeacherPassword] = useState<string>("");
  const [accountMessage, setAccountMessage] = useState<string>("");
  const [editingPwUserId, setEditingPwUserId] = useState<string | null>(null);
  const [updatedPassword, setUpdatedPassword] = useState<string>("");

  const [saveMessage, setSaveMessage] = useState<string>("");

  useEffect(() => {
    try {
      const now = new Date();
      const todayMon = getMonday(now);
      setCurrentMonday(todayMon);
      setHistoryMonday(todayMon);
      setReviewMonday(todayMon);
      setTaskDateInput(formatDateKey(now));

      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const savedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const savedTimetable = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
      const savedIepRecords = localStorage.getItem(STORAGE_KEYS.IEP_RECORDS);
      const savedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      const savedWeeklyTasks = localStorage.getItem(STORAGE_KEYS.WEEKLY_TASKS);

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

      if (savedIepRecords) {
        setIepRecords(JSON.parse(savedIepRecords));
      } else {
        setIepRecords(createDefaultIEPRecords());
      }

      if (savedAttendance) {
        setAttendanceRecords(JSON.parse(savedAttendance));
      } else {
        setAttendanceRecords(createDefaultAttendanceRecords());
      }

      if (savedWeeklyTasks) {
        const parsedTasks: WeeklyTask[] = JSON.parse(savedWeeklyTasks);
        setWeeklyTasks(parsedTasks.map((t) => normalizeWeeklyTask(t, parsedTeachers)));
      } else {
        setWeeklyTasks(createDefaultWeeklyTasks(todayMon));
      }

      const savedSessionUser = sessionStorage.getItem(STORAGE_KEYS.SESSION_USER);
      const savedSessionPage = sessionStorage.getItem(STORAGE_KEYS.SESSION_PAGE);
      if (savedSessionUser) {
        const sessionUser: UserAccount = JSON.parse(savedSessionUser);
        const validUser = parsedUsers.find((u) => u.id === sessionUser.id);
        if (validUser) {
          setCurrentUser(validUser);
          if (validUser.role === "admin" && parsedTeachers.length > 0) {
            setAdminTargetTeacherId(parsedTeachers[0].id);
            setReviewTeacherId(parsedTeachers[0].id);
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
            ].includes(savedSessionPage)
          ) {
            setActivePage(savedSessionPage as typeof activePage);
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
    if (!popupTaskId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopupTaskId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [popupTaskId]);

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
    if (!isStorageLoaded || !currentUser) return;
    sessionStorage.setItem(STORAGE_KEYS.SESSION_PAGE, activePage);
  }, [activePage, currentUser, isStorageLoaded]);

  const handleExportBackupJson = () => {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      users,
      students,
      categories,
      timetable,
      iepRecords,
      attendanceRecords,
      weeklyTasks,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IEP_통합백업_${formatDateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || "{}"));
        if (!parsed.users || !parsed.students || !parsed.timetable || !parsed.iepRecords) {
          alert("올바른 IEP 백업 JSON 파일이 아닙니다.");
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

        alert("✅ 백업 파일에서 모든 데이터가 성공적으로 복원되었습니다!");
      } catch {
        alert("백업 파일을 읽는 중 오류가 발생했습니다.");
      } finally {
        if (backupFileInputRef.current) backupFileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const teachersOnly = users.filter((u) => u.role === "teacher");
  const activeTeacherId =
    currentUser?.role === "admin" ? adminTargetTeacherId : currentUser?.id || "";
  const activeTeacher = teachersOnly.find((t) => t.id === activeTeacherId) || teachersOnly[0];
  const visibleTimetable = timetable.filter((slot) => slot.teacherId === activeTeacher?.id);

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

  const getAssignedStudentsForTeacher = (teacherId: string): Student[] => {
    const teacherSlots = timetable.filter((slot) => slot.teacherId === teacherId);
    const assignedIds = new Set<string>();
    teacherSlots.forEach((slot) => slot.studentIds.forEach((id) => assignedIds.add(id)));
    return students.filter((st) => assignedIds.has(st.id));
  };

  const weekKey = formatDateKey(currentMonday);
  const weekRangeLabel = `${currentMonday.getFullYear()}년 ${formatShortDate(
    currentMonday,
    0
  )} (월) ~ ${formatShortDate(currentMonday, 5)} (토)`;

  const getCategoryById = (catId: string) => categories.find((c) => c.id === catId);
  const getCategoryName = (catId: string) => getCategoryById(catId)?.name || "미지정";
  const getCategoryTheme = (catIdOrName: string): CategoryTheme => {
    const byId = categories.find((c) => c.id === catIdOrName);
    if (byId) {
      return getThemeByColorKey(byId.colorKey, byId.name);
    }
    const byName = categories.find((c) => c.name === catIdOrName);
    if (byName) {
      return getThemeByColorKey(byName.colorKey, byName.name);
    }
    return getThemeByColorKey(undefined, catIdOrName);
  };

  // [2번] 출결 통계 + 미보강 잔여 횟수 계산
  const getStudentAttendanceStats = (studentId: string) => {
    let present = 0;
    let absent = 0;
    let makeup = 0;

    Object.entries(attendanceRecords).forEach(([key, status]) => {
      if (key.endsWith(`_${studentId}`)) {
        if (status === "출석") present++;
        else if (status === "결석") absent++;
        else if (status === "보강") makeup++;
      }
    });

    const pendingMakeup = Math.max(0, absent - makeup);
    return { present, absent, makeup, pendingMakeup, total: present + absent + makeup };
  };

  // [4번] 관리자 주간 요약 대시보드 지표 계산
  const adminWeeklySummary = (() => {
    const totalSlots = timetable.length;
    let totalStudentSessions = 0;
    let completedIepCount = 0;
    let weekPresent = 0;
    let weekAbsent = 0;
    let weekMakeup = 0;

    timetable.forEach((slot) => {
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
        if (hasContent) completedIepCount++;

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

    const uncheckedTasksAll = weeklyTasks.filter((task) => {
      const targets = getTargetTeachersForTask(task, teachersOnly);
      return targets.some((t) => !isTaskCheckedByTeacher(task, t.id));
    }).length;

    return {
      totalSlots,
      totalStudentSessions,
      completedIepCount,
      completionRate,
      weekPresent,
      weekAbsent,
      weekMakeup,
      uncheckedTasksAll,
    };
  })();

  const getPreviousSessionRecord = (studentId: string, currentExactDate: string) => {
    const pastSessions = Object.entries(iepRecords)
      .filter(([key, rec]) => {
        const [mKey, sId, stId] = key.split("_");
        if (stId !== studentId) return false;
        const slot = timetable.find((s) => s.id === sId);
        const exactDate = slot ? getExactDateFromMondayKey(mKey, slot.day) : mKey;
        const hasAnyContent = Boolean(
          rec.sessionGoal.trim() ||
            rec.activityContent.trim() ||
            rec.evaluation.trim() ||
            rec.nextPlan.trim()
        );
        return exactDate < currentExactDate && hasAnyContent;
      })
      .map(([key, rec]) => {
        const [mKey, sId] = key.split("_");
        const slot = timetable.find((s) => s.id === sId);
        const exactDate = slot ? getExactDateFromMondayKey(mKey, slot.day) : mKey;
        return {
          exactDate,
          dayPeriod: slot ? `${slot.day}${slot.period}` : "-",
          categoryName: slot ? getCategoryName(slot.categoryId) : "수업",
          record: rec,
        };
      })
      .sort((a, b) => b.exactDate.localeCompare(a.exactDate));

    return pastSessions[0] || null;
  };

  const handleAddWeeklyTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = taskTitleInput.trim();
    if (!trimmedTitle) return;

    const { weekLabel: chosenLabel, weekStartDate: chosenMondayKey } =
      getWeekInfoFromDateString(taskDateInput);
    const chosenAssignee = taskAssigneeInput.trim() || "전체 선생님";

    const initialTeacherMap: Record<string, boolean> = {};
    getTargetTeachersForTask({ assignee: chosenAssignee }, teachersOnly).forEach((t) => {
      initialTeacherMap[t.id] = false;
    });

    const newTask: WeeklyTask = {
      id: `wt-${Date.now()}`,
      weekLabel: chosenLabel,
      weekStartDate: chosenMondayKey,
      title: trimmedTitle,
      detail: taskDetailInput.trim() || "상세 지시사항 없음",
      assignee: chosenAssignee,
      createdAt: formatDateKey(new Date()),
      checkedByTeacher: false,
      checkedByTeachers: initialTeacherMap,
    };

    setWeeklyTasks((prev) => [newTask, ...prev]);
    setTaskTitleInput("");
    setTaskDetailInput("");
    setWeeklyTaskMessage(
      `✅ 선택한 날짜(${taskDateInput})가 '${chosenLabel}'로 자동 반영되었습니다.`
    );
    setTimeout(() => setWeeklyTaskMessage(""), 3500);
  };

  const handleToggleWeeklyTaskChecked = (taskId: string, teacherId?: string) => {
    const targetTeacherId = teacherId || currentUser?.id;
    if (!targetTeacherId) return;

    setWeeklyTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const currentVal = isTaskCheckedByTeacher(task, targetTeacherId);
        const nextMap: Record<string, boolean> = {
          ...(task.checkedByTeachers || {}),
          [targetTeacherId]: !currentVal,
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
    );
  };

  const handleDeleteWeeklyTask = (taskId: string) => {
    setWeeklyTasks((prev) => prev.filter((task) => task.id !== taskId));
    if (popupTaskId === taskId) setPopupTaskId(null);
    setWeeklyTaskMessage("🗑️ 주간 업무가 삭제되었습니다.");
    setTimeout(() => setWeeklyTaskMessage(""), 3000);
  };

  const moveWeek = (weeks: number) => {
    const next = new Date(currentMonday);
    next.setDate(currentMonday.getDate() + weeks * 7);
    setCurrentMonday(next);
    setTaskDateInput(formatDateKey(next));
    setSaveMessage("");
  };

  const resetToThisWeek = () => {
    const now = new Date();
    const todayMon = getMonday(now);
    setCurrentMonday(todayMon);
    setTaskDateInput(formatDateKey(now));
    setSaveMessage("");
  };

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
    setPopupTaskId(null);
    setLoginIdInput("");
    setLoginPwInput("");

    sessionStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(matchedUser));
    sessionStorage.setItem(STORAGE_KEYS.SESSION_PAGE, "timetable");

    if (matchedUser.role === "admin" && teachersOnly.length > 0) {
      setAdminTargetTeacherId(teachersOnly[0].id);
      setReviewTeacherId(teachersOnly[0].id);
    } else if (matchedUser.role === "teacher") {
      const myStudents = getAssignedStudentsForTeacher(matchedUser.id);
      setHistoryStudentId(myStudents[0]?.id || "");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActivePage("timetable");
    setSelectedSlotId(null);
    setSelectedStudentId(null);
    setPopupTaskId(null);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_PAGE);
  };

  const handleOpenSlotDetail = (slot: TimetableSlot) => {
    setSelectedSlotId(slot.id);
    const firstStId = slot.studentIds[0] || null;
    setSelectedStudentId(firstStId);
    setIepIndexTab("today");
    setIsEditingGoalsAndStatus(false);
    setSaveMessage("");
    setProfileSaveMsg("");
    setActivePage("detail");
  };

  const handleOpenTeacherHistory = (studentId?: string) => {
    if (!currentUser || currentUser.role !== "teacher") return;
    const myStudents = getAssignedStudentsForTeacher(currentUser.id);

    if (studentId && myStudents.some((s) => s.id === studentId)) {
      setHistoryStudentId(studentId);
    } else if (myStudents.length > 0 && !myStudents.some((s) => s.id === historyStudentId)) {
      setHistoryStudentId(myStudents[0].id);
    }
    setSelectedHistoryKey(null);
    setHistoryMonday(currentMonday);
    setActivePage("teacherHistory");
  };

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

  const handleChangeCategoryColor = (catId: string, colorKey: ColorKey) => {
    const colorLabel = COLOR_PALETTE.find((c) => c.key === colorKey)?.label || colorKey;
    setCategories((prev) =>
      prev.map((cat) => (cat.id === catId ? { ...cat, colorKey } : cat))
    );
    setCategoryMessage(`🎨 색상이 '${colorLabel}'(으)로 변경되었습니다.`);
    setTimeout(() => setCategoryMessage(""), 2500);
  };

  const toggleModalStudent = (studentId: string) => {
    setModalStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSaveTimetableSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell || !modalCategoryId || modalStudentIds.length === 0 || !activeTeacher) return;

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

  const handleDeleteTimetableSlot = () => {
    if (!editingCell?.existingSlot) return;
    setTimetable((prev) => prev.filter((s) => s.id !== editingCell.existingSlot!.id));
    setEditingCell(null);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const name = studentNameInput.trim();
    const birthDate = studentBirthInput;
    const schoolGradeClass = studentSchoolInput.trim();
    const initialConsultInfo = studentInitialConsultInput.trim();
    const currentStatusInfo = studentCurrentStatusInput.trim();
    const longTermGoal = studentLongGoalInput.trim();
    const shortTermGoal = studentShortGoalInput.trim();

    if (!name || !birthDate) return;

    if (editingStudentId) {
      setStudents((prev) =>
        prev.map((st) =>
          st.id === editingStudentId
            ? {
                ...st,
                name,
                birthDate,
                schoolGradeClass,
                initialConsultInfo: initialConsultInfo || "초기 상담 내용 미입력",
                currentStatusInfo: currentStatusInfo || st.currentStatusInfo,
                longTermGoal,
                shortTermGoal,
              }
            : st
        )
      );
      setStudentMessage(`✅ '${name}' 학생 정보가 저장되었습니다.`);
    } else {
      const newStudent: Student = {
        id: `st-${Date.now()}`,
        name,
        birthDate,
        schoolGradeClass,
        initialConsultInfo: initialConsultInfo || "초기 상담 내용 미입력",
        currentStatusInfo: currentStatusInfo || "담당 선생님 관찰 특이사항 미입력",
        longTermGoal,
        shortTermGoal,
      };
      setStudents((prev) => [...prev, newStudent]);
      setStudentMessage(`✅ '${name}' 학생이 새로 등록되었습니다.`);
    }

    handleCancelEditStudent();
    setTimeout(() => setStudentMessage(""), 3500);
  };

  const handleStartEditStudent = (st: Student) => {
    setEditingStudentId(st.id);
    setStudentNameInput(st.name);
    setStudentBirthInput(st.birthDate);
    setStudentSchoolInput(st.schoolGradeClass || "");
    setStudentInitialConsultInput(st.initialConsultInfo);
    setStudentCurrentStatusInput(st.currentStatusInfo);
    setStudentLongGoalInput(st.longTermGoal);
    setStudentShortGoalInput(st.shortTermGoal);
  };

  const handleCancelEditStudent = () => {
    setEditingStudentId(null);
    setStudentNameInput("");
    setStudentBirthInput("2016-01-01");
    setStudentSchoolInput("");
    setStudentInitialConsultInput("");
    setStudentCurrentStatusInput("");
    setStudentLongGoalInput("");
    setStudentShortGoalInput("");
  };

  const handleDeleteStudent = (st: Student) => {
    setStudents((prev) => prev.filter((item) => item.id !== st.id));
    setTimetable((prev) =>
      prev.map((slot) => ({
        ...slot,
        studentIds: slot.studentIds.filter((id) => id !== st.id),
      }))
    );
    if (editingStudentId === st.id) {
      handleCancelEditStudent();
    }
    setStudentMessage(`🗑️ '${st.name}' 학생이 명단에서 삭제되었습니다.`);
    setTimeout(() => setStudentMessage(""), 3500);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name === trimmed)) {
      setCategoryMessage("⚠️ 이미 등록된 수업 종류입니다.");
      return;
    }
    const chosenColor = newCategoryColorKey;
    const chosenColorLabel =
      COLOR_PALETTE.find((c) => c.key === chosenColor)?.label || chosenColor;

    setCategories((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, name: trimmed, colorKey: chosenColor },
    ]);
    setNewCategoryName("");

    const usedKeys = new Set(categories.map((c) => getThemeByColorKey(c.colorKey, c.name).key));
    usedKeys.add(chosenColor);
    const unusedColor = COLOR_PALETTE.find((item) => !usedKeys.has(item.key));
    if (unusedColor) {
      setNewCategoryColorKey(unusedColor.key);
    }

    setCategoryMessage(`✅ '${trimmed}' (${chosenColorLabel}) 수업 종류가 추가되었습니다.`);
    setTimeout(() => setCategoryMessage(""), 3000);
  };

  const handleSaveEditCategory = (catId: string) => {
    const trimmed = editingCategoryName.trim();
    if (!trimmed) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, name: trimmed, colorKey: editingCategoryColorKey } : c
      )
    );
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setCategoryMessage("✅ 수업 종류 및 색상이 수정되었습니다.");
    setTimeout(() => setCategoryMessage(""), 3000);
  };

  const handleDeleteCategory = (cat: ClassCategory) => {
    if (categories.length <= 1) {
      setCategoryMessage("⚠️ 최소 1개 이상의 수업 종류는 유지되어야 합니다.");
      return;
    }
    const isInUse = timetable.some((slot) => slot.categoryId === cat.id);
    if (isInUse) {
      setCategoryMessage(
        `⚠️ '${cat.name}' 수업이 현재 시간표에 배정되어 있어 삭제할 수 없습니다.`
      );
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    setCategoryMessage(`🗑️ '${cat.name}' 수업 종류가 삭제되었습니다.`);
    setTimeout(() => setCategoryMessage(""), 3000);
  };

  const handleCreateTeacherAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newTeacherName.trim();
    const trimmedId = newTeacherLoginId.trim();
    const trimmedPw = newTeacherPassword.trim();

    if (!trimmedName || !trimmedId || !trimmedPw) return;

    if (users.some((u) => u.loginId === trimmedId)) {
      setAccountMessage("⚠️ 이미 사용 중인 아이디입니다. 다른 아이디를 입력하세요.");
      return;
    }

    const newAccount: UserAccount = {
      id: `t-${Date.now()}`,
      loginId: trimmedId,
      password: trimmedPw,
      name: trimmedName,
      role: "teacher",
    };

    setUsers((prev) => [...prev, newAccount]);
    setNewTeacherName("");
    setNewTeacherLoginId("");
    setNewTeacherPassword("");
    setAccountMessage(`✅ '${trimmedName}' (${trimmedId}) 계정이 생성되었습니다.`);
    setTimeout(() => setAccountMessage(""), 3500);
  };

  const handleUpdateTeacherPassword = (userId: string) => {
    if (!updatedPassword.trim()) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: updatedPassword.trim() } : u))
    );
    setEditingPwUserId(null);
    setUpdatedPassword("");
    setAccountMessage("✅ 비밀번호가 변경되었습니다.");
    setTimeout(() => setAccountMessage(""), 3000);
  };

  const handleDeleteTeacherAccount = (teacher: UserAccount) => {
    if (teachersOnly.length <= 1) {
      setAccountMessage("⚠️ 최소 1명 이상의 선생님 계정은 유지되어야 합니다.");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== teacher.id));
    setTimetable((prev) => prev.filter((s) => s.teacherId !== teacher.id));
    if (adminTargetTeacherId === teacher.id) {
      const remaining = teachersOnly.filter((t) => t.id !== teacher.id);
      if (remaining[0]) setAdminTargetTeacherId(remaining[0].id);
    }
    setAccountMessage(`🗑️ '${teacher.name}' 계정이 삭제되었습니다.`);
    setTimeout(() => setAccountMessage(""), 3500);
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
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-600">💡 계정 및 저장 안내:</p>
            </div>
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

  const renderHeader = () => (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setActivePage("timetable")}
          className="text-lg font-bold text-slate-800 hover:text-blue-600 transition"
        >
          사이언스 특수체육 수성센터
        </button>

        <span
          className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
            currentUser.role === "admin"
              ? "bg-slate-800 text-white"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {currentUser.role === "admin" ? "관리자 모드" : "선생님 모드"}
        </span>

        <nav className="flex flex-wrap items-center gap-1 ml-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActivePage("timetable")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activePage === "timetable" || activePage === "detail"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🗓️ 주간 시간표
          </button>

          <button
            onClick={() => {
              setWeeklyTaskMessage("");
              setPopupTaskId(null);
              setTaskDateInput(formatDateKey(new Date()));
              setActivePage("weeklyTasks");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 ${
              activePage === "weeklyTasks"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>{currentUser.role === "admin" ? "📌 주간 업무 지시" : "📌 주간 업무"}</span>
            {currentUser.role === "teacher" && uncheckedWeeklyTaskCount > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[10px] font-extrabold rounded-full">
                {uncheckedWeeklyTaskCount}
              </span>
            )}
          </button>

          {currentUser.role === "teacher" ? (
            <button
              onClick={() => handleOpenTeacherHistory()}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activePage === "teacherHistory"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📚 담당 학생 누적 IEP & 출결
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setReviewSaveMsg("");
                  setReviewMonday(currentMonday);
                  setActivePage("adminReview");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 ${
                  activePage === "adminReview"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🕵️ 선생님별 IEP 검토·피드백</span>
                {totalUncheckedIepCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-extrabold rounded-full">
                    {totalUncheckedIepCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActivePage("students")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activePage === "students"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🎓 학생 명단 ({students.length})
              </button>
              <button
                onClick={() => setActivePage("categories")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activePage === "categories"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🏷️ 수업 종류·색상 ({categories.length})
              </button>
              <button
                onClick={() => setActivePage("accounts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activePage === "accounts"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                👤 선생님 계정 ({teachersOnly.length})
              </button>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {currentUser.role === "admin" && (
          <div className="flex items-center gap-1.5 mr-1">
            <button
              type="button"
              onClick={handleExportBackupJson}
              title="전체 데이터를 JSON 파일로 백업 다운로드"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition"
            >
              💾 백업
            </button>
            <button
              type="button"
              onClick={() => backupFileInputRef.current?.click()}
              title="백업된 JSON 파일 불러오기"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition"
            >
              📂 복원
            </button>
            <input
              ref={backupFileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackupJson}
              className="hidden"
            />
          </div>
        )}

        <span
          className="hidden md:inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"
          title="모든 변경사항이 브라우저에 자동 저장됩니다"
        >
          ● 자동 저장됨
        </span>
        <span className="text-sm text-slate-600">
          <strong>{currentUser.name}</strong>
        </span>
        <button
          onClick={handleLogout}
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded-lg"
        >
          로그아웃
        </button>
      </div>
    </header>
  );

  // ============================================================================
  // [공통 페이지] 주간 업무 지시 & 조회
  // ============================================================================
  if (activePage === "weeklyTasks") {
    const visibleTasksForTeacher = weeklyTasks.filter((task) => {
      const targets = getTargetTeachersForTask(task, teachersOnly);
      return targets.some((t) => t.id === currentUser.id);
    });

    const selectedPopupTask = popupTaskId
      ? weeklyTasks.find((t) => t.id === popupTaskId) || null
      : null;

    const previewWeekInfo = getWeekInfoFromDateString(taskDateInput);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {renderHeader()}

        <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {currentUser.role === "admin"
                  ? "📌 관리자 주간 업무 지시 및 선생님별 확인 현황"
                  : `📌 ${currentUser.name} 주간 업무 안내`}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {currentUser.role === "admin"
                  ? "달력에서 기준 날짜를 선택하면 해당 주간의 주차가 자동 계산되어 선생님 화면에 반영됩니다."
                  : "목록에서는 핵심 요약만 보시고, 업무 항목을 클릭하면 팝업 창이 열려 상세 내용을 편하게 읽을 수 있습니다."}
              </p>
            </div>
            {weeklyTaskMessage && (
              <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-800 text-white shadow-sm">
                {weeklyTaskMessage}
              </span>
            )}
          </div>

          {currentUser.role === "admin" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
                <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
                  ➕ 주간 업무 상세 작성
                </h3>

                <form onSubmit={handleAddWeeklyTask} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        기준 날짜 선택 (달력)
                      </label>
                      <input
                        type="date"
                        value={taskDateInput}
                        onChange={(e) => setTaskDateInput(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-[11px] font-semibold text-blue-600 mt-1">
                        → 자동 반영 주차: {previewWeekInfo.weekLabel}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        대상 선생님
                      </label>
                      <select
                        value={taskAssigneeInput}
                        onChange={(e) => setTaskAssigneeInput(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm text-slate-800 bg-white"
                      >
                        <option value="전체 선생님">전체 선생님</option>
                        {teachersOnly.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      주간 업무 제목 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={taskTitleInput}
                      onChange={(e) => setTaskTitleInput(e.target.value)}
                      placeholder="예: IEP 일지 작성 및 교구 점검 안내"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        상세 지시사항 (확장 입력 칸)
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {taskDetailInput.length}자 입력됨 · 우측 하단 드래그로 높이 조절 가능
                      </span>
                    </div>
                    <textarea
                      rows={9}
                      value={taskDetailInput}
                      onChange={(e) => setTaskDetailInput(e.target.value)}
                      placeholder={`선생님들께 전달할 세부 지시 내용이나 마감 일정을 여유롭게 입력하세요.\n\n예시)\n1. 주간 IEP 일지 작성 마감: 금요일 17시\n2. 수중/PT 교구 소독 및 정리 상태 점검\n3. 특이사항 발생 시 즉시 관리자 공유`}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 leading-relaxed resize-y min-h-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
                  >
                    주간 업무 지시 등록
                  </button>
                </form>
              </section>

              <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-800">
                    📋 누적 등록된 주간 업무 및 선생님별 확인 현황 ({weeklyTasks.length}건)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    항목 클릭 시 상세 팝업 열람 · 등록 선생님 {teachersOnly.length}명 기준
                  </span>
                </div>

                {weeklyTasks.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    등록된 주간 업무가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {weeklyTasks.map((task) => {
                      const targetTeachers = getTargetTeachersForTask(task, teachersOnly);
                      const checkedCount = targetTeachers.filter((t) =>
                        isTaskCheckedByTeacher(task, t.id)
                      ).length;

                      return (
                        <div
                          key={task.id}
                          onClick={() => setPopupTaskId(task.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setPopupTaskId(task.id);
                            }
                          }}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/40 hover:border-blue-300 transition cursor-pointer space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-white font-bold">
                                {task.weekLabel}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                                대상: {task.assignee}
                              </span>
                              <span className="text-slate-400">등록일: {task.createdAt}</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-md font-extrabold ${
                                  targetTeachers.length > 0 &&
                                  checkedCount === targetTeachers.length
                                    ? "bg-emerald-600 text-white"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                확인 {checkedCount}/{targetTeachers.length}명
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWeeklyTask(task.id);
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition"
                            >
                              삭제
                            </button>
                          </div>

                          <p className="text-sm font-bold text-slate-800">{task.title}</p>

                          <div className="bg-white rounded-xl border border-slate-200/90 p-3 space-y-2">
                            <span className="text-[11px] font-bold text-slate-500 block">
                              선생님별 확인 상태
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {targetTeachers.map((teacher) => {
                                const done = isTaskCheckedByTeacher(task, teacher.id);
                                return (
                                  <span
                                    key={teacher.id}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                                      done
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                        : "bg-amber-50 text-amber-800 border-amber-200"
                                    }`}
                                  >
                                    <span>{teacher.name}</span>
                                    <span>{done ? "✅ 확인 완료" : "⏳ 미확인"}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-3 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                            {task.detail}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">
                  📋 누적 주간 업무 목록 ({visibleTasksForTeacher.length}건)
                </h3>
                <span className="text-xs text-slate-500">
                  항목을 클릭하면 상세 내용을 팝업으로 열람합니다.
                </span>
              </div>

              {visibleTasksForTeacher.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  현재 전달된 주간 업무가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleTasksForTeacher.map((task) => {
                    const isCheckedMine = isTaskCheckedByTeacher(task, currentUser.id);

                    return (
                      <div
                        key={task.id}
                        onClick={() => setPopupTaskId(task.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setPopupTaskId(task.id);
                          }
                        }}
                        className={`p-4 rounded-xl border transition cursor-pointer flex flex-wrap items-center justify-between gap-3 ${
                          isCheckedMine
                            ? "bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/80"
                            : "bg-slate-50/80 border-slate-200 hover:bg-blue-50/60 hover:border-blue-300"
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-bold">
                              {task.weekLabel}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold">
                              대상: {task.assignee}
                            </span>
                            <span className="text-slate-400">{task.createdAt}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold ${
                                isCheckedMine
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isCheckedMine ? "✅ 확인 완료" : "⏳ 미확인"}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-slate-800 truncate">
                            {task.title}
                          </h4>
                        </div>

                        <div
                          className="flex items-center gap-2 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setPopupTaskId(task.id)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
                          >
                            팝업 열기
                          </button>

                          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer select-none bg-white px-3 py-1.5 rounded-lg border border-slate-300">
                            <input
                              type="checkbox"
                              checked={isCheckedMine}
                              onChange={() =>
                                handleToggleWeeklyTaskChecked(task.id, currentUser.id)
                              }
                              className="w-4 h-4 accent-emerald-600"
                            />
                            <span>확인 완료</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>

        {selectedPopupTask && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setPopupTaskId(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[88vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-bold">
                      {selectedPopupTask.weekLabel}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                      대상: {selectedPopupTask.assignee}
                    </span>
                    <span className="text-slate-400">
                      등록일: {selectedPopupTask.createdAt}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedPopupTask.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setPopupTaskId(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2 py-1"
                  aria-label="팝업 닫기"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {selectedPopupTask.detail}
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                {currentUser.role === "teacher" ? (
                  <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-800 cursor-pointer select-none bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                    <input
                      type="checkbox"
                      checked={isTaskCheckedByTeacher(selectedPopupTask, currentUser.id)}
                      onChange={() =>
                        handleToggleWeeklyTaskChecked(selectedPopupTask.id, currentUser.id)
                      }
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <span>이 주간 업무 내용을 확인했습니다 (확인 완료)</span>
                  </label>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {getTargetTeachersForTask(selectedPopupTask, teachersOnly).map((t) => {
                      const done = isTaskCheckedByTeacher(selectedPopupTask, t.id);
                      return (
                        <span
                          key={t.id}
                          className={`px-2.5 py-1 rounded-lg font-bold border ${
                            done
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {t.name}: {done ? "확인" : "미확인"}
                        </span>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPopupTaskId(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // [선생님 전용 페이지] 담당 학생 누적 IEP & 출결 조회
  // ============================================================================
  if (currentUser.role === "teacher" && activePage === "teacherHistory") {
    const myAssignedStudents = getAssignedStudentsForTeacher(currentUser.id);
    const targetStudent =
      myAssignedStudents.find((s) => s.id === historyStudentId) || myAssignedStudents[0];
    const targetAge = targetStudent ? calculateAge(targetStudent.birthDate) : null;
    const stats = targetStudent
      ? getStudentAttendanceStats(targetStudent.id)
      : { present: 0, absent: 0, makeup: 0, pendingMakeup: 0, total: 0 };

    const studentSlots = targetStudent
      ? timetable.filter(
          (slot) =>
            slot.teacherId === currentUser.id && slot.studentIds.includes(targetStudent.id)
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
        const theme = slot ? getCategoryTheme(slot.categoryId) : getCategoryTheme(categoryName);

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

    const historyWeekKey = formatDateKey(historyMonday);
    const historyWeekLabel = `${historyMonday.getFullYear()}년 ${formatShortDate(
      historyMonday,
      0
    )} (월) ~ ${formatShortDate(historyMonday, 5)} (토)`;

    const moveHistoryWeek = (weeks: number) => {
      const next = new Date(historyMonday);
      next.setDate(historyMonday.getDate() + weeks * 7);
      setHistoryMonday(next);
      setSelectedHistoryKey(null);
    };

    const activeDetailItem =
      studentHistoryList.find((item) => item.key === selectedHistoryKey) || null;

    return (
      <div className="min-h-screen bg-slate-50 print:bg-white flex flex-col">
        {renderHeader()}

        <main className="flex-1 max-w-6xl w-full mx-auto p-6 print:p-2 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                📚 {currentUser.name} 담당 학생 누적 IEP & 출결 조회
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                개인정보 보호를 위해{" "}
                <strong>
                  {currentUser.name} 시간표에 배정된 학생({myAssignedStudents.length}명)
                </strong>
                의 기록만 표시됩니다.
              </p>
            </div>

            {targetStudent && (
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                🖨️ {targetStudent.name} 상담 보고서 인쇄 / PDF 저장
              </button>
            )}
          </div>

          {myAssignedStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-400">
              현재 배정된 담당 학생이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 print:block gap-6">
              <section className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit print:hidden">
                <h3 className="text-sm font-bold text-slate-800 mb-3 pb-2.5 border-b border-slate-100">
                  담당 학생 명단 ({myAssignedStudents.length}명)
                </h3>
                <div className="space-y-2">
                  {myAssignedStudents.map((st) => {
                    const age = calculateAge(st.birthDate);
                    const isSelected = st.id === targetStudent?.id;
                    const stStats = getStudentAttendanceStats(st.id);

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
                              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-full">
                                미보강 {stStats.pendingMakeup}회
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            누적 {stStats.total}회
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          {st.birthDate}생 {st.schoolGradeClass ? `· ${st.schoolGradeClass}` : ""}
                        </p>

                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            출석 {stStats.present}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                            결석 {stStats.absent}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            보강 {stStats.makeup}
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
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-800">{targetStudent.name}</h3>
                          {targetAge !== null && (
                            <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                              만 {targetAge}세 ({targetStudent.birthDate})
                            </span>
                          )}
                          {targetStudent.schoolGradeClass && (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                              {targetStudent.schoolGradeClass}
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                              stats.pendingMakeup > 0
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            미보강 잔여 {stats.pendingMakeup}회
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            출석 {stats.present}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                            결석 {stats.absent}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                            보강 {stats.makeup}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                          <span className="font-bold text-slate-700 block mb-1">
                            1. 초기 상담 및 기초평가 (관리자 작성)
                          </span>
                          <p className="text-slate-700 leading-relaxed">
                            {targetStudent.initialConsultInfo}
                          </p>
                        </div>

                        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
                          <span className="font-bold text-amber-900 block mb-1">
                            2. 현재 상태 및 관찰 특이사항 (선생님 작성)
                          </span>
                          <p className="text-amber-900 leading-relaxed">
                            {targetStudent.currentStatusInfo}
                          </p>
                        </div>

                        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5">
                          <span className="font-extrabold text-indigo-800 block mb-1">
                            3. 장기목표 (Long-Term Goal)
                          </span>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            {targetStudent.longTermGoal || "미설정"}
                          </p>
                        </div>

                        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5">
                          <span className="font-extrabold text-blue-800 block mb-1">
                            4. 단기목표 (Short-Term Goal)
                          </span>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            {targetStudent.shortTermGoal || "미설정"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 print:hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <h4 className="text-base font-bold text-slate-800">
                          📂 {targetStudent.name} IEP 열람 방식
                        </h4>

                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryViewMode("timetable");
                              setSelectedHistoryKey(null);
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                              historyViewMode === "timetable"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            🗓️ 주간 시간표로 보기
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryViewMode("files");
                              setSelectedHistoryKey(null);
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                              historyViewMode === "files"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            📁 누적 파일 목록 ({studentHistoryList.length}개)
                          </button>
                        </div>
                      </div>

                      {historyViewMode === "timetable" && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <span className="text-xs text-slate-600">
                              수업 칸을 클릭하면 해당 주차의 전체 IEP가 열립니다.
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => moveHistoryWeek(-1)}
                                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
                              >
                                ◀ 이전 주
                              </button>
                              <span className="text-xs font-extrabold text-slate-800 px-2">
                                {historyWeekLabel}
                              </span>
                              <button
                                type="button"
                                onClick={() => moveHistoryWeek(1)}
                                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
                              >
                                다음 주 ▶
                              </button>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse table-fixed min-w-[600px]">
                              <thead>
                                <tr>
                                  <th className="w-14 p-2 bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600">
                                    교시
                                  </th>
                                  {DAYS.map((day, idx) => (
                                    <th
                                      key={day}
                                      className="p-2 bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700"
                                    >
                                      {day} ({formatShortDate(historyMonday, idx)})
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {PERIODS.map((period) => (
                                  <tr key={period}>
                                    <td className="p-1.5 bg-slate-50 border border-slate-200 text-center text-[11px] font-bold text-slate-600">
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
                                      const theme = getCategoryTheme(slot.categoryId);
                                      const sessionKey = `${historyWeekKey}_${slot.id}_${targetStudent.id}`;
                                      const rec = iepRecords[sessionKey];
                                      const att = attendanceRecords[sessionKey];
                                      const hasData = Boolean(
                                        rec?.activityContent || rec?.evaluation || att
                                      );
                                      const isSelectedCell = selectedHistoryKey === sessionKey;

                                      return (
                                        <td
                                          key={`${day}-${period}`}
                                          className="p-1 border border-slate-200 h-16 align-top"
                                        >
                                          <button
                                            type="button"
                                            onClick={() => setSelectedHistoryKey(sessionKey)}
                                            className={`w-full h-full rounded-lg p-1.5 text-left border transition flex flex-col justify-between ${
                                              isSelectedCell
                                                ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                                                : hasData
                                                ? `${theme.card} text-slate-800`
                                                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500"
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-1">
                                              <span
                                                className={`text-[10px] font-extrabold px-1 rounded ${
                                                  isSelectedCell
                                                    ? "bg-white/20 text-white"
                                                    : theme.badge
                                                }`}
                                              >
                                                {catName}
                                              </span>
                                              {rec?.adminChecked && (
                                                <span className="text-[10px]" title="관리자 확인됨">
                                                  ✅
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[10px] truncate mt-1">
                                              {att ? `[${att}] ` : ""}
                                              {hasData ? "IEP 보기" : "미작성"}
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

                          {selectedHistoryKey && (
                            <div className="mt-4 p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                              {(() => {
                                const [mKey, sId] = selectedHistoryKey.split("_");
                                const slot = timetable.find((s) => s.id === sId);
                                const exactDate = slot
                                  ? getExactDateFromMondayKey(mKey, slot.day)
                                  : mKey;
                                const catName = slot ? getCategoryName(slot.categoryId) : "수업";
                                const theme = slot
                                  ? getCategoryTheme(slot.categoryId)
                                  : getCategoryTheme(catName);
                                const rec = iepRecords[selectedHistoryKey];
                                const att = attendanceRecords[selectedHistoryKey];

                                return (
                                  <>
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/70 pb-2.5">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded-md">
                                          {exactDate} ({slot?.day}
                                          {slot?.period})
                                        </span>
                                        <span
                                          className={`px-2.5 py-1 text-xs font-extrabold rounded-md border ${theme.pill}`}
                                        >
                                          {catName}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 text-xs font-bold rounded border ${getAttendanceBadgeStyle(
                                            att
                                          )}`}
                                        >
                                          {att || "출결 미체크"}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedHistoryKey(null)}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-800"
                                      >
                                        닫기 ✕
                                      </button>
                                    </div>

                                    {!rec ? (
                                      <p className="text-xs text-slate-500 py-3">
                                        작성된 IEP 내용이 없습니다.
                                      </p>
                                    ) : (
                                      <div className="space-y-3 text-xs">
                                        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                          <span className="font-bold text-indigo-700 block mb-1">
                                            1. 금주 세부 목표
                                          </span>
                                          <p className="text-slate-800 whitespace-pre-wrap">
                                            {rec.sessionGoal || "-"}
                                          </p>
                                        </div>
                                        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                          <span className="font-bold text-blue-700 block mb-1">
                                            2. 세부 수업 활동 내용
                                          </span>
                                          <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                                            {rec.activityContent || "-"}
                                          </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                            <span className="font-bold text-slate-700 block mb-1">
                                              3. 교수적 수정 및 지원 전략 (UDL)
                                            </span>
                                            <p className="text-slate-800 whitespace-pre-wrap">
                                              {rec.supportStrategy || "-"}
                                            </p>
                                          </div>
                                          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                            <span className="font-bold text-emerald-700 block mb-1">
                                              4. 수행 결과 및 반응
                                            </span>
                                            <p className="text-slate-800 whitespace-pre-wrap">
                                              {rec.evaluation || "-"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}

                      {historyViewMode === "files" && (
                        <div className="space-y-3">
                          {studentHistoryList.map((item) => {
                            const isExpanded = activeDetailItem?.key === item.key;

                            return (
                              <div
                                key={item.key}
                                className={`rounded-xl border transition overflow-hidden ${
                                  isExpanded
                                    ? "border-indigo-500 bg-indigo-50/30 shadow-sm"
                                    : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/70"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedHistoryKey(isExpanded ? null : item.key)
                                  }
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
                                  </div>
                                  <span className="text-xs font-bold text-indigo-600">
                                    {isExpanded ? "접기 ▲" : "내용 열기 ▼"}
                                  </span>
                                </button>

                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-2 border-t border-slate-200/80 space-y-2 text-xs">
                                    <p>
                                      <strong>목표:</strong> {item.record.sessionGoal || "-"}
                                    </p>
                                    <p className="whitespace-pre-wrap">
                                      <strong>활동:</strong> {item.record.activityContent || "-"}
                                    </p>
                                    <p className="whitespace-pre-wrap">
                                      <strong>지원:</strong> {item.record.supportStrategy || "-"}
                                    </p>
                                    <p className="whitespace-pre-wrap">
                                      <strong>결과:</strong> {item.record.evaluation || "-"}
                                    </p>
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
          )}
        </main>
      </div>
    );
  }

  // ============================================================================
  // [관리자 전용 페이지] 선생님별 누적 IEP 검토 · 피드백
  // ============================================================================
  if (currentUser.role === "admin" && activePage === "adminReview") {
    const selectedTeacher =
      teachersOnly.find((t) => t.id === reviewTeacherId) || teachersOnly[0];
    const teacherAssignedStudents = selectedTeacher
      ? getAssignedStudentsForTeacher(selectedTeacher.id)
      : [];

    const teacherAllSlots = timetable.filter((s) => s.teacherId === selectedTeacher?.id);
    const filteredReviewSlots =
      reviewStudentFilterId === "all"
        ? teacherAllSlots
        : teacherAllSlots.filter((s) => s.studentIds.includes(reviewStudentFilterId));

    const teacherSlotIds = new Set(teacherAllSlots.map((s) => s.id));

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

    const reviewWeekKey = formatDateKey(reviewMonday);
    const reviewWeekLabel = `${reviewMonday.getFullYear()}년 ${formatShortDate(
      reviewMonday,
      0
    )} (월) ~ ${formatShortDate(reviewMonday, 5)} (토)`;

    const moveReviewWeek = (weeks: number) => {
      const next = new Date(reviewMonday);
      next.setDate(reviewMonday.getDate() + weeks * 7);
      setReviewMonday(next);
      setSelectedReviewSlotId(null);
    };

    const handleSaveAdminReview = (recordKey: string, nextCheckedState?: boolean) => {
      const existing = iepRecords[recordKey];
      if (!existing) return;

      const draftText =
        adminFeedbackDrafts[recordKey] !== undefined
          ? adminFeedbackDrafts[recordKey]
          : existing.adminFeedback || "";

      const checkedValue =
        nextCheckedState !== undefined ? nextCheckedState : Boolean(existing.adminChecked);

      setIepRecords((prev) => ({
        ...prev,
        [recordKey]: {
          ...existing,
          adminChecked: checkedValue,
          adminFeedback: draftText.trim(),
          adminCheckedAt: checkedValue ? formatDateKey(new Date()) : undefined,
        },
      }));

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
      const theme = getCategoryTheme(categoryName);

      return (
        <div
          key={recordKey}
          className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 ${
            rec.adminChecked
              ? "border-emerald-300 ring-1 ring-emerald-200"
              : "border-slate-200"
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
              <label className="text-xs font-extrabold text-emerald-900">
                ✍️ 관리자 피드백
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-900">
                <input
                  type="checkbox"
                  checked={Boolean(rec.adminChecked)}
                  onChange={(e) => handleSaveAdminReview(recordKey, e.target.checked)}
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
                onClick={() => handleSaveAdminReview(recordKey, true)}
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
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {renderHeader()}

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
                      reviewViewMode === "timetable"
                        ? "bg-blue-600 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    시간표
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewViewMode("files")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      reviewViewMode === "files"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600"
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
                      <th className="w-16 p-2 bg-slate-100 border border-slate-200 text-xs">
                        교시
                      </th>
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
                          const theme = getCategoryTheme(slot.categoryId);
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
                                  {catName}
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
      </div>
    );
  }

  // ============================================================================
  // [관리자 전용 페이지 1] 학생 명단 관리 (미보강 잔여 횟수 배지 포함)
  // ============================================================================
  if (currentUser.role === "admin" && activePage === "students") {
    const previewAge = calculateAge(studentBirthInput);

    const filteredStudents = students.filter((st) => {
      const q = studentSearchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        st.name.toLowerCase().includes(q) ||
        (st.schoolGradeClass && st.schoolGradeClass.toLowerCase().includes(q)) ||
        st.birthDate.includes(q) ||
        st.initialConsultInfo.toLowerCase().includes(q) ||
        st.currentStatusInfo.toLowerCase().includes(q)
      );
    });

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {renderHeader()}

        <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                🎓 학생 명단 및 기초·목표·보강 관리
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                결석 및 보강 기록을 바탕으로 <strong>미보강 잔여 횟수</strong>가 자동
                집계됩니다.
              </p>
            </div>
            {studentMessage && (
              <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-800 text-white">
                {studentMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">
                  {editingStudentId ? "✏️ 학생 정보 수정" : "➕ 새 학생 등록"}
                </h3>
                {editingStudentId && (
                  <button
                    type="button"
                    onClick={handleCancelEditStudent}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    신규 모드
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveStudent} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    학생 이름 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentNameInput}
                    onChange={(e) => setStudentNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">생년월일</label>
                    {previewAge !== null && (
                      <span className="text-xs font-extrabold text-blue-600">
                        만 {previewAge}세
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={studentBirthInput}
                    onChange={(e) => setStudentBirthInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    학교 및 학년/반
                  </label>
                  <input
                    type="text"
                    value={studentSchoolInput}
                    onChange={(e) => setStudentSchoolInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. 초기 상담 및 기초평가
                  </label>
                  <textarea
                    rows={3}
                    value={studentInitialConsultInput}
                    onChange={(e) => setStudentInitialConsultInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. 현재 상태 및 특이사항
                  </label>
                  <textarea
                    rows={2}
                    value={studentCurrentStatusInput}
                    onChange={(e) => setStudentCurrentStatusInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1">
                    3. 장기목표
                  </label>
                  <input
                    type="text"
                    value={studentLongGoalInput}
                    onChange={(e) => setStudentLongGoalInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-1">
                    4. 단기목표
                  </label>
                  <input
                    type="text"
                    value={studentShortGoalInput}
                    onChange={(e) => setStudentShortGoalInput(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {editingStudentId && (
                    <button
                      type="button"
                      onClick={handleCancelEditStudent}
                      className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl"
                    >
                      취소
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl"
                  >
                    {editingStudentId ? "수정 저장" : "학생 등록"}
                  </button>
                </div>
              </form>
            </section>

            <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">
                  📋 등록된 전체 학생 ({filteredStudents.length}/{students.length}명)
                </h3>
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="🔍 이름, 학교/반 검색..."
                  className="w-full sm:w-56 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-3.5">
                {filteredStudents.map((st) => {
                  const age = calculateAge(st.birthDate);
                  const stStats = getStudentAttendanceStats(st.id);

                  return (
                    <div
                      key={st.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-base text-slate-800">{st.name}</span>
                          {age !== null && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                              만 {age}세
                            </span>
                          )}
                          {stStats.pendingMakeup > 0 ? (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold">
                              미보강 잔여 {stStats.pendingMakeup}회
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              보강 완료/없음
                            </span>
                          )}
                          <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-slate-600">
                            출석 {stStats.present} · 결석 {stStats.absent} · 보강{" "}
                            {stStats.makeup}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditStudent(st)}
                            className="px-3 py-1 bg-white border border-slate-300 text-xs font-bold rounded-lg"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(st)}
                            className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="text-slate-600">
                          <strong>초기상담:</strong> {st.initialConsultInfo}
                        </p>
                        <p className="text-amber-900">
                          <strong>현재상태:</strong> {st.currentStatusInfo}
                        </p>
                        <p className="text-indigo-800">
                          <strong>장기목표:</strong> {st.longTermGoal || "미설정"}
                        </p>
                        <p className="text-blue-800">
                          <strong>단기목표:</strong> {st.shortTermGoal || "미설정"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // [관리자 전용 페이지 2] 수업 종류 및 색상 관리 (10색 팔레트)
  // ============================================================================
  if (currentUser.role === "admin" && activePage === "categories") {
    const usedColorKeys = new Set(
      categories.map((cat) => getThemeByColorKey(cat.colorKey, cat.name).key)
    );

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {renderHeader()}

        <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">🏷️ 수업 종류 및 색상 관리</h2>
              <p className="text-xs text-slate-500 mt-1">
                10가지 색상 중 원하는 색상을 선택하여 수업별로 구분할 수 있습니다.
              </p>
            </div>
            {categoryMessage && (
              <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-800 text-white">
                {categoryMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
              <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
                ➕ 새 수업 종류 추가
              </h3>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    수업 종류 이름
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="예: 감각통합, 심리운동"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    색상 선택 (10가지)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_PALETTE.map((colorItem) => {
                      const selected = newCategoryColorKey === colorItem.key;
                      const isAlreadyUsed = usedColorKeys.has(colorItem.key);
                      return (
                        <button
                          type="button"
                          key={colorItem.key}
                          onClick={() => setNewCategoryColorKey(colorItem.key)}
                          className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                            selected
                              ? "border-slate-800 bg-slate-100 ring-2 ring-slate-800"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full ${colorItem.swatch}`} />
                          <span className="text-[10px] font-bold text-slate-700">
                            {colorItem.label}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {isAlreadyUsed ? "사용중" : "여유"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl"
                >
                  수업 종류 추가하기
                </button>
              </form>
            </section>

            <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
                📋 등록된 수업 종류 및 색상 ({categories.length}개)
              </h3>

              <div className="space-y-3">
                {categories.map((cat) => {
                  const usedCount = timetable.filter((s) => s.categoryId === cat.id).length;
                  const isEditing = editingCategoryId === cat.id;
                  const theme = getThemeByColorKey(cat.colorKey, cat.name);
                  const previewEditingTheme = getThemeByColorKey(
                    editingCategoryColorKey,
                    editingCategoryName || cat.name
                  );

                  return (
                    <div
                      key={cat.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold ${previewEditingTheme.pill}`}
                            >
                              {editingCategoryName.trim() || cat.name}
                            </span>
                            <input
                              type="text"
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              className="flex-1 min-w-[160px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditCategory(cat.id)}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategoryId(null)}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                            >
                              취소
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {COLOR_PALETTE.map((colorItem) => {
                              const selected = editingCategoryColorKey === colorItem.key;
                              return (
                                <button
                                  type="button"
                                  key={colorItem.key}
                                  onClick={() => setEditingCategoryColorKey(colorItem.key)}
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 ${
                                    selected
                                      ? "border-slate-800 bg-slate-800 text-white"
                                      : "border-slate-200 bg-white text-slate-700"
                                  }`}
                                >
                                  <span className={`w-3 h-3 rounded-full ${colorItem.swatch}`} />
                                  <span>{colorItem.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`px-3 py-1 rounded-lg border text-sm font-extrabold ${theme.pill}`}
                              >
                                {cat.name}
                              </span>
                              <span className="text-xs font-semibold text-slate-600">
                                ({theme.label})
                              </span>
                              <span className="text-xs text-slate-400">
                                · 시간표 사용 {usedCount}건
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategoryId(cat.id);
                                  setEditingCategoryName(cat.name);
                                  setEditingCategoryColorKey(theme.key);
                                }}
                                className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-bold rounded-lg"
                              >
                                이름·색상 수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg"
                              >
                                삭제
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/70">
                            <span className="text-[11px] font-bold text-slate-400 mr-1">
                              빠른 색상 선택:
                            </span>
                            {COLOR_PALETTE.map((colorItem) => {
                              const isCurrent = theme.key === colorItem.key;
                              return (
                                <button
                                  type="button"
                                  key={colorItem.key}
                                  title={`${colorItem.label} 선택`}
                                  onClick={() => handleChangeCategoryColor(cat.id, colorItem.key)}
                                  className={`w-6 h-6 rounded-full ${colorItem.swatch} transition flex items-center justify-center text-[10px] font-extrabold text-white ${
                                    isCurrent
                                      ? "ring-2 ring-offset-2 ring-slate-800 scale-110"
                                      : "opacity-75 hover:opacity-100"
                                  }`}
                                >
                                  {isCurrent ? "✓" : ""}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // [관리자 전용 페이지 3] 선생님 계정 관리
  // ============================================================================
  if (currentUser.role === "admin" && activePage === "accounts") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {renderHeader()}

        <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">👤 선생님 계정 관리</h2>
            {accountMessage && (
              <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-800 text-white">
                {accountMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
              <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
                ➕ 새 선생님 계정 등록
              </h3>

              <form onSubmit={handleCreateTeacherAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">선생님 성함</label>
                  <input
                    type="text"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    로그인 아이디
                  </label>
                  <input
                    type="text"
                    value={newTeacherLoginId}
                    onChange={(e) => setNewTeacherLoginId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    초기 비밀번호
                  </label>
                  <input
                    type="text"
                    value={newTeacherPassword}
                    onChange={(e) => setNewTeacherPassword(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl"
                >
                  계정 생성하기
                </button>
              </form>
            </section>

            <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
                📋 등록된 선생님 계정 ({teachersOnly.length}명)
              </h3>
              <div className="space-y-3">
                {teachersOnly.map((teacher) => {
                  const isEditingPw = editingPwUserId === teacher.id;
                  return (
                    <div
                      key={teacher.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-base text-slate-800">{teacher.name}</div>
                        <div className="text-xs text-slate-600">
                          아이디: <strong>{teacher.loginId}</strong> · 비밀번호:{" "}
                          <strong>{teacher.password}</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditingPw ? (
                          <>
                            <input
                              type="text"
                              value={updatedPassword}
                              onChange={(e) => setUpdatedPassword(e.target.value)}
                              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                            <button
                              onClick={() => handleUpdateTeacherPassword(teacher.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                            >
                              저장
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingPwUserId(teacher.id);
                                setUpdatedPassword(teacher.password);
                              }}
                              className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-bold rounded-lg"
                            >
                              비번 변경
                            </button>
                            <button
                              onClick={() => handleDeleteTeacherAccount(teacher)}
                              className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg"
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // [2페이지] 수업 상세 페이지 (3번: 지난 차시 불러오기 & 문구 템플릿 삽입 포함)
  // ============================================================================
  if (activePage === "detail" && selectedSlotId) {
    const selectedSlot = timetable.find((s) => s.id === selectedSlotId);
    if (!selectedSlot) {
      setActivePage("timetable");
      return null;
    }

    const exactClassDate = getExactDateFromMondayKey(weekKey, selectedSlot.day);
    const categoryName = getCategoryName(selectedSlot.categoryId);
    const categoryTheme = getCategoryTheme(selectedSlot.categoryId);
    const slotStudents = students.filter((s) => selectedSlot.studentIds.includes(s.id));
    const selectedStudent =
      slotStudents.find((s) => s.id === selectedStudentId) || slotStudents[0];
    const selectedStudentAge = selectedStudent ? calculateAge(selectedStudent.birthDate) : null;

    const recordKey = `${weekKey}_${selectedSlot.id}_${selectedStudent?.id}`;
    const currentAttendance = attendanceRecords[recordKey];
    const currentIEP: IEPRecord = iepRecords[recordKey] || {
      sessionGoal: "",
      activityContent: "",
      supportStrategy: "",
      evaluation: "",
      nextPlan: "",
    };

    const previousSession = selectedStudent
      ? getPreviousSessionRecord(selectedStudent.id, exactClassDate)
      : null;

    const handleSelectAttendance = (studentId: string, status: AttendanceStatus) => {
      const targetKey = `${weekKey}_${selectedSlot.id}_${studentId}`;
      setAttendanceRecords((prev) => ({
        ...prev,
        [targetKey]: status,
      }));
    };

    const handleStartEditStudentGoalsStatus = () => {
      if (!selectedStudent) return;
      setGoalLongInput(selectedStudent.longTermGoal);
      setGoalShortInput(selectedStudent.shortTermGoal);
      setStatusInput(selectedStudent.currentStatusInfo);
      setIsEditingGoalsAndStatus(true);
    };

    const handleSaveStudentGoalsStatus = () => {
      if (!selectedStudent) return;
      setStudents((prev) =>
        prev.map((st) =>
          st.id === selectedStudent.id
            ? {
                ...st,
                longTermGoal: goalLongInput.trim(),
                shortTermGoal: goalShortInput.trim(),
                currentStatusInfo: statusInput.trim() || st.currentStatusInfo,
              }
            : st
        )
      );
      setIsEditingGoalsAndStatus(false);
      setProfileSaveMsg("✅ 현재 상태 및 장기·단기목표가 저장되었습니다.");
      setTimeout(() => setProfileSaveMsg(""), 3500);
    };

    const handleIEPChange = (field: keyof IEPRecord, value: string) => {
      setIepRecords((prev) => ({
        ...prev,
        [recordKey]: {
          ...currentIEP,
          [field]: value,
        },
      }));
      setSaveMessage("");
    };

    // [3번] 지난 차시 내용 복사해오기
    const handleCopyPreviousSession = () => {
      if (!previousSession) return;
      setIepRecords((prev) => ({
        ...prev,
        [recordKey]: {
          ...currentIEP,
          sessionGoal: previousSession.record.sessionGoal || currentIEP.sessionGoal,
          activityContent:
            previousSession.record.activityContent || currentIEP.activityContent,
          supportStrategy:
            previousSession.record.supportStrategy || currentIEP.supportStrategy,
        },
      }));
      setSaveMessage(`⏪ ${previousSession.exactDate} 차시 내용을 불러왔습니다.`);
      setTimeout(() => setSaveMessage(""), 3000);
    };

    // [3번] 템플릿 문구 삽입
    const handleInsertTemplate = (
      field: "activityContent" | "supportStrategy",
      templateText: string
    ) => {
      const existingText = currentIEP[field] || "";
      const nextText = existingText.trim()
        ? `${existingText.trim()}\n${templateText}`
        : templateText;
      handleIEPChange(field, nextText);
      setSaveMessage("✨ 템플릿 문구가 추가되었습니다.");
      setTimeout(() => setSaveMessage(""), 2500);
    };

    const handleSaveIEP = (e: React.FormEvent) => {
      e.preventDefault();
      setSaveMessage(
        `✅ ${exactClassDate} (${selectedSlot.day}${selectedSlot.period}) [${selectedStudent.name}] 저장 완료!`
      );
      setTimeout(() => setSaveMessage(""), 3500);
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {renderHeader()}

        <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 px-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setActivePage("timetable")}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg"
              >
                ← 시간표
              </button>
              <span className="px-2.5 py-1 bg-slate-800 text-white text-xs font-extrabold rounded-md">
                {exactClassDate} ({selectedSlot.day}
                {selectedSlot.period})
              </span>
              <span
                className={`px-2.5 py-1 text-xs font-extrabold rounded-md border ${categoryTheme.pill}`}
              >
                {categoryName}
              </span>
              {selectedSlot.detailTitle && (
                <h2 className="text-base font-bold text-slate-800">{selectedSlot.detailTitle}</h2>
              )}
            </div>

            {currentUser.role === "teacher" && selectedStudent && (
              <button
                onClick={() => handleOpenTeacherHistory(selectedStudent.id)}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl"
              >
                📚 {selectedStudent.name} 누적 IEP·보고서
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 px-5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h3 className="text-xs font-bold text-slate-700">
                👥 참여 학생 선택 및 금일 출결 체크
              </h3>
              <span className="text-[11px] text-slate-400">실시간 자동 저장됨</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {slotStudents.map((student) => {
                const isSelected = student.id === selectedStudent?.id;
                const stAge = calculateAge(student.birthDate);
                const stRecordKey = `${weekKey}_${selectedSlot.id}_${student.id}`;
                const stAttendance = attendanceRecords[stRecordKey];
                const stStats = getStudentAttendanceStats(student.id);

                return (
                  <div
                    key={student.id}
                    onClick={() => {
                      setSelectedStudentId(student.id);
                      setIsEditingGoalsAndStatus(false);
                      setSaveMessage("");
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "bg-indigo-50/90 border-indigo-600 ring-1 ring-indigo-600"
                        : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-800">{student.name}</span>
                        {stAge !== null && (
                          <span className="text-[11px] font-bold text-blue-600">
                            (만 {stAge}세)
                          </span>
                        )}
                        {stStats.pendingMakeup > 0 && (
                          <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                            미보강 {stStats.pendingMakeup}회
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">출석 {stStats.present}회</span>
                    </div>

                    <div
                      className="pt-1.5 border-t border-slate-200/80 flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(["출석", "결석", "보강"] as AttendanceStatus[]).map((statusOption) => {
                        const isStatusActive = stAttendance === statusOption;
                        let activeClass = "";
                        if (isStatusActive) {
                          if (statusOption === "출석")
                            activeClass = "bg-emerald-600 text-white border-emerald-600";
                          if (statusOption === "결석")
                            activeClass = "bg-rose-600 text-white border-rose-600";
                          if (statusOption === "보강")
                            activeClass = "bg-amber-500 text-white border-amber-500";
                        } else {
                          activeClass =
                            "bg-white text-slate-600 border-slate-300 hover:bg-slate-100";
                        }

                        return (
                          <button
                            key={statusOption}
                            type="button"
                            onClick={() => handleSelectAttendance(student.id, statusOption)}
                            className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition ${activeClass}`}
                          >
                            {statusOption}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedStudent && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-100 px-4 pt-3 border-b border-slate-200 flex flex-wrap items-end justify-between gap-2">
                <div className="flex flex-wrap items-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIepIndexTab("profile")}
                    className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold border-t border-x ${
                      iepIndexTab === "profile"
                        ? "bg-white text-amber-800 border-slate-200 -mb-px"
                        : "bg-slate-200/70 text-slate-600 border-transparent"
                    }`}
                  >
                    📋 기초정보 · 목표
                  </button>
                  <button
                    type="button"
                    onClick={() => setIepIndexTab("prev")}
                    className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold border-t border-x ${
                      iepIndexTab === "prev"
                        ? "bg-white text-slate-900 border-slate-200 -mb-px"
                        : "bg-slate-200/70 text-slate-600 border-transparent"
                    }`}
                  >
                    ⏪ 지난 차시 보기
                  </button>
                  <button
                    type="button"
                    onClick={() => setIepIndexTab("today")}
                    className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold border-t border-x ${
                      iepIndexTab === "today"
                        ? "bg-white text-indigo-700 border-slate-200 -mb-px"
                        : "bg-slate-200/70 text-slate-600 border-transparent"
                    }`}
                  >
                    ✏️ 오늘 수업 IEP 작성
                  </button>
                  <button
                    type="button"
                    onClick={() => setIepIndexTab("next")}
                    className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold border-t border-x ${
                      iepIndexTab === "next"
                        ? "bg-white text-blue-700 border-slate-200 -mb-px"
                        : "bg-slate-200/70 text-slate-600 border-transparent"
                    }`}
                  >
                    ⏭️ 다음 차시 계획
                  </button>
                </div>

                {saveMessage && (
                  <span className="pb-2 text-xs font-bold text-emerald-700">{saveMessage}</span>
                )}
              </div>

              {iepIndexTab === "profile" && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-base font-bold text-slate-800">
                      📋 {selectedStudent.name}{" "}
                      {selectedStudentAge !== null && `(만 ${selectedStudentAge}세)`}
                    </h4>
                    {profileSaveMsg && (
                      <span className="text-xs font-bold text-emerald-600">{profileSaveMsg}</span>
                    )}
                    {!isEditingGoalsAndStatus ? (
                      <button
                        type="button"
                        onClick={handleStartEditStudentGoalsStatus}
                        className="px-3.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl"
                      >
                        ✏️ 상태 및 목표 수정
                      </button>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsEditingGoalsAndStatus(false)}
                          className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-xl"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveStudentGoalsStatus}
                          className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                        >
                          저장
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <span className="font-bold text-slate-700 block mb-1">1. 초기 상담</span>
                      <p>{selectedStudent.initialConsultInfo}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <span className="font-bold text-amber-900 block mb-1">2. 현재 상태</span>
                      {isEditingGoalsAndStatus ? (
                        <textarea
                          rows={2}
                          value={statusInput}
                          onChange={(e) => setStatusInput(e.target.value)}
                          className="w-full p-2 bg-white border border-amber-300 rounded-lg"
                        />
                      ) : (
                        <p>{selectedStudent.currentStatusInfo}</p>
                      )}
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                      <span className="font-bold text-indigo-800 block mb-1">3. 장기목표</span>
                      {isEditingGoalsAndStatus ? (
                        <input
                          type="text"
                          value={goalLongInput}
                          onChange={(e) => setGoalLongInput(e.target.value)}
                          className="w-full p-2 bg-white border border-indigo-300 rounded-lg"
                        />
                      ) : (
                        <p>{selectedStudent.longTermGoal || "미설정"}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <span className="font-bold text-blue-800 block mb-1">4. 단기목표</span>
                      {isEditingGoalsAndStatus ? (
                        <input
                          type="text"
                          value={goalShortInput}
                          onChange={(e) => setGoalShortInput(e.target.value)}
                          className="w-full p-2 bg-white border border-blue-300 rounded-lg"
                        />
                      ) : (
                        <p>{selectedStudent.shortTermGoal || "미설정"}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {iepIndexTab === "prev" && (
                <div className="p-6 space-y-3 text-xs">
                  {previousSession ? (
                    <>
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                        <span className="font-bold text-amber-900 block mb-1">
                          📌 지난 차시 다음 계획 ({previousSession.exactDate}):
                        </span>
                        <p className="whitespace-pre-wrap">{previousSession.record.nextPlan || "-"}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                        <span className="font-bold text-indigo-700 block mb-1">• 세부 목표</span>
                        <p>{previousSession.record.sessionGoal || "-"}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                        <span className="font-bold text-blue-700 block mb-1">• 활동 내용</span>
                        <p className="whitespace-pre-wrap">
                          {previousSession.record.activityContent || "-"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="py-10 text-center text-slate-400">
                      직전 차시 기록이 없습니다.
                    </p>
                  )}
                </div>
              )}

              {iepIndexTab === "today" && (
                <form onSubmit={handleSaveIEP} className="p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <h4 className="text-base font-bold text-slate-800">
                      ✏️ {exactClassDate} · {selectedStudent.name} IEP 작성
                    </h4>

                    {previousSession && (
                      <button
                        type="button"
                        onClick={handleCopyPreviousSession}
                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-extrabold rounded-xl border border-amber-300 transition"
                      >
                        ⏪ 지난 차시({previousSession.exactDate}) 내용 복사해오기
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      1. 금주 세부 교육 목표
                    </label>
                    <input
                      type="text"
                      value={currentIEP.sessionGoal}
                      onChange={(e) => handleIEPChange("sessionGoal", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        2. 세부 수업 활동 내용
                      </label>
                      <div className="flex flex-wrap items-center gap-1">
                        {ACTIVITY_TEMPLATES.map((tpl) => (
                          <button
                            type="button"
                            key={tpl.label}
                            onClick={() => handleInsertTemplate("activityContent", tpl.text)}
                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold"
                          >
                            + {tpl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      value={currentIEP.activityContent}
                      onChange={(e) => handleIEPChange("activityContent", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          3. 교수적 수정 및 지원 전략
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {SUPPORT_TEMPLATES.map((tpl) => (
                            <button
                              type="button"
                              key={tpl.label}
                              onClick={() => handleInsertTemplate("supportStrategy", tpl.text)}
                              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold"
                            >
                              + {tpl.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        rows={5}
                        value={currentIEP.supportStrategy}
                        onChange={(e) => handleIEPChange("supportStrategy", e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm leading-relaxed"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <label className="block text-xs font-bold text-slate-700">
                          4. 수행 결과 및 아이의 반응
                        </label>
                        <div className="flex items-center gap-1">
                          {(
                            ["달성 완료", "진행 중(향상)", "지원 필요"] as GoalProgressStatus[]
                          ).map((prog) => {
                            const active = currentIEP.progressStatus === prog;
                            return (
                              <button
                                key={prog}
                                type="button"
                                onClick={() => handleIEPChange("progressStatus", prog)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  active
                                    ? getProgressBadgeStyle(prog)
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                }`}
                              >
                                {getProgressEmoji(prog)} {prog}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <textarea
                        rows={5}
                        value={currentIEP.evaluation}
                        onChange={(e) => handleIEPChange("evaluation", e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
                    >
                      {selectedStudent.name} 오늘 IEP 저장 확인
                    </button>
                  </div>
                </form>
              )}

              {iepIndexTab === "next" && (
                <form onSubmit={handleSaveIEP} className="p-6 space-y-4">
                  <h4 className="text-base font-bold text-slate-800">
                    ⏭️ 다음 차시 계획 ({selectedStudent.name})
                  </h4>
                  <textarea
                    rows={4}
                    value={currentIEP.nextPlan}
                    onChange={(e) => handleIEPChange("nextPlan", e.target.value)}
                    className="w-full px-4 py-3 border border-blue-300 rounded-xl text-sm"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl"
                    >
                      다음 차시 계획 저장 확인
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ============================================================================
  // [1페이지] 주간 수업 시간표 메인 화면 (4번 관리자 주간 요약 대시보드 + 2번 미보강 표시)
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {renderHeader()}

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-5">
        {currentUser.role === "admin" && (
          <>
            {/* [4번] 관리자 주간 요약 대시보드 */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 block">
                  이번 주 배정 수업 / 회기
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {adminWeeklySummary.totalSlots}칸
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({adminWeeklySummary.totalStudentSessions}건)
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 block">
                  이번 주 IEP 작성률
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-indigo-600">
                    {adminWeeklySummary.completionRate}%
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({adminWeeklySummary.completedIepCount}/
                    {adminWeeklySummary.totalStudentSessions}건)
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 block">
                  이번 주 출결 (출석·결석·보강)
                </span>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    출석 {adminWeeklySummary.weekPresent}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    결석 {adminWeeklySummary.weekAbsent}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    보강 {adminWeeklySummary.weekMakeup}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">
                    미확인 주간 업무 / 미검토 IEP
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-sm font-extrabold">
                    <span className="text-slate-800">
                      업무 {adminWeeklySummary.uncheckedTasksAll}건
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-rose-600">IEP {totalUncheckedIepCount}건</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePage("adminReview")}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-xl shrink-0"
                >
                  검토 →
                </button>
              </div>
            </section>

            <div className="bg-slate-800 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-amber-400 text-slate-900 text-xs font-extrabold rounded-md">
                  관리자 시간표 편성
                </span>
                <span className="text-sm text-slate-200">
                  선생님을 선택하고 시간표 칸의 <strong>[+]</strong> 또는 <strong>[편집]</strong>을
                  눌러 수업을 배정하세요.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {teachersOnly.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setAdminTargetTeacherId(t.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTeacher?.id === t.id
                        ? "bg-blue-500 text-white shadow"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </>
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
                <span className="text-[11px] font-bold text-slate-400 mr-0.5">수업 색상 범례:</span>
                {categories.map((cat) => {
                  const theme = getCategoryTheme(cat.id);
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
                onClick={() => moveWeek(-1)}
                className="px-3 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200"
              >
                ◀ 이전 주
              </button>
              <span className="px-3 text-sm font-extrabold text-slate-800 min-w-[210px] text-center">
                {weekRangeLabel}
              </span>
              <button
                onClick={() => moveWeek(1)}
                className="px-3 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200"
              >
                다음 주 ▶
              </button>
              <button
                onClick={resetToThisWeek}
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
                      const theme = slot ? getCategoryTheme(slot.categoryId) : null;

                      const hasPendingMakeupInSlot = slot
                        ? slot.studentIds.some(
                            (stId) => getStudentAttendanceStats(stId).pendingMakeup > 0
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
                                    {catName}
                                  </span>
                                  {hasPendingMakeupInSlot && (
                                    <span
                                      title="미보강 잔여 횟수가 있는 학생이 포함된 수업입니다"
                                      className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-rose-600 text-white shrink-0"
                                    >
                                      보강요청
                                    </span>
                                  )}
                                </div>

                                {currentUser.role === "admin" ? (
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
                                onClick={() => handleOpenSlotDetail(slot)}
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

      {currentUser.role === "admin" && editingCell && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
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
                    const theme = getCategoryTheme(cat.id);
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
                    const stStats = getStudentAttendanceStats(st.id);
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => toggleModalStudent(st.id)}
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
                    onClick={handleDeleteTimetableSlot}
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
    </div>
  );
}