import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import "./layout.css";

export default function Layout({ children }) {
  return (
    <div className="layout-container">
      <Navbar />
      <Sidebar />
      <div className="layout-content">{children}</div>
    </div>
  );
}