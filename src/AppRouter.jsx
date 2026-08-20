import { Routes, Route } from "react-router-dom";
import App from "./App.jsx";

// Per-sport story pages (/:sport/story) have been removed — App.jsx now
// handles every route. StoryView.jsx is left in views/ unreferenced in
// case story pages come back later.
export default function AppRouter() {
  return (
    <Routes>
      <Route path="*" element={<App />} />
    </Routes>
  );
}
