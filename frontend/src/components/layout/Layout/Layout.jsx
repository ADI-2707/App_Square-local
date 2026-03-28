import { useState, useMemo, useEffect, Fragment } from "react";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import GroupModal from "../../Modals/GroupModal/GroupModal";
import RecipeModal from "../../Modals/RecipeModal/RecipeModal";
import { useWorkspace } from "../../../context/WorkspaceContext/WorkspaceContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import WorkspaceToolbar from "../../workspace/WorkspaceToolbar/WorkspaceToolbar";
import api from "../../../Utility/api";
import "./layout.css";

export default function Layout({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const [animateIntro, setAnimateIntro] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState([]);

  const { workspace } = useWorkspace();
  const { openRecipeInWorkspace } = useRecipes();

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

  const devices = editableData.length
    ? editableData
    : workspace?.data?.devices || [];

  const showValues = workspace?.type === "recipe";

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
      const updated = [...prev];
      updated[deviceIndex].tag_values[tagIndex].value = newValue;
      return updated;
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

  return (
    <div className="layout-container">
      <Navbar />
      <Sidebar onOpenModal={setActiveModal} />

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
            className="recipe-workspace"
          >
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
            />

            <div className="recipe-matrix-container">
              <table
                className={`recipe-matrix-table ${
                  showValues ? "recipe-mode" : "template-mode"
                }`}
              >
                <thead>
                  <tr>
                    {devices.map((device) => (
                      <th
                        key={`device-header-${device.id}`}
                        colSpan={showValues ? 2 : 1}
                        className="device-header"
                      >
                        {device.device_name}
                      </th>
                    ))}
                  </tr>

                  <tr>
                    {devices.map((device) => (
                      <Fragment key={`subheader-${device.id}`}>
                        <th className="sub-header">Tag</th>
                        {showValues && <th className="sub-header">Value</th>}
                      </Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {tableRows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`}>
                      {row.map((cell, colIndex) => {
                        const originalValue =
                          workspace?.data?.devices?.[colIndex]?.tag_values?.[
                            rowIndex
                          ]?.value;

                        const currentValue =
                          devices[colIndex]?.tag_values?.[rowIndex]?.value;

                        const isChanged =
                          String(originalValue ?? "") !==
                          String(currentValue ?? "");

                        return (
                          <Fragment key={`cell-${rowIndex}-${colIndex}`}>
                            <td
                              className="tag-cell"
                              style={{ textAlign: "center" }}
                            >
                              {cell.tagName}
                            </td>

                            {showValues && (
                              <td
                                className={`value-cell ${
                                  isChanged ? "changed-cell" : ""
                                }`}
                              >
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="any"
                                    className="value-input"
                                    value={currentValue ?? ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "" || isNaN(val)) return;
                                      handleValueChange(
                                        colIndex,
                                        rowIndex,
                                        val,
                                      );
                                    }}
                                  />
                                ) : (
                                  currentValue
                                )}
                              </td>
                            )}
                          </Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <GroupModal isOpen={activeModal === "createGroup"} onClose={closeModal} />

      <RecipeModal isOpen={activeModal === "createArea"} onClose={closeModal} />
    </div>
  );
}
