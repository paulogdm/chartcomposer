import moment from "moment";
import LoadingIndicator from "./LoadingIndicator";

class SongEditor extends React.Component {
  constructor(props) {
    super();
    this.state = { value: props.value, editorClosed: false, };
  }

  onChange = e => {
    const { onChange } = this.props;
    const value = e.target.value;
    this.setState({ value }, () => onChange(value));
  };

  toggleEditorClosed = () => {
    console.log("toggleEditorClosed");
    this.setState({
	  editorClosed: !this.state.editorClosed,
    });
  };

  render() {
    const { readOnly, saving, serverModified } = this.props;
    const { value, editorClosed } = this.state;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <style jsx>{`
          textarea:focus {
            border-color: lightblue !important;
            outline: none;
          }
        `}</style>
        <div
          style={{
            display: "flex",
            fontSize: 10,
            justifyContent: "space-between",
          }}
        >
          {readOnly ? (
            <div style={{ color: "red", marginBottom: 10 }}>READ ONLY</div>
          ) : saving ? (
            <div>Saving ...</div>
          ) : (
            <div />
          )}

          <LastSaved timestamp={serverModified} />
        </div>
        <div style={{ flex: 1, position: "relative" }}>
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
          />
        </div>
      </div>
    );
  }
}

export default SongEditor;

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
	<div
       onClick={this.toggleEditorClosed}
       style={{ cursor: "pointer", padding: "0px 3px 0px 12px", fontSize: "13px" }}
       >
      ◀
    </div>
  </div>
);
