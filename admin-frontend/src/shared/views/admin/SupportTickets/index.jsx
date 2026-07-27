import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownUp,
  Calendar,
  Eye,
  LifeBuoy,
  RefreshCw,
  Search,
} from "lucide-react";
import Loading from "../../../components/common/Loading";
import AdminPagination from "../../../components/admin/AdminPagination";
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
const TOPICS = [
  "Order Status",
  "Delivery Issue",
  "Return and Refund",
  "Product Inquiry",
  "Payment Problem",
  "Technical Support",
  "Account Issue",
  "Suggestion",
  "Other",
];

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

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const Badge = ({ value, className }) => (
  <span
    className={`inline-flex min-h-7 items-center whitespace-nowrap rounded-full border px-3 text-[11px] font-black uppercase tracking-wide ${className}`}
  >
    {formatStatus(value)}
  </span>
);

export default function AdminSupportTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    topic: "",
    assignedTo: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    totalItems: 0,
    totalPages: 1,
  });
  const [sort, setSort] = useState({
    sortBy: "lastActivity",
    sortOrder: "desc",
  });

  const queryParams = useMemo(
    () => ({
      ...filters,
      ...sort,
      page: pagination.page,
      limit: pagination.limit,
    }),
    [filters, pagination.limit, pagination.page, sort]
  );

  const fetchTickets = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const response = await adminService.getSupportTickets(queryParams);
      setTickets(response.data.tickets || []);
      setPagination((current) => ({
        ...current,
        ...(response.data.pagination || {}),
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load support tickets");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [queryParams]);

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
      fetchTickets();
    });
  }, [fetchTickets]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchAgents();
    });
    return subscribeRealtimeDomains(["support", "users"], () =>
      fetchTickets({ silent: true })
    );
  }, [fetchAgents, fetchTickets]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const setPage = (page) => {
    setPagination((current) => ({
      ...current,
      page,
    }));
  };

  const setPageSize = (limit) => {
    setPagination((current) => ({
      ...current,
      page: 1,
      limit,
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets({ silent: true });
    setRefreshing(false);
  };

  const toggleSort = (sortBy) => {
    setSort((current) => ({
      sortBy,
      sortOrder:
        current.sortBy === sortBy && current.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const sortButton = (label, sortBy) => (
    <button
      type="button"
      onClick={() => toggleSort(sortBy)}
      className="inline-flex items-center gap-1 text-left text-xs font-black uppercase tracking-wider text-gray-500 hover:text-gray-900"
    >
      {label}
      <ArrowDownUp className="h-3.5 w-3.5" />
    </button>
  );

  if (loading) {
    return <Loading message="Loading support tickets..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Support Tickets
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage customer support requests and waiting-for-customer follow-ups.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-blue-800">
                <LifeBuoy className="h-4 w-4" />
                <span className="text-sm font-bold">
                  {pagination.totalItems} Tickets
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-gray-600 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(220px,1.3fr)_repeat(5,minmax(130px,1fr))]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search ticket, customer, email, subject, order"
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-10 text-sm font-semibold text-gray-800 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(event) => updateFilter("priority", event.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <select
              value={filters.topic}
              onChange={(event) => updateFilter("topic", event.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All topics</option>
              {TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>

            <select
              value={filters.assignedTo}
              onChange={(event) => updateFilter("assignedTo", event.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All agents</option>
              <option value="unassigned">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <label className="relative block">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => updateFilter("startDate", event.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100"
                  aria-label="Start date"
                />
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) => updateFilter("endDate", event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-2 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100"
                aria-label="End date"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    {sortButton("Ticket Number", "ticketNumber")}
                  </th>
                  <th className="px-6 py-3 text-left">
                    {sortButton("Customer", "customer")}
                  </th>
                  <th className="px-6 py-3 text-left">
                    {sortButton("Email", "email")}
                  </th>
                  <th className="px-6 py-3 text-left">
                    {sortButton("Topic", "topic")}
                  </th>
                  <th className="px-6 py-3 text-left">
                    {sortButton("Order Number", "orderNumber")}
                  </th>
                  <th className="px-6 py-3 text-left">
                    {sortButton("Status", "status")}
                  </th>
                  <th className="px-6 py-3 text-left">
                    {sortButton("Priority", "priority")}
                  </th>
                  <th className="px-6 py-3 text-left">
                    {sortButton("Assigned Agent", "assignedAgent")}
                  </th>
                  <th className="px-6 py-3 text-left">
                    {sortButton("Last Activity", "lastActivity")}
                  </th>
                  <th className="px-6 py-3 text-left">
                    {sortButton("Created Date", "createdDate")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-14 text-center">
                      <LifeBuoy className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                      <p className="text-sm font-bold text-gray-500">
                        No support tickets found
                      </p>
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id || ticket.ticketNumber} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm font-black text-blue-700">
                        {ticket.ticketNumber}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">
                        {ticket.fullName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-600">
                        {ticket.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700">
                        {ticket.inquiryTopic}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-600">
                        {ticket.orderNumber || "N/A"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge value={ticket.status} className={statusStyles[ticket.status] || statusStyles.OPEN} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge value={ticket.priority} className={priorityStyles[ticket.priority] || priorityStyles.NORMAL} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-600">
                        {ticket.assignedTo?.name || "Unassigned"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-600">
                        {formatDate(ticket.lastActivityAt || ticket.updatedAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-600">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/support/tickets/${ticket.ticketNumber}`)}
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-black text-white transition hover:bg-blue-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            currentPage={pagination.page}
            endIndex={Math.min(pagination.page * pagination.limit, pagination.totalItems)}
            itemLabel="tickets"
            pageSize={pagination.limit}
            setPage={setPage}
            setPageSize={setPageSize}
            startIndex={pagination.totalItems ? (pagination.page - 1) * pagination.limit : 0}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
          />
        </div>
      </div>
    </div>
  );
}
