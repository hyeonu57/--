export type Role = "admin" | "teacher";
export type DayOfWeek = "월" | "화" | "수" | "목" | "금" | "토";
export type AttendanceStatus = "출석" | "결석" | "보강";
export type GoalProgressStatus = "달성 완료" | "진행 중(향상)" | "지원 필요";
export type IepBookTab = "profile" | "prev" | "today" | "next";

export type ActivePage =
  | "timetable"
  | "detail"
  | "teacherHistory"
  | "adminReview"
  | "weeklyTasks"
  | "students"
  | "categories"
  | "accounts"
  | "attendanceBook";

export type ColorKey =
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

export interface ActivityTemplateItem {
  id: string;
  label: string;
  text: string;
}

export interface UserAccount {
  id: string;
  loginId: string;
  password: string;
  name: string;
  role: Role;
}

export interface Student {
  id: string;
  name: string;
  birthDate: string;
  schoolGradeClass?: string;
  initialConsultInfo: string;
  currentStatusInfo: string;
  longTermGoal: string;
  shortTermGoal: string;
}

export interface ClassCategory {
  id: string;
  name: string;
  colorKey?: ColorKey;
}

export interface TimetableSlot {
  id: string;
  teacherId: string;
  day: DayOfWeek;
  period: number;
  categoryId: string;
  detailTitle?: string;
  studentIds: string[];
  isMakeupSlot?: boolean;
  makeupForDate?: string;
  makeupWeekKey?: string;
  makeupOriginRecordKey?: string;
  makeupNotificationId?: string;
}

export interface IEPRecord {
  sessionGoal: string;
  activityTop?: string;
  activityMiddle?: string;
  activityBottom?: string;
  activityContent: string;
  supportStrategy: string;
  evaluation: string;
  progressStatus?: GoalProgressStatus;
  nextPlan: string;
  adminChecked?: boolean;
  adminFeedback?: string;
  adminCheckedAt?: string;
}

export interface MakeupNotification {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  categoryName: string;
  originalDate: string;
  makeupDate: string;
  makeupDay: DayOfWeek;
  makeupPeriod: number;
  makeupSlotId?: string;
  createdAt: string;
  acknowledgedByAdmin: boolean;
}

export interface WeeklyTask {
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

export interface CategoryTheme {
  key: ColorKey;
  label: string;
  swatch: string;
  card: string;
  badge: string;
  pill: string;
  titleHover: string;
  modalActive: string;
}

export interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}