import { useEffect, useMemo, useState } from "react";
import BaseModal from "../BaseModal/BaseModal";
import "./viewRecipeModal.css";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useWorkspace } from "../../../context/WorkspaceContext/WorkspaceContext";

export default function ViewRecipeModal({ isOpen, onClose }) {
  const { groups, devices, getFullTemplate } = useEntities();
  const { openWorkspace } = useWorkspace();

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const ITEMS_PER_PAGE = 8;

  const templateList = useMemo(() => {
    return groups.allIds
      .map((id) => groups.byId[id])
      .filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      );
  }, [groups, search]);

  const totalPages = Math.ceil(templateList.length / ITEMS_PER_PAGE);

  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return templateList.slice(start, start + ITEMS_PER_PAGE);
  }, [templateList, currentPage]);

  const getDeviceCount = (templateId) => {
    const list = devices.byGroupId[templateId];
    if (!list) return "...";
    return list.length;
  };

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
        <span key={i} className="highlight">{part}</span>
      ) : (
        part
      )
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === "Escape") onClose();

      if (e.key === "ArrowDown") {
        setSelectedIndex((prev) =>
          Math.min(prev + 1, paginatedTemplates.length - 1)
        );
      }

      if (e.key === "ArrowUp") {
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }

      if (e.key === "Enter") {
        const selected = paginatedTemplates[selectedIndex];
        if (selected) handleOpenTemplate(selected);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, paginatedTemplates, selectedIndex]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="All Templates"
    >
      <div className="view-modal">

        <div className="view-search">
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
              setSelectedIndex(0);
            }}
          />
        </div>

        <div className="view-list">
          {paginatedTemplates.length === 0 ? (
            <div className="empty">No templates found</div>
          ) : (
            paginatedTemplates.map((template, index) => (
              <div
                key={template.id}
                className={`view-item ${
                  selectedIndex === index ? "selected" : ""
                }`}
                onClick={() => handleOpenTemplate(template)}
              >
                <span>
                  {highlightMatch(template.name, search)}
                </span>

                <div className="tooltip">
                  {getDeviceCount(template.id)} devices
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="modal-actions">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => p - 1);
                setSelectedIndex(0);
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
                setCurrentPage((p) => p + 1);
                setSelectedIndex(0);
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