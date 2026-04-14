import { useEffect, useMemo, useState } from "react";
import BaseModal from "../BaseModal/BaseModal";
import "./viewTemplateModal.css";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useWorkspace } from "../../../context/WorkspaceContext/WorkspaceContext";

export default function ViewTemplateModal({ isOpen, onClose }) {
  const { groups, devices, getFullTemplate } = useEntities();
  const { openWorkspace, workspace } = useWorkspace();

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [direction, setDirection] = useState("next");
  const [animating, setAnimating] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [dateFilter, setDateFilter] = useState("all");
  const [templates, setTemplates] = useState([]);
  const [total, setTotal] = useState(0);

  const ITEMS_PER_PAGE = 8;

  const getDeviceCount = (templateId) => {
    const list = devices.byGroupId[templateId];
    if (!list) return "...";
    return list.length;
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleOpenTemplate = async (template) => {
    try {
      const full = await getFullTemplate(template.id);
      openWorkspace("template", full);
      onClose();
    } catch {
      alert("Failed to open template");
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="highlight">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === "ArrowDown") {
        setSelectedIndex((prev) =>
          prev === -1 ? 0 : Math.min(prev + 1, templates.length - 1),
        );
      }

      if (e.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev === -1 ? -1 : Math.max(prev - 1, 0)));
      }

      if (e.key === "Enter") {
        if (selectedIndex === -1) return;
        const selected = templates[selectedIndex];
        if (selected) handleOpenTemplate(selected);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, templates, selectedIndex]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;

    if (workspace?.type === "template") {
      const index = templates.findIndex(
        (t) => t.id === workspace.data?.id,
      );

      setSelectedIndex(index !== -1 ? index : -1);
    } else {
      setSelectedIndex(-1);
    }
  }, [isOpen, templates, workspace]);

  const { fetchTemplates } = useEntities();

  useEffect(() => {
    if (!isOpen) return;

    const handler = setTimeout(async () => {
      try {
        const res = await fetchTemplates({
          search,
          sort: sortBy,
          dateFilter,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        });

        setTemplates(res.data);
        setTotal(res.total);
      } catch {
        alert("Failed to load templates");
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [search, sortBy, dateFilter, currentPage, isOpen]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="All Templates">
      <div className="view-modal">
        <div className="view-search">
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
              setSelectedIndex(-1);
            }}
          />

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
              setSelectedIndex(-1);
            }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
              setSelectedIndex(-1);
            }}
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div
          className={`view-list-wrapper ${
            animating ? `slide-${direction}` : ""
          }`}
        >
          <div className="view-list">
            {templates.length === 0 ? (
              <div className="empty">No templates found</div>
            ) : (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => {
                const template = templates[index];

                if (!template) {
                  return (
                    <div
                      key={`placeholder-${index}`}
                      className="view-item placeholder"
                    >
                      <div className="skeleton-line" />
                    </div>
                  );
                }

                return (
                  <div
                    key={template.id}
                    className={`view-item ${
                      selectedIndex === index ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedIndex(index);
                      handleOpenTemplate(template);
                    }}
                  >
                    <span>
                      {highlightMatch(template.name, debouncedSearch)}
                    </span>

                    <div className="tooltip">
                      {getDeviceCount(template.id)} devices
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="modal-actions">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setDirection("prev");
                setAnimating(true);

                setTimeout(() => {
                  setCurrentPage((p) => p - 1);
                  setSelectedIndex(-1);
                  setAnimating(false);
                }, 180);
              }}
            >
              Prev
            </button>

            <span>
              Page {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => {
                setDirection("next");
                setAnimating(true);

                setTimeout(() => {
                  setCurrentPage((p) => p + 1);
                  setSelectedIndex(-1);
                  setAnimating(false);
                }, 180);
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
