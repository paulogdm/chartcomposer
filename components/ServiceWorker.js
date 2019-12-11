import React, { PureComponent } from "react";

class ServiceWorker extends PureComponent {
  componentDidMount() {
    if (!process.env.IS_DEV && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("service worker registered."))
        .catch(err => console.dir(err));
    }
    this.installPromptEvent = null;
    window.addEventListener("beforeinstallprompt", this.installPrompt);
    window.addEventListener("click", this.onClickShowInstallPrompt);
  }

  componentWillUnmount() {
    this.installPromptEvent = null;
    window.removeEventListener(
      "beforeinstallprompt",
      this.onBeforeInstallPrompt,
    );
    window.removeEventListener("click", this.onClickShowInstallPrompt);
  }

  onBeforeInstallPrompt = e => {
    console.debug("got beforeinstallprompt!");
    // Prevent Chrome <= 67 from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    this.installPromptEvent = e;
  };

  onClickShowInstallPrompt = e => {
    if (!this.installPromptEvent) {
      return;
    }
    window.removeEventListener("click", this.onClickShowInstallPrompt);
    this.installPromptEvent.prompt();
    this.installPromptEvent.userChoice.then(choice => {
      if (choice.outcome === "accepted") {
        console.log("User accepted the A2HS prompt");
      } else {
        console.log("User dismissed the A2HS prompt");
      }
      // Clear the saved prompt since it can't be used again
      this.installPromptEvent = null;
    });
  };

  render() {
    return null;
  }
}

export default ServiceWorker;
