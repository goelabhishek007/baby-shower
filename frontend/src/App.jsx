import { Routes, Route, Navigate } from "react-router-dom";
import InvitePage from "./pages/InvitePage.jsx";
import HostDashboard from "./pages/HostDashboard.jsx";

// ✅ Change to a random string and KEEP IT PRIVATE (bookmark it)
const HOST_PATH = "/ae1804";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InvitePage />} />
      <Route path={HOST_PATH} element={<HostDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
