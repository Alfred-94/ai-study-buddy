import React, { useState } from "react";
import {
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Target,
  TrendingUp,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

const StudyPlanner = () => {
  const [view, setView] = useState("day");

  const stats = {
    sessions: 6,
    totalTime: "2h 45m",
    progress: 68,
    completedTasks: 4,
    totalTasks: 6,
    examDays: 21,
    examName: "Biology Midterm",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Content */}
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Good morning, Alex! 👋
            </h1>
            <p className="text-slate-500 mt-2">
              Plan smart, stay consistent, achieve more.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search topics, notes, docs..."
                className="w-[320px] h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notification */}
            <button className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center">
              <Bell size={18} />
            </button>

            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
              AJ
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center justify-between mb-8">
          {/* Date Picker */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <button className="px-4 py-4 hover:bg-slate-50">
              <ChevronLeft size={18} />
            </button>
            <div className="px-10 flex items-center gap-4">
              <span className="font-semibold text-slate-700">May 16, 2024</span>
              <Calendar size={18} />
            </div>
            <button className="px-4 py-4 hover:bg-slate-50">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* View Switch */}
          <div className="bg-white border border-slate-200 p-1 rounded-2xl flex">
            {["day", "week", "month"].map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={`px-6 py-2 rounded-xl capitalize transition-all ${
                  view === item
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-500"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* New Plan */}
          <button className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-lg">
            <Plus size={18} />
            New Plan
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Today's Focus */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-blue-50">
                <Target size={20} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Today's Focus</h3>
            </div>
            <div className="flex justify-between mb-6">
              <div>
                <p className="text-5xl font-bold text-slate-900">{stats.sessions}</p>
                <p className="text-slate-500 mt-2">Study Sessions</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-slate-900">{stats.totalTime}</p>
                <p className="text-slate-500 mt-2">Total Study Time</p>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full">
              <div className="h-2 rounded-full bg-blue-600 w-[65%]" />
            </div>
          </div>

          {/* Plan Progress */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-green-50">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Plan Progress</h3>
            </div>
            <p className="text-5xl font-bold text-slate-900">{stats.progress}%</p>
            <p className="text-slate-500 mt-2 mb-8">Completed</p>
            <div className="h-2 bg-slate-100 rounded-full">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>

          {/* Tasks Done */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-emerald-50">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Tasks Done</h3>
            </div>
            <p className="text-5xl font-bold text-slate-900">
              {stats.completedTasks}/{stats.totalTasks}
            </p>
            <p className="text-slate-500 mt-2 mb-8">Tasks Completed</p>
            <div className="h-2 bg-slate-100 rounded-full">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{
                  width: `${(stats.completedTasks / stats.totalTasks) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Upcoming Exam */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-blue-50">
                <GraduationCap size={20} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-800">Upcoming Exam</h3>
            </div>
            <p className="text-5xl font-bold text-slate-900">{stats.examDays} Days</p>
            <p className="text-slate-700 font-medium mt-3">{stats.examName}</p>
          </div>
        </div>

        {/* Main Planner Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* LEFT SECTION (Timeline) */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50">
                    <Calendar size={20} className="text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Today's Schedule
                  </h2>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 font-medium">Auto Plan</span>
                    <button className="relative w-12 h-6 bg-blue-600 rounded-full">
                      <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full" />
                    </button>
                  </div>
                  <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center">
                    ⚙️
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-5">
                {/* Row 1 */}
                <div className="flex gap-6">
                  <div className="w-20 pt-8">
                    <p className="text-sm font-medium text-slate-500">09:00 AM</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <div className="w-[2px] h-full bg-slate-200 mt-2" />
                  </div>
                  <div className="flex-1 border border-slate-200 rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">Photosynthesis – Notes Review</h3>
                      <p className="text-slate-500 mt-1">Biology</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">45m</span>
                      <span className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                        Completed ✓
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex gap-6">
                  <div className="w-20 pt-8">
                    <p className="text-sm font-medium text-slate-500">10:00 AM</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <div className="w-[2px] h-full bg-slate-200 mt-2" />
                  </div>
                  <div className="flex-1 border border-slate-200 rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">Cell Respiration – Concept Study</h3>
                      <p className="text-slate-500 mt-1">Biology</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">60m</span>
                      <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                        In Progress
                      </span>
                      <button className="w-10 h-10 rounded-full border border-blue-200 flex items-center justify-center text-blue-600">
                        ▶️
                      </button>
                    </div>
                  </div>
                </div>

                {/* Break */}
                <div className="flex gap-6">
                  <div className="w-20 pt-6">
                    <p className="text-sm font-medium text-slate-500">11:15 AM</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <div className="w-[2px] h-full bg-slate-200 mt-2" />
                  </div>
                  <div className="flex-1 border border-slate-200 rounded-2xl p-5 flex justify-between items-center bg-slate-50">
                    <h3 className="font-medium text-slate-700">☕️ Short Break</h3>
                    <span className="text-slate-500">15m</span>
                  </div>
                </div>
                {/* Practice Questions */}
                <div className="flex gap-6">
                  <div className="w-20 pt-8">
                    <p className="text-sm font-medium text-slate-500">11:30 AM</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <div className="w-[2px] h-full bg-slate-200 mt-2" />
                  </div>
                  <div className="flex-1 border border-slate-200 rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">Practice Questions</h3>
                      <p className="text-slate-500 mt-1">Biology</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">45m</span>
                      <button className="px-6 py-2 border border-blue-200 rounded-xl text-blue-600 font-medium">
                        Start
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lunch Break */}
                <div className="flex gap-6">
                  <div className="w-20 pt-6">
                    <p className="text-sm font-medium text-slate-500">01:00 PM</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <div className="w-[2px] h-full bg-slate-200 mt-2" />
                  </div>
                  <div className="flex-1 border border-slate-200 rounded-2xl p-5 flex justify-between items-center bg-slate-50">
                    <h3 className="font-medium text-slate-700">🍽 Lunch Break</h3>
                    <span className="text-slate-500">60m</span>
                  </div>
                </div>

                {/* Mitosis */}
                <div className="flex gap-6">
                  <div className="w-20 pt-8">
                    <p className="text-sm font-medium text-slate-500">02:00 PM</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <div className="w-[2px] h-full bg-slate-200 mt-2" />
                  </div>
                  <div className="flex-1 border border-slate-200 rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">Mitosis – Deep Dive</h3>
                      <p className="text-slate-500 mt-1">Biology</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">60m</span>
                      <button className="px-6 py-2 border border-blue-200 rounded-xl text-blue-600 font-medium">
                        Start
                      </button>
                    </div>
                  </div>
                </div>

                {/* Flashcards */}
                <div className="flex gap-6">
                  <div className="w-20 pt-8">
                    <p className="text-sm font-medium text-slate-500">03:15 PM</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <div className="w-[2px] h-full bg-slate-200 mt-2" />
                  </div>
                  <div className="flex-1 border border-slate-200 rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">Flashcards Review</h3>
                      <p className="text-slate-500 mt-1">Biology</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">30m</span>
                      <button className="px-6 py-2 border border-blue-200 rounded-xl text-blue-600 font-medium">
                        Start
                      </button>
                    </div>
                  </div>
                </div>

                {/* Daily Quiz */}
                <div className="flex gap-6">
                  <div className="w-20 pt-8">
                    <p className="text-sm font-medium text-slate-500">03:45 PM</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                  </div>
                  <div className="flex-1 border border-slate-200 rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">Daily Quiz</h3>
                      <p className="text-slate-500 mt-1">Biology</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">30m</span>
                      <button className="px-6 py-2 border border-blue-200 rounded-xl text-blue-600 font-medium">
                        Start
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Task */}
              <button className="mt-8 w-full py-4 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-semibold hover:bg-blue-50 transition">
                + Add Task
              </button>
            </div>
          </div>

          {/* RIGHT SIDEBAR STARTS HERE */}
          <div className="space-y-6">
            {/* Today's Tasks */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-slate-900">Today's Tasks</h3>
                <span className="text-slate-500 font-medium">4/6</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full mb-6">
                <div className="h-2 w-[67%] rounded-full bg-blue-600" />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked readOnly className="w-5 h-5 accent-blue-600" />
                  <span className="text-slate-700">Review Photosynthesis Notes</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked readOnly className="w-5 h-5 accent-blue-600" />
                  <span className="text-slate-700">Study Cell Respiration</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked readOnly className="w-5 h-5 accent-blue-600" />
                  <span className="text-slate-700">Practice 10 Questions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-blue-600" />
                  <span className="text-slate-700">Watch Mitosis Video</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-blue-600" />
                  <span className="text-slate-700">Review Flashcards</span>
                  </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-blue-600" />
                  <span className="text-slate-700">Take Daily Quiz</span>
                </label>
              </div>
            </div>

            {/* Focus Timer */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Focus Timer</h3>
                <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none">
                  <option>Deep Work</option>
                  <option>Pomodoro</option>
                  <option>Exam Prep</option>
                </select>
              </div>
              {/* Timer Circle */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <svg width="230" height="230" className="-rotate-90">
                    <circle cx="115" cy="115" r="95" stroke="#E5E7EB" strokeWidth="12" fill="none" />
                    <circle
                      cx="115"
                      cy="115"
                      r="95"
                      stroke="#2563EB"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="597"
                      strokeDashoffset="150"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <h1 className="text-5xl font-bold text-slate-900">25:00</h1>
                    <p className="text-slate-500 mt-2">Focus</p>
                  </div>
                </div>
              </div>
              {/* Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold transition">
                  ▶️ Start
                </button>
                <button className="w-14 rounded-2xl border border-slate-200 flex items-center justify-center">
                  ↻
                </button>
              </div>
            </div>

            {/* Motivation Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 p-6 overflow-hidden relative">
              <div className="text-5xl text-blue-500 mb-4">"</div>
              <h3 className="text-xl font-semibold text-slate-800 leading-relaxed">
                Discipline today,
                <br />
                success tomorrow.
              </h3>
              <p className="mt-4 text-slate-500">— Your future self</p>
              <div className="absolute bottom-4 right-4 text-6xl">👨‍🎓</div>
            </div>
          </div>
        </div>

        {/* Future Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Notes */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold mb-4">Notes</h3>
            <p className="text-slate-500 mb-4">AI-generated summaries and study notes.</p>
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold">
              Open Notes
            </button>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold mb-4">Documents</h3>
            <p className="text-slate-500 mb-4">Upload PDFs, slides and study resources.</p>
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold">
              Upload Documents
            </button>
          </div>
          {/* Resources */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold mb-4">Resources</h3>
            <p className="text-slate-500 mb-4">Recommended videos, quizzes and flashcards.</p>
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold">
              Explore Resources
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default StudyPlanner;

              