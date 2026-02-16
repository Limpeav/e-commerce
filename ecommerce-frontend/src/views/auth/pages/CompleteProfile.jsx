import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { savePhoneNumber } from "../../../services/authApi";
import {
    Phone,
    AlertCircle,
    Loader,
    CheckCircle,
    Smartphone,
    ArrowRight,
    LogOut,
} from "lucide-react";
import PastelCloudBackdrop from "../../../components/ui/PastelCloudBackdrop";

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

    // Handle phone submission - directly save without OTP
    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Basic validation
        if (!phone || phone.length < 8) {
            setError("Please enter a valid phone number");
            return;
        }

        setLoading(true);

        try {
            if (!user?.token) throw new Error("Authentication error. Please login again.");

            const { data } = await savePhoneNumber(user.token, phone);

            // Update local user state with new phone
            const updatedUser = { ...user, phone: data.phone };
            login(updatedUser); // Update context

            success("Profile Completed", "Phone number saved successfully!");
            setCompleted(true);

            // Redirect after short delay
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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base px-4 py-10 font-sans">
            <PastelCloudBackdrop />

            <div className="relative z-10 w-full max-w-md">

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-white shadow-sm">
                        <Smartphone className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-text-main md:text-4xl">
                        Complete Profile
                    </h1>
                    <p className="mt-1 text-sm text-text-muted">
                        Please add your phone number to continue
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-primary/15 bg-white/95 p-6 shadow-sm backdrop-blur md:p-7">

                    {error && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 animate-shake">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                            <p className="text-sm font-medium text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Enter Phone Form */}
                    {!completed && (
                        <form onSubmit={handlePhoneSubmit} className="space-y-4">
                            <div className="rounded-xl border border-primary/12 bg-blue-soft/25 p-4 text-center">
                                <p className="text-sm text-text-muted font-medium">
                                    Please enter your phone number to continue shopping.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text-main">Phone Number</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/45">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="e.g. 012345678"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        autoFocus
                                        className="w-full rounded-xl border border-primary/20 bg-white py-3 pl-11 pr-4 text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !phone}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-text-main transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={logout}
                                className="flex w-full items-center justify-center gap-2 py-2 text-xs font-medium text-text-muted transition-colors hover:text-red-500"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Logout and Try Later
                            </button>
                        </form>
                    )}

                    {/* Success */}
                    {completed && (
                        <div className="py-6 text-center">
                            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-green-100 animate-bounce">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className="mb-1 text-xl font-semibold text-green-800">Success!</h3>
                            <p className="mb-4 text-sm text-green-700">Redirecting you to home page...</p>
                            <Loader className="mx-auto h-5 w-5 animate-spin text-primary" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
