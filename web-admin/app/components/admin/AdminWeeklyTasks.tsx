"use client";

import React, { useState } from "react";
import { ConfirmDialogState, UserAccount, WeeklyTask } from "../../types/iep";
import {
  formatDateKey,
  getTargetTeachersForTask,
  getWeekInfoFromDateString,
  isTaskCheckedByTeacher,
} from "../../utils/iepHelpers";

interface AdminWeeklyTasksProps {
  weeklyTasks: WeeklyTask[];
  teachersOnly: UserAccount[];
  onAddTask: (newTask: WeeklyTask) => void;
  onDeleteTask: (taskId: string) => void;
  onRequestConfirm: (dialog: ConfirmDialogState) => void;
}

export default function AdminWeeklyTasks({
  weeklyTasks,
  teachersOnly,
  onAddTask,
  onDeleteTask,
  onRequestConfirm,
}: AdminWeeklyTasksProps) {
  const [taskDateInput, setTaskDateInput] = useState<string>(() => formatDateKey(new Date()));
  const [taskTitleInput, setTaskTitleInput] = useState<string>("");
  const [taskDetailInput, setTaskDetailInput] = useState<string>("");
  const [taskAssigneeInput, setTaskAssigneeInput] = useState<string>("전체 선생님");
  const [message, setMessage] = useState<string>("");
  const [popupTaskId, setPopupTaskId] = useState<string | null>(null);

  const previewWeekInfo = getWeekInfoFromDateString(taskDateInput);
  const selectedPopupTask = popupTaskId
    ? weeklyTasks.find((t) => t.id === popupTaskId) || null
    : null;

  const handleSubmit = (e: React.FormEvent) => {
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

    onAddTask({
      id: `wt-${Date.now()}`,
      weekLabel: chosenLabel,
      weekStartDate: chosenMondayKey,
      title: trimmedTitle,
      detail: taskDetailInput.trim() || "상세 지시사항 없음",
      assignee: chosenAssignee,
      createdAt: formatDateKey(new Date()),
      checkedByTeacher: false,
      checkedByTeachers: initialTeacherMap,
    });

    setTaskTitleInput("");
    setTaskDetailInput("");
    setMessage(`✅ 선택한 날짜(${taskDateInput})가 '${chosenLabel}'로 자동 반영되었습니다.`);
    setTimeout(() => setMessage(""), 3500);
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">
          📌 관리자 주간 업무 지시 및 선생님별 확인 현황
        </h2>
        {message && (
          <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-800 text-white shadow-sm">
            {message}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
            ➕ 주간 업무 상세 작성
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  기준 날짜 선택 (달력)
                </label>
                <input
                  type="date"
                  value={taskDateInput}
                  onChange={(e) => setTaskDateInput(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm text-slate-800 bg-white"
                  required
                />
                <p className="text-[11px] font-semibold text-blue-600 mt-1">
                  → 자동 반영 주차: {previewWeekInfo.weekLabel}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">대상 선생님</label>
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
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">상세 지시사항</label>
              <textarea
                rows={8}
                value={taskDetailInput}
                onChange={(e) => setTaskDetailInput(e.target.value)}
                placeholder="선생님들께 전달할 세부 지시 내용을 입력하세요."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 leading-relaxed resize-y"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition"
            >
              주간 업무 지시 등록
            </button>
          </form>
        </section>

        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
            📋 누적 등록된 주간 업무 ({weeklyTasks.length}건)
          </h3>

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
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/40 transition cursor-pointer space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-white font-bold">
                        {task.weekLabel}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                        대상: {task.assignee}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                        확인 {checkedCount}/{targetTeachers.length}명
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestConfirm({
                          title: "주간 업무 삭제",
                          message: `'${task.title}' 주간 업무를 삭제하시겠습니까?`,
                          confirmLabel: "삭제",
                          danger: true,
                          onConfirm: () => {
                            onDeleteTask(task.id);
                            if (popupTaskId === task.id) setPopupTaskId(null);
                            setMessage("🗑️ 주간 업무가 삭제되었습니다.");
                            setTimeout(() => setMessage(""), 3000);
                          },
                        });
                      }}
                      className="px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg"
                    >
                      삭제
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{task.title}</p>
                  <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-3 bg-white p-3 rounded-lg border border-slate-200/80">
                    {task.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {selectedPopupTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setPopupTaskId(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-xs font-bold">
                  {selectedPopupTask.weekLabel}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedPopupTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPopupTaskId(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {selectedPopupTask.detail}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPopupTaskId(null)}
                className="px-5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}