"use client";

import React from "react";
import { MakeupNotification, UserAccount } from "../../types/iep";

export interface TeacherSummaryMetrics {
  totalSlots: number;
  totalStudentSessions: number;
  completedIepCount: number;
  completionRate: number;
  uncheckedIepForTeacher: number;
  weekPresent: number;
  weekAbsent: number;
  weekMakeup: number;
  uncheckedTasksForTeacher: number;
}

interface AdminDashboardProps {
  teachersOnly: UserAccount[];
  activeTeacher?: UserAccount;
  onSelectTeacher: (teacherId: string) => void;
  summary: TeacherSummaryMetrics;
  onGoReview: () => void;
  unacknowledgedMakeupList: MakeupNotification[];
  onAcknowledgeMakeup: (notiId: string) => void;
}

export default function AdminDashboardAndNotifications({
  teachersOnly,
  activeTeacher,
  onSelectTeacher,
  summary,
  onGoReview,
  unacknowledgedMakeupList,
  onAcknowledgeMakeup,
}: AdminDashboardProps) {
  return (
    <>
      <div className="bg-slate-800 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-amber-400 text-slate-900 text-xs font-extrabold rounded-md">
            선생님 선택
          </span>
          <span className="text-sm text-slate-200">
            선택한 <strong>{activeTeacher?.name}</strong> 기준으로 아래 현황과 시간표가 표시됩니다.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {teachersOnly.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTeacher(t.id)}
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

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block">
            {activeTeacher?.name} 주간 수업 / 회기
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">{summary.totalSlots}칸</span>
            <span className="text-xs font-semibold text-slate-500">
              ({summary.totalStudentSessions}건)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block">
            {activeTeacher?.name} IEP 작성률
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-600">
              {summary.completionRate}%
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({summary.completedIepCount}/{summary.totalStudentSessions}건)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block">
            {activeTeacher?.name} 출결 현황
          </span>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              출석 {summary.weekPresent}
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">
              결석 {summary.weekAbsent}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              보강 {summary.weekMakeup}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">
              미확인 업무 / 미검토 IEP
            </span>
            <div className="mt-1 flex items-center gap-2 text-sm font-extrabold">
              <span className="text-slate-800">업무 {summary.uncheckedTasksForTeacher}건</span>
              <span className="text-slate-300">·</span>
              <span className="text-rose-600">IEP {summary.uncheckedIepForTeacher}건</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onGoReview}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-xl shrink-0"
          >
            검토 →
          </button>
        </div>
      </section>

      {unacknowledgedMakeupList.length > 0 && (
        <section className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-950">
              🔔 교사 보강 날짜 반영 알림 ({unacknowledgedMakeupList.length}건)
            </span>
            <span className="text-[11px] text-amber-800">
              해당 선생님·날짜의 주간 시간표에 보강 수업이 반영되었습니다.
            </span>
          </div>
          <div className="space-y-2">
            {unacknowledgedMakeupList.map((noti) => (
              <div
                key={noti.id}
                className="bg-white border border-amber-200 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="text-slate-800">
                  <strong>{noti.teacherName}</strong> · <strong>{noti.studentName}</strong> (
                  {noti.categoryName}) — 결석({noti.originalDate}) → 보강{" "}
                  <strong className="text-amber-700">
                    {noti.makeupDate} ({noti.makeupDay}요일 {noti.makeupPeriod}교시)
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => onAcknowledgeMakeup(noti.id)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg"
                >
                  알림 확인
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}