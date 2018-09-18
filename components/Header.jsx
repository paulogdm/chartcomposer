import { Button } from "react-bootstrap";
import { Sender, SignInAsGuest } from "../components/Page";
import UserMenu from "../components/UserMenu";

const Header = ({
  className,
  paneViewButtonGroup,
  readOnly,
  setSmallScreenMode,
  signOut,
  smallScreenMode,
  togglePreferencesOpen,
  user,
  nologin,
  title,
}) => (
  <div
    className={className}
    style={{
      alignItems: "center",
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 10px",
    }}
  >
    <style jsx>{`
      .title-and-input {
        align-items: center;
      }
      .title-and-input > h1 {
        padding-right: 20px;
      }
      @media (max-width: 600px) {
        .title-and-input {
          align-items: left;
          flex-direction: column;
        }
      }
      @media print {
        .header,
        .songlist {
          display: none !important;
        }
      }
    `}</style>
    <div
      className="title-and-input"
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "row",
      }}
    >
      {smallScreenMode !== null &&
      smallScreenMode !== "SongList" &&
      smallScreenMode !== "PromoCopy" ? (
        <div
          onClick={() => {
            setSmallScreenMode("SongList");
          }}
          style={{ cursor: "pointer", padding: 10 }}
        >
          ◀
        </div>
      ) : null}
      <h1
        style={{
          fontSize: 20,
          margin: 0,
          paddingBottom: 0,
          paddingTop: 0,
        }}
      >
        {title ? title : "ChartComposer =)"}
      </h1>
    </div>

    <div
      style={{
        alignItems: "center",
        display: "flex",
      }}
    >
      {smallScreenMode !== null &&
      smallScreenMode !== "SongList" &&
      smallScreenMode !== "PromoCopy" &&
      !readOnly ? (
        <Button
          onClick={() => {
            setSmallScreenMode(
              smallScreenMode == "SongView" ? "SongEditor" : "SongView",
            );
          }}
          style={{ marginRight: 10 }}
        >
          {smallScreenMode == "SongView" ? "Edit" : "View"}
        </Button>
      ) : null}

      {paneViewButtonGroup ? (
        <div style={{ display: "flex", alignItems: "center", marginRight: 30 }}>
          <div style={{ marginRight: 10 }}>View</div>
          {paneViewButtonGroup}
        </div>
      ) : null}

      {user ? (
        <UserMenu
          user={user}
          signOut={signOut}
          togglePreferencesOpen={togglePreferencesOpen}
        />
      ) : nologin ? (
        <a href="/">Home</a>
      ) : (
        <Sender
          state={{ to: "/" }}
          render={({ url }) => (
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src="/static/notes.png"
                height={20}
                width={20}
                alt=""
                style={{
                  marginRight: 5,
                }}
              />
              <a href={url}>Sign in</a>
              <div style={{ margin: "0 5px" }}>|</div>
              <SignInAsGuest />
            </div>
          )}
        />
      )}
    </div>
  </div>
);

export default Header;
