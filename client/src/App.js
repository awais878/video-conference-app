import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VideoCall from "./VideoCall";
import Home from "./Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:roomId" element={<VideoCall />} />
      </Routes>
    </Router>
  );
}

export default App;