import React, { PureComponent } from "react";

import publicRuntimeConfig from "../utils/publicRuntimeConfig";
const { IS_DEV } = publicRuntimeConfig;

class ServiceWorker extends PureComponent {
  componentDidMount() {
    if (!IS_DEV && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("service worker registered."))
        .catch(err => console.dir(err));
    }
  }

  render() {
    return null;
  }
}

export default ServiceWorker;
