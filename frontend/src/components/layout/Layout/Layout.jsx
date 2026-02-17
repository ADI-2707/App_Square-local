import { useState, useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import GroupModal from "../../Modals/GroupModal/GroupModal";
import api from "../../../Utility/api";
import "./layout.css";

export default function Layout() {
  const [groups, setGroups] = useState([]);
  const [activeModal, setActiveModal] = useState(null);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/templates/groups");
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    fetchGroups();
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
        onClose={closeModal}
      />
    </div>
  );
}