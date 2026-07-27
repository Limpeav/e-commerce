import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  LifeBuoy,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  StickyNote,
  UserCheck,
  XCircle,
} from "lucide-react";
import Loading from "../../../components/common/Loading";
import { adminService } from "../../../services/adminService";
import { subscribeRealtimeDomains } from "../../../services/realtime";

const STATUSES = [
  "OPEN",
  "PENDING",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];

const WAITING_CONFIRMATION =
  "This will pause support work until the customer responds. A reminder will be sent after three days, and the ticket will automatically close after seven days without a response.";

const statusStyles = {
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  WAITING_FOR_CUSTOMER: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
};

const priorityStyles = {
  LOW: "bg-gray-50 text-gray-700 border-gray-200",
  NORMAL: "bg-slate-50 text-slate-700 border-slate-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  URGENT: "bg-red-50 text-red-700 border-red-200",
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

const Badge = ({ value, className }) => (
  <span
    className={`inline-flex min-h-7 items-center whitespace-nowrap rounded-full border px-3 text-[11px] font-black uppercase tracking-wide ${className}`}
  >
    {formatStatus(value)}
  </span>
);

const getReplyStyle = (reply) => {
  if (reply.isInternalNote) return "border-purple-200 bg-purple-50";
  if (reply.senderType === "CUSTOMER") return "border-blue-200 bg-blue-50";
  if (reply.senderType === "SYSTEM") return "border-gray-200 bg-gray-50";
  return "border-emerald-200 bg-emerald-50";
};

export default function AdminSupportTicketDetails() {
  const { ticketNumber } = useParams();
  const navigate = useNavigate();
  const attachmentInputRef = useRef(null);
  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [replyForm, setReplyForm] = useState({
    message: "",
    attachments: [],
    markWaitingForCustomer: false,
  });
  const [internalNote, setInternalNote] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [priorityValue, setPriorityValue] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const fetchTicket = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const response = await adminService.getSupportTicket(ticketNumber);
      const nextTicket = response.data.ticket;
      setTicket(nextTicket);
      setStatusValue(nextTicket.status || "OPEN");
      setPriorityValue(nextTicket.priority || "NORMAL");
      setAssignedTo(nextTicket.assignedTo?._id || nextTicket.assignedTo || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load support ticket");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [ticketNumber]);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await adminService.getUsers();
      setAgents((response.data || []).filter((user) => user.role === "admin"));
    } catch {
      setAgents([]);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchTicket();
      fetchAgents();
    });
    return subscribeRealtimeDomains(["support", "users"], () =>
      fetchTicket({ silent: true })
    );
  }, [fetchAgents, fetchTicket]);

  const resetReplyForm = () => {
    setReplyForm({
      message: "",
      attachments: [],
      markWaitingForCustomer: false,
    });
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

  const updateTicketFromResponse = (response) => {
    const nextTicket = response.data.ticket || response.data;
    setTicket(nextTicket);
    setStatusValue(nextTicket.status || "OPEN");
    setPriorityValue(nextTicket.priority || "NORMAL");
    setAssignedTo(nextTicket.assignedTo?._id || nextTicket.assignedTo || "");
  };

  const handleReplyAttachments = (event) => {
    setReplyForm((current) => ({
      ...current,
      attachments: Array.from(event.target.files || []),
    }));
  };

  const submitReply = async (event) => {
    event.preventDefault();
    if (!replyForm.message.trim() && replyForm.attachments.length === 0) {
      alert("Add a reply message or attachment before sending.");
      return;
    }

    if (
      replyForm.markWaitingForCustomer &&
      !window.confirm(WAITING_CONFIRMATION)
    ) {
      return;
    }

    try {
      setBusy("reply");
      const response = await adminService.replyToSupportTicket(ticket.ticketNumber, {
        ...replyForm,
      });
      updateTicketFromResponse(response);
      resetReplyForm();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send support reply");
    } finally {
      setBusy("");
    }
  };

  const saveStatus = async (nextStatus = statusValue) => {
    if (
      nextStatus === "WAITING_FOR_CUSTOMER" &&
      !window.confirm(WAITING_CONFIRMATION)
    ) {
      return;
    }

    let closedReason = "";
    if (nextStatus === "CLOSED") {
      closedReason = window.prompt("Closed reason", "Closed by support.") || "";
    }

    try {
      setBusy("status");
      const response = await adminService.updateSupportTicketStatus(
        ticket.ticketNumber,
        {
          status: nextStatus,
          closedReason,
        }
      );
      updateTicketFromResponse(response);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setBusy("");
    }
  };

  const savePriority = async () => {
    try {
      setBusy("priority");
      const response = await adminService.updateSupportTicketPriority(
        ticket.ticketNumber,
        priorityValue
      );
      updateTicketFromResponse(response);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update priority");
    } finally {
      setBusy("");
    }
  };

  const saveAssignment = async () => {
    try {
      setBusy("assignment");
      const response = await adminService.updateSupportTicketAssignment(
        ticket.ticketNumber,
        assignedTo
      );
      updateTicketFromResponse(response);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update assignment");
    } finally {
      setBusy("");
    }
  };

  const submitInternalNote = async (event) => {
    event.preventDefault();
    if (!internalNote.trim()) {
      alert("Internal note is required.");
      return;
    }

    try {
      setBusy("note");
      const response = await adminService.addSupportInternalNote(
        ticket.ticketNumber,
        internalNote
      );
      updateTicketFromResponse(response);
      setInternalNote("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add internal note");
    } finally {
      setBusy("");
    }
  };

  const handleReopen = async () => {
    try {
      setBusy("reopen");
      const response = await adminService.reopenSupportTicket(ticket.ticketNumber);
      updateTicketFromResponse(response);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reopen ticket");
    } finally {
      setBusy("");
    }
  };

  const detailRows = useMemo(() => {
    if (!ticket) return [];

    return [
      ["Customer", ticket.fullName],
      ["Email", ticket.email],
      ["Phone", ticket.phoneNumber || "Not provided"],
      ["Order Number", ticket.orderNumber || "Not provided"],
      ["Topic", ticket.inquiryTopic],
      ["Created", formatDateTime(ticket.createdAt)],
      ["Last Activity", formatDateTime(ticket.lastActivityAt || ticket.updatedAt)],
      ["Waiting Since", formatDateTime(ticket.waitingSince)],
      ["Auto Close At", formatDateTime(ticket.autoCloseAt)],
      ["Closed Reason", ticket.closedReason || "N/A"],
    ];
  }, [ticket]);

  if (loading) {
    return <Loading message="Loading support ticket..." />;
  }

  if (error || !ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
          <p className="font-bold">{error || "Support ticket not found"}</p>
          <button
            type="button"
            onClick={() => navigate("/admin/support/tickets")}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white"
          >
            Back to Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/admin/support/tickets")}
            className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-gray-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Support
          </button>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-black text-blue-700">
                  {ticket.ticketNumber}
                </span>
                <Badge value={ticket.status} className={statusStyles[ticket.status] || statusStyles.OPEN} />
                <Badge value={ticket.priority} className={priorityStyles[ticket.priority] || priorityStyles.NORMAL} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{ticket.subject}</h1>
              <p className="mt-1 text-sm font-semibold text-gray-500">
                {ticket.fullName} | {ticket.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => saveStatus("RESOLVED")}
                disabled={busy === "status" || ticket.status === "RESOLVED"}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Resolve
              </button>
              <button
                type="button"
                onClick={() => saveStatus("CLOSED")}
                disabled={busy === "status" || ticket.status === "CLOSED"}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-gray-800 px-4 text-sm font-black text-white transition hover:bg-gray-900 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Close
              </button>
              <button
                type="button"
                onClick={handleReopen}
                disabled={busy === "reopen" || ticket.status !== "CLOSED" || !ticket.isReopenEligible}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
              >
                <Clock className="h-4 w-4" />
                Reopen
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <main className="space-y-6">
          <section className="rounded-xl bg-white shadow-sm">
            <div className="border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-black text-gray-900">
                  Conversation
                </h2>
              </div>
            </div>
            <div className="space-y-4 p-6">
              {(ticket.replies || []).map((reply) => (
                <article
                  key={reply._id || reply.createdAt}
                  className={`rounded-xl border p-4 ${getReplyStyle(reply)}`}
                >
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-gray-900">
                        {reply.senderName ||
                          (reply.senderType === "CUSTOMER" ? "Customer" : "Support")}
                      </p>
                      {reply.isInternalNote && (
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-purple-700">
                          Internal Note
                        </span>
                      )}
                      {reply.senderType === "SYSTEM" && (
                        <span className="rounded-full bg-gray-200 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-gray-700">
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-500">
                      {formatDateTime(reply.createdAt)}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-gray-800">
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
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-black text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
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

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Send className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-black text-gray-900">
                Reply to Customer
              </h2>
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
                className="min-h-36 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Write a customer-visible response"
              />

              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-600 transition hover:border-blue-300 hover:text-blue-700">
                <Paperclip className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  {replyForm.attachments.length
                    ? replyForm.attachments.map((file) => file.name).join(", ")
                    : "Attach JPG, PNG, WEBP, or PDF files"}
                </span>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleReplyAttachments}
                  className="sr-only"
                />
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <input
                  type="checkbox"
                  checked={replyForm.markWaitingForCustomer}
                  onChange={(event) =>
                    setReplyForm((current) => ({
                      ...current,
                      markWaitingForCustomer: event.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-bold leading-6 text-blue-900">
                  Send reply and mark as Waiting for Customer
                </span>
              </label>

              <button
                type="submit"
                disabled={busy === "reply"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {busy === "reply" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Reply
              </button>
            </form>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <StickyNote className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-black text-gray-900">
                Internal Note
              </h2>
            </div>
            <form onSubmit={submitInternalNote} className="space-y-4">
              <textarea
                rows="4"
                value={internalNote}
                onChange={(event) => setInternalNote(event.target.value)}
                className="min-h-28 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-purple-100"
                placeholder="Internal notes are hidden from customers"
              />
              <button
                type="submit"
                disabled={busy === "note"}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-black text-white transition hover:bg-purple-700 disabled:opacity-50"
              >
                {busy === "note" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <StickyNote className="h-4 w-4" />}
                Add Internal Note
              </button>
            </form>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <LifeBuoy className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-black text-gray-900">Ticket Info</h2>
            </div>
            <dl className="space-y-3">
              {detailRows.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <dt className="text-sm font-bold text-gray-500">{label}</dt>
                  <dd className="text-right text-sm font-black text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-black text-gray-900">Management</h2>
            </div>
            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-wide text-gray-500">
                  Status
                </span>
                <div className="flex gap-2">
                  <select
                    value={statusValue}
                    onChange={(event) => setStatusValue(event.target.value)}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => saveStatus()}
                    disabled={busy === "status"}
                    className="rounded-xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-wide text-gray-500">
                  Priority
                </span>
                <div className="flex gap-2">
                  <select
                    value={priorityValue}
                    onChange={(event) => setPriorityValue(event.target.value)}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={savePriority}
                    disabled={busy === "priority"}
                    className="rounded-xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-wide text-gray-500">
                  Assigned Support Agent
                </span>
                <div className="flex gap-2">
                  <select
                    value={assignedTo}
                    onChange={(event) => setAssignedTo(event.target.value)}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={saveAssignment}
                    disabled={busy === "assignment"}
                    className="rounded-xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </label>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-black text-gray-900">
              Activity History
            </h2>
            <div className="space-y-3">
              {(ticket.activities || []).length === 0 ? (
                <p className="text-sm font-semibold text-gray-500">
                  No activity recorded yet.
                </p>
              ) : (
                ticket.activities
                  .slice()
                  .reverse()
                  .map((activity) => (
                    <div
                      key={activity._id || activity.createdAt}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                    >
                      <p className="text-xs font-black uppercase tracking-wide text-gray-700">
                        {activity.action}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-gray-600">
                        {activity.description}
                      </p>
                      <p className="mt-2 text-[11px] font-bold text-gray-400">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
