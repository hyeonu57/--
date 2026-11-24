"use client";

import React, { useState } from "react";
import { UserAccount, WeeklyTask } from "../../types/iep";
import { getTargetTeachersForTask, isTaskCheckedByTeacher } from "../../utils/iepHelpers";

interface TeacherWeeklyTasksProps {
  currentUser: UserAccount;
  teachersOnly: UserAccount[];
  weeklyTasks: WeeklyTask[];
  onToggleChecked: (taskId: string, teacherId: string) => void;
}

export default function TeacherWeeklyTasks({
  currentUser,
  teachersOnly,
  weeklyTasks,
  onToggleChecked,
}: TeacherWeeklyTasksProps) {
  const [popupTaskId, setPopupTaskId] = useState<string | null>(null);

  const visibleTasksForTeacher = weeklyTasks.filter((task) => {
    const targets = getTargetTeachersForTask(task, teachersOnly);
    return targets.some((t) => t.id === currentUser.id);
  });

  const selectedPopupTask = popupTaskId
    ? weeklyTasks.find((t) => t.id === popupTaskId) || null
    : null;

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          📌 {currentUser.name} 주간 업무 안내
        </h2>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
          📋 누적 주간 업무 목록 ({visibleTasksForTeacher.length}건)
        </h3>
        <div className="space-y-3">
          {visibleTasksForTeacher.map((task) => {
            const isCheckedMine = isTaskCheckedByTeacher(task, currentUser.id);
            return (
              <div
                key={task.id}
                onClick={() => setPopupTaskId(task.id)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-blue-50/60 transition cursor-pointer flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-bold">
                      {task.weekLabel}
                    </span>
                    <span className="text-slate-400">{task.createdAt}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-800">{task.title}</h4>
                </div>
                <label
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isCheckedMine}
                    onChange={() => onToggleChecked(task.id, currentUser.id)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span>확인 완료</span>
                </label>
              </div>
            );
          })}
        </div>
      </section>

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