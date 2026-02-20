import { useState, useRef } from 'react';
import { User, Bell, Shield, Palette, AlertTriangle, Key, Trash2, Mail, RefreshCw } from 'lucide-react';
import { useDarkMode } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../../config/index.js';

// UI Components
import PageLayout from '../../components/ui/PageLayout';
import SectionHeader from '../../components/ui/SectionHeader';
import ContentBox from '../../components/ui/ContentBox';
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

  // ── Delete Account State ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // For regular users: password confirmation
  const [deletePassword, setDeletePassword] = useState('');

  // For Google users: 2-step OTP flow
  //   step 1 = "send code" screen
  //   step 2 = "enter code" screen
  const [googleStep, setGoogleStep] = useState(1);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  // Detect Google-registered users (googleId is returned by the backend)
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

  // ── Step 1 for Google: Send OTP to email ──
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

  // ── Handle OTP digit input (auto-advance) ──
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // digits only
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

  // ── Submit delete ──
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

      await axios.post(
        `${API_URL}/users/delete-account`,
        payload,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Successfully deleted — logout and redirect
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

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
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 shadow-inner ${isDark ? 'bg-primary' : 'bg-stone-200'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 shadow-md ${isDark ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </ContentBox>

        {/* Security & Privacy */}
        <ContentBox>
          <SectionHeader number={4} title="Security &amp; Privacy" icon={Shield} />
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-stone-50 text-stone-600 border border-stone-200 rounded-xl hover:bg-white hover:border-primary hover:text-primary transition-all font-bold text-xs shadow-sm">
              Change Password
            </button>
            <button className="px-6 py-3 bg-stone-50 text-stone-600 border border-stone-200 rounded-xl hover:bg-white hover:border-primary hover:text-primary transition-all font-bold text-xs shadow-sm">
              Enable 2FA
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all font-bold text-xs shadow-sm"
            >
              Delete Account
            </button>
          </div>
        </ContentBox>
      </div>

      {/* ══════════════════════════════════════════
          Delete Account Modal
      ══════════════════════════════════════════ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 sm:p-8">

              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-100">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-center text-text-main mb-2">Delete Account?</h2>
              <p className="text-center text-text-muted font-medium text-sm mb-6">
                This action is permanently irreversible. All your orders, reviews, and preferences will be permanently wiped.
              </p>

              {deleteError && (
                <div className="mb-5">
                  <AlertMessage type="error" message={deleteError} onClose={() => setDeleteError('')} />
                </div>
              )}

              {/* ── GOOGLE USER FLOW ── */}
              {isGoogleUser ? (
                <div>
                  {googleStep === 1 ? (
                    /* ── Step 1: Explain + Send Code button ── */
                    <div className="space-y-5">
                      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-blue-800 mb-0.5">Signed in with Google</p>
                          <p className="text-xs text-blue-600 leading-relaxed">
                            Since you use Google Sign-In, we'll send a 6-digit confirmation code to your email to verify this request.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="flex-1 px-5 py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold text-sm hover:bg-stone-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp}
                          className="flex-1 px-5 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {isSendingOtp ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Mail className="w-4 h-4" />
                              Send Code
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Step 2: Enter the 6-digit OTP ── */
                    <form onSubmit={handleDeleteAccount} className="space-y-5">
                      {/* Email sent notice */}
                      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                        <Mail className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-xs text-green-700 leading-relaxed">
                          We sent a 6-digit code to <strong>{maskedEmail}</strong>. Enter it below to confirm deletion.
                        </p>
                      </div>

                      {/* OTP digit boxes */}
                      <div>
                        <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-3 ml-1 text-center">
                          Confirmation Code
                        </label>
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
                              className="w-12 h-14 text-center text-xl font-black text-red-600 bg-red-50 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Resend link */}
                      <p className="text-center text-xs text-stone-400">
                        Didn't receive it?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setGoogleStep(1);
                            setOtpDigits(['', '', '', '', '', '']);
                            setDeleteError('');
                          }}
                          className="text-red-500 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Resend
                        </button>
                      </p>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={closeModal}
                          disabled={isDeleting}
                          className="flex-1 px-5 py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold text-sm hover:bg-stone-200 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isDeleting || otpDigits.join('').length < 6}
                          className="flex-1 px-5 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
                        >
                          {isDeleting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              Confirm Delete
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* ── REGULAR USER: Password field ── */
                <form onSubmit={handleDeleteAccount} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2 ml-1">
                      Confirm Identity
                    </label>
                    <p className="text-xs text-stone-500 mb-3 ml-1">
                      Enter your password to confirm account deletion.
                    </p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                        <Key className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => {
                          setDeletePassword(e.target.value);
                          setDeleteError('');
                        }}
                        className="w-full pl-11 pr-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:border-red-500 focus:bg-white transition-all font-bold text-text-main placeholder-stone-400"
                        placeholder="Enter your current password"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={isDeleting}
                      className="flex-1 px-6 py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold text-sm hover:bg-stone-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isDeleting || !deletePassword}
                      className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
                    >
                      {isDeleting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          Confirm Delete
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
