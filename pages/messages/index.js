import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useRouter } from "next/router";
import axios from "axios";
import baseUrl from "../../utils/baseUrl";
import cookie from "js-cookie";
import getUserInfo from "../../utils/getUserInfo";
import newMsgSound from "../../utils/newMsgSound";
import { parseCookies } from "nookies";
import SearchMessages from "../../components/Messages/SearchMessages/SearchMessages";
import Card from "../../components/Layout/Card/Card";
import Button from "../../components/Layout/Button/Button";
import MessagePreview from "../../components/Messages/MessagePreview/MessagePreview";
import ChatBox from "../../components/Messages/ChatBox/ChatBox";
import Modal from "../../components/Layout/Modal/Modal";
import { NoMessages } from "../../components/Layout/NoData/NoData";
import styles from "./messages.module.css";
import { Media, MediaContextProvider } from "../../Responsive/Media";

const scrollDivToBottom = (divRef) => divRef.current && divRef.current.scrollIntoView({ behaviour: "smooth" });

export default function Messages({ chatsData, errorLoading, user }) {
  const [chats, setChats] = useState(chatsData || []);

  const router = useRouter();

  const socket = useRef();
  const [connectedUsers, setConnectedUsers] = useState([]);

  const [messages, setMessages] = useState([]);
  const [bannerData, setBannerData] = useState({username: "",profilePicUrl: ""});

  const divRef = useRef();

  // This ref is for persisting the state of query string in url throughout re-renders
  const openChatId = useRef("");

  //Connection useEffect
  useEffect(() => {
    if (!socket.current) {
      const token = cookie.get("token");
      socket.current = io(baseUrl, { auth: { token } });
    }

    if (socket.current) {
      socket.current.emit("joinChat", { userId: user._id });

      socket.current.on("connectedUsers", ({ users }) => {
        setConnectedUsers(users);
      });

      if (chats.length > 0 && !router.query.message) {
        router.push(`/messages?message=${chats[0].messagesWith}`, undefined, {
          shallow: true,
        });
      }
    }

    const messageRead = async () => {
      try {
        await axios.post(
          `${baseUrl}/api/notifications/readMessages`,
          {},
          { headers: { Authorization: cookie.get("token") } }
        );
      } catch (error) {
        console.log(error);
      }
    };

    messageRead();

    return () => {
      messageRead();
      socket.current && socket.current.disconnect();
    };
  }, []);

  // Load messages useEffect
  useEffect(() => {
    const loadMessages = () => {
      socket.current.emit("loadMessages", {
        userId: user._id,
        messagesWith: router.query.message,
      });

      socket.current.on("messagesLoaded", ({ chat }) => {
        setMessages(chat.messages);
        setBannerData({
          username: chat.messagesWith.username,
          profilePicUrl: chat.messagesWith.profilePicUrl,
        });

        openChatId.current = chat.messagesWith._id;
        divRef.current && scrollDivToBottom(divRef);
      });

      socket.current.on("noChatFound", async () => {
        const { username, profilePicUrl } = await getUserInfo(router.query.message);

        setBannerData({ username, profilePicUrl });
        setMessages([]);

        if (!chats.some((i) => i.messagesWith === router.query.message)) {
          const newChat = {
            messagesWith: router.query.message,
            username: username,
            profilePicUrl: profilePicUrl,
            lastMessage: "",
            date: Date.now(),
          };
          setChats((prev) => [newChat, ...prev]);
        }

        openChatId.current = router.query.message;
      });
    };

    if (socket.current && router.query.message) loadMessages();
  }, [router.query.message]);

  // Confirming msg is sent and receiving the messages useEffect
  useEffect(() => {
    if (socket.current) {
      socket.current.on("msgSent", ({ newMsg }) => {
        if (newMsg.receiver === openChatId.current) {
          setMessages((prev) => [...prev, newMsg]);
        }
        setChats((prev) => {
          const previousChat = prev.find(chat => chat.messagesWith === newMsg.receiver);
          previousChat.lastMessage = newMsg.msg;
          previousChat.date = newMsg.date;

          return [...prev];
        });
      });

      socket.current.on("newMsgReceived", async ({ newMsg }) => {
        let senderName;

        // When chat with sender is currently open in browser
        if (newMsg.sender === openChatId.current) {
          setMessages((prev) => [...prev, newMsg]);

          setChats((prev) => {
            const previousChat = prev.find(chat => chat.messagesWith === newMsg.sender);
            previousChat.lastMessage = newMsg.msg;
            previousChat.date = newMsg.date;

            senderName = previousChat.username;

            return [...prev];
          });
        }
        else {
          const ifPreviouslyMessaged = chats.filter((chat) => chat.messagesWith === newMsg.sender).length > 0;

          if (ifPreviouslyMessaged) {
            setChats((prev) => {
              const previousChat = prev.find(chat => chat.messagesWith === newMsg.sender);
              previousChat.lastMessage = newMsg.msg;
              previousChat.date = newMsg.date;

              senderName = previousChat.username;

              return [
                previousChat,
                ...prev.filter((chat) => chat.messagesWith !== newMsg.sender),
              ];
            });
          }

          //If no previous chat with sender
          else {
            const { username, profilePicUrl } = await getUserInfo(newMsg.sender);
            senderName = username;

            const newChat = {
              messagesWith: newMsg.sender,
              username,
              profilePicUrl,
              lastMessage: newMsg.msg,
              date: newMsg.date,
            };
            setChats((prev) => [newChat, ...prev]);
          }
        }

        newMsgSound(senderName);
      });
    }
  }, []);

  useEffect(() => {
    messages.length > 0 && scrollDivToBottom(divRef);
  }, [messages]);

  const sendMsg = (msg) => {
    if (socket.current) {
      socket.current.emit("sendNewMsg", {
        userId: user._id,
        msgSendToUserId: openChatId.current,
        msg,
      });
    }
  };

  const deleteMsg = (messageId) => {
    if (socket.current) {
      socket.current.emit("deleteMsg", {
        userId: user._id,
        messagesWith: openChatId.current,
        messageId,
      });

      socket.current.on("msgDeleted", () => {
        setMessages(prev =>prev.filter(message => message._id !== messageId));
      });
    }
  };

  const deleteChat = async (messagesWith) => {
    try {
      await axios.delete(`${baseUrl}/api/chats/${messagesWith}`, {
        headers: { Authorization: cookie.get("token") },
      });

      setChats((prev) =>prev.filter((chat) => chat.messagesWith !== messagesWith));
      router.push("/messages", undefined, { shallow: true });
    } catch (error) {
      let index = chats.findIndex((i) => i.messagesWith === messagesWith);
      if (chats[index].lastMessage === "") {
        setChats(prev =>prev.filter((chat) => chat.messagesWith !== messagesWith));
        router.push("/messages", undefined, { shallow: true });
      } else alert("Error deleting chat");
    }
  };

  return (
    <MediaContextProvider>

      <Media lessThan="mobile">
        <Modal>
          <Card className={styles.mobile}>
            <h4>You need to install the mobile app to use Chat feature</h4>
            <Button className={styles.goBackButton} onClick={()=>router.replace("/")}>Go Back</Button>
          </Card>
        </Modal>
      </Media>

      <Media greaterThanOrEqual="mobile">
        <div className={styles.layContent}>
          <div className={styles.leftBar}>
            <h2>Messages</h2>
            <SearchMessages chats={chats} setChats={setChats} />

            <div className={styles.messagePreviews}>
              {(!errorLoading && chats.length) > 0 ? (
                <>
                  {chats.map((chat, i) => (
                    <div key={i}>
                      <MessagePreview
                        chat={chat}
                        connectedUsers={connectedUsers}
                        deleteChat={deleteChat}
                      />
                      {i !== chats.length - 1 && <hr />}
                    </div>
                  ))}
                </>
              ) : (
                <NoMessages />
              )}
            </div>
          </div>

          <div className={styles.rightBar}>
            {router.query.message && (
              <Card className={styles.chatBox}>
                <ChatBox
                  divRef={divRef}
                  bannerData={bannerData}
                  messages={messages}
                  user={user}
                  socket={socket.current}
                  sendMsg={sendMsg}
                  deleteMsg={deleteMsg}
                />
              </Card>
            )}
          </div>
        </div>
      </Media>
      
    </MediaContextProvider>
  );
}

Messages.getInitialProps = async (ctx) => {
  try {
    const { token } = parseCookies(ctx);

    const res = await axios.get(`${baseUrl}/api/chats`, {
      headers: { Authorization: token },
    });

    return { chatsData: res.data };
  } catch (error) {
    return { errorLoading: true };
  }
};