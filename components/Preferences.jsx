import React from "react";

import Background from "./Background";

export const defaultPreferences = {
  color: "Red",
  songs: {},
  folders: {},
};

export default class Preferences extends React.Component {
  constructor(props) {
    super();
    this.state = {
      isOpen: false,
    };
  }

  componentDidMount() {
    document.addEventListener("click", this.onDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.onDocumentClick);
    this.clickListener = null;
  }

  onDocumentClick = e => {
    if (!this.contents.contains(e.target)) {
      this.props.togglePreferencesOpen();
    }
  };

  onChangeColor = e => {
    console.log("onChangeColor", e.target.value);
    let preferences = {
      ...this.props.preferences,
      color: e.target.value,
    };
    this.props.updatePreferences(preferences);
  };

  render() {
    const { preferences, togglePreferencesOpen } = this.props;
    return (
      <div>
        <style jsx>{`
          .label-c {
            margin-bottom: 5px;
          }
          .label-c label {
            background-color: #eee;
            padding: 3px;
          }
          .close {
            cursor: pointer;
            color: #666;
            position: absolute;
            top: 5px;
            right: 5px;
            padding: 5px;
          }
        `}</style>
        <Background />
        <div
          ref={el => (this.contents = el)}
          style={{
            background: "#fff",
            border: "2px solid #ccc",
            padding: "0 20px 20px",
            position: "fixed",
            width: 400,
            height: 300,
            left: "50%",
            top: "50%",
            transform: "translate3d(-50%, -50%, 0)",
            zIndex: 2,
          }}
        >
          <h2>Preferences</h2>
          <div className="close" onClick={togglePreferencesOpen}>
            ×
          </div>
          <div className="label-c">
            <label>Chord color</label>
          </div>
          <select onChange={this.onChangeColor} value={preferences.color}>
            <option>Blue</option>
            <option>Red</option>
          </select>
        </div>
      </div>
    );
  }
}
