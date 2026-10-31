import { Routes, Route } from "react-router-dom";
import App from "./App.jsx";

// App.jsx maps the URL to a tab itself (/football, /f1, ..., /about).
export default function AppRouter() {
  return (
    <Routes>
      <Route path="*" element={<App />} />
    </Routes>
  );
}
