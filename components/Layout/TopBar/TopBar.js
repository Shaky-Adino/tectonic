import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import baseUrl from "../../../utils/baseUrl";
import cookie from "js-cookie";
import Link from "next/link";
import { useRouter } from "next/router";
import UserSuggestion from "../../Profile/UserSuggestion/UserSuggestion";
import OnlineUser from "../../Profile/OnlineUser/OnlineUser";
import UserStats from "../../Profile/UserStats/UserStats";
import { logoutUser } from "../../../utils/authUser";
import SearchBar from "../SearchBar/SearchBar";
import Modal from "../Modal/Modal";
import NewMessagePopUp from "../../Messages/NewMessagePopUp/NewMessagePopUp";
import getUserInfo from "../../../utils/getUserInfo";
import newMsgSound from "../../../utils/newMsgSound";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faPaw,faChevronLeft,faChevronRight,faTh,faBell,faComment,faUser,faCog,faSearch,faHome,faSignOutAlt,} from "@fortawesome/free-solid-svg-icons";
import {faComment as farComment,faBell as farBell,faUser as farUser,} from "@fortawesome/free-regular-svg-icons";
import { Media, MediaContextProvider } from "../../../Responsive/Media";
import { Notification } from "../Toastr";
import styles from "./topBar.module.css";

export default function TopBar({user: {unreadNotification,email,unreadMessage,username,profilePicUrl,_id,newMessagePopup,},userFollowStats}) {

  const [leftMenuOpen, setLeftMenuOpen] = useState(true);
  const [rightMenuOpen, setRightMenuOpen] = useState(true);
  const leftMenuToggle = () => setLeftMenuOpen((prevValue) => !prevValue);
  const rightMenuToggle = () => setRightMenuOpen((prevValue) => !prevValue);

  const [connectedUsers, setConnectedUsers] = useState([]);

  const socket = useRef();

  const [newMessageReceived, setNewMessageReceived] = useState(null);
  const [newMessageModal, showNewMessageModal] = useState(false);

  const [newNotification, setNewNotification] = useState(null);
  const [notificationPopup, showNotificationPopup] = useState(false);

  const [unreadMsg,setUnreadMsg] = useState(unreadMessage);
  const [unreadNotf,setUnreadNotf] = useState(unreadNotification);

  const router = useRouter();

  const isActive = (route) => router.pathname === route;

  useEffect(() => {
    if (!socket.current) {
      const token = cookie.get("token");
      socket.current = io(baseUrl, { auth: { token } });
    }

    if (socket.current) {
      socket.current.emit("join", { userId: _id });

      socket.current.on("connectedUsers", ({ users }) => {
        const onlineUsers = users.filter((connectedUser) => {
          return (
            userFollowStats.following.length > 0 &&
            userFollowStats.following.filter(
              (following) => following.user === connectedUser.userId
            ).length > 0
          );
        });
        setConnectedUsers(onlineUsers);
      });

      socket.current.on("newNotificationReceived",({userId, profilePicUrl, username, postId, like }) => {
          if(userFollowStats.following.length > 0 &&
            userFollowStats.following.filter((following) => following.user === userId).length > 0){
              setNewNotification({profilePicUrl, username, postId, like });
              showNotificationPopup(true);
          }
      });
    }

    return () => {
      socket.current && socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    const handler = async ({ newMsg }) => {
      const { username, profilePicUrl } = await getUserInfo(newMsg.sender);
      setNewMessageReceived({...newMsg,senderName: username,senderProfilePic: profilePicUrl});
      showNewMessageModal(true);
      newMsgSound(username);
    };

    if (socket.current && newMessagePopup && router.pathname !== "/messages") {
      socket.current.on("newMsgReceived", handler);
    }

    if(router.pathname === "/messages"){
      showNewMessageModal(false);
      setUnreadMsg(0);
    }

    if(router.pathname === "/notifications")
      setUnreadNotf(0);

    return () => {
      socket.current && socket.current.off("newMsgReceived", handler);
    };
  }, [router.isReady, router.pathname]);

  useEffect(() => {
    notificationPopup && setTimeout(() => showNotificationPopup(false), 5000);
  }, [notificationPopup]);

  return (
      <MediaContextProvider>
        <Media greaterThanOrEqual="tablet">

          {newMessageModal && !isActive("/messages") && (
            <Modal closeModal={() => showNewMessageModal(false)}>
              <NewMessagePopUp
                closeModal={() => showNewMessageModal(false)}
                socket={socket}
                newMessageReceived={newMessageReceived}
                userId={_id}
              />
            </Modal>
          )}
          
          {notificationPopup && newNotification && <Notification newNotification={newNotification}/>}

          <div className={styles.topbarContainer}>
            <TopbarLeft router={router} />
            <div className={styles.topbarRight}>
              <div className={styles.topbarIcons}>
                <div className={styles.topbarIconItem}>
                  <ChatIcon router={router} />
                  {unreadMsg ? <span className={styles.topbarIconBadge}>{unreadMsg}</span> : null}
                </div>
                <div className={styles.topbarIconItem}>
                  <BellIcon router={router} />
                  {unreadNotf ? <span className={styles.topbarIconBadge}>{unreadNotf}</span> : null}
                </div>
              </div>
              <FontAwesomeIcon
                icon={rightMenuOpen ? faUser : farUser}
                size="2x"
                className={styles.userIcon}
                onClick={rightMenuToggle}
              />
            </div>
          </div>

          <div className={rightMenuOpen ? `${styles.rightMenu} ${styles.toggled}`: styles.rightMenu}>
            <div className={styles.userProfile}>
              <div className={styles.userPic}><img src={profilePicUrl} /></div>
              <h3>{username}</h3>
              <UserStats userFollowStats={userFollowStats} />
            </div>

            <RightMenu isActive={isActive} username={username} email={email} router={router} />

            <div className={rightMenuOpen ? styles.rightMenuCloseArrow : styles.rightMenuOpenArrow} onClick={rightMenuToggle}>
              <FontAwesomeIcon icon={rightMenuOpen ? faChevronRight : faChevronLeft}/>
            </div>
          </div>
        </Media>

        <Media between={["mobile", "tablet"]}>
          <div className={styles.topbarContainer}>
            <TopbarLeft router={router} />
            <div className={styles.topbarTabletRight}>
              <HomeMenu isActive={isActive} router={router} />
              <MessageMenu isActive={isActive} router={router} />
              <NotificationsMenu isActive={isActive} router={router} />
              <SettingsMenu isActive={isActive} router={router} />
              <ProfileMenu router={router} username={username} />
              <LogoutMenu email={email} />
            </div>
          </div>
        </Media>

        <Media lessThan="mobile">
          <div className={styles.topbarContainer}>
            <div className={styles.topbarMobile}>
              <HomeMenu isActive={isActive} router={router} />
              <NotificationsMenu isActive={isActive} router={router} />
              <SearchMenu isActive={isActive} router={router} />
              <ProfileMenu router={router} username={username} />
              <LogoutMenu email={email} />
            </div>
          </div>
        </Media>

        <Media greaterThanOrEqual="computer">
          {!isActive("/messages") && (
            <div className={leftMenuOpen ? `${styles.leftMenu} ${styles.toggled}`: styles.leftMenu}>
              <p style={{ marginTop: "10px" }}>People you may know</p>
              <div className={styles.layUsers}>
                <UserSuggestion index={0} />
                <UserSuggestion index={1} />
                <UserSuggestion index={2} />
                <UserSuggestion index={3} />
                <UserSuggestion index={4} />
              </div>
              {connectedUsers.length > 0 && <p>Online Users</p>}
              <div className={styles.layOnlineUsers}>
                {connectedUsers.map((onlineUser) => (
                  <OnlineUser key={onlineUser.userId} onlineUser={onlineUser.userId} />
                ))}
              </div>
              <div className={leftMenuOpen ? styles.leftMenuCloseArrow : styles.leftMenuOpenArrow} onClick={leftMenuToggle}>
                <FontAwesomeIcon icon={leftMenuOpen ? faChevronLeft : faChevronRight} />
              </div>
            </div>
          )}
        </Media>
      </MediaContextProvider>
  );
}

const ChatIcon = ({router}) => {
  const [chatHovered, setChatHovered] = useState(false);
  const toggleChatHover = () => setChatHovered(!chatHovered);

  return (
    <FontAwesomeIcon
      icon={chatHovered ? faComment : farComment}
      className={styles.chatIcon}
      onMouseEnter={toggleChatHover}
      onMouseLeave={toggleChatHover}
      onClick={() => router.push("/messages")}
    />
  );
}

const BellIcon = ({router}) => {
  const [notificationHovered, setNotificationHovered] = useState(false);
  const toggleNotificationHover = () => setNotificationHovered(!notificationHovered);

  return (
    <FontAwesomeIcon
      icon={notificationHovered ? faBell : farBell}
      className={styles.bellIcon}
      onMouseEnter={toggleNotificationHover}
      onMouseLeave={toggleNotificationHover}
      onClick={() => router.push("/notifications")}
    />
  );
}

const HomeMenu = ({router, isActive}) => {
  return (
    <FontAwesomeIcon
      className={isActive("/") ? styles.selectedMenuItem : styles.menuItem}
      icon={faHome}
      onClick={() => router.push("/")}
    />
  );
}

const MessageMenu = ({router, isActive}) => {
  return (
    <FontAwesomeIcon
      className={isActive("/messages") ? styles.selectedMenuItem : styles.menuItem}
      icon={faComment}
      onClick={() => router.push("/messages")}
    />
  );
}

const NotificationsMenu = ({router, isActive}) => {
  return (
    <FontAwesomeIcon
      className={isActive("/notifications") ? styles.selectedMenuItem : styles.menuItem}
      icon={faBell}
      onClick={() => router.push("/notifications")}
    />
  );
}

const SettingsMenu = ({router, isActive}) => {
  return (
    <FontAwesomeIcon 
      className={isActive("/settings") ? styles.selectedMenuItem : styles.menuItem} 
      icon={faCog} 
      onClick={() => router.push("/settings")}
    />
  );
}

const ProfileMenu = ({router, username}) => {
  return (
    <FontAwesomeIcon
      className={router.query.username === username ? styles.selectedMenuItem : styles.menuItem}
      icon={faUser}
      onClick={() => router.push(`/${username}`)}
    />
  );
}

const SearchMenu = ({router, isActive}) => {
  return (
    <FontAwesomeIcon 
      className={isActive("/search") ? styles.selectedMenuItem : styles.menuItem} 
      icon={faSearch} 
      onClick={() => router.push("/search")}
    />
  );
}

const LogoutMenu = ({email}) => {
  return (
    <FontAwesomeIcon
      className={styles.menuItem}
      icon={faSignOutAlt}
      onClick={() => logoutUser(email)}
    />
  );
}

const TopbarLeft = ({router}) => {
  return (
    <>
      <div className={styles.topbarLeft} onClick={() => router.push("/")}>
        <span className={styles.logo}>
          <FontAwesomeIcon icon={faPaw} />
          {` Tectonic`}
        </span>
      </div>
      <div className={styles.topbarCenter}><SearchBar /></div>
    </>
  );
}

const RightMenu = ({isActive, username, email, router}) => {
  return (
    <>
      <div className={styles.profileOptions}>
        <Link href="/">
          <div className={isActive("/") ? `${styles.profileFeed} ${styles.selectedOption}`: styles.profileFeed}>
            <FontAwesomeIcon icon={faTh} className={styles.item} />
            <p>Feed</p>
          </div>
        </Link>
        <Link href="/notifications">
          <div className={isActive("/notifications") ? `${styles.profileNotifications} ${styles.selectedOption}`: styles.profileNotifications}>
            <FontAwesomeIcon icon={faBell} className={styles.item} />
            <p>Notifications</p>
          </div>
        </Link>
        <Link href="/messages">
          <div className={isActive("/messages") ? `${styles.profileMessages} ${styles.selectedOption}`: styles.profileMessages}>
            <FontAwesomeIcon icon={faComment} className={styles.item} />
            <p>Messages</p>
          </div>
        </Link>
        <Link href={`/${username}`}>
          <div className={router.query.username === username ? `${styles.profileUser} ${styles.selectedOption}` : styles.profileUser}>
            <FontAwesomeIcon icon={faUser} className={styles.item} />
            <p>Profile</p>
          </div>
        </Link>
        <Link href={`/settings`}>
          <div className={isActive("/settings") ? `${styles.profileSettings} ${styles.selectedOption}`: styles.profileSettings}>
            <FontAwesomeIcon icon={faCog} className={styles.item} />
            <p>Settings</p>
          </div>
        </Link>
      </div>
      <div className={styles.userLogout} onClick={() => logoutUser(email)}>
        <FontAwesomeIcon icon={faSignOutAlt} className={styles.item} />
        <p>Logout</p>
      </div>
    </>
  );
}