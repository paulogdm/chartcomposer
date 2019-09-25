import React from "react";
import PropTypes from "prop-types";
import FaChain from "react-icons/lib/fa/chain";
import FaFolderOpen from "react-icons/lib/fa/folder-open";

import ButtonToolbarGroup from "./ButtonToolbarGroup";
import DropboxChooser from "./DropboxChooser";
import publicRuntimeConfig from "./../utils/publicRuntimeConfig";

const { DROPBOX_APP_KEY } = publicRuntimeConfig;

const AddFolder = ({ dbx, dropboxLoadLink }) => {
  let buttons = [];
  if (dbx) {
    buttons.push({
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
            dropboxLoadLink(folder.link);
          }}
          multiselect={false}
          extensions={[]}
          folderselect
        >
          + <FaFolderOpen />
        </DropboxChooser>
      ),
    });
  }

  buttons.push({
    title: "Paste a Dropbox folder link",
    onClick: e => {
      const url = window.prompt("Dropbox shared folder URL");
      if (!url) {
        return;
      }
      dropboxLoadLink(url);
    },
    content: (
      <div>
        + <FaChain />
      </div>
    ),
  });

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
      }}
    >
      <ButtonToolbarGroup buttons={buttons} />
    </div>
  );
};

AddFolder.propTypes = {
  dbx: PropTypes.object,
  dropboxLoadLink: PropTypes.func,
};

export default AddFolder;
