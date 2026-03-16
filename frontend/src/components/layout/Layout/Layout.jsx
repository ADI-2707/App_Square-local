import { useState, useMemo, useEffect, Fragment } from "react";

import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";

import GroupModal from "../../Modals/GroupModal/GroupModal";
import RecipeModal from "../../Modals/RecipeModal/RecipeModal";

import { useWorkspace } from "../../../context/WorkspaceContext/WorkspaceContext";

import "./layout.css";

export default function Layout() {
  const [activeModal, setActiveModal] = useState(null);
  const [animateIntro, setAnimateIntro] = useState(false);

  const { workspace } = useWorkspace();

  const closeModal = () => {
    setActiveModal(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateIntro(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const devices = workspace?.data?.devices || [];

  const showValues = workspace?.type === "recipe";

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

  return (
    <div className="layout-container">
      <Navbar />
      <Sidebar onOpenModal={setActiveModal} />

      <div className="layout-content">
        {!workspace ? (
          <div
            className={`workspace-placeholder ${
              animateIntro ? "intro-active" : ""
            }`}
          >
            <h2>Welcome to APP SQUARE</h2>
            <p>Engineered software for real-time production management.</p>
          </div>
        ) : (
          <div className="recipe-workspace">
            <h2 className="workspace-title">
              {workspace.type === "recipe" &&
                `Active Recipe: ${workspace.data.name}`}

              {workspace.type === "template" &&
                `Template: ${workspace.data.name}`}

              {workspace.type === "device" && `Device: ${workspace.data.name}`}
            </h2>

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
                      {row.map((cell, colIndex) => (
                        <Fragment key={`cell-${rowIndex}-${colIndex}`}>
                          <td
                            className="tag-cell"
                            style={{ textAlign: "center" }}
                          >
                            {cell.tagName}
                          </td>

                          {showValues && (
                            <td className="value-cell">{cell.value}</td>
                          )}
                        </Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <GroupModal isOpen={activeModal === "createGroup"} onClose={closeModal} />

      <RecipeModal
        isOpen={activeModal === "createRecipe"}
        onClose={closeModal}
      />
    </div>
  );
}
