import React from "react";
import PropTypes from "prop-types";
import dynamic from "next/dynamic";
const MonacoEditorWithNoSSR = dynamic(() => import("react-monaco-editor"), {
  ssr: false,
});
import moment from "moment";
import { Button } from "react-bootstrap";
import _ from "lodash";

import textToChordPro, { isChordProFormat } from "./../utils/textToChordPro";

class SongEditor extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
    saving: PropTypes.bool,
    serverModified: PropTypes.string,
    smallScreenMode: PropTypes.string,
    value: PropTypes.string,
  };

  constructor(props) {
    super();
    this.state = { value: props.value || "" };
    this.debouncedOnChange = _.debounce(props.onChange, 250);
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  onChange = value => {
    // update editor state immediately, then call our HOC onChange debounced
    this.setState({ value }, () => this.debouncedOnChange(value));
  };

  convertValueToChordPro = () => {
    const { onChange } = this.props;
    const value = textToChordPro(this.state.value);
    console.debug("convertValueToChordPro", { value });
    this.setState({ value }, () => onChange(value));
  };

  handleResize = () => {
    if (!this.editor) {
      return;
    }
    this.editor.layout();
  };

  render() {
    const { readOnly, saving, serverModified, smallScreenMode } = this.props;
    const { value } = this.state;

    let editor;
    if (smallScreenMode) {
      editor = (
        <textarea
          value={value}
          onChange={e => {
            this.onChange(e.target.value);
          }}
          style={{ display: "flex", height: "100%", width: "100%" }}
        />
      );
    } else {
      editor = (
        <MonacoEditorWithNoSSR
          width="100%"
          height="100%"
          language="markdown"
          theme="vs-light"
          value={value}
          options={{
            fontSize: 14,
            glyphMargin: false,
            lineNumbers: "off",
            minimap: { enabled: false },
            readOnly,
            renderLineHighlight: "none",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            selectionHighlight: false,
            wordBasedSuggestions: false,
            wordWrap: "on",
          }}
          onChange={this.onChange}
          editorDidMount={editor => (this.editor = editor)}
        />
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {isChordProFormat(value) ? null : (
          <Button
            onClick={this.convertValueToChordPro}
            style={{
              position: "fixed",
              right: "80px",
            }}
          >
            Convert to ChordPro
          </Button>
        )}
        <div
          style={{
            display: "flex",
            fontSize: 10,
            justifyContent: "space-between",
            minHeight: 20,
          }}
        >
          <div>
            {readOnly && (
              <div style={{ color: "red", marginBottom: 10 }}>READ ONLY</div>
            )}
          </div>

          {saving ? <Saving /> : <LastSaved timestamp={serverModified} />}
        </div>
        <div style={{ height: "100%", position: "relative" }}>{editor}</div>
      </div>
    );
  }
}

export default SongEditor;

const Saving = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: 5,
    }}
  >
    <div>Saving ...</div>
    <div
      style={{
        color: "gold",
        padding: "0px 3px",
        marginLeft: 5,
        borderRadius: "50%",
        border: "1px solid gold",
      }}
    >
      ✔
    </div>
  </div>
);

const LastSaved = ({ timestamp }) => (
  <div style={{ display: "flex", alignItems: "center", padding: 5 }}>
    <div>Last edited {moment(timestamp).fromNow()}</div>
    <div
      style={{
        color: "green",
        padding: "0px 3px",
        marginLeft: 5,
        borderRadius: "50%",
        border: "1px solid #ccc",
      }}
    >
      ✔
    </div>
  </div>
);
