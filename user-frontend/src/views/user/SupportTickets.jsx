import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronRight,
  Inbox,
  MessageSquare,
  Plus,
  Search,
  TicketCheck,
} from "lucide-react";
import Loading from "../../components/common/Loading";
import PageLayout from "../../components/ui/PageLayout";
import { useDarkMode } from "../../hooks";
import { getMySupportTickets, SUPPORT_TICKET_STATUSES } from "../../services/supportService";
import { subscribeRealtimeDomains } from "../../services/realtime";

const statusStyles = {
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  WAITING_FOR_CUSTOMER: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
};

const formatStatus = (status = "") =>
  String(status || "OPEN").replace(/_/g, " ");

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

export default function SupportTickets() {
  const navigate = useNavigate();
  const [isDark] = useDarkMode();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchTickets = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const result = await getMySupportTickets();
      setTickets(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load support tickets");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    return subscribeRealtimeDomains(["support"], () => fetchTickets({ silent: true }));
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus = !statusFilter || ticket.status === statusFilter;
      const searchable = [
        ticket.ticketNumber,
        ticket.subject,
        ticket.inquiryTopic,
        ticket.orderNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!term || searchable.includes(term));
    });
  }, [searchTerm, statusFilter, tickets]);

  const pageClassName = isDark ? "bg-transparent text-slate-100" : "bg-bg-base";
  const cardClassName = isDark
    ? "border-slate-800 bg-slate-900/90 text-slate-100"
    : "border-stone-100 bg-white text-text-main";
  const mutedClassName = isDark ? "text-slate-400" : "text-text-muted";

  if (loading) {
    return <Loading message="Loading support tickets..." />;
  }

  return (
    <PageLayout
      title="My Support Tickets"
      subtitle="Track your conversations with Cherish Baby Store support."
      badge="Support"
      icon={TicketCheck}
      badgeColor="primary"
      maxWidth="6xl"
      seoTitle="My Support Tickets"
      seoDescription="View and reply to your Cherish Baby Store support tickets."
      canonical="/customer/support/tickets"
    >
      <div className={`min-h-[60vh] rounded-none transition-colors ${pageClassName}`}>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className={`relative block min-w-[240px] flex-1 ${mutedClassName}`}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tickets"
                className={`h-12 w-full rounded-2xl border px-10 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-primary/20 ${
                  isDark ? "border-slate-800 bg-slate-900" : "border-stone-100 bg-white"
                }`}
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`h-12 rounded-2xl border px-4 text-sm font-black outline-none transition focus:ring-2 focus:ring-primary/20 ${
                isDark ? "border-slate-800 bg-slate-900" : "border-stone-100 bg-white"
              }`}
              aria-label="Filter by support ticket status"
            >
              <option value="">All Statuses</option>
              {SUPPORT_TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/customer/contact"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/15 transition hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className={`overflow-hidden rounded-2xl border shadow-sm ${cardClassName}`}>
          {filteredTickets.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <Inbox className={`mb-4 h-12 w-12 ${mutedClassName}`} />
              <h2 className="text-lg font-black">No support tickets found</h2>
              <p className={`mt-2 max-w-sm text-sm font-medium leading-6 ${mutedClassName}`}>
                Create a support request when you need help with an order,
                payment, delivery, account, or product question.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id || ticket.ticketNumber}
                  type="button"
                  onClick={() => navigate(`/customer/support/tickets/${ticket.ticketNumber}`)}
                  className="grid w-full grid-cols-1 gap-4 p-5 text-left transition hover:bg-primary/5 md:grid-cols-[minmax(0,1fr)_170px_150px_40px] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-primary">
                        {ticket.ticketNumber}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <h3 className="truncate text-base font-black text-text-main">
                      {ticket.subject}
                    </h3>
                    <p className={`mt-1 text-xs font-semibold ${mutedClassName}`}>
                      {ticket.inquiryTopic}
                      {ticket.orderNumber ? ` | Order ${ticket.orderNumber}` : ""}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 text-sm font-semibold ${mutedClassName}`}>
                    <MessageSquare className="h-4 w-4" />
                    Updated {formatDate(ticket.lastActivityAt || ticket.updatedAt)}
                  </div>
                  <div className={`flex items-center gap-2 text-sm font-semibold ${mutedClassName}`}>
                    <Calendar className="h-4 w-4" />
                    {formatDate(ticket.createdAt)}
                  </div>
                  <ChevronRight className="hidden h-5 w-5 text-text-muted md:block" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
