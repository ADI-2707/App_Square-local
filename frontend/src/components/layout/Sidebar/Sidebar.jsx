import { useState, useEffect } from "react";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import "./sidebar.css";

export default function Sidebar({ onOpenModal }) {
  const { groups, devices, tags, loadGroups, loadDevices, loadTags } =
    useEntities();

  const [openSections, setOpenSections] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedDevices, setExpandedDevices] = useState({});

  useEffect(() => {
    loadGroups();
  }, []);

  const toggleSection = (sectionName) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const toggleGroup = async (groupId) => {
    if (!expandedGroups[groupId]) {
      await loadDevices(groupId);
    }

    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleDevice = async (deviceId) => {
    if (!expandedDevices[deviceId]) {
      await loadTags(deviceId);
    }

    setExpandedDevices((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src="/app.svg" alt="App Logo" className="sidebar-logo" />
        <div className="sidebar-appname">APP SQUARE</div>
      </div>

      <div className="sidebar-section">
        <div
          className="sidebar-title"
          onClick={() => toggleSection("templates")}
        >
          {openSections.templates ? "▾" : "▸"} Templates
        </div>

        {openSections.templates && (
          <div className="sidebar-submenu">
            <button onClick={() => onOpenModal("createGroup")}>
              Create Template
            </button>

            {groups.allIds.length === 0 && (
              <div className="tree-empty">No Templates Yet</div>
            )}

            {groups.allIds.map((groupId) => {
              const group = groups.byId[groupId];
              const deviceIds = devices.byGroupId[groupId] || [];

              return (
                <div key={groupId}>
                  <div
                    className="tree-item group-item"
                    onClick={() => toggleGroup(groupId)}
                  >
                    {expandedGroups[groupId] ? "▾" : "▸"} {group.name}
                  </div>

                  {expandedGroups[groupId] &&
                    deviceIds.map((deviceId) => {
                      const device = devices.byId[deviceId];
                      const tagIds = tags.byDeviceId[deviceId] || [];

                      return (
                        <div key={deviceId} className="tree-device">
                          <div
                            className="tree-item device-item"
                            onClick={() => toggleDevice(deviceId)}
                          >
                            {expandedDevices[deviceId] ? "▾" : "▸"}{" "}
                            {device.name}
                          </div>

                          {expandedDevices[deviceId] &&
                            tagIds.map((tagId) => {
                              const tag = tags.byId[tagId];

                              return (
                                <div key={tagId} className="tree-item tag-item">
                                  {tag.name}
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title" onClick={() => toggleSection("recipes")}>
          {openSections.recipes ? "▾" : "▸"} Recipes
        </div>

        {openSections.recipes && (
          <div className="sidebar-submenu">

            <button onClick={() => onOpenModal("createRecipe")}>
              Create Recipe
            </button>

            <button>View Recipes</button>

          </div>
        )}
      </div>
    </div>
  );
}