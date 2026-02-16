import { useState } from "react";
import BaseModal from "../../../components/Modals/BaseModal/BaseModal";
import "./groupList.css";

export default function GroupList() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="group-page">
      <div className="group-header">
        <h2>Template Groups</h2>
        <button
          className="create-btn"
          onClick={() => setIsModalOpen(true)}
        >
          + Create Group
        </button>
      </div>

      <div className="group-table">
        No Groups Yet
      </div>

      <BaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Template Group"
      >
        <p>Group form will go here.</p>
      </BaseModal>
    </div>
  );
}