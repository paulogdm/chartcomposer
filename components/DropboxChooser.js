import React, { Component } from "react";
import PropTypes from "prop-types";
import loadScript from "load-script";

// TODO(elsigh): maybe we should just copy locally? There was some reason
// I can't remember about why it was better to do it this way.
const DROPBOX_SDK_URL = "https://www.dropbox.com/static/api/2/dropins.js";
const SCRIPT_ID = "dropboxjs";

let scriptLoadingStarted = false;

// read more
// https://www.dropbox.com/developers/chooser
export default class DropboxChooser extends Component {
  static propTypes = {
    children: PropTypes.node,
    appKey: PropTypes.string.isRequired,
    success: PropTypes.func.isRequired,
    cancel: PropTypes.func,
    linkType: PropTypes.oneOf(["preview", "direct"]),
    multiselect: PropTypes.bool,
    extensions: PropTypes.arrayOf(PropTypes.string),
    disabled: PropTypes.bool,
    folderselect: PropTypes.bool,
  };

  static defaultProps = {
    cancel: () => {},
    linkType: "preview",
    multiselect: false,
    disabled: false,
    folderselect: false,
  };

  componentDidMount() {
    if (!this.isDropboxReady() && !scriptLoadingStarted) {
      scriptLoadingStarted = true;
      loadScript(DROPBOX_SDK_URL, {
        attrs: {
          id: SCRIPT_ID,
          "data-app-key": this.props.appKey,
        },
      });
    }
  }

  isDropboxReady() {
    return !!window.Dropbox;
  }

  onChoose = () => {
    if (!this.isDropboxReady() || this.props.disabled) {
      return null;
    }

    const {
      success,
      cancel,
      linkType,
      multiselect,
      extensions,
      folderselect,
    } = this.props;
    console.warn({ folderselect });
    window.Dropbox.choose({
      success,
      cancel,
      linkType,
      multiselect,
      extensions,
      folderselect,
    });
  };

  render() {
    return (
      <div onClick={this.onChoose}>
        {this.props.children ? (
          this.props.children
        ) : (
          <button>Open dropbox chooser</button>
        )}
      </div>
    );
  }
}
