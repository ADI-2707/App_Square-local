import { useEffect, useState } from "react";
import api from "../../Utility/api";
import "./logs.css";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await api.get("/admin/logs", {
        params: {
          page,
          page_size: pageSize,
          sort_order: "desc",
        },
      });

      let filtered = res.data.logs;

      if (search) {
        filtered = filtered.filter(
          (log) =>
            log.action.toLowerCase().includes(search.toLowerCase()) ||
            log.endpoint?.toLowerCase().includes(search.toLowerCase()),
        );
      }

      if (statusFilter) {
        filtered = filtered.filter((log) => log.status === statusFilter);
      }

      if (actionFilter) {
        filtered = filtered.filter((log) => log.action === actionFilter);
      }

      setLogs(filtered);
      setTotal(res.data.total);
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to load logs");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="logs-page">
      <h2 className="logs-title">System Logs</h2>

      <div className="logs-filters">
        <input
          placeholder="Search action or endpoint..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
        </select>

        <select onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">All Actions</option>
          <option value="RECIPE_CREATE">RECIPE_CREATE</option>
          <option value="RECIPE_DELETE">RECIPE_DELETE</option>
          <option value="TEMPLATE_CREATE">TEMPLATE_CREATE</option>
          <option value="TEMPLATE_DEVICE_DELETE">TEMPLATE_DEVICE_DELETE</option>
        </select>

        <button onClick={fetchLogs}>Apply</button>
      </div>

      <div className="logs-table">
        <div className="logs-header">
          <span>Actor</span>
          <span>Action</span>
          <span>Status</span>
          <span>Endpoint</span>
          <span>Error</span>
          <span>Time</span>
        </div>

        {logs.map((log) => (
          <div key={log.id} className="logs-row">
            <span className="col-actor">{log.actor}</span>

            <span className="col-action">{log.action}</span>

            <span
              className={
                log.status === "SUCCESS" ? "status-success" : "status-failure"
              }
            >
              {log.status}
            </span>

            <span className="col-endpoint">{log.endpoint}</span>

            <span className="col-error">{log.error_message || "-"}</span>

            <span className="col-time">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="logs-pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>

        <span>
          Page {page} / {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}