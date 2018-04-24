import DropboxChooser from "../utils/DropboxChooser";

import { Sender, SignInAsGuest } from "../components/Page";
import UserMenu from "../components/UserMenu";

import publicRuntimeConfig from "../utils/publicRuntimeConfig";
const { DROPBOX_APP_KEY } = publicRuntimeConfig;

const Header = ({
  className,
  loadDropboxLink,
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
        {title ? title : "ChartComposer"}
      </h1>
      {user ? (
        <div
          style={{
            alignItems: "center",
            display: "flex",
          }}
        >
          <DropboxChooser
            appKey={DROPBOX_APP_KEY}
            success={choices => {
              console.debug("DropboxChooser success", { choices });
              const folder = choices[0];
              if (!folder.isDir) {
                alert("Please choose a folder, not a file");
                return;
              }
              loadDropboxLink(folder.link);
            }}
            multiselect={false}
            extensions={[]}
            folderselect
          >
            <div style={{ cursor: "pointer", textDecoration: "underline" }}>
              Choose a folder
            </div>
          </DropboxChooser>
          <div style={{ margin: "0 10px" }}>or</div>
          <div
            onClick={e => {
              const url = window.prompt("Dropbox shared folder URL");
              if (!url) {
                return;
              }
              loadDropboxLink(url);
            }}
            style={{ cursor: "pointer", textDecoration: "underline" }}
          >
            Paste a link
          </div>
        </div>
      ) : null}
    </div>

    <div style={{ display: "flex" }}>
      {smallScreenMode !== null &&
      smallScreenMode !== "SongList" &&
      smallScreenMode !== "PromoCopy" &&
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
      ) : nologin ? (
        <a href="/">Home</a>
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
              <div style={{ margin: "0 5px" }}>|</div>
              <a href="/about">About</a>
            </div>
          )}
        />
      )}
    </div>
  </div>
);

export default Header;
