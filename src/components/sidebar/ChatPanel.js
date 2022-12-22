import {
  IconButton,
  InputAdornment,
  OutlinedInput as Input,
} from "@material-ui/core";
import { Send } from "@material-ui/icons";
import { useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import React, { useEffect, useRef, useState } from "react";
import { formatAMPM, json_verify, nameTructed } from "../../utils/helper";
import { useTheme } from "@material-ui/core/styles";

const ChatMessage = ({ senderId, senderName, text, timestamp }) => {
  // UI of one chat message
  const mMeeting = useMeeting(); // Get the meeting object from the meeting
  // console.log("mMeeting", mMeeting);
  const localParticipantId = mMeeting?.localParticipant?.id;
  const localSender = localParticipantId === senderId;

  return (
    <div
      className={`flex ${localSender ? "justify-end" : "justify-start"} mt-4`} // If localSender is true then justify-end else justify-start
      style={{
        maxWidth: "100%",
      }}
    >
      <div
        className={`flex ${
          localSender ? "items-end" : "items-start"
        } flex-col py-1 px-2 rounded-md bg-gray-700`}
      >
        <p style={{ color: "#ffffff80" }}>
          {localSender ? "You" : nameTructed(senderName, 15)}
        </p>
        <div>
          <p className="inline-block whitespace-pre-wrap break-words text-right text-white">
            {text}
          </p>
        </div>
        <div className="mt-1">
          <p className="text-xs italic" style={{ color: "#ffffff80" }}>
            {formatAMPM(new Date(timestamp))} {/* Format the timestamp */}
          </p>
        </div>
      </div>
    </div>
  );
};

const ChatInput = ({ inputHeight }) => {
  const [message, setMessage] = useState(""); // State to store the message
  const { publish } = usePubSub("CHAT");  // Get the publish function from the pubsub
  // console.log("publish", publish);
  const input = useRef(); // Ref to the input element
  const theme = useTheme();

  return (
    <div
      style={{
        height: inputHeight,
        width: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(1),
      }}
    >
      {/* Input element to accept text */}
      <Input
        style={{
          paddingRight: 0,
          width: "100%",
        }}
        minRows={1}
        maxRows={5}
        multiline
        id="outlined"
        onChange={(e) => {
          setMessage(e.target.value); // Set the message state
        }}
        ref={input}
        value={message}
        placeholder="Write your message 📧"
        onKeyPress={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            // If enter key is pressed and shift key is not pressed
            e.preventDefault();
            const messageText = message.trim(); // Trim the message to remove extra spaces

            if (messageText.length > 0) {
              publish(messageText, { persist: true }); // Publish the message to the pubsub channel
              setTimeout(() => {
                setMessage("");
              }, 100);
              input.current?.focus(); // Focus on the input element
            }
          }
        }}
        endAdornment={
          // Send button
          <InputAdornment position="end">
            <IconButton
              disabled={message.length < 2}
              variant="outlined"
              // theme={theme.palette.primary.main}
              onClick={() => {
                const messageText = message.trim(); // Trim the message to remove extra spaces
                if (messageText.length > 0) {
                  publish(messageText, { persist: true }); // Publish the message to the pubsub channel
                  setTimeout(() => {
                    setMessage("");
                  }, 100);
                  input.current?.focus();
                }
              }}
            >
              <Send />
            </IconButton>
          </InputAdornment>
        }
      />
    </div>
  );
};

const ChatMessages = ({ listHeight }) => {
  const listRef = useRef(); // for scrolling to bottom of chat
  const { messages } = usePubSub("CHAT"); // usePubSub hook to get messages from pubsub channel named "CHAT"
  // console.log(messages)

  const scrollToBottom = (data) => {
    // scroll to bottom of chat if new message is received
    // console.log(data);
    if (!data) {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    } else {
      const { text } = data;

      if (json_verify(text)) {
        const { type } = JSON.parse(text);
        if (type === "CHAT") {
          if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
          }
        }
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return messages ? ( // render messages if any
    <div ref={listRef} style={{ overflowY: "scroll", height: listHeight }}>
      <div className="p-4">
        {messages.map((msg, i) => {
          const { senderId, senderName, message, timestamp } = msg;
          return (
            <ChatMessage
              key={`chat_item_${i}`}
              {...{ senderId, senderName, text: message, timestamp }}
            />
          );
        })}
      </div>
    </div>
  ) : (
    <p>No messages</p>
  );
};

export function ChatPanel({ panelHeight }) {
  // console.log(panelHeight);
  const inputHeight = 72;
  const listHeight = panelHeight - inputHeight;

  return (
    <div>
    {/* Render all chat messages based on the input height */}
      <ChatMessages listHeight={listHeight} />
      <ChatInput inputHeight={inputHeight} />
    </div>
  );
}
