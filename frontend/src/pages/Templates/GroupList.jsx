import { useState } from "react";
import GroupModal from "../../../components/Modals/GroupModal/GroupModal";
import "./groupList.css";

export default function GroupList() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="group-page">
      <div className="group-header">
        <h2>Template Groups</h2>
        <button className="create-btn" onClick={() => setIsModalOpen(true)}>
          + Create Group
        </button>
      </div>

      <div className="group-table">No Groups Yet</div>

      <GroupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <p>Group form will go here.</p>
    </div>
  );
}
