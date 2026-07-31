import { Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import StoryView from "./views/StoryView.jsx";

// App.jsx is untouched and keeps rendering exactly as it does today
// (tab-click state, no URL changes) for every route except the new
// per-sport story pages below.
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/:sport/story" element={<StoryView />} />
      <Route path="*" element={<App />} />
    </Routes>
  );
}
