"use client";

import React, { useRef } from "react";
import { ActivePage, UserAccount } from "../../types/iep";

interface HeaderProps {
  currentUser: UserAccount;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onOpenTeacherHistory: () => void;
  onLogout: () => void;
  uncheckedWeeklyTaskCount: number;
  totalUncheckedIepCount: number;
  unacknowledgedMakeupCount: number;
  studentCount: number;
  categoryCount: number;
  teacherCount: number;
  onExportBackup: () => void;
  onImportBackupFile: (file: File) => void;
}

export default function Header({
  currentUser,
  activePage,
  onNavigate,
  onOpenTeacherHistory,
  onLogout,
  uncheckedWeeklyTaskCount,
  totalUncheckedIepCount,
  unacknowledgedMakeupCount,
  studentCount,
  categoryCount,
  teacherCount,
  onExportBackup,
  onImportBackupFile,
}: HeaderProps) {
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => onNavigate("timetable")}
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
            onClick={() => onNavigate("timetable")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activePage === "timetable" || activePage === "detail"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🗓️ 주간 시간표
          </button>

          <button
            onClick={() => onNavigate("weeklyTasks")}
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
              onClick={onOpenTeacherHistory}
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
                onClick={() => onNavigate("adminReview")}
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
                onClick={() => onNavigate("students")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activePage === "students"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🎓 학생 명단 ({studentCount})
              </button>
              <button
                onClick={() => onNavigate("categories")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activePage === "categories"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🏷️ 수업 종류·색상 ({categoryCount})
              </button>
              <button
                onClick={() => onNavigate("accounts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activePage === "accounts"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                👤 선생님 계정 ({teacherCount})
              </button>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {currentUser.role === "admin" && (
          <div className="flex items-center gap-1.5 mr-1">
            {unacknowledgedMakeupCount > 0 && (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold rounded-full">
                🔔 보강 알림 {unacknowledgedMakeupCount}건
              </span>
            )}
            <button
              type="button"
              onClick={onExportBackup}
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
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportBackupFile(file);
                if (backupFileInputRef.current) backupFileInputRef.current.value = "";
              }}
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
          onClick={onLogout}
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded-lg"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}