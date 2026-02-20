import { useState, useMemo, Fragment } from "react";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";

import GroupModal from "../../Modals/GroupModal/GroupModal";
import RecipeModal from "../../Modals/RecipeModal/RecipeModal";

import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import "./layout.css";

export default function Layout() {
  const [activeModal, setActiveModal] = useState(null);
  const { activeRecipe } = useRecipes();

  const closeModal = () => {
    setActiveModal(null);
  };

  const devices = activeRecipe?.devices || [];

  const tableRows = useMemo(() => {
    if (!devices.length) return [];

    const maxTags = Math.max(
      ...devices.map((device) => device.tag_values?.length || 0)
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
        })
      );
    }

    return rows;
  }, [devices]);

  return (
    <div className="layout-container">
      <Navbar />
      <Sidebar onOpenModal={setActiveModal} />

      <div className="layout-content">
        {!activeRecipe ? (
          <div className="workspace-placeholder">
            <h2>Welcome to APP SQUARE</h2>
            <p>Select a recipe from the sidebar to open in workspace.</p>
          </div>
        ) : (
          <div className="recipe-workspace">
            <h2 className="workspace-title">
              Active Recipe: {activeRecipe.name}
            </h2>

            <div className="recipe-matrix-container">
              <table className="recipe-matrix-table">
                <thead>
                  <tr>
                    {devices.map((device) => (
                      <th
                        key={`device-header-${device.id}`}
                        colSpan={2}
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
                        <th className="sub-header">Value</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {tableRows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`}>
                      {row.map((cell, colIndex) => (
                        <Fragment key={`cell-${rowIndex}-${colIndex}`}>
                          <td className="tag-cell">{cell.tagName}</td>
                          <td className="value-cell">{cell.value}</td>
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

      <GroupModal
        isOpen={activeModal === "createGroup"}
        onClose={closeModal}
      />

      <RecipeModal
        isOpen={activeModal === "createRecipe"}
        onClose={closeModal}
      />
    </div>
  );
}