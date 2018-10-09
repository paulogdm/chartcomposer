import React from "react";
import dynamic from "next/dynamic";
const MonacoEditorWithNoSSR = dynamic(() => import("react-monaco-editor"), {
  ssr: false,
});
import moment from "moment";
import { Button } from "react-bootstrap";

import LoadingIndicator from "./LoadingIndicator";
import textToChordPro, { isChordProFormat } from "../utils/textToChordPro";

class SongEditor extends React.Component {
  constructor(props) {
    super();
    this.state = { value: props.value };
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  onChangeMonaco = value => {
    const { onChange } = this.props;
    this.setState({ value }, () => onChange(value));
  };

  onChange = e => {
    const { onChange } = this.props;
    const value = e.target.value;
    this.setState({ value }, () => onChange(value));
  };

  convertValueToChordPro = () => {
    const { onChange } = this.props;
    const value = textToChordPro(this.state.value);
    this.setState({ value }, () => onChange(value));
  };

  handleResize = () => this.editor.layout();

  render() {
    const { readOnly, saving, serverModified } = this.props;
    const { value } = this.state;
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
        <div style={{ flex: 1, position: "relative" }}>
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
            onChange={this.onChangeMonaco}
            editorDidMount={editor => (this.editor = editor)}
          />
          {/*
          <textarea
            value={value}
            onChange={this.onChange}
            readOnly={readOnly}
            style={{
              border: "1px solid transparent",
              boxSizing: "border-box",
              fontSize: 14,
              height: "100%",
              padding: "3px",
              width: "100%",
            }}
          />*/}
        </div>
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
