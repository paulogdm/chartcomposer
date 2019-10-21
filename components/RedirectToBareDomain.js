import { PureComponent } from "react";

export default class RedirectToBareComain extends PureComponent {
  componentDidMount() {
    const href = window.document.location.href;
    if (
      -1 !== href.indexOf("www.chartcomposer.com") ||
      -1 !== href.indexOf("www.songdocs.io")
    ) {
      // Redirect to bare domain.
      window.document.location = "https://songdocs.io/";
    }
  }
  render() {
    return null;
  }
}
