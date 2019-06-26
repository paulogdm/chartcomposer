import React from "react";

const Background = () => (
  <div
    style={{
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      pointerEvents: "none",
      zIndex: 1,
      background: "rgba(0, 0, 0, 0.3)",
    }}
  />
);

export default Background;
