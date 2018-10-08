import React from "react";

import Background from "./Background";

const notes = ["♪", "♫", "♬", "♩", "♪", "♫", "♬"];

const LoadingIndicator = ({
  bounceHeight = 10,
  fontSize = "2em",
  hasBackground,
  style,
}) => {
  hasBackground = hasBackground !== false;
  style = style || {};
  return (
    <div>
      <style jsx>{`
        ul li {
          display: inline-block;
          font-size: ${fontSize};
          margin: 0 4px;
          color: #000;
          text-shadow: 0 -1px 0 white, 0 1px 0 black;
        }
        .note-0 {
          animation: music 1s 100ms ease-in-out both infinite;
        }
        .note-1 {
          animation: music 1s 200ms ease-in-out both infinite;
        }
        .note-2 {
          animation: music 1s 300ms ease-in-out both infinite;
        }
        .note-3 {
          animation: music 1s 400ms ease-in-out both infinite;
        }
        .note-4 {
          animation: music 1s 500ms ease-in-out both infinite;
        }
        .note-5 {
          animation: music 1s 600ms ease-in-out both infinite;
        }
        .note-6 {
          animation: music 1s 700ms ease-in-out both infinite;
        }

        @keyframes music {
          0%,
          100% {
            transform: translate3d(0, -${bounceHeight}px, 0);
          }
          50% {
            transform: translate3d(0, ${bounceHeight}px, 0);
          }
        }
      `}</style>
      {hasBackground && <Background />}
      <div
        style={{
          background: "transparent",
          borderRadius: 7,
          padding: "10px 30px 20px 30px",
          color: "#000",
          whiteSpace: "nowrap",
          ...style,
        }}
      >
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {notes.map((note, i) => (
            <li className={`note-${i}`} key={i}>
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
export default LoadingIndicator;
