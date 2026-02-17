import { useState } from "react";
import "./sidebar.css";

export default function Sidebar({ groups, onOpenModal }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [showTree, setShowTree] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedDevices, setExpandedDevices] = useState({});

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const toggleGroup = (index) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleDevice = (groupIndex, deviceIndex) => {
    const key = `${groupIndex}-${deviceIndex}`;
    setExpandedDevices((prev) => ({
      ...prev,
      [key]: !prev[key],
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
          onClick={() => toggleMenu("templates")}
        >
          Templates
        </div>

        {openMenu === "templates" && (
          <div className="sidebar-submenu">

            <button onClick={() => onOpenModal("createGroup")}>
              Create Template
            </button>

            <button onClick={() => setShowTree(!showTree)}>
              View Templates
            </button>

            {showTree && (
              <div className="tree-container">
                {groups.length === 0 && (
                  <div className="tree-empty">No Templates Yet</div>
                )}

                {groups.map((group, gIndex) => (
                  <div key={gIndex} className="tree-group">

                    <div
                      className="tree-item group-item"
                      onClick={() => toggleGroup(gIndex)}
                    >
                      ▸ {group.group_name}
                    </div>

                    {expandedGroups[gIndex] &&
                      group.devices.map((device, dIndex) => {
                        const deviceKey = `${gIndex}-${dIndex}`;

                        return (
                          <div key={dIndex} className="tree-device">

                            <div
                              className="tree-item device-item"
                              onClick={() => toggleDevice(gIndex, dIndex)}
                            >
                              ▸ {device.device_name}
                            </div>

                            {expandedDevices[deviceKey] &&
                              device.tags.map((tag, tIndex) => (
                                <div
                                  key={tIndex}
                                  className="tree-item tag-item"
                                >
                                  {tag.name}
                                </div>
                              ))}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}