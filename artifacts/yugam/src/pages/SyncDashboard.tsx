import { useState } from "react";
import {
  Search,
  PenSquare,
  Phone,
  Video,
  Paperclip,
  SendHorizontal,
} from "lucide-react";

const threads = [
  {
    name: "Nisha Agarwal",
    initials: "NA",
    gradient: "from-violet-500 to-purple-600",
    snippet: "Sure, I'll share the revised proposal by EOD today.",
    time: "10:42 AM",
    unread: true,
    tag: "Clients",
  },
  {
    name: "Sameer Kulkarni",
    initials: "SK",
    gradient: "from-emerald-500 to-green-600",
    snippet: "The deployment is scheduled for tomorrow morning.",
    time: "09:15 AM",
    unread: true,
    tag: "Internal",
  },
  {
    name: "Ritika Bose",
    initials: "RB",
    gradient: "from-sky-500 to-blue-600",
    snippet: "Can we reschedule the demo call to Thursday?",
    time: "Yesterday",
    unread: false,
    tag: "Clients",
  },
  {
    name: "Amit Dhawan",
    initials: "AD",
    gradient: "from-amber-500 to-orange-600",
    snippet: "Reviewed the contract — looks good to proceed.",
    time: "Yesterday",
    unread: false,
    tag: "Internal",
  },
];

const messages = [
  { from: "them", text: "Hi! I wanted to follow up on the proposal we discussed last week. Have you had a chance to review the pricing?" },
  { from: "me", text: "Yes, I went through it. The scope looks great — just need a small adjustment on the payment terms. Can we do net-45 instead of net-30?" },
  { from: "them", text: "Sure, I'll share the revised proposal by EOD today." },
];

const filters = ["All", "Internal", "Clients"] as const;

export default function SyncDashboard() {
  const [activeThread, setActiveThread] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filteredThreads = threads.filter((t) => {
    const matchesFilter = activeFilter === "All" || t.tag === activeFilter;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.snippet.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const current = threads[activeThread];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sync Communications</h1>
          <p className="text-sm text-gray-400 mt-0.5">Unified inbox & team chat</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <PenSquare className="w-4 h-4" />
          New Message
        </button>
      </div>

      <div className="flex h-[700px] bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="w-1/3 border-r border-gray-100 flex flex-col">
          <div className="p-4 space-y-3 shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-1">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeFilter === f
                      ? "bg-[#E31E24] text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.map((thread, idx) => {
              const originalIdx = threads.indexOf(thread);
              const isActive = originalIdx === activeThread;
              return (
                <button
                  key={thread.name}
                  onClick={() => setActiveThread(originalIdx)}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isActive ? "bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${thread.gradient} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                      {thread.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{thread.name}</span>
                          {thread.unread && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0">{thread.time}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{thread.snippet}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${current.gradient} flex items-center justify-center text-white text-[11px] font-bold`}>
                {current.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{current.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[11px] text-gray-400">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-gray-50 p-6 overflow-y-auto flex flex-col gap-4">
            {messages.map((msg, i) =>
              msg.from === "them" ? (
                <div key={i} className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm max-w-[70%]">
                    <p className="text-sm text-gray-700 leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="bg-[#E31E24] rounded-2xl rounded-tr-md px-4 py-3 shadow-sm max-w-[70%]">
                    <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center gap-3 shrink-0">
            <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-red-200 transition-all"
            />
            <button className="w-10 h-10 rounded-full bg-[#E31E24] hover:bg-[#c9191f] flex items-center justify-center text-white shadow-lg shadow-red-500/20 transition-all shrink-0">
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
