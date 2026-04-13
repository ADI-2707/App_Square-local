import { useEffect, useMemo, useState } from "react";
import "./viewRecipeModal.css";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useWorkspace } from "../../../context/WorkspaceContext/WorkspaceContext";

export default function ViewRecipeModal({ isOpen, onClose }) {
  const { groups, devices, getFullTemplate } = useEntities();
  const { openWorkspace } = useWorkspace();

  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
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
    return devices.byGroupId[templateId]?.length || 0;
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

  if (!isOpen) return null;

  return (
    <div className="vrm-overlay">
      <div className="vrm-modal">

        <div className="vrm-header">
          <h2>All Templates</h2>
          <button className="vrm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="vrm-search">
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
        
        <div className="vrm-body">
          {paginatedTemplates.map((template, index) => (
            <div
              key={template.id}
              className={`vrm-item ${
                selectedIndex === index ? "selected" : ""
              }`}
              onClick={() => handleOpenTemplate(template)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              {template.name}

              {hoveredTemplate === template.id && (
                <div className="vrm-tooltip">
                  <div className="vrm-tooltip-title">Devices</div>
                  <div className="vrm-tooltip-item">
                    {getDeviceCount(template.id)} devices
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="vrm-footer">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => p - 1);
                setSelectedIndex(0);
              }}
            >
              ← Prev
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
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}