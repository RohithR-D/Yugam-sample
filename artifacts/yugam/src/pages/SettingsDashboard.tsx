import { useState } from "react";
import {
  Building2,
  SlidersHorizontal,
  CreditCard,
  Puzzle,
  Bell,
  Upload,
  Trash2,
  Save,
  X,
} from "lucide-react";

const menuItems = [
  { label: "Company Profile", icon: Building2 },
  { label: "Preferences", icon: SlidersHorizontal },
  { label: "Billing & Plans", icon: CreditCard },
  { label: "Integrations", icon: Puzzle },
  { label: "Notifications", icon: Bell },
];

function Toggle({ enabled, label }: { enabled: boolean; label: string }) {
  const [on, setOn] = useState(enabled);
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-green-500" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

export default function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState("Company Profile");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your enterprise workspace preferences</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        <div className="w-1/4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-red-50 text-[#E31E24]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="w-3/4 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Company Logo</h3>
            <p className="text-xs text-gray-400 mt-0.5">Upload your organization logo for branding</p>
            <div className="flex items-center gap-5 mt-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E31E24] to-[#c9191f] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-red-500/20">
                E
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Upload New
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-6 pt-6">
            <h3 className="text-base font-semibold text-gray-800">General Information</h3>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Company Name</label>
                <input
                  type="text"
                  defaultValue="Edocs Inc"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Registration / Tax ID</label>
                <input
                  type="text"
                  defaultValue="GSTIN-22ABCD1234E1Z5"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-6 pt-6">
            <h3 className="text-base font-semibold text-gray-800">Localization</h3>
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Default Currency</label>
                <select className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                  <option>INR - Indian Rupee</option>
                  <option>USD - US Dollar</option>
                  <option>EUR - Euro</option>
                  <option>GBP - British Pound</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Timezone</label>
                <select className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                  <option>Asia/Kolkata (IST, UTC+5:30)</option>
                  <option>America/New_York (EST, UTC-5)</option>
                  <option>Europe/London (GMT, UTC+0)</option>
                  <option>Asia/Tokyo (JST, UTC+9)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-6 pt-6">
            <h3 className="text-base font-semibold text-gray-800">Global Preferences</h3>
            <p className="text-xs text-gray-400 mt-0.5">Configure system-wide security and display settings</p>
            <div className="mt-3 divide-y divide-gray-50">
              <Toggle enabled={true} label="Force 2FA for all users" />
              <Toggle enabled={false} label="Enable Dark Mode (Beta)" />
              <Toggle enabled={true} label="Auto-lock inactive sessions (15m)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
