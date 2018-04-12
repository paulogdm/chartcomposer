import React from "react";
import _ from "lodash";

import Background from "./Background";
import {
  displayPreferenceDefaults,
  displayPreferenceMap,
} from "../utils/chordProParse";

export const defaultPreferences = {
  display: {
    ...displayPreferenceDefaults,
  },
  songs: {},
  folders: {
    "id:zY8_f7IMoCgAAAAAAAE7DA": {
      ".tag": "folder",
      url:
        "https://www.dropbox.com/sh/hyt61zo702g3c5c/AACT5_YdGoZiEyYt4yI6Oolaa?dl=0",
      id: "id:zY8_f7IMoCgAAAAAAAE7DA",
      name: "Demo Songs",
      link_permissions: {
        resolved_visibility: { ".tag": "public" },
        can_revoke: false,
        revoke_failure_reason: { ".tag": "owner_only" },
      },
    },
  },
};

export default class Preferences extends React.Component {
  constructor(props) {
    super();
    this.state = {
      isOpen: false,
      preferences: { ...props.preferences },
    };
  }

  componentDidMount() {
    document.addEventListener("click", this.onDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.onDocumentClick);
    this.clickListener = null;
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.preferences &&
      !_.isEqual(this.state.preferences, nextProps.preferences)
    ) {
      console.log("preferences componentWillReceiveProps", { preferences });
      this.setState({ preferences: { ...nextProps.preferences } });
    }
  }

  onDocumentClick = e => {
    if (!this.contents.contains(e.target)) {
      this.props.togglePreferencesOpen();
    }
  };

  onChangeDisplayPreference = e => {
    let preferences = {
      ...this.state.preferences,
      display: {
        ...this.state.preferences.display,
        [e.target.name]: e.target.value,
      },
    };
    console.log("onChangeDisplayPreference", e.target.value, e.target.name, {
      preferences,
    });
    this.setState({ preferences });
  };

  onClickResetDefault = e => {
    let preferences = {
      ...this.state.preferences,
      display: {
        ...displayPreferenceDefaults,
      },
    };
    console.log("onClickResetDefault", { preferences });
    this.setState({ preferences });
  };

  onClickSave = e => {
    let preferences = {
      ...this.state.preferences,
      display: {
        ...this.state.preferences.display,
        [e.target.name]: e.target.value,
      },
    };
    console.log("onClickSave", { preferences });
    this.props.updatePreferences(preferences);
  };

  render() {
    const { smallScreenMode, togglePreferencesOpen } = this.props;
    const isSmallScreen = smallScreenMode !== null;
    const { preferences } = this.state;
    const sections = Object.keys(displayPreferenceMap);
    sections.sort();

    return (
      <div>
        <style jsx>{`
          .pref {
            margin-bottom: 16px;
          }
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
            bottom: isSmallScreen ? 0 : null,
            boxSizing: "border-box",
            padding: "10px 30px 30px",
            position: "fixed",
            left: isSmallScreen ? 0 : "50%",
            right: isSmallScreen ? 0 : null,
            top: isSmallScreen ? 0 : "50%",
            transform: isSmallScreen ? null : "translate3d(-50%, -50%, 0)",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div>
              <h2>Display Preferences</h2>
              <div
                className="close"
                onClick={togglePreferencesOpen}
                style={{ fontSize: isSmallScreen ? 30 : null }}
              >
                ×
              </div>
            </div>
            <div
              style={{
                display: isSmallScreen ? null : "flex",
                overflow: "auto",
              }}
            >
              {sections.map(section => {
                return (
                  <section key={section} style={{ margin: "0 10px" }}>
                    <h3>{section}</h3>
                    <div>
                      {Object.keys(displayPreferenceMap[section])
                        .sort()
                        .map(key => {
                          const prefInfo = displayPreferenceMap[section][key];
                          const selected =
                            preferences.display[key] ||
                            displayPreferenceDefaults[key];
                          return (
                            <div key={key} className="pref">
                              <div className="label-c">
                                <label>{prefInfo.label}</label>
                              </div>
                              <select
                                onChange={this.onChangeDisplayPreference}
                                name={key}
                                value={selected}
                              >
                                {prefInfo.options.map(option => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                    </div>
                  </section>
                );
              })}
            </div>
            <div
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
                marginTop: 20,
                textAlign: "center",
              }}
            >
              <span
                onClick={this.onClickResetDefault}
                style={{
                  cursor: "pointer",
                  fontSize: 11,
                  textDecoration: "underline",
                }}
              >
                Reset to defaults
              </span>
              <div style={{ width: 20 }} />
              <button
                onClick={this.onClickSave}
                style={{ fontSize: isSmallScreen ? 20 : null }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
