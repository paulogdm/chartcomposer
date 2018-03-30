import React from "react";

export default class UserMenu extends React.Component {
  constructor(props) {
    super();
    this.state = {
      isOpen: false,
    };
  }

  componentDidMount() {
    document.addEventListener("click", this.onDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.onDocumentClick);
  }

  onDocumentClick = e => {
    if (!this.el.contains(e.target) && this.state.isOpen) {
      this.setState({ isOpen: false });
    }
  };

  toggleOpen = e => {
    this.setState({ isOpen: !this.state.isOpen });
    e.stopPropagation();
  };

  togglePreferences = e => {
    this.setState({ isOpen: false });
    this.props.togglePreferencesOpen();
  };

  render() {
    const { user, signOut } = this.props;
    const { isOpen } = this.state;
    return (
      <div ref={el => (this.el = el)} style={{ position: "relative" }}>
        <style jsx>{`
          li {
            cursor: pointer;
            padding: 10px;
          }
          li:hover {
            background-color: #eee;
          }
        `}</style>
        <div
          onClick={this.toggleOpen}
          style={{ cursor: "pointer" }}
          title={user.display_name}
        >
          <img
            alt=""
            src={user.profile_photo_url}
            style={{ borderRadius: "50%", width: 20, height: 20 }}
          />
        </div>
        {isOpen ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #ccc",
              minWidth: 100,
              position: "absolute",
              right: 0,
              zIndex: 1,
            }}
          >
            <ol
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                textAlign: "right",
              }}
            >
              <li onClick={this.togglePreferences}>
                <div>Preferences</div>
              </li>
              <li onClick={signOut}>
                <div>Sign out</div>
              </li>
            </ol>
          </div>
        ) : null}
      </div>
    );
  }
}
