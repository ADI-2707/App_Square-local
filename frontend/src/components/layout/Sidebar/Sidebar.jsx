import { NavLink } from "react-router-dom";
import "./sidebar.css";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <NavLink to="/home">Home</NavLink>
    </div>
  );
}