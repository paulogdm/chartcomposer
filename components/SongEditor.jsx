import moment from "moment";
import LoadingIndicator from "./LoadingIndicator";

const SongEditor = ({ onChange, readOnly, saving, server_modified, value }) => {
  if (!value) {
    return null;
  }
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

        <LastSaved timestamp={server_modified} />
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <textarea
          value={value}
          onChange={onChange}
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
};

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
  </div>
);
