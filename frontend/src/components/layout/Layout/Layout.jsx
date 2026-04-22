import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";
import GroupModal from "../../Modals/GroupModal/GroupModal";
import RecipeModal from "../../Modals/RecipeModal/RecipeModal";
import AboutModal from "../../Modals/AboutModal/AboutModal";
import HelpModal from "../../Modals/HelpModal/HelpModal";
import { useWorkspace } from "../../../context/WorkspaceContext/WorkspaceContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import WorkspaceToolbar from "../../workspace/WorkspaceToolbar/WorkspaceToolbar";
import ChangeLogBanner from "../../workspace/ChangeLogBanner/ChangeLogBanner";
import api from "../../../Utility/api";
import "./layout.css";

export default function Layout({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const [animateIntro, setAnimateIntro] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState([]);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const getViewModeKey = (type) => `app_square_view_mode_${type}`;
  const VALID_VIEW_MODES = ["device", "tag"];

  const [viewMode, setViewMode] = useState("device");

  const { workspace, openWorkspace } = useWorkspace();
  const { openRecipeInWorkspace } = useRecipes();
  const { deleteTag } = useEntities();
  const { role } = useAuth();
  const location = useLocation();

  const scrollRef = useRef(null);

  const isAdminView = location.pathname.startsWith("/admin");

  const closeModal = () => {
    setActiveModal(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateIntro(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!workspace?.type) return;

    if (workspace.type !== "recipe") {
      setViewMode("device");
      return;
    }

    const saved = localStorage.getItem(getViewModeKey("recipe"));

    if (VALID_VIEW_MODES.includes(saved)) {
      setViewMode(saved);
    } else {
      setViewMode("device");
    }
  }, [workspace?.type]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth) return;

      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", handleWheel);

    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const originalDevices = workspace?.data?.devices || [];

    if (!originalDevices.length) {
      setEditableData([]);
      return;
    }

    const cloned = originalDevices.map((device) => ({
      ...device,
      tag_values: device.tag_values?.map((tag) => ({
        ...tag,
      })),
    }));

    setEditableData(cloned);
    setIsEditing(false);
  }, [workspace]);

  useEffect(() => {
    if (workspace?.type === "recipe") {
      localStorage.setItem(getViewModeKey("recipe"), viewMode);
    }
  }, [viewMode, workspace?.type]);

  const devices = editableData.length
    ? editableData
    : workspace?.data?.devices || [];

  const tagIndexMap = useMemo(() => {
    const map = {};

    devices.forEach((device, deviceIndex) => {
      map[deviceIndex] = {};

      device.tag_values?.forEach((tag, tagIndex) => {
        map[deviceIndex][tag.tag_name] = tagIndex;
      });
    });

    return map;
  }, [devices]);

  const isRecipe = workspace?.type === "recipe";
  const isTemplate = workspace?.type === "template";
  const showValues = isRecipe;

  const hasChanges = () => {
    if (!workspace?.data?.devices || !editableData.length) return false;

    const originalDevices = workspace.data.devices;

    for (let d = 0; d < originalDevices.length; d++) {
      const originalTags = originalDevices[d].tag_values || [];
      const editedTags = editableData[d]?.tag_values || [];

      for (let t = 0; t < originalTags.length; t++) {
        if (
          String(originalTags[t]?.value ?? "") !==
          String(editedTags[t]?.value ?? "")
        ) {
          return true;
        }
      }
    }

    return false;
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      const changed = hasChanges();

      if (changed) {
        const confirmed = window.confirm(
          "Are you sure you want to apply these changes?",
        );

        if (!confirmed) return;

        try {
          await api.put(`/recipes/${workspace.data.id}/values`, {
            devices: editableData,
          });

          alert("Changes saved successfully");

          await openRecipeInWorkspace(workspace.data);
        } catch (err) {
          console.error(err);
          alert("Failed to save changes");
          return;
        }
      }

      setIsEditing(false);
      return;
    }

    setIsEditing(true);
  };

  const handleValueChange = (deviceIndex, tagIndex, newValue) => {
    setEditableData((prev) => {
      return prev.map((device, dIndex) => {
        if (dIndex !== deviceIndex) return device;

        return {
          ...device,
          tag_values: device.tag_values.map((tag, tIndex) =>
            tIndex === tagIndex ? { ...tag, value: newValue } : tag,
          ),
        };
      });
    });
  };

  const tableRows = useMemo(() => {
    if (!devices.length) return [];

    const maxTags = Math.max(
      ...devices.map((device) => device.tag_values?.length || 0),
    );

    const rows = [];

    for (let i = 0; i < maxTags; i++) {
      rows.push(
        devices.map((device) => {
          const tag = device.tag_values?.[i];

          return {
            tagName: tag?.tag_name ?? "-",
            value: tag?.value ?? "-",
          };
        }),
      );
    }

    return rows;
  }, [devices]);

  const allTags = isRecipe
    ? Array.from(
        new Set(
          devices.flatMap((device) =>
            (device.tag_values || []).map((t) => t.tag_name),
          ),
        ),
      )
    : [];

  const handleCancelEdit = () => {
    const originalDevices = workspace?.data?.devices || [];

    const cloned = originalDevices.map((device) => ({
      ...device,
      tag_values: device.tag_values?.map((tag) => ({
        ...tag,
      })),
    }));

    setEditableData(cloned);
    setIsEditing(false);
  };

  const handleDeleteTag = async (tagName, deviceIndex) => {
    const device = workspace.data.devices[deviceIndex];

    const tag = device.tag_values.find((t) => t.tag_name === tagName);
    if (!tag) return;

    const confirmed = window.confirm(
      `Delete tag "${tagName}"?\n\nThis will affect all linked recipes.`,
    );

    if (!confirmed) return;
    await deleteTag(tag.id);

    const updated = await api.get(`/templates/${workspace.data.id}/full`);
    openWorkspace("template", updated.data);
  };

  const tagMatrix = useMemo(() => {
    if (!devices.length) return [];

    const tagMap = {};

    devices.forEach((device) => {
      device.tag_values?.forEach((tag) => {
        if (!tagMap[tag.tag_name]) {
          tagMap[tag.tag_name] = {};
        }

        tagMap[tag.tag_name][device.device_name] = tag.value;
      });
    });

    return Object.entries(tagMap).map(([tagName, deviceValues]) => ({
      tagName,
      values: deviceValues,
    }));
  }, [devices]);

  return (
    <>
      <div className="layout-container">
        <Navbar />
        <Sidebar onOpenModal={setActiveModal} disabled={isAdminView} />

        <div className="layout-content">
          {children ? (
            children
          ) : !workspace ? (
            <div
              className={`workspace-placeholder ${
                animateIntro ? "intro-active" : ""
              }`}
            >
              <h2>Welcome to APP SQUARE</h2>
              <p>Engineered software for real-time production management.</p>
            </div>
          ) : (
            <div
              key={`${workspace.type}-${workspace.data.id}`}
              className={`recipe-workspace ${animateIntro ? "view-enter" : ""}`}
            >
              {workspace?.data?.changes?.length > 0 && (
                <ChangeLogBanner changes={workspace.data.changes} />
              )}
              <h2 className="workspace-title">
                {workspace.type === "recipe" &&
                  `Active Recipe: ${workspace.data.name}`}

                {workspace.type === "template" &&
                  `Template: ${workspace.data.name}`}

                {workspace.type === "device" &&
                  `Equipment: ${workspace.data.name}`}
              </h2>

              <WorkspaceToolbar
                onUpload={() => console.log("Upload clicked")}
                onDownload={() => console.log("Download clicked")}
                isEditing={isEditing}
                onEditToggle={handleEditToggle}
                onCancel={handleCancelEdit}
                showEdit={workspace?.type === "recipe"}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />

              <div
                key={viewMode}
                className="recipe-matrix-container view-transition"
              >
                <div className="matrix-scroll" ref={scrollRef}>
                  {isTemplate ? (
                    <table className="recipe-matrix-table template-mode">
                      <thead>
                        <tr>
                          {devices.map((device) => (
                            <th key={device.id} className="device-header">
                              {device.device_name}
                            </th>
                          ))}
                        </tr>

                        <tr>
                          {devices.map((device) => (
                            <th key={device.id} className="sub-header">
                              Tag
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {tableRows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, colIndex) => (
                              <td
                                key={colIndex}
                                className="tag-cell tag-cell-with-action"
                              >
                                <span>{cell.tagName}</span>

                                {role === "admin" && cell.tagName !== "-" && (
                                  <button
                                    className="tag-delete-btn"
                                    onClick={() =>
                                      handleDeleteTag(cell.tagName, colIndex)
                                    }
                                  >
                                    ✕
                                  </button>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : viewMode === "device" ? (
                    <table className="recipe-matrix-table recipe-mode">
                      <thead>
                        <tr>
                          {devices.map((device) => (
                            <th
                              key={device.id}
                              className="device-header"
                              colSpan={2}
                            >
                              {device.device_name}
                            </th>
                          ))}
                        </tr>

                        <tr>
                          {devices.map((device) => (
                            <React.Fragment key={device.id}>
                              <th className="sub-header">Tag</th>
                              <th className="sub-header">Value</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {tableRows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, colIndex) => (
                              <React.Fragment key={colIndex}>
                                <td className="tag-cell">{cell.tagName}</td>

                                <td className="value-cell">
                                  {isEditing ? (
                                    <input
                                      className="value-input"
                                      value={cell.value}
                                      onChange={(e) =>
                                        handleValueChange(
                                          colIndex,
                                          tagIndexMap[colIndex]?.[cell.tagName],
                                          e.target.value,
                                        )
                                      }
                                    />
                                  ) : (
                                    cell.value
                                  )}
                                </td>
                              </React.Fragment>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    
                    <table className="recipe-matrix-table recipe-mode">
                      <thead>
                        <tr>
                          <th>Tag</th>
                          {devices.map((device) => (
                            <th key={device.id}>{device.device_name}</th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {allTags.map((tag, rowIndex) => (
                          <tr key={rowIndex}>
                            <td>{tag}</td>
                            {devices.map((device, colIndex) => {
                              const tagVal = device.tag_values.find(
                                (t) => t.tag_name === tag,
                              );
                              return (
                                <td key={colIndex}>
                                  {tagVal ? tagVal.value : "-"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <GroupModal
          isOpen={activeModal === "createGroup"}
          onClose={closeModal}
        />

        <RecipeModal
          isOpen={activeModal === "createArea"}
          onClose={closeModal}
        />
      </div>
      <Footer
        onOpenAbout={() => setShowAbout(true)}
        onOpenHelp={() => setShowHelp(true)}
      />

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}
