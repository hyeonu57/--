"use client";

import React, { useState } from "react";
import { COLOR_PALETTE } from "../../constants/iep";
import {
  AttendanceStatus,
  ClassCategory,
  ColorKey,
  ConfirmDialogState,
  Student,
  TimetableSlot,
  UserAccount,
} from "../../types/iep";
import {
  calculateAge,
  computeStudentAttendanceStats,
  getThemeByColorKey,
} from "../../utils/iepHelpers";

interface StudentsManagementProps {
  students: Student[];
  timetable: TimetableSlot[];
  attendanceRecords: Record<string, AttendanceStatus>;
  onSaveStudent: (student: Student, isEdit: boolean) => void;
  onDeleteStudent: (studentId: string) => void;
  onRequestConfirm: (dialog: ConfirmDialogState) => void;
}

export function AdminStudentsView({
  students,
  timetable,
  attendanceRecords,
  onSaveStudent,
  onDeleteStudent,
  onRequestConfirm,
}: StudentsManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [birthInput, setBirthInput] = useState("2016-01-01");
  const [schoolInput, setSchoolInput] = useState("");
  const [initialConsultInput, setInitialConsultInput] = useState("");
  const [currentStatusInput, setCurrentStatusInput] = useState("");
  const [longGoalInput, setLongGoalInput] = useState("");
  const [shortGoalInput, setShortGoalInput] = useState("");
  const [message, setMessage] = useState("");

  const previewAge = calculateAge(birthInput);

  const filteredStudents = students.filter((st) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      st.name.toLowerCase().includes(q) ||
      (st.schoolGradeClass && st.schoolGradeClass.toLowerCase().includes(q)) ||
      st.birthDate.includes(q) ||
      st.initialConsultInfo.toLowerCase().includes(q) ||
      st.currentStatusInfo.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setEditingStudentId(null);
    setNameInput("");
    setBirthInput("2016-01-01");
    setSchoolInput("");
    setInitialConsultInput("");
    setCurrentStatusInput("");
    setLongGoalInput("");
    setShortGoalInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name || !birthInput) return;

    const payload: Student = {
      id: editingStudentId || `st-${Date.now()}`,
      name,
      birthDate: birthInput,
      schoolGradeClass: schoolInput.trim(),
      initialConsultInfo: initialConsultInput.trim() || "초기 상담 내용 미입력",
      currentStatusInfo: currentStatusInput.trim() || "담당 선생님 관찰 특이사항 미입력",
      longTermGoal: longGoalInput.trim(),
      shortTermGoal: shortGoalInput.trim(),
    };

    onSaveStudent(payload, Boolean(editingStudentId));
    setMessage(
      editingStudentId
        ? `✅ '${name}' 학생 정보가 저장되었습니다.`
        : `✅ '${name}' 학생이 새로 등록되었습니다.`
    );
    resetForm();
    setTimeout(() => setMessage(""), 3500);
  };

  const handleStartEdit = (st: Student) => {
    setEditingStudentId(st.id);
    setNameInput(st.name);
    setBirthInput(st.birthDate);
    setSchoolInput(st.schoolGradeClass || "");
    setInitialConsultInput(st.initialConsultInfo);
    setCurrentStatusInput(st.currentStatusInfo);
    setLongGoalInput(st.longTermGoal);
    setShortGoalInput(st.shortTermGoal);
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">
          🎓 학생 명단 및 기초·목표·보강 관리
        </h2>
        {message && (
          <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-800 text-white">
            {message}
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
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                신규 모드
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                학생 이름 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">생년월일</label>
                {previewAge !== null && (
                  <span className="text-xs font-extrabold text-blue-600">만 {previewAge}세</span>
                )}
              </div>
              <input
                type="date"
                value={birthInput}
                onChange={(e) => setBirthInput(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">학교 및 학년/반</label>
              <input
                type="text"
                value={schoolInput}
                onChange={(e) => setSchoolInput(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                1. 초기 상담 및 기초평가
              </label>
              <textarea
                rows={3}
                value={initialConsultInput}
                onChange={(e) => setInitialConsultInput(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                2. 현재 상태 및 특이사항
              </label>
              <textarea
                rows={2}
                value={currentStatusInput}
                onChange={(e) => setCurrentStatusInput(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">3. 장기목표</label>
              <input
                type="text"
                value={longGoalInput}
                onChange={(e) => setLongGoalInput(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-700 mb-1">4. 단기목표</label>
              <input
                type="text"
                value={shortGoalInput}
                onChange={(e) => setShortGoalInput(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              {editingStudentId && (
                <button
                  type="button"
                  onClick={resetForm}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 이름, 학교/반 검색..."
              className="w-full sm:w-56 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-3.5">
            {filteredStudents.map((st) => {
              const age = calculateAge(st.birthDate);
              const stStats = computeStudentAttendanceStats(
                st.id,
                attendanceRecords,
                timetable
              );

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
                        출석 {stStats.present} · 결석 {stStats.absent} · 보강 {stStats.makeup}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(st)}
                        className="px-3 py-1 bg-white border border-slate-300 text-xs font-bold rounded-lg"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onRequestConfirm({
                            title: "학생 삭제",
                            message: `'${st.name}' 학생을 명단과 시간표에서 삭제하시겠습니까?`,
                            confirmLabel: "삭제",
                            danger: true,
                            onConfirm: () => {
                              onDeleteStudent(st.id);
                              if (editingStudentId === st.id) resetForm();
                              setMessage(`🗑️ '${st.name}' 학생이 명단에서 삭제되었습니다.`);
                              setTimeout(() => setMessage(""), 3500);
                            },
                          })
                        }
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
  );
}

interface CategoriesManagementProps {
  categories: ClassCategory[];
  timetable: TimetableSlot[];
  onAddCategory: (cat: ClassCategory) => void;
  onUpdateCategory: (catId: string, name: string, colorKey: ColorKey) => void;
  onDeleteCategory: (catId: string) => void;
  onRequestConfirm: (dialog: ConfirmDialogState) => void;
}

export function AdminCategoriesView({
  categories,
  timetable,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onRequestConfirm,
}: CategoriesManagementProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColorKey, setNewCategoryColorKey] = useState<ColorKey>("sky");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryColorKey, setEditingCategoryColorKey] = useState<ColorKey>("cyan");
  const [message, setMessage] = useState("");

  const usedColorKeys = new Set(
    categories.map((cat) => getThemeByColorKey(cat.colorKey, cat.name).key)
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name === trimmed)) {
      setMessage("⚠️ 이미 등록된 수업 종류입니다.");
      return;
    }
    const chosenColorLabel =
      COLOR_PALETTE.find((c) => c.key === newCategoryColorKey)?.label || newCategoryColorKey;

    onAddCategory({
      id: `cat-${Date.now()}`,
      name: trimmed,
      colorKey: newCategoryColorKey,
    });
    setNewCategoryName("");
    setMessage(`✅ '${trimmed}' (${chosenColorLabel}) 수업 종류가 추가되었습니다.`);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">🏷️ 수업 종류 및 색상 관리</h2>
        {message && (
          <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-800 text-white">
            {message}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
            ➕ 새 수업 종류 추가
          </h3>

          <form onSubmit={handleAdd} className="space-y-4">
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
                          onClick={() => {
                            if (!editingCategoryName.trim()) return;
                            onUpdateCategory(
                              cat.id,
                              editingCategoryName.trim(),
                              editingCategoryColorKey
                            );
                            setEditingCategoryId(null);
                            setMessage("✅ 수업 종류 및 색상이 수정되었습니다.");
                            setTimeout(() => setMessage(""), 3000);
                          }}
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
                            onClick={() => {
                              if (categories.length <= 1) {
                                setMessage("⚠️ 최소 1개 이상의 수업 종류는 유지되어야 합니다.");
                                return;
                              }
                              if (usedCount > 0) {
                                setMessage(
                                  `⚠️ '${cat.name}' 수업이 현재 시간표에 배정되어 있어 삭제할 수 없습니다.`
                                );
                                return;
                              }
                              onRequestConfirm({
                                title: "수업 종류 삭제",
                                message: `'${cat.name}' 수업 종류를 삭제하시겠습니까?`,
                                confirmLabel: "삭제",
                                danger: true,
                                onConfirm: () => {
                                  onDeleteCategory(cat.id);
                                  setMessage(`🗑️ '${cat.name}' 수업 종류가 삭제되었습니다.`);
                                  setTimeout(() => setMessage(""), 3000);
                                },
                              });
                            }}
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
                              onClick={() => {
                                onUpdateCategory(cat.id, cat.name, colorItem.key);
                                setMessage(`🎨 색상이 '${colorItem.label}'(으)로 변경되었습니다.`);
                                setTimeout(() => setMessage(""), 2500);
                              }}
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
  );
}

interface AccountsManagementProps {
  users: UserAccount[];
  onCreateTeacher: (account: UserAccount) => void;
  onUpdatePassword: (userId: string, newPw: string) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onRequestConfirm: (dialog: ConfirmDialogState) => void;
}

export function AdminAccountsView({
  users,
  onCreateTeacher,
  onUpdatePassword,
  onDeleteTeacher,
  onRequestConfirm,
}: AccountsManagementProps) {
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherLoginId, setNewTeacherLoginId] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [editingPwUserId, setEditingPwUserId] = useState<string | null>(null);
  const [updatedPassword, setUpdatedPassword] = useState("");
  const [message, setMessage] = useState("");

  const teachersOnly = users.filter((u) => u.role === "teacher");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newTeacherName.trim();
    const trimmedId = newTeacherLoginId.trim();
    const trimmedPw = newTeacherPassword.trim();
    if (!trimmedName || !trimmedId || !trimmedPw) return;

    if (users.some((u) => u.loginId === trimmedId)) {
      setMessage("⚠️ 이미 사용 중인 아이디입니다.");
      return;
    }

    onCreateTeacher({
      id: `t-${Date.now()}`,
      loginId: trimmedId,
      password: trimmedPw,
      name: trimmedName,
      role: "teacher",
    });

    setNewTeacherName("");
    setNewTeacherLoginId("");
    setNewTeacherPassword("");
    setMessage(`✅ '${trimmedName}' (${trimmedId}) 계정이 생성되었습니다.`);
    setTimeout(() => setMessage(""), 3500);
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">👤 선생님 계정 관리</h2>
        {message && (
          <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-800 text-white">
            {message}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
            ➕ 새 선생님 계정 등록
          </h3>

          <form onSubmit={handleCreate} className="space-y-4">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">로그인 아이디</label>
              <input
                type="text"
                value={newTeacherLoginId}
                onChange={(e) => setNewTeacherLoginId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">초기 비밀번호</label>
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
                          onClick={() => {
                            if (!updatedPassword.trim()) return;
                            onUpdatePassword(teacher.id, updatedPassword.trim());
                            setEditingPwUserId(null);
                            setMessage("✅ 비밀번호가 변경되었습니다.");
                            setTimeout(() => setMessage(""), 3000);
                          }}
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
                          onClick={() => {
                            if (teachersOnly.length <= 1) {
                              setMessage("⚠️ 최소 1명 이상의 선생님 계정은 유지되어야 합니다.");
                              return;
                            }
                            onRequestConfirm({
                              title: "선생님 계정 삭제",
                              message: `'${teacher.name}' 계정과 배정된 시간표를 모두 삭제하시겠습니까?`,
                              confirmLabel: "삭제",
                              danger: true,
                              onConfirm: () => {
                                onDeleteTeacher(teacher.id);
                                setMessage(`🗑️ '${teacher.name}' 계정이 삭제되었습니다.`);
                                setTimeout(() => setMessage(""), 3500);
                              },
                            });
                          }}
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
  );
}