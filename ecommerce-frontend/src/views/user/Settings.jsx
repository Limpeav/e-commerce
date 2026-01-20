import { useState } from 'react';
import { User, Bell, Shield, Globe, Palette } from 'lucide-react';
import { useDarkMode } from '../../hooks';

// UI Components
import PageLayout from '../../components/ui/PageLayout';
import SectionHeader from '../../components/ui/SectionHeader';
import ContentBox from '../../components/ui/ContentBox';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import FormInput from '../../components/ui/FormInput';

export default function Settings() {
  const [isDark, toggleDarkMode] = useDarkMode();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  return (
    <PageLayout
      title="Settings"
      subtitle="Manage your account preferences"
      maxWidth="4xl"
    >
      <div className="space-y-8">
        {/* Profile Settings */}
        <ContentBox>
          <SectionHeader number={1} title="Profile Settings" icon={User} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <FormInput
              label="Display Name"
              placeholder="Enter your name"
            />
            <FormInput
              label="Email Address"
              type="email"
              placeholder="Enter email"
              icon={Mail}
            />
          </div>
        </ContentBox>

        {/* Notification Settings */}
        <ContentBox>
          <SectionHeader number={2} title="Notifications" icon={Bell} />
          <div className="space-y-6">
            <ToggleSwitch
              checked={notifications}
              onChange={setNotifications}
              label="Order Updates"
            />
            <ToggleSwitch
              checked={false}
              onChange={() => { }}
              label="Promotional Emails"
            />
          </div>
        </ContentBox>

        {/* Appearance Settings */}
        <ContentBox>
          <SectionHeader number={3} title="Appearance" icon={Palette} />
          <div className="space-y-10">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wide mb-4 ml-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-6 py-4 bg-stone-50 border-2 border-stone-100 rounded-xl focus:outline-none focus:border-primary transition-all text-text-main font-bold appearance-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-6 bg-stone-50 rounded-2xl border border-stone-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-stone-100">
                  <Palette className={`w-5 h-5 transition-colors ${isDark ? 'text-primary' : 'text-stone-300'}`} />
                </div>
                <span className="text-sm font-bold text-text-main">Dark Mode</span>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 shadow-inner ${isDark ? 'bg-primary' : 'bg-stone-200'
                  }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 shadow-md ${isDark ? 'translate-x-7' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          </div>
        </ContentBox>

        {/* Privacy Settings */}
        <ContentBox>
          <SectionHeader number={4} title="Security & Privacy" icon={Shield} />
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-stone-50 text-stone-600 border border-stone-200 rounded-xl hover:bg-white hover:border-primary hover:text-primary transition-all font-bold text-xs shadow-sm">
              Change Password
            </button>
            <button className="px-6 py-3 bg-stone-50 text-stone-600 border border-stone-200 rounded-xl hover:bg-white hover:border-primary hover:text-primary transition-all font-bold text-xs shadow-sm">
              Enable 2FA
            </button>
            <button className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all font-bold text-xs shadow-sm">
              Delete Account
            </button>
          </div>
        </ContentBox>
      </div>
    </PageLayout>
  );
}
