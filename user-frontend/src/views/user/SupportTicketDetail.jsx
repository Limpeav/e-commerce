import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  FileText,
  Lock,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  TicketCheck,
} from "lucide-react";
import Loading from "../../components/common/Loading";
import PageLayout from "../../components/ui/PageLayout";
import { useAuth } from "../../context/useAuth";
import { useDarkMode } from "../../hooks";
import { useToast } from "../../context/useToast";
import {
  getSupportTicket,
  reopenSupportTicket,
  replyToSupportTicket,
} from "../../services/supportService";
import { subscribeRealtimeDomains } from "../../services/realtime";

const statusStyles = {
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  WAITING_FOR_CUSTOMER: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
};

const formatStatus = (status = "") => String(status || "OPEN").replace(/_/g, " ");

const formatDateTime = (value) => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex min-h-7 items-center rounded-full border px-3 text-[11px] font-black uppercase tracking-wide ${
      statusStyles[status] || statusStyles.OPEN
    }`}
  >
    {formatStatus(status)}
  </span>
);

const getReplyTone = (reply) => {
  if (reply.senderType === "CUSTOMER") {
    return "border-primary/20 bg-primary/8";
  }

  if (reply.senderType === "SYSTEM") {
    return "border-slate-200 bg-slate-50";
  }

  return "border-emerald-200 bg-emerald-50";
};

export default function SupportTicketDetail() {
  const navigate = useNavigate();
  const { ticketNumber } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isDark] = useDarkMode();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef(null);
  const accessToken = searchParams.get("accessToken") || "";
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [replyForm, setReplyForm] = useState({
    message: "",
    attachments: [],
  });

  const fetchTicket = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const result = await getSupportTicket(ticketNumber, accessToken);
      setTicket(result);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Support ticket could not be loaded"
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, [accessToken, ticketNumber]);

  useEffect(() => {
    fetchTicket();
    return subscribeRealtimeDomains(["support"], () => fetchTicket({ silent: true }));
  }, [fetchTicket]);

  const handleAttachmentChange = (event) => {
    setReplyForm((current) => ({
      ...current,
      attachments: Array.from(event.target.files || []),
    }));
  };

  const resetReplyForm = () => {
    setReplyForm({ message: "", attachments: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitReply = async (event) => {
    event.preventDefault();
    if (!replyForm.message.trim() && replyForm.attachments.length === 0) {
      toastError("Reply required", "Add a message or attachment before sending.");
      return;
    }

    try {
      setBusy(true);
      const result = await replyToSupportTicket(ticket.ticketNumber, {
        ...replyForm,
        accessToken,
      });
      setTicket(result);
      resetReplyForm();
      success("Reply sent", "Your support reply was added.");
    } catch (err) {
      toastError(
        "Reply failed",
        err.response?.data?.message || err.message || "Failed to send reply"
      );
    } finally {
      setBusy(false);
    }
  };

  const handleReopen = async () => {
    try {
      setBusy(true);
      const result = await reopenSupportTicket(ticket.ticketNumber, {
        message: replyForm.message,
        attachments: replyForm.attachments,
        accessToken,
      });
      setTicket(result);
      resetReplyForm();
      success("Ticket reopened", "Support has been notified.");
    } catch (err) {
      toastError(
        "Reopen failed",
        err.response?.data?.message || err.message || "Failed to reopen ticket"
      );
    } finally {
      setBusy(false);
    }
  };

  const pageClassName = isDark ? "bg-transparent text-slate-100" : "bg-bg-base";
  const cardClassName = isDark
    ? "border-slate-800 bg-slate-900/90 text-slate-100"
    : "border-stone-100 bg-white text-text-main";
  const mutedClassName = isDark ? "text-slate-400" : "text-text-muted";
  const canReply = ticket && ticket.status !== "CLOSED";

  if (loading) {
    return <Loading message="Loading support ticket..." />;
  }

  if (error || !ticket) {
    return (
      <div className={`flex min-h-screen items-center justify-center px-4 ${pageClassName}`}>
        <div className={`max-w-md rounded-2xl border p-6 text-center shadow-sm ${cardClassName}`}>
          <Lock className={`mx-auto mb-4 h-10 w-10 ${mutedClassName}`} />
          <h1 className="text-xl font-black">Ticket unavailable</h1>
          <p className={`mt-2 text-sm font-semibold leading-6 ${mutedClassName}`}>
            {error || "This support ticket could not be loaded."}
          </p>
          <Link
            to={user ? "/customer/support/tickets" : "/customer/contact"}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-black text-white"
          >
            {user ? "Back to Tickets" : "Contact Support"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title={ticket.ticketNumber}
      subtitle={ticket.subject}
      badge="Support Ticket"
      icon={TicketCheck}
      badgeColor="primary"
      maxWidth="6xl"
      seoTitle={`Support Ticket ${ticket.ticketNumber}`}
      seoDescription={ticket.subject}
      canonical={`/customer/support/tickets/${ticket.ticketNumber}`}
    >
      <div className={`min-h-[70vh] transition-colors ${pageClassName}`}>
        <button
          type="button"
          onClick={() => navigate(user ? "/customer/support/tickets" : "/customer/contact")}
          className={`mb-6 inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${
            isDark ? "bg-slate-900 text-slate-200" : "bg-white text-text-main"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className={`rounded-2xl border shadow-sm ${cardClassName}`}>
            <div className="border-b border-stone-100 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-primary">
                      {ticket.ticketNumber}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h2 className="text-xl font-black text-text-main">{ticket.subject}</h2>
                  <p className={`mt-1 text-sm font-semibold ${mutedClassName}`}>
                    {ticket.inquiryTopic}
                  </p>
                </div>
                <div className={`text-sm font-semibold ${mutedClassName}`}>
                  Updated {formatDateTime(ticket.lastActivityAt || ticket.updatedAt)}
                </div>
              </div>

              {ticket.status === "WAITING_FOR_CUSTOMER" && (
                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
                  We are waiting for your response. Please provide the requested
                  information before {formatDateTime(ticket.autoCloseAt)}.
                </div>
              )}

              {ticket.status === "CLOSED" && !ticket.isReopenEligible && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-bold leading-6 text-gray-700">
                  This ticket can no longer be reopened. Please create a new support request.
                </div>
              )}
            </div>

            <div className="space-y-4 p-5">
              {(ticket.replies || []).map((reply) => (
                <article
                  key={reply._id || reply.createdAt}
                  className={`rounded-2xl border p-4 ${getReplyTone(reply)}`}
                >
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-black text-text-main">
                      {reply.senderType === "CUSTOMER"
                        ? reply.senderName || "Customer"
                        : reply.senderType === "SYSTEM"
                          ? "System"
                          : reply.senderName || "Support"}
                    </p>
                    <p className={`text-xs font-bold ${mutedClassName}`}>
                      {formatDateTime(reply.createdAt)}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-text-main">
                    {reply.message}
                  </p>
                  {reply.attachments?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {reply.attachments.map((attachment) => (
                        <a
                          key={attachment.url}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-text-main transition hover:border-primary/30 hover:text-primary"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {attachment.originalName || "Attachment"}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className={`rounded-2xl border p-5 shadow-sm ${cardClassName}`}>
              <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-text-main">
                Ticket Details
              </h3>
              <dl className="space-y-3 text-sm">
                {[
                  ["Customer", ticket.fullName],
                  ["Email", ticket.email],
                  ["Phone", ticket.phoneNumber || "Not provided"],
                  ["Order", ticket.orderNumber || "Not provided"],
                  ["Created", formatDateTime(ticket.createdAt)],
                  ["Status", formatStatus(ticket.status)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <dt className={`font-bold ${mutedClassName}`}>{label}</dt>
                    <dd className="text-right font-black text-text-main">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className={`rounded-2xl border p-5 shadow-sm ${cardClassName}`}>
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-wide text-text-main">
                  {canReply ? "Reply" : "Reopen Ticket"}
                </h3>
              </div>

              <form onSubmit={submitReply} className="space-y-4">
                <textarea
                  rows="5"
                  value={replyForm.message}
                  onChange={(event) =>
                    setReplyForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  disabled={!canReply && !ticket.isReopenEligible}
                  className={`min-h-32 w-full resize-y rounded-2xl border px-4 py-3 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDark ? "border-slate-800 bg-slate-950" : "border-stone-100 bg-stone-50"
                  }`}
                  placeholder={
                    canReply
                      ? "Write your reply"
                      : ticket.isReopenEligible
                        ? "Tell support what you still need help with"
                        : "This ticket is closed"
                  }
                />

                <label
                  className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border border-dashed px-4 text-xs font-black transition ${
                    isDark
                      ? "border-slate-700 bg-slate-950 text-slate-300"
                      : "border-stone-200 bg-stone-50 text-text-muted"
                  }`}
                >
                  <Paperclip className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    {replyForm.attachments.length
                      ? replyForm.attachments.map((file) => file.name).join(", ")
                      : "Attach files"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleAttachmentChange}
                    disabled={!canReply && !ticket.isReopenEligible}
                    className="sr-only"
                  />
                </label>

                {canReply ? (
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/15 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Reply
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReopen}
                    disabled={busy || !ticket.isReopenEligible}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-text-main px-5 text-sm font-black text-white shadow-lg transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                    Reopen Ticket
                  </button>
                )}
              </form>
            </section>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}
