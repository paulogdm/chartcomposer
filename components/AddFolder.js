import DropboxChooser from "./DropboxChooser";
import publicRuntimeConfig from "../utils/publicRuntimeConfig";

const { DROPBOX_APP_KEY } = publicRuntimeConfig;

const AddFolder = ({ loadDropboxLink }) => (
  <div
    style={{
      alignItems: "center",
      display: "flex",
    }}
  >
    <DropboxChooser
      appKey={DROPBOX_APP_KEY}
      success={choices => {
        console.debug("DropboxChooser success", { choices });
        const folder = choices[0];
        if (!folder.isDir) {
          alert("Please choose a folder, not a file");
          return;
        }
        loadDropboxLink(folder.link);
      }}
      multiselect={false}
      extensions={[]}
      folderselect
    >
      <button title="Choose a folder on Dropbox">+ 📁</button>
    </DropboxChooser>
  </div>
);

export default AddFolder;
