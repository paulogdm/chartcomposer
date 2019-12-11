import React from "react";
import { init, captureException } from "@sentry/browser";
import getConfig from "next/config";

import { SENTRY_DSN } from "../utils/constants";

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
      if (!process.env.IS_DEV) {
        init({ dsn: SENTRY_DSN });
      }
    }

    componentDidCatch(error, errorInfo) {
      this.setState({ error });
      if (!process.env.IS_DEV) {
        captureException(error, { extra: errorInfo });
      }
    }

    render() {
      return <Child {...this.props} error={this.state.error} />;
    }
  };
}

export default withSentry;
