import { PureComponent } from "react";

import { DOMAIN_NAME } from "./../utils/constants";

export default class RedirectToBareComain extends PureComponent {
  componentDidMount() {
    const href = window.document.location.href;
    if (
      -1 !== href.indexOf("www.chartcomposer.com") ||
      -1 !== href.indexOf(`www.${DOMAIN_NAME}`)
    ) {
      // Redirect to bare domain.
      window.document.location = `https://${DOMAIN_NAME}/`;
    }
  }
  render() {
    return null;
  }
}
