import { useEffect, useRef, useState, useCallback } from "react";
import {
  sendChatMessage,
  getChatMessages,
  getAllowedChatUsers,
  getChatConversations,
  editChatMessage,
  deleteChatMessage,
  markMessagesRead,
} from "../Services/api";
import { socket } from "../socket";

// ===================== HELPERS =====================
const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const getRoleBadgeColor = (role) => {
  if (role === "coach") return "#f59e0b";
  if (role === "analyst") return "#3b82f6";
  if (role === "player") return "#10b981";
  return "#6b7280";
};

// ===================== TICK ICONS =====================
const TickIcon = ({ status }) => {
  if (status === "read") {
    return (
      <span style={{ color: "#53d0f5", fontSize: 13, marginLeft: 3 }}>✓✓</span>
    );
  }
  if (status === "delivered") {
    return (
      <span style={{ color: "#aaa", fontSize: 13, marginLeft: 3 }}>✓✓</span>
    );
  }
  return <span style={{ color: "#aaa", fontSize: 13, marginLeft: 3 }}>✓</span>;
};

// ===================== AVATAR =====================
const Avatar = ({ name, size = 40, color }) => (
  <div
    style={{
      width: size,
      height: size,
      minWidth: size,
      borderRadius: "50%",
      background: color || "#25D366",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.38,
      fontWeight: 700,
      color: "#fff",
      fontFamily: "'Outfit', sans-serif",
    }}
  >
    {getInitials(name)}
  </div>
);

// ===================== MAIN COMPONENT =====================
const ChatApp = ({ theme = "dark" }) => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const myId = user?.id || user?._id;
  const myRole = user?.role;
  const myName = user?.name || "Me";

  const [allowedUsers, setAllowedUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [editingMsg, setEditingMsg] = useState(null); // { id, text }
  const [contextMenu, setContextMenu] = useState(null); // { x, y, msg }
  const [showInfo, setShowInfo] = useState(null); // msg
  const [showDeleteModal, setShowDeleteModal] = useState(null); // msg
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatAreaRef = useRef(null);

  const isDark = theme === "dark";

  // ---- COLORS ----
  const C = isDark
    ? {
        bg: "#111b21",
        sidebar: "#111b21",
        sidebarHover: "#202c33",
        sidebarActive: "#2a3942",
        chatBg: "#0b141a",
        headerBg: "#202c33",
        inputBg: "#2a3942",
        myBubble: "#005c4b",
        theirBubble: "#202c33",
        text: "#e9edef",
        subText: "#8696a0",
        border: "#2a3942",
        searchBg: "#2a3942",
        dateLabelBg: "#182229",
        accent: "#00a884",
      }
    : {
        bg: "#f0f2f5",
        sidebar: "#fff",
        sidebarHover: "#f5f6f6",
        sidebarActive: "#d9fdd3",
        chatBg: "#efeae2",
        headerBg: "#fff",
        inputBg: "#fff",
        myBubble: "#d9fdd3",
        theirBubble: "#fff",
        text: "#111b21",
        subText: "#667781",
        border: "#e9edef",
        searchBg: "#f0f2f5",
        dateLabelBg: "#fff",
        accent: "#00a884",
      };

  // ===================== INIT =====================
  useEffect(() => {
    if (myId) socket.emit("register", myId);
  }, [myId]);

  useEffect(() => {
    fetchAllowedUsers();
    fetchConversations();
  }, []);

  const fetchAllowedUsers = async () => {
    try {
      const res = await getAllowedChatUsers();
      setAllowedUsers(res.data);
      const onlineMap = {};
      res.data.forEach((u) => {
        onlineMap[u._id] = u.isOnline;
      });
      setOnlineUsers(onlineMap);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await getChatConversations();
      setConversations(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ===================== FETCH MESSAGES =====================
  useEffect(() => {
    if (!selectedUser) return;
    setLoading(true);

    const fetch = async () => {
      try {
        const res = await getChatMessages(selectedUser._id);
        setMessages(res.data);
        setLoading(false);
        // Emit read
        socket.emit("messagesRead", { readerId: myId, senderId: selectedUser._id });
        // Update conversations unread count
        setConversations((prev) =>
          prev.map((c) =>
            c.user._id === selectedUser._id ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch (err) {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedUser]);

  // ===================== AUTO SCROLL =====================
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ===================== SOCKET EVENTS =====================
  useEffect(() => {
    const onReceive = (data) => {
      const incomingMsg = {
        _id: data.messageId || Date.now().toString(),
        message: data.message,
        sender: { _id: data.senderId, name: "", role: "" },
        receiver: { _id: myId },
        status: "delivered",
        createdAt: data.timestamp || new Date().toISOString(),
      };

      if (data.senderId === selectedUser?._id) {
        setMessages((prev) => [...prev, incomingMsg]);
        socket.emit("messagesRead", { readerId: myId, senderId: data.senderId });
      } else {
        // Update unread count in sidebar
        setConversations((prev) => {
          const exists = prev.find((c) => c.user._id === data.senderId);
          if (exists) {
            return prev.map((c) =>
              c.user._id === data.senderId
                ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: incomingMsg }
                : c
            );
          }
          return prev;
        });
        fetchConversations();
      }
    };

    const onDelivered = ({ messageId, tempId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId || m._id === messageId
            ? { ...m, status: "delivered" }
            : m
        )
      );
    };

    const onRead = ({ readerId }) => {
      if (readerId === selectedUser?._id) {
        setMessages((prev) => prev.map((m) => ({ ...m, status: "read" })));
      }
    };

    const onEdited = ({ messageId, newText }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, message: newText, edited: true } : m
        )
      );
    };

    const onDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, deletedForEveryone: true, message: "This message was deleted" }
            : m
        )
      );
    };

    const onTyping = ({ senderId }) => {
      if (senderId === selectedUser?._id) {
        setTypingUsers((prev) => ({ ...prev, [senderId]: true }));
      }
    };

    const onStopTyping = ({ senderId }) => {
      setTypingUsers((prev) => {
        const copy = { ...prev };
        delete copy[senderId];
        return copy;
      });
    };

    const onUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: true }));
    };

    const onUserOffline = ({ userId }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: false }));
    };

    socket.on("receiveMessage", onReceive);
    socket.on("messageDelivered", onDelivered);
    socket.on("messagesReadBy", onRead);
    socket.on("messageEdited", onEdited);
    socket.on("messageDeleted", onDeleted);
    socket.on("userTyping", onTyping);
    socket.on("userStoppedTyping", onStopTyping);
    socket.on("userOnline", onUserOnline);
    socket.on("userOffline", onUserOffline);

    return () => {
      socket.off("receiveMessage", onReceive);
      socket.off("messageDelivered", onDelivered);
      socket.off("messagesReadBy", onRead);
      socket.off("messageEdited", onEdited);
      socket.off("messageDeleted", onDeleted);
      socket.off("userTyping", onTyping);
      socket.off("userStoppedTyping", onStopTyping);
      socket.off("userOnline", onUserOnline);
      socket.off("userOffline", onUserOffline);
    };
  }, [selectedUser, myId]);

  // ===================== TYPING =====================
  const handleTyping = (e) => {
    setText(e.target.value);
    if (!selectedUser) return;

    socket.emit("typing", { senderId: myId, receiverId: selectedUser._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { senderId: myId, receiverId: selectedUser._id });
    }, 1500);
  };

  // ===================== SEND =====================
  const handleSend = async () => {
    if (!text.trim() || !selectedUser) return;

    if (editingMsg) {
      // EDIT MODE
      const updatedText = text.trim();
      try {
        await editChatMessage(editingMsg._id, updatedText);
        socket.emit("editMessage", {
          messageId: editingMsg._id,
          newText: updatedText,
          senderId: myId,
          receiverId: selectedUser._id,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m._id === editingMsg._id ? { ...m, message: updatedText, edited: true } : m
          )
        );
        setEditingMsg(null);
        setText("");
      } catch (err) {
        console.log(err);
      }
      return;
    }

    const tempId = "temp_" + Date.now();
    const optimistic = {
      _id: tempId,
      message: text.trim(),
      sender: { _id: myId, name: myName, role: myRole },
      receiver: { _id: selectedUser._id },
      status: "sent",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setText("");
    socket.emit("stopTyping", { senderId: myId, receiverId: selectedUser._id });

    try {
      const res = await sendChatMessage({ receiverId: selectedUser._id, message: text.trim() });
      const saved = res.data;

      socket.emit("sendMessage", {
        senderId: myId,
        receiverId: selectedUser._id,
        message: text.trim(),
        messageId: saved._id,
        tempId,
      });

      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...saved, status: "sent" } : m))
      );

      // Update conversations sidebar
      fetchConversations();
    } catch (err) {
      console.log(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && editingMsg) {
      setEditingMsg(null);
      setText("");
    }
  };

  // ===================== CONTEXT MENU =====================
  const handleRightClick = (e, msg) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  };

  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // ===================== DELETE =====================
  const handleDelete = async (msg, deleteFor) => {
    try {
      await deleteChatMessage(msg._id, deleteFor);
      socket.emit("deleteMessage", {
        messageId: msg._id,
        deleteFor,
        senderId: myId,
        receiverId: selectedUser._id,
      });

      if (deleteFor === "everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === msg._id
              ? { ...m, deletedForEveryone: true, message: "This message was deleted" }
              : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      }

      setShowDeleteModal(null);
    } catch (err) {
      console.log(err);
    }
  };

  // ===================== SIDEBAR USERS =====================
  // Merge conversations + allowed users (show all allowed, conversation data on top)
  const getSidebarList = () => {
    const convMap = {};
    conversations.forEach((c) => {
      convMap[c.user._id] = c;
    });

    const allUsers = allowedUsers.map((u) => {
      const conv = convMap[u._id];
      return {
        user: { ...u, isOnline: onlineUsers[u._id] ?? u.isOnline },
        lastMessage: conv?.lastMessage || null,
        unreadCount: conv?.unreadCount || 0,
      };
    });

    // Sort: conversations with messages first (by last message time), then others
    return allUsers
      .filter((item) => {
        const name = item.user.name?.toLowerCase() || "";
        return name.includes(search.toLowerCase());
      })
      .sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
        const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
        return bTime - aTime;
      });
  };

  // ===================== DATE LABELS =====================
  const groupedMessages = () => {
    const groups = [];
    let lastDate = null;

    for (const msg of messages) {
      const dateLabel = formatDateLabel(msg.createdAt);
      if (dateLabel !== lastDate) {
        groups.push({ type: "date", label: dateLabel });
        lastDate = dateLabel;
      }
      groups.push({ type: "msg", data: msg });
    }
    return groups;
  };

  const isTyping = selectedUser && typingUsers[selectedUser._id];

  // ===================== RENDER =====================
  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 64px)",
        background: C.bg,
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
      onClick={() => setContextMenu(null)}
    >
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
        .msg-bubble { position: relative; }
        .msg-bubble:hover .msg-actions { opacity: 1 !important; }
        .sidebar-item { transition: background 0.15s; }
        .sidebar-item:hover { background: ${C.sidebarHover} !important; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-in { animation: fadeSlide 0.2s ease; }
      `}</style>

      {/* ===================== LEFT SIDEBAR ===================== */}
      <div
        style={{
          width: 340,
          minWidth: 300,
          background: C.sidebar,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            background: C.headerBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={myName} size={40} color={getRoleBadgeColor(myRole)} />
            <div>
              <p style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>{myName}</p>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: getRoleBadgeColor(myRole),
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {myRole}
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 16px", background: C.sidebar }}>
          <div
            style={{
              background: C.searchBg,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" stroke={C.subText} strokeWidth="2" />
              <path d="M20 20l-3-3" stroke={C.subText} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or start new chat"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: C.text,
                fontSize: 14,
                flex: 1,
              }}
            />
          </div>
        </div>

        {/* Users list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {getSidebarList().map((item) => {
            const u = item.user;
            const isActive = selectedUser?._id === u._id;
            const isOnline = onlineUsers[u._id] ?? u.isOnline;

            return (
              <div
                key={u._id}
                className="sidebar-item"
                onClick={() => {
                  setSelectedUser(u);
                  setText("");
                  setEditingMsg(null);
                }}
                style={{
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  cursor: "pointer",
                  background: isActive ? C.sidebarActive : "transparent",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div style={{ position: "relative" }}>
                  <Avatar name={u.name} size={48} color={getRoleBadgeColor(u.role)} />
                  {isOnline && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        width: 11,
                        height: 11,
                        background: "#25d366",
                        border: `2px solid ${isActive ? C.sidebarActive : C.sidebar}`,
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ color: C.text, fontWeight: 600, fontSize: 15, margin: 0 }}>
                      {u.name}
                    </p>
                    <span style={{ fontSize: 11, color: C.subText }}>
                      {item.lastMessage ? formatTime(item.lastMessage.createdAt) : ""}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                    <p
                      style={{
                        color: C.subText,
                        fontSize: 13,
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 160,
                      }}
                    >
                      {item.lastMessage
                        ? item.lastMessage.deletedForEveryone
                          ? "🚫 Message deleted"
                          : item.lastMessage.message
                        : (
                          <span
                            style={{
                              fontSize: 11,
                              color: getRoleBadgeColor(u.role),
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            {u.role}
                          </span>
                        )}
                    </p>
                    {item.unreadCount > 0 && (
                      <span
                        style={{
                          background: C.accent,
                          color: "#fff",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "1px 7px",
                          minWidth: 20,
                          textAlign: "center",
                        }}
                      >
                        {item.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {getSidebarList().length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: C.subText, fontSize: 14 }}>
              No contacts found
            </div>
          )}
        </div>
      </div>

      {/* ===================== RIGHT CHAT ===================== */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!selectedUser ? (
          // Empty state
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: C.chatBg,
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 20 }}>💬</div>
            <p style={{ color: C.text, fontSize: 20, fontWeight: 600 }}>SportTrack Messages</p>
            <p style={{ color: C.subText, fontSize: 14, marginTop: 8 }}>
              Select a conversation to start messaging
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div
              style={{
                background: C.headerBg,
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ position: "relative" }}>
                <Avatar name={selectedUser.name} size={42} color={getRoleBadgeColor(selectedUser.role)} />
                {(onlineUsers[selectedUser._id] ?? selectedUser.isOnline) && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 10,
                      height: 10,
                      background: "#25d366",
                      border: `2px solid ${C.headerBg}`,
                      borderRadius: "50%",
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ color: C.text, fontWeight: 600, fontSize: 16, margin: 0 }}>
                  {selectedUser.name}
                </p>
                <p style={{ color: C.subText, fontSize: 12, margin: 0 }}>
                  {isTyping
                    ? "typing..."
                    : (onlineUsers[selectedUser._id] ?? selectedUser.isOnline)
                    ? "online"
                    : selectedUser.lastSeen
                    ? `last seen ${formatTime(selectedUser.lastSeen)}`
                    : "offline"}
                </p>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: getRoleBadgeColor(selectedUser.role),
                  background: isDark ? "#1a2a3a" : "#f0f9f4",
                  padding: "3px 10px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {selectedUser.role}
              </span>
            </div>

            {/* Messages Area */}
            <div
              ref={chatAreaRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 60px",
                background: C.chatBg,
                backgroundImage: isDark
                  ? "radial-gradient(circle at 20% 50%, rgba(0,168,132,0.03) 0%, transparent 60%)"
                  : "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300000008' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            >
              {loading ? (
                <div style={{ textAlign: "center", color: C.subText, paddingTop: 60 }}>
                  Loading messages...
                </div>
              ) : (
                groupedMessages().map((item, idx) => {
                  if (item.type === "date") {
                    return (
                      <div key={`date-${idx}`} style={{ textAlign: "center", margin: "16px 0" }}>
                        <span
                          style={{
                            background: C.dateLabelBg,
                            color: C.subText,
                            fontSize: 12,
                            fontWeight: 500,
                            padding: "4px 14px",
                            borderRadius: 8,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  }

                  const msg = item.data;
                  const isMe = msg.sender?._id === myId || msg.sender === myId;
                  const isDeleted = msg.deletedForEveryone;

                  return (
                    <div
                      key={msg._id || idx}
                      className="msg-in msg-bubble"
                      style={{
                        display: "flex",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        marginBottom: 4,
                      }}
                      onContextMenu={(e) => handleRightClick(e, msg)}
                    >
                      <div
                        style={{
                          maxWidth: "65%",
                          position: "relative",
                        }}
                      >
                        {/* Bubble */}
                        <div
                          style={{
                            background: isDeleted
                              ? isDark ? "#1a2533" : "#f5f5f5"
                              : isMe ? C.myBubble : C.theirBubble,
                            color: isDeleted ? C.subText : C.text,
                            padding: "8px 14px",
                            borderRadius: isMe
                              ? "16px 16px 4px 16px"
                              : "16px 16px 16px 4px",
                            fontSize: 14,
                            lineHeight: 1.5,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                            fontStyle: isDeleted ? "italic" : "normal",
                            wordBreak: "break-word",
                          }}
                        >
                          {isDeleted ? "🚫 This message was deleted" : msg.message}

                          {/* Time + tick + edited */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              alignItems: "center",
                              gap: 4,
                              marginTop: 4,
                              marginBottom: -2,
                            }}
                          >
                            {msg.edited && !isDeleted && (
                              <span style={{ fontSize: 11, color: C.subText, fontStyle: "italic" }}>
                                edited
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: C.subText }}>
                              {formatTime(msg.createdAt)}
                            </span>
                            {isMe && !isDeleted && <TickIcon status={msg.status} />}
                          </div>
                        </div>

                        {/* Hover actions */}
                        {!isDeleted && (
                          <div
                            className="msg-actions"
                            style={{
                              position: "absolute",
                              top: "50%",
                              transform: "translateY(-50%)",
                              [isMe ? "left" : "right"]: "calc(100% + 6px)",
                              opacity: 0,
                              transition: "opacity 0.15s",
                              display: "flex",
                              gap: 4,
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenu({ x: e.clientX, y: e.clientY, msg });
                              }}
                              style={{
                                background: isDark ? "#2a3942" : "#fff",
                                border: "none",
                                borderRadius: "50%",
                                width: 28,
                                height: 28,
                                cursor: "pointer",
                                color: C.subText,
                                fontSize: 14,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              }}
                            >
                              ▾
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 8 }}>
                  <div
                    style={{
                      background: C.theirBubble,
                      borderRadius: "16px 16px 16px 4px",
                      padding: "10px 16px",
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          background: C.subText,
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: `bounce 1.2s ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Edit Banner */}
            {editingMsg && (
              <div
                style={{
                  background: isDark ? "#1e3a2f" : "#d9fdd3",
                  padding: "8px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: `2px solid ${C.accent}`,
                }}
              >
                <div>
                  <p style={{ color: C.accent, fontSize: 12, fontWeight: 700, margin: 0 }}>
                    ✏️ Editing message
                  </p>
                  <p style={{ color: C.subText, fontSize: 13, margin: 0, marginTop: 2 }}>
                    {editingMsg.message.slice(0, 60)}
                    {editingMsg.message.length > 60 ? "..." : ""}
                  </p>
                </div>
                <button
                  onClick={() => { setEditingMsg(null); setText(""); }}
                  style={{ background: "none", border: "none", color: C.subText, cursor: "pointer", fontSize: 20 }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Input Area */}
            <div
              style={{
                padding: "10px 20px",
                background: C.headerBg,
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  flex: 1,
                  background: C.inputBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 24,
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 18px",
                  gap: 10,
                }}
              >
                <input
                  ref={inputRef}
                  value={text}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  placeholder={editingMsg ? "Edit your message..." : "Type a message"}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: C.text,
                    fontSize: 15,
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!text.trim()}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: text.trim() ? C.accent : isDark ? "#2a3942" : "#e0e0e0",
                  border: "none",
                  cursor: text.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2 21L23 12L2 3V10L17 12L2 14V21Z"
                    fill={text.trim() ? "#fff" : C.subText}
                  />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ===================== CONTEXT MENU ===================== */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: isDark ? "#233138" : "#fff",
            borderRadius: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            zIndex: 9999,
            minWidth: 180,
            overflow: "hidden",
            border: `1px solid ${C.border}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            {
              label: "ℹ️  Message Info",
              action: () => { setShowInfo(contextMenu.msg); setContextMenu(null); },
              show: true,
            },
            {
              label: "✏️  Edit Message",
              action: () => {
                setEditingMsg(contextMenu.msg);
                setText(contextMenu.msg.message);
                setContextMenu(null);
                inputRef.current?.focus();
              },
              show: contextMenu.msg.sender?._id === myId && !contextMenu.msg.deletedForEveryone,
            },
            {
              label: "🗑️  Delete Message",
              action: () => { setShowDeleteModal(contextMenu.msg); setContextMenu(null); },
              show: !contextMenu.msg.deletedForEveryone,
              danger: true,
            },
          ]
            .filter((item) => item.show)
            .map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 18px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: item.danger ? "#ef4444" : C.text,
                  fontSize: 14,
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.target.style.background = isDark ? "#2a3942" : "#f5f6f6")}
                onMouseLeave={(e) => (e.target.style.background = "transparent")}
              >
                {item.label}
              </button>
            ))}
        </div>
      )}

      {/* ===================== MESSAGE INFO MODAL ===================== */}
      {showInfo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowInfo(null)}
        >
          <div
            style={{
              background: isDark ? "#233138" : "#fff",
              borderRadius: 12,
              padding: 28,
              minWidth: 320,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: C.text, marginBottom: 20, fontSize: 16, fontWeight: 700 }}>
              ℹ️ Message Info
            </h3>
            <div style={{ color: C.text, fontSize: 14, marginBottom: 16 }}>
              <strong>Message:</strong>
              <p style={{ color: C.subText, marginTop: 4 }}>{showInfo.message}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.subText, fontSize: 13 }}>Sent</span>
                <span style={{ color: C.text, fontSize: 13 }}>
                  {new Date(showInfo.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.subText, fontSize: 13 }}>Status</span>
                <span style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>
                  {showInfo.status === "read"
                    ? "✓✓ Read"
                    : showInfo.status === "delivered"
                    ? "✓✓ Delivered"
                    : "✓ Sent"}
                </span>
              </div>
              {showInfo.edited && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.subText, fontSize: 13 }}>Edited</span>
                  <span style={{ color: "#f59e0b", fontSize: 13 }}>Yes</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowInfo(null)}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "10px",
                background: C.accent,
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 14,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===================== DELETE MODAL ===================== */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowDeleteModal(null)}
        >
          <div
            style={{
              background: isDark ? "#233138" : "#fff",
              borderRadius: 12,
              padding: 28,
              minWidth: 320,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: C.text, marginBottom: 8, fontSize: 16, fontWeight: 700 }}>
              🗑️ Delete Message
            </h3>
            <p style={{ color: C.subText, fontSize: 14, marginBottom: 24 }}>
              This action cannot be undone.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => handleDelete(showDeleteModal, "me")}
                style={{
                  padding: "11px 16px",
                  background: isDark ? "#2a3942" : "#f5f6f6",
                  border: "none",
                  borderRadius: 8,
                  color: C.text,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: "left",
                }}
              >
                Delete for Me
              </button>

              {showDeleteModal.sender?._id === myId && (
                <button
                  onClick={() => handleDelete(showDeleteModal, "everyone")}
                  style={{
                    padding: "11px 16px",
                    background: "#fee2e2",
                    border: "none",
                    borderRadius: 8,
                    color: "#ef4444",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  Delete for Everyone
                </button>
              )}

              <button
                onClick={() => setShowDeleteModal(null)}
                style={{
                  padding: "11px 16px",
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.subText,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 14,
                  textAlign: "left",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default ChatApp;