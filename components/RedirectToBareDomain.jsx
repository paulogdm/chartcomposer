import { PureComponent } from "react";

export default class RedirectToBareComain extends PureComponent {
  componentDidMount() {
    const href = document.location.href;
    if (-1 !== href.indexOf("www.chartcomposer.com")) {
      // Redirect to bare domain.
      document.location = "https://chartcomposer.com/";
    }
  }
  render() {
    return null;
  }
}
