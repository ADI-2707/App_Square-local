import { useState } from "react";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import GroupModal from "../../Modals/GroupModal/GroupModal";
import "./layout.css";

export default function Layout() {
  const [groups, setGroups] = useState([]);
  const [activeModal, setActiveModal] = useState(null);

  const handleCreateGroup = (groupData) => {
    setGroups((prev) => [...prev, groupData]);
    setActiveModal(null);
  };

  return (
    <div className="layout-container">
      <Navbar />

      <Sidebar
        groups={groups}
        onOpenModal={setActiveModal}
      />

      <div className="layout-content">
        <h2>Welcome to APP SQUARE</h2>
      </div>

      <GroupModal
        isOpen={activeModal === "createGroup"}
        onClose={() => setActiveModal(null)}
        onSave={handleCreateGroup}
      />
    </div>
  );
}