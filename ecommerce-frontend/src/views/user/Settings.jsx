import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, Bell, Shield, Palette, AlertTriangle, Key, Trash2, Mail, RefreshCw, Moon, Globe } from 'lucide-react';
import { useDarkMode } from '../../hooks';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../../config/index.js';
import PageLayout from '../../components/ui/PageLayout';
import SectionHeader from '../../components/ui/SectionHeader';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import FormInput from '../../components/ui/FormInput';
import { AlertMessage } from '../../components';

const API_URL = config.API_BASE_URL;

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, toggleDarkMode] = useDarkMode();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [googleStep, setGoogleStep] = useState(1);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  const isGoogleUser = !!user?.googleId;

  const closeModal = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeleteError('');
    setDeleteSuccess('');
    setGoogleStep(1);
    setOtpDigits(['', '', '', '', '', '']);
    setMaskedEmail('');
  };

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    setDeleteError('');
    try {
      const res = await axios.post(
        `${API_URL}/users/request-delete-otp`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMaskedEmail(res.data.email || user.email);
      setGoogleStep(2);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to send confirmation email.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    setDeleteError('');
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtpDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    otpRefs.current[lastFilled]?.focus();
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setIsDeleting(true);
    setDeleteError('');
    try {
      let payload = {};
      if (isGoogleUser) {
        const otpCode = otpDigits.join('');
        if (otpCode.length < 6) {
          setDeleteError('Please enter the full 6-digit code.');
          setIsDeleting(false);
          return;
        }
        payload = { otpCode };
      } else {
        payload = { password: deletePassword };
      }
      await axios.post(`${API_URL}/users/delete-account`, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const sectionCard = `rounded-2xl border bg-bg-card p-5 sm:p-6 md:p-8`;
  const borderStyle = { borderColor: 'var(--color-border)' };

  return (
    <PageLayout
      title="Settings"
      subtitle="Manage your account preferences"
      maxWidth="4xl"
    >
      <div className="space-y-8">
        {/* Profile Settings */}
        <section>
          <SectionHeader number={1} title="Profile Settings" icon={User} />
          <div className={sectionCard} style={borderStyle}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                label="Display Name"
                placeholder="Enter your name"
                value={user?.name || ''}
                readOnly
              />
              <FormInput
                label="Email Address"
                type="email"
                placeholder="Enter email"
                value={user?.email || ''}
                readOnly
              />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <SectionHeader number={2} title="Notifications" icon={Bell} />
          <div className={sectionCard} style={borderStyle}>
            <div className="space-y-4">
              <ToggleSwitch
                checked={notifications}
                onChange={setNotifications}
                label="Order Updates"
              />
              <ToggleSwitch
                checked={false}
                onChange={() => {}}
                label="Promotional Emails"
              />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <SectionHeader number={3} title="Appearance" icon={Palette} />
          <div className={sectionCard} style={borderStyle}>
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-xs font-bold uppercase tracking-[0.16em] text-primary">Language</label>
                <div className="relative max-w-xs">
                  <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full appearance-none rounded-xl border bg-bg-card py-3.5 pl-11 pr-10 text-sm font-medium text-text-main outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    style={borderStyle}
                  >
                    <option value="en">English</option>
                    <option value="kh">Khmer</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-bg-card p-4 sm:p-5" style={borderStyle}>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border" style={borderStyle}>
                    <Moon className={`h-5 w-5 ${isDark ? 'text-primary' : 'text-text-muted'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">Dark Mode</p>
                    <p className="text-xs font-medium text-text-muted">
                      {isDark ? 'Enabled for this browser' : 'Use the light appearance'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDark}
                  onClick={() => toggleDarkMode()}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 ${isDark ? 'bg-primary' : 'bg-stone-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section>
          <SectionHeader number={4} title="Security & Privacy" icon={Shield} />
          <div className={sectionCard} style={borderStyle}>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-xl border bg-bg-card px-5 py-3 text-xs font-bold text-text-main transition-all hover:border-primary/30 hover:text-primary" style={borderStyle}>
                Change Password
              </button>
              <button className="rounded-xl border bg-bg-card px-5 py-3 text-xs font-bold text-text-main transition-all hover:border-primary/30 hover:text-primary" style={borderStyle}>
                Enable 2FA
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-xs font-bold text-red-600 transition-all hover:bg-red-600 hover:text-white"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-stone-100'}`}>
            <div className="p-6 sm:p-8">
              <div className="mb-5 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-red-100 bg-red-50">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <h2 className="mb-2 text-center text-xl font-bold text-text-main">Delete Account?</h2>
              <p className="mb-6 text-center text-sm font-medium text-text-muted">
                This action is permanently irreversible. All your orders, reviews, and preferences will be permanently wiped.
              </p>

              {deleteError && (
                <div className="mb-5">
                  <AlertMessage type="error" message={deleteError} onClose={() => setDeleteError('')} />
                </div>
              )}

              {isGoogleUser ? (
                <div>
                  {googleStep === 1 ? (
                    <div className="space-y-5">
                      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                        <div>
                          <p className="text-sm font-bold text-blue-800">Signed in with Google</p>
                          <p className="text-xs text-blue-600">We'll send a 6-digit code to your email to verify this request.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={closeModal} className="flex-1 rounded-xl border bg-bg-card px-5 py-3.5 text-sm font-bold text-text-main transition-colors hover:border-primary/30" style={borderStyle}>Cancel</button>
                        <button type="button" onClick={handleSendOtp} disabled={isSendingOtp} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60">
                          {isSendingOtp ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Mail className="h-4 w-4" /> Send Code</>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleDeleteAccount} className="space-y-5">
                      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                        <Mail className="h-5 w-5 shrink-0 text-green-600" />
                        <p className="text-xs text-green-700">We sent a 6-digit code to <strong>{maskedEmail}</strong>.</p>
                      </div>
                      <div>
                        <label className="mb-3 block text-center text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Confirmation Code</label>
                        <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                          {otpDigits.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => (otpRefs.current[i] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              className="h-14 w-12 rounded-xl border-2 border-red-200 bg-red-50 text-center text-xl font-bold text-red-600 transition-all focus:border-red-500 focus:bg-white focus:outline-none"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-center text-xs text-text-muted">
                        Didn't receive it?{' '}
                        <button type="button" onClick={() => { setGoogleStep(1); setOtpDigits(['', '', '', '', '', '']); setDeleteError(''); }} className="inline-flex items-center gap-1 font-bold text-red-500 hover:underline">
                          <RefreshCw className="h-3 w-3" /> Resend
                        </button>
                      </p>
                      <div className="flex gap-3">
                        <button type="button" onClick={closeModal} disabled={isDeleting} className="flex-1 rounded-xl border bg-bg-card px-5 py-3.5 text-sm font-bold text-text-main transition-colors hover:border-primary/30 disabled:opacity-50" style={borderStyle}>Cancel</button>
                        <button type="submit" disabled={isDeleting || otpDigits.join('').length < 6} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                          {isDeleting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Trash2 className="h-4 w-4" /> Confirm Delete</>}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={handleDeleteAccount} className="space-y-5">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Confirm Identity</label>
                    <p className="mb-3 text-xs text-text-muted">Enter your password to confirm account deletion.</p>
                    <div className="relative">
                      <Key className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                        className="w-full rounded-xl border bg-bg-card py-3.5 pl-11 pr-4 text-sm font-medium text-text-main outline-none transition-all focus:ring-2 focus:ring-red-500/20"
                        style={borderStyle}
                        placeholder="Enter your current password"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={closeModal} disabled={isDeleting} className="flex-1 rounded-xl border bg-bg-card px-5 py-3.5 text-sm font-bold text-text-main transition-colors hover:border-primary/30 disabled:opacity-50" style={borderStyle}>Cancel</button>
                    <button type="submit" disabled={isDeleting || !deletePassword} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                      {isDeleting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Trash2 className="h-4 w-4" /> Confirm Delete</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </PageLayout>
  );
}
