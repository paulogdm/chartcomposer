import ButtonToolbarGroup from "./ButtonToolbarGroup";
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
    <ButtonToolbarGroup
      buttons={[
        {
          title: "Choose a folder on Dropbox",
          content: (
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
              + 📁
            </DropboxChooser>
          ),
        },
        {
          onClick: e => {
            const url = window.prompt("Dropbox shared folder URL");
            if (!url) {
              return;
            }
            loadDropboxLink(url);
          },
          title: "Paste a Dropbox folder link",
          content: "+ 🔗",
        },
      ]}
    />
  </div>
);

export default AddFolder;
