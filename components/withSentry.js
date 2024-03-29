import React from "react";
import { init, captureException } from "@sentry/browser";
import getConfig from "next/config";

import { SENTRY_DSN } from "../utils/constants";

const { publicRuntimeConfig } = getConfig();
const { IS_DEV } = publicRuntimeConfig;

function withSentry(Child) {
  return class WrappedComponent extends React.Component {
    static getInitialProps(context) {
      if (Child.getInitialProps) {
        return Child.getInitialProps(context);
      }
      return {};
    }
    constructor(props) {
      super(props);
      this.state = {
        error: null,
      };
      if (!IS_DEV) {
        init({ dsn: SENTRY_DSN });
      }
    }

    componentDidCatch(error, errorInfo) {
      this.setState({ error });
      if (!IS_DEV) {
        captureException(error, { extra: errorInfo });
      }
    }

    render() {
      return <Child {...this.props} error={this.state.error} />;
    }
  };
}

export default withSentry;
