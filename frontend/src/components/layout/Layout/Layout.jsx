import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";
import GroupModal from "../../Modals/GroupModal/GroupModal";
import RecipeModal from "../../Modals/RecipeModal/RecipeModal";
import AboutModal from "../../Modals/AboutModal/AboutModal";
import HelpModal from "../../Modals/HelpModal/HelpModal";
import DeviceModal from "../../Modals/DeviceModal/DeviceModal";
import { useWorkspace } from "../../../context/WorkspaceContext/WorkspaceContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { useUiLock } from "../../../context/UiLockContext/UiLockContext";
import WorkspaceToolbar from "../../workspace/WorkspaceToolbar/WorkspaceToolbar";
import ChangeLogBanner from "../../workspace/ChangeLogBanner/ChangeLogBanner";
import UiLockOverlay from "../../common/UiLockOverlay/UiLockOverlay";
import DeleteIcon from "../../../assets/icons/DeleteIcon";
import api from "../../../Utility/api";
import "./layout.css";

export default function Layout({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const [animateIntro, setAnimateIntro] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState([]);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [deviceModalMode, setDeviceModalMode] = useState("addEquipment"); // addEquipment | addTag
  const [deviceModalInitial, setDeviceModalInitial] = useState(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  const getViewModeKey = (type) => `app_square_view_mode_${type}`;
  const VALID_VIEW_MODES = ["device", "tag"];

  const [viewMode, setViewMode] = useState("device");

  const { workspace, openWorkspace } = useWorkspace();
  const { openRecipeInWorkspace } = useRecipes();
  const { deleteTag, addDeviceToTemplate, addTagsToDevice } = useEntities();
  const { lockUI, unlockUI } = useUiLock();
  const { isLocked } = useUiLock();
  const { role } = useAuth();
  const location = useLocation();

  const scrollRef = useRef(null);

  const isAdminView = location.pathname.startsWith("/admin");

  const prevIsAdminRef = useRef(false);

  useEffect(() => {
    const isAdmin = location.pathname.startsWith("/admin");
    if (isAdmin && !prevIsAdminRef.current) {
      setIsSidebarCollapsed(true);
    }
    prevIsAdminRef.current = isAdmin;
  }, [location.pathname, setIsSidebarCollapsed]);

  const closeModal = () => {
    setActiveModal(null);
  };

  useEffect(() => {
    const checkWidth = () => {
      setIsSmallScreen(window.innerWidth < 1100);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);

    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isSidebarCollapsed);
  }, [isSidebarCollapsed]);

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
    if (workspace?.type === "template") return;
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

  const isRecipe = workspace?.type === "recipe";
  const isTemplate = workspace?.type === "template";
  const isDeviceWorkspace = workspace?.type === "device";
  const showValues = isRecipe;

  const devices = isTemplate
    ? workspace?.data?.devices || []
    : editableData.length
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
          lockUI("Saving only changed values...");

          const changedPayload = [];

          editableData.forEach((device, dIndex) => {
            const originalDevice = workspace.data.devices[dIndex];

            device.tag_values.forEach((tag, tIndex) => {
              const originalTag = originalDevice?.tag_values?.[tIndex];

              if (!originalTag) return;

              if (String(originalTag.value ?? "") !== String(tag.value ?? "")) {
                changedPayload.push({
                  tag_id: tag.id,
                  device_id: device.id,
                  value: tag.value,
                });
              }
            });
          });

          if (changedPayload.length === 0) {
            unlockUI();
            setIsEditing(false);
            return;
          }

          await api.put(`/recipes/${workspace.data.id}/values`, {
            changes: changedPayload,
          });

          await openRecipeInWorkspace(workspace.data);

          alert("Changes saved successfully");
        } catch (err) {
          console.error(err);
          alert("Failed to save changes");
        } finally {
          unlockUI();
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
            hasTag: Boolean(tag),
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

  const handleDeleteTag = async (tag, deviceIndex) => {
    const tagId = tag.id;

    if (!tagId) {
      console.error("Tag ID missing", tag);
      return;
    }

    const confirmed = window.confirm(
      `Delete tag "${tag.tag_name}"?\n\nThis will affect all linked recipes.`,
    );

    if (!confirmed) return;

    const deviceId = devices[deviceIndex].id;

    try {
      lockUI(
        `Deleting "${tag.tag_name}" from ${devices[deviceIndex].device_name}...`,
      );

      await deleteTag(tagId, deviceId);

      const updated = await api.get(`/templates/${workspace.data.id}/full`);
      openWorkspace("template", updated.data);
    } catch (err) {
      console.error(err);
      alert("Failed to delete tag");
    } finally {
      unlockUI();
    }
  };

  const handleAddEquipment = () => {
    if (role !== "admin") return;
    setDeviceModalMode("addEquipment");
    setDeviceModalInitial(null);
    setIsDeviceModalOpen(true);
  };

  const handleAddTag = () => {
    if (role !== "admin") return;
    setDeviceModalMode("addTag");

    // Equipment workspace data structure: { id, name, devices: [ { id, device_name, tag_values: [] } ] }
    const device = workspace.data.devices[0];

    setDeviceModalInitial({
      device_name: device.device_name,
      tags: device.tag_values.map((t) => ({ name: t.tag_name, id: t.id })),
    });
    setIsDeviceModalOpen(true);
  };

  const handleDeviceModalSave = async (deviceData) => {
    try {
      lockUI(
        deviceModalMode === "addEquipment"
          ? "Adding equipment..."
          : "Adding tags...",
      );

      if (deviceModalMode === "addEquipment") {
        const updated = await addDeviceToTemplate(workspace.data.id, deviceData);
        openWorkspace("template", updated);
      } else {
        const deviceId = workspace.data.devices[0].id;
        const updatedDevice = await addTagsToDevice(deviceId, deviceData.tags);

        openWorkspace("device", {
          ...workspace.data,
          devices: [updatedDevice],
        });
      }

      setIsDeviceModalOpen(false);
    } catch (err) {
      // Error handled in context
    } finally {
      unlockUI();
    }
  };

  return (
    <>
      {isSmallScreen && showBanner && (
        <div className="screen-warning-banner">
          ⚠ For best experience, use a wider screen or reduce zoom
          <span
            style={{ marginLeft: "12px", cursor: "pointer" }}
            onClick={() => setShowBanner(false)}
          >
            ✕
          </span>
        </div>
      )}
      <div
        className={`layout-container ${isLocked ? "ui-locked" : ""} ${isSmallScreen ? "with-banner" : ""}`}
      >
        <Navbar />
        <Sidebar
          onOpenModal={setActiveModal}
          disabled={isAdminView}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        <div
          className={`layout-content ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}
        >
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

                {workspace.type === "device" && (
                  <>
                    Equipment: {workspace.data.name}
                    {workspace.data.recipeName && (
                      <span className="template-label">
                        ({workspace.data.recipeName})
                      </span>
                    )}
                  </>
                )}
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
                workspaceType={workspace.type}
                onAddEquipment={handleAddEquipment}
                onAddTag={handleAddTag}
              />

              <div
                key={viewMode}
                className="recipe-matrix-container view-transition"
              >
                <div className="matrix-scroll" ref={scrollRef}>
                  {isTemplate ? (
                    <table className="recipe-matrix-table template-device-mode">
                      <thead>
                        <tr>
                          {devices.map((device) => (
                            <th
                              key={device.id}
                              className="device-header"
                              colSpan={isTemplate ? 1 : 2}
                            >
                              {device.device_name}
                            </th>
                          ))}
                        </tr>

                        <tr>
                          {devices.map((device) =>
                            isTemplate ? (
                              <th key={device.id} className="sub-header">
                                Tag
                              </th>
                            ) : (
                              <Fragment key={device.id}>
                                <th className="sub-header">Tag</th>
                                <th className="sub-header">Value</th>
                              </Fragment>
                            ),
                          )}
                        </tr>
                      </thead>

                      <tbody>
                        <tr>
                          {devices.map((device, deviceIndex) => (
                            <td key={device.id} className="template-column">
                              {device.tag_values?.map((tag, tagIndex) => (
                                <div
                                  className="tag-cell tag-cell-with-action"
                                  key={`${device.id}-${tag.id}-${tagIndex}`}
                                >
                                  <span>{tag.tag_name}</span>

                                  {role === "admin" && (
                                    <button
                                      className="tag-delete-btn"
                                      onClick={() =>
                                        handleDeleteTag(tag, deviceIndex)
                                      }
                                    >
                                      <DeleteIcon />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </td>
                          ))}
                        </tr>
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
                            <Fragment key={device.id}>
                              <th className="sub-header">Tag</th>
                              <th className="sub-header">Value</th>
                            </Fragment>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {tableRows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, colIndex) => {
                              const tagIndex =
                                tagIndexMap[colIndex]?.[cell.tagName];

                              return (
                                <Fragment key={colIndex}>
                                  <td className="tag-cell">{cell.tagName}</td>

                                  <td className="value-cell">
                                    {isEditing && cell.hasTag ? (
                                      <input
                                        className="value-input"
                                        value={cell.value}
                                        onChange={(e) =>
                                          handleValueChange(
                                            colIndex,
                                            tagIndex,
                                            e.target.value,
                                          )
                                        }
                                      />
                                    ) : (
                                      cell.value
                                    )}
                                  </td>
                                </Fragment>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="recipe-matrix-table tag-mode">
                      <thead>
                        <tr>
                          <th className="device-header tag-header-main">Tag</th>

                          {devices.map((device) => (
                            <th key={device.id} className="device-header">
                              {device.device_name}
                            </th>
                          ))}
                        </tr>

                        <tr>
                          <th className="sub-header">Tag</th>

                          {devices.map((device) => (
                            <th key={device.id} className="sub-header">
                              Value
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {allTags.map((tag, rowIndex) => (
                          <tr key={rowIndex}>
                            <td className="tag-cell">{tag}</td>

                            {devices.map((device, deviceIndex) => {
                              const tagIndex = device.tag_values.findIndex(
                                (t) => t.tag_name === tag,
                              );

                              const tagVal =
                                tagIndex !== -1
                                  ? device.tag_values[tagIndex]
                                  : null;

                              return (
                                <td key={deviceIndex} className="value-cell">
                                  {tagVal ? (
                                    isEditing ? (
                                      <input
                                        className="value-input"
                                        value={tagVal.value}
                                        onChange={(e) =>
                                          handleValueChange(
                                            deviceIndex,
                                            tagIndex,
                                            e.target.value,
                                          )
                                        }
                                      />
                                    ) : (
                                      tagVal.value
                                    )
                                  ) : (
                                    "-"
                                  )}
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

        <DeviceModal
          isOpen={isDeviceModalOpen}
          onClose={() => setIsDeviceModalOpen(false)}
          onSave={handleDeviceModalSave}
          initialDevice={deviceModalInitial}
          readOnlyDeviceName={deviceModalMode === "addTag"}
        />
      </div>
      <Footer
        onOpenAbout={() => setShowAbout(true)}
        onOpenHelp={() => setShowHelp(true)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <UiLockOverlay />
    </>
  );
}
