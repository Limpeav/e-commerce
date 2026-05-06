import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";
import { useToast } from "../../../context/ToastContext";
import { updateUserProfile } from "../../../services/authApi";
import {
    Phone,
    AlertCircle,
    Loader,
    CheckCircle,
    Smartphone,
    ArrowRight,
    LogOut,
} from "lucide-react";

const CAMBODIA_DIAL_CODE = "+855";

const toLocalPhoneDigits = (phone = "") => {
    const digits = String(phone).replace(/\D/g, "");

    if (digits.startsWith("855")) {
        return digits.slice(3);
    }

    return digits.replace(/^0/, "");
};

const toCambodiaPhone = (phone = "") => {
    const localDigits = toLocalPhoneDigits(phone);
    return localDigits ? `${CAMBODIA_DIAL_CODE}${localDigits}` : "";
};

const isValidCambodiaPhone = (phone = "") => /^\d{8,9}$/.test(toLocalPhoneDigits(phone));

const CompleteProfile = () => {
    const { user, login, logout } = useAuth();
    const { success } = useToast();
    const navigate = useNavigate();

    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Redirect if user not logged in
    useEffect(() => {
        if (!user) {
            navigate("/login");
        } else if (user.phone) {
            // If user already has phone, no need to be here
            navigate("/");
        }
    }, [user, navigate]);

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Basic validation
        if (!isValidCambodiaPhone(phone)) {
            setError("Please enter a valid Cambodia phone number");
            return;
        }

        setLoading(true);

        try {
            if (!user?.token) throw new Error("Authentication error. Please login again.");
            const { data } = await updateUserProfile(user.token, {
                phone: toCambodiaPhone(phone),
            });
            const updatedUser = { ...user, phone: data.phone };
            login(updatedUser);

            success("Profile Completed", "Phone number saved successfully.");
            setCompleted(true);

            setTimeout(() => {
                navigate("/");
            }, 1500);
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to save phone number."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-light/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            </div>

            <div className="w-full max-w-md relative z-10">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl border border-stone-100 mb-6">
                        <Smartphone className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black text-text-main mb-2 font-display">
                        Complete Profile
                    </h1>
                    <p className="text-text-muted font-medium">
                        Add your phone number to continue
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white p-8 sm:p-10">

                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 mb-6 animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {/* Enter Phone Form */}
                    {!completed && (
                        <form onSubmit={handlePhoneSubmit} className="space-y-6">
                            <div className="bg-primary/5 rounded-2xl p-4 text-center">
                                <p className="text-sm text-text-muted font-medium">
                                    Please add your phone number before continuing.
                                </p>
                            </div>

                            <div className="group">
                                <label className="block text-xs font-black text-primary uppercase tracking-widest mb-3 ml-1">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <span className="absolute left-12 top-1/2 -translate-y-1/2 text-sm font-bold text-text-main">
                                        {CAMBODIA_DIAL_CODE}
                                    </span>
                                    <input
                                        type="tel"
                                        placeholder="16568335"
                                        value={phone}
                                        onChange={(e) => setPhone(toLocalPhoneDigits(e.target.value))}
                                        required
                                        autoFocus
                                        className="w-full pl-28 pr-4 py-4 border-2 border-stone-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold bg-stone-50/50 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !phone}
                                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg bg-primary text-white hover:bg-primary-dark hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Save Phone Number
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={logout}
                                className="w-full py-3 text-xs font-bold text-stone-400 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-3 h-3" />
                                Logout and Try Later
                            </button>
                        </form>
                    )}

                    {/* Success */}
                    {completed && (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-black text-green-800 mb-2">Success!</h3>
                            <p className="text-green-600 mb-6">Redirecting you to home page...</p>
                            <Loader className="w-6 h-6 text-primary animate-spin mx-auto" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
