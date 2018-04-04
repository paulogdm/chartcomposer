import { Sender, SignInAsGuest } from "../components/Page";
import UserMenu from "../components/UserMenu";

const Header = ({
  className,
  dropboxInputValue,
  loadDropboxLink,
  onChangeDropboxInput,
  readOnly,
  setSmallScreenMode,
  signOut,
  smallScreenMode,
  togglePreferencesOpen,
  user,
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
        .title-and-input > h1 {
          padding-right: 0;
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
        display: "flex",
      }}
    >
      {smallScreenMode !== null && smallScreenMode !== "SongList" ? (
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
        ChartComposer
      </h1>
      {user ? (
        <div
          style={{
            alignItems: "center",
            display: "flex",
          }}
        >
          <input
            onChange={onChangeDropboxInput}
            onKeyPress={e => {
              if (e.key === "Enter") {
                loadDropboxLink(dropboxInputValue);
              }
            }}
            placeholder="Dropbox folder or song URL"
            value={dropboxInputValue}
            style={{
              flex: 1,
              fontSize: 14,
              width: 200,
            }}
          />
          <button
            onClick={() => {
              loadDropboxLink(dropboxInputValue);
            }}
          >
            Go
          </button>
        </div>
      ) : null}
    </div>

    <div style={{ display: "flex" }}>
      {smallScreenMode !== null &&
      smallScreenMode !== "SongList" &&
      !readOnly ? (
        <button
          onClick={() => {
            setSmallScreenMode(
              smallScreenMode == "SongView" ? "SongEditor" : "SongView",
            );
          }}
          style={{ marginRight: 10 }}
        >
          {smallScreenMode == "SongView" ? "Edit" : "View"}
        </button>
      ) : null}

      {user ? (
        <UserMenu
          user={user}
          signOut={signOut}
          togglePreferencesOpen={togglePreferencesOpen}
        />
      ) : (
        <Sender
          state={{ to: "/" }}
          render={({ url }) => (
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src="/static/dropbox.png"
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