import { useMemo, useState } from "react";
import "./viewRecipeModal.css";
import { useEntities } from "../../../context/EntityContext/EntityContext";

export default function ViewRecipeModal({ isOpen, onClose }) {
  const { groups, devices } = useEntities();

  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  const ITEMS_PER_PAGE = 8;

  const templateList = useMemo(() => {
    return groups.allIds.map((id) => groups.byId[id]);
  }, [groups]);

  const totalPages = Math.ceil(templateList.length / ITEMS_PER_PAGE);

  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return templateList.slice(start, start + ITEMS_PER_PAGE);
  }, [templateList, currentPage]);

  const getDeviceCount = (templateId) => {
    return devices.byGroupId[templateId]?.length || 0;
  };

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

        <div className="vrm-body">
          {paginatedTemplates.map((template) => (
            <div
              key={template.id}
              className="vrm-item"
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

        {/* FOOTER */}
        {totalPages > 1 && (
          <div className="vrm-footer">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ← Prev
            </button>

            <span>
              Page {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}