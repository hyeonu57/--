"use client";

import React, { useState } from "react";
import {
  BASIC_ROUTINE_BOTTOM,
  BASIC_ROUTINE_TOP,
  SUPPORT_TEMPLATES,
} from "../../constants/iep";
import {
  ActivityTemplateItem,
  AttendanceStatus,
  ClassCategory,
  GoalProgressStatus,
  IEPRecord,
  IepBookTab,
  Student,
  TimetableSlot,
  UserAccount,
} from "../../types/iep";
import {
  buildCombinedActivityText,
  calculateAge,
  computeStudentAttendanceStats,
  getExactDateFromMondayKey,
  getProgressBadgeStyle,
  getProgressEmoji,
  parseActivitySections,
  resolveCategoryTheme,
} from "../../utils/iepHelpers";

interface SessionDetailViewProps {
  currentUser: UserAccount;
  selectedSlot: TimetableSlot;
  initialStudentId: string | null;
  weekKey: string;
  students: Student[];
  categories: ClassCategory[];
  timetable: TimetableSlot[];
  iepRecords: Record<string, IEPRecord>;
  attendanceRecords: Record<string, AttendanceStatus>;
  middleTemplates: ActivityTemplateItem[];
  onBackToTimetable: () => void;
  onOpenTeacherHistory: (studentId: string) => void;
  onOpenCreateMakeup: (student: Student, slot: TimetableSlot, originalDate: string) => void;
  onOpenEditMakeup: (makeupSlot: TimetableSlot) => void;
  onSetAttendance: (recordKey: string, status: AttendanceStatus) => void;
  onUpdateStudentProfile: (
    studentId: string,
    longGoal: string,
    shortGoal: string,
    currentStatus: string
  ) => void;
  onSaveIepRecord: (recordKey: string, record: IEPRecord) => void;
  onAddMiddleTemplate: (label: string, text: string) => void;
  onDeleteMiddleTemplate: (tplId: string) => void;
}

export default function SessionDetailView({
  currentUser,
  selectedSlot,
  initialStudentId,
  weekKey,
  students,
  categories,
  timetable,
  iepRecords,
  attendanceRecords,
  middleTemplates,
  onBackToTimetable,
  onOpenTeacherHistory,
  onOpenCreateMakeup,
  onOpenEditMakeup,
  onSetAttendance,
  onUpdateStudentProfile,
  onSaveIepRecord,
  onAddMiddleTemplate,
  onDeleteMiddleTemplate,
}: SessionDetailViewProps) {
  const slotStudents = students.filter((s) => selectedSlot.studentIds.includes(s.id));
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId && slotStudents.some((s) => s.id === initialStudentId)
      ? initialStudentId
      : slotStudents[0]?.id || ""
  );
  const [iepIndexTab, setIepIndexTab] = useState<IepBookTab>("today");
  const [isEditingGoalsAndStatus, setIsEditingGoalsAndStatus] = useState<boolean>(false);
  const [goalLongInput, setGoalLongInput] = useState<string>("");
  const [goalShortInput, setGoalShortInput] = useState<string>("");
  const [statusInput, setStatusInput] = useState<string>("");
  const [profileSaveMsg, setProfileSaveMsg] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState<string>("");

  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState<boolean>(false);
  const [newTplLabelInput, setNewTplLabelInput] = useState<string>("");
  const [newTplTextInput, setNewTplTextInput] = useState<string>("");

  const exactClassDate = getExactDateFromMondayKey(weekKey, selectedSlot.day);
  const categoryName =
    categories.find((c) => c.id === selectedSlot.categoryId)?.name || "미지정";
  const categoryTheme = resolveCategoryTheme(categories, selectedSlot.categoryId);

  const selectedStudent =
    slotStudents.find((s) => s.id === selectedStudentId) || slotStudents[0];
  const selectedStudentAge = selectedStudent ? calculateAge(selectedStudent.birthDate) : null;

  const recordKey = `${weekKey}_${selectedSlot.id}_${selectedStudent?.id}`;
  const currentIEP: IEPRecord = iepRecords[recordKey] || {
    sessionGoal: "",
    activityTop: "",
    activityMiddle: "",
    activityBottom: "",
    activityContent: "",
    supportStrategy: "",
    evaluation: "",
    nextPlan: "",
  };

  const activitySections = parseActivitySections(currentIEP);

  const previousSession = (() => {
    if (!selectedStudent) return null;
    const pastSessions = Object.entries(iepRecords)
      .filter(([key, rec]) => {
        const [mKey, sId, stId] = key.split("_");
        if (stId !== selectedStudent.id) return false;
        const slot = timetable.find((s) => s.id === sId);
        const exactDate = slot ? getExactDateFromMondayKey(mKey, slot.day) : mKey;
        const hasAnyContent = Boolean(
          rec.sessionGoal.trim() ||
            rec.activityContent.trim() ||
            rec.evaluation.trim() ||
            rec.nextPlan.trim()
        );
        return exactDate < exactClassDate && hasAnyContent;
      })
      .map(([key, rec]) => {
        const [mKey, sId] = key.split("_");
        const slot = timetable.find((s) => s.id === sId);
        const exactDate = slot ? getExactDateFromMondayKey(mKey, slot.day) : mKey;
        return {
          exactDate,
          record: rec,
        };
      })
      .sort((a, b) => b.exactDate.localeCompare(a.exactDate));

    return pastSessions[0] || null;
  })();

  const handleSelectAttendance = (student: Student, status: AttendanceStatus) => {
    if (status === "보강" && !selectedSlot.isMakeupSlot) {
      onOpenCreateMakeup(student, selectedSlot, exactClassDate);
      return;
    }
    onSetAttendance(`${weekKey}_${selectedSlot.id}_${student.id}`, status);
  };

  const handleIEPChange = (field: keyof IEPRecord, value: string) => {
    onSaveIepRecord(recordKey, {
      ...currentIEP,
      [field]: value,
    });
    setSaveMessage("");
  };

  const handleActivitySectionChange = (section: "top" | "middle" | "bottom", value: string) => {
    const nextTop = section === "top" ? value : activitySections.top;
    const nextMiddle = section === "middle" ? value : activitySections.middle;
    const nextBottom = section === "bottom" ? value : activitySections.bottom;

    onSaveIepRecord(recordKey, {
      ...currentIEP,
      activityTop: nextTop,
      activityMiddle: nextMiddle,
      activityBottom: nextBottom,
      activityContent: buildCombinedActivityText(nextTop, nextMiddle, nextBottom),
    });
    setSaveMessage("");
  };

  const handleApplyBasicRoutine = () => {
    const nextTop = activitySections.top.trim()
      ? `${activitySections.top.trim()}\n${BASIC_ROUTINE_TOP}`
      : BASIC_ROUTINE_TOP;
    const nextBottom = activitySections.bottom.trim()
      ? `${activitySections.bottom.trim()}\n${BASIC_ROUTINE_BOTTOM}`
      : BASIC_ROUTINE_BOTTOM;

    onSaveIepRecord(recordKey, {
      ...currentIEP,
      activityTop: nextTop,
      activityMiddle: activitySections.middle,
      activityBottom: nextBottom,
      activityContent: buildCombinedActivityText(nextTop, activitySections.middle, nextBottom),
    });
    setSaveMessage("✨ 기본 루틴이 상(준비운동·동기유발)과 하(마무리·피드백)에 채워졌습니다.");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleInsertMiddleTemplate = (templateText: string) => {
    const nextMiddle = activitySections.middle.trim()
      ? `${activitySections.middle.trim()}\n${templateText}`
      : templateText;
    handleActivitySectionChange("middle", nextMiddle);
    setSaveMessage("✨ 중(본시수업) 템플릿이 추가되었습니다.");
    setTimeout(() => setSaveMessage(""), 2500);
  };

  const handleInsertSupportTemplate = (templateText: string) => {
    const existingText = currentIEP.supportStrategy || "";
    const nextText = existingText.trim()
      ? `${existingText.trim()}\n${templateText}`
      : templateText;
    handleIEPChange("supportStrategy", nextText);
    setSaveMessage("✨ 지원 전략 템플릿이 추가되었습니다.");
    setTimeout(() => setSaveMessage(""), 2500);
  };

  const handleCopyPreviousSession = () => {
    if (!previousSession) return;
    const prevSections = parseActivitySections(previousSession.record);
    const nextTop = prevSections.top || activitySections.top;
    const nextMiddle = prevSections.middle || activitySections.middle;
    const nextBottom = prevSections.bottom || activitySections.bottom;

    onSaveIepRecord(recordKey, {
      ...currentIEP,
      sessionGoal: previousSession.record.sessionGoal || currentIEP.sessionGoal,
      activityTop: nextTop,
      activityMiddle: nextMiddle,
      activityBottom: nextBottom,
      activityContent: buildCombinedActivityText(nextTop, nextMiddle, nextBottom),
      supportStrategy: previousSession.record.supportStrategy || currentIEP.supportStrategy,
    });
    setSaveMessage(`⏪ ${previousSession.exactDate} 차시 내용을 불러왔습니다.`);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleSaveIEPForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIepRecord(recordKey, {
      ...currentIEP,
      activityTop: activitySections.top,
      activityMiddle: activitySections.middle,
      activityBottom: activitySections.bottom,
      activityContent: buildCombinedActivityText(
        activitySections.top,
        activitySections.middle,
        activitySections.bottom
      ),
    });
    setSaveMessage(
      `✅ ${exactClassDate} (${selectedSlot.day}${selectedSlot.period}) [${selectedStudent.name}] 저장 완료!`
    );
    setTimeout(() => setSaveMessage(""), 3500);
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 px-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onBackToTimetable}
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
            {selectedSlot.isMakeupSlot ? `보강·${categoryName}` : categoryName}
          </span>
          {selectedSlot.detailTitle && (
            <h2 className="text-base font-bold text-slate-800">{selectedSlot.detailTitle}</h2>
          )}
          {selectedSlot.isMakeupSlot && (
            <button
              type="button"
              onClick={() => onOpenEditMakeup(selectedSlot)}
              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-extrabold rounded-lg"
            >
              ✏️ 보강 일정 수정/취소
            </button>
          )}
        </div>

        {currentUser.role === "teacher" && selectedStudent && (
          <button
            onClick={() => onOpenTeacherHistory(selectedStudent.id)}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl"
          >
            📚 {selectedStudent.name} 누적 IEP·보고서
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 px-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h3 className="text-xs font-bold text-slate-700">
            👥 참여 학생 선택 및 금일 출결 체크{" "}
            {selectedSlot.isMakeupSlot
              ? "(보강 수업 완료 시 출석 또는 보강 체크)"
              : "(보강 클릭 시 날짜 팝업)"}
          </h3>
          <span className="text-[11px] text-slate-400">실시간 자동 저장됨</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {slotStudents.map((student) => {
            const isSelected = student.id === selectedStudent?.id;
            const stAge = calculateAge(student.birthDate);
            const stRecordKey = `${weekKey}_${selectedSlot.id}_${student.id}`;
            const stAttendance = attendanceRecords[stRecordKey];
            const stStats = computeStudentAttendanceStats(
              student.id,
              attendanceRecords,
              timetable
            );

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
                      <span className="text-[11px] font-bold text-blue-600">(만 {stAge}세)</span>
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
                        onClick={() => handleSelectAttendance(student, statusOption)}
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
                    onClick={() => {
                      setGoalLongInput(selectedStudent.longTermGoal);
                      setGoalShortInput(selectedStudent.shortTermGoal);
                      setStatusInput(selectedStudent.currentStatusInfo);
                      setIsEditingGoalsAndStatus(true);
                    }}
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
                      onClick={() => {
                        onUpdateStudentProfile(
                          selectedStudent.id,
                          goalLongInput.trim(),
                          goalShortInput.trim(),
                          statusInput.trim() || selectedStudent.currentStatusInfo
                        );
                        setIsEditingGoalsAndStatus(false);
                        setProfileSaveMsg("✅ 현재 상태 및 장기·단기목표가 저장되었습니다.");
                        setTimeout(() => setProfileSaveMsg(""), 3500);
                      }}
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
                    <p className="whitespace-pre-wrap">
                      {previousSession.record.nextPlan || "-"}
                    </p>
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
                <p className="py-10 text-center text-slate-400">직전 차시 기록이 없습니다.</p>
              )}
            </div>
          )}

          {iepIndexTab === "today" && (
            <form onSubmit={handleSaveIEPForm} className="p-6 space-y-5">
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

              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-800">
                    2. 세부 수업 활동 내용 (상 · 중 · 하)
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyBasicRoutine}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold rounded-lg shadow-sm transition"
                  >
                    ✨ 기본 루틴 채우기 (상·하 자동 입력)
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-sky-800 mb-1">
                    상 - 준비운동 및 동기유발
                  </label>
                  <textarea
                    rows={2}
                    value={activitySections.top}
                    onChange={(e) => handleActivitySectionChange("top", e.target.value)}
                    placeholder="준비운동 및 동기유발 내용을 입력하세요."
                    className="w-full px-3.5 py-2.5 bg-white border border-sky-200 rounded-xl text-sm leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-bold text-indigo-800">
                      중 - 본시수업
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {middleTemplates.map((tpl) => (
                        <button
                          type="button"
                          key={tpl.id}
                          onClick={() => handleInsertMiddleTemplate(tpl.text)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-[11px] font-bold transition"
                        >
                          + {tpl.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setIsTemplateManagerOpen(true)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold transition"
                      >
                        ⚙️ 템플릿 관리
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={activitySections.middle}
                    onChange={(e) => handleActivitySectionChange("middle", e.target.value)}
                    placeholder="본시수업 내용을 입력하거나 위 템플릿을 클릭해 추가하세요."
                    className="w-full px-3.5 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    하 - 마무리 운동 및 금일 피드백
                  </label>
                  <textarea
                    rows={2}
                    value={activitySections.bottom}
                    onChange={(e) => handleActivitySectionChange("bottom", e.target.value)}
                    placeholder="마무리 운동 및 금일 피드백 내용을 입력하세요."
                    className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm leading-relaxed"
                  />
                </div>
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
                          onClick={() => handleInsertSupportTemplate(tpl.text)}
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
                      {(["달성 완료", "진행 중(향상)", "지원 필요"] as GoalProgressStatus[]).map(
                        (prog) => {
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
                        }
                      )}
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
            <form onSubmit={handleSaveIEPForm} className="p-6 space-y-4">
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

      {isTemplateManagerOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setIsTemplateManagerOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                ⚙️ 중(본시수업) 활동 템플릿 관리
              </h3>
              <button
                type="button"
                onClick={() => setIsTemplateManagerOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTplLabelInput.trim() || !newTplTextInput.trim()) return;
                onAddMiddleTemplate(newTplLabelInput.trim(), newTplTextInput.trim());
                setNewTplLabelInput("");
                setNewTplTextInput("");
              }}
              className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200"
            >
              <span className="text-xs font-extrabold text-slate-700 block">
                ➕ 새 본시수업 템플릿 추가
              </span>
              <input
                type="text"
                value={newTplLabelInput}
                onChange={(e) => setNewTplLabelInput(e.target.value)}
                placeholder="버튼 이름 (예: 상지 협응·던지기)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                required
              />
              <textarea
                rows={2}
                value={newTplTextInput}
                onChange={(e) => setNewTplTextInput(e.target.value)}
                placeholder="삽입될 본시수업 문구를 입력하세요."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
              >
                템플릿 목록에 추가
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {middleTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3 rounded-xl border border-slate-200 flex items-start justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-extrabold text-indigo-800 block">{tpl.label}</span>
                    <p className="text-slate-600 mt-0.5">{tpl.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteMiddleTemplate(tpl.id)}
                    className="px-2.5 py-1 bg-rose-50 text-rose-600 font-bold rounded-lg shrink-0"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsTemplateManagerOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}