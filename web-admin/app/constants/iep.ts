import {
  ActivityTemplateItem,
  CategoryTheme,
  ClassCategory,
  DayOfWeek,
  Student,
  TimetableSlot,
  UserAccount,
} from "../types/iep";

export const DAYS: DayOfWeek[] = ["월", "화", "수", "목", "금", "토"];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export const STORAGE_KEYS = {
  USERS: "iep_portal_users_v2",
  STUDENTS: "iep_portal_students_v2",
  CATEGORIES: "iep_portal_categories_v2",
  TIMETABLE: "iep_portal_timetable_v2",
  IEP_RECORDS: "iep_portal_iep_records_v2",
  ATTENDANCE: "iep_portal_attendance_v2",
  WEEKLY_TASKS: "iep_portal_weekly_tasks_v2",
  MAKEUP_NOTIFICATIONS: "iep_portal_makeup_notifications_v2",
  MIDDLE_TEMPLATES: "iep_portal_middle_templates_v2",
  SESSION_USER: "iep_portal_session_user_v2",
  SESSION_PAGE: "iep_portal_session_page_v2",
};

export const BASIC_ROUTINE_TOP =
  "관절 가동성 및 가벼운 스트레칭(5분) 진행, 오늘 활동 순서 안내 및 동기유발";
export const BASIC_ROUTINE_BOTTOM =
  "호흡 조절 및 전신 이완 스트레칭(5분), 오늘 활동 소감 나누기 및 긍정 피드백";

export const DEFAULT_MIDDLE_TEMPLATES: ActivityTemplateItem[] = [
  {
    id: "tpl-mid-1",
    label: "균형·협응 순환 활동",
    text: "평균대 보행 → 콘 터치 → 표적 던지기 순환 코스(3회 반복)",
  },
  {
    id: "tpl-mid-2",
    label: "수중 적응·부력 활동",
    text: "입수 후 호흡 연습, 수중 걷기 및 발차기, 부력 기구 활용 균형 유지",
  },
];

export const SUPPORT_TEMPLATES: { label: string; text: string }[] = [
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

export const COLOR_PALETTE: CategoryTheme[] = [
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

export const INITIAL_USERS: UserAccount[] = [
  { id: "admin-1", loginId: "admin", password: "1234", name: "총괄 관리자", role: "admin" },
  { id: "t-1", loginId: "teacher1", password: "1234", name: "정현우 선생님", role: "teacher" },
  { id: "t-2", loginId: "teacher2", password: "1234", name: "김휘원 선생님", role: "teacher" },
];

export const INITIAL_CATEGORIES: ClassCategory[] = [
  { id: "cat-1", name: "수중", colorKey: "cyan" },
  { id: "cat-2", name: "PT", colorKey: "emerald" },
  { id: "cat-3", name: "재활", colorKey: "violet" },
  { id: "cat-4", name: "특수체육", colorKey: "amber" },
];

export const INITIAL_STUDENTS: Student[] = [
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

export const INITIAL_TIMETABLE: TimetableSlot[] = [
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