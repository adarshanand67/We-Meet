import React, { useState, useEffect, useRef, createRef } from "react";
import {
  Constants,
  createCameraVideoTrack,
  useMeeting,
  usePubSub,
} from "@videosdk.live/react-sdk";
import { BottomBar } from "./components/BottomBar";
import { SidebarConatiner } from "../components/sidebar/SidebarContainer";
import MemorizedParticipantView from "./components/ParticipantView";
import { PresenterView } from "../components/PresenterView";
import { useSnackbar } from "notistack";
import { nameTructed, trimSnackBarText } from "../utils/helper";
import useResponsiveSize from "../hooks/useResponsiveSize";
import WaitingToJoinScreen from "../components/screens/WaitingToJoinScreen";
import ConfirmBox from "../components/ConfirmBox";

export function MeetingContainer({
  onMeetingLeave,
  setIsMeetingLeft,
  selectedMic,
  selectedWebcam,
  selectWebcamDeviceId,
  setSelectWebcamDeviceId,
  selectMicDeviceId,
  setSelectMicDeviceId,
  useRaisedHandParticipants,
  raisedHandsParticipants,
  micEnabled,
  webcamEnabled,
}) {
  const bottomBarHeight = 60;

  // Setting up MeetingContainer states and refs
  const [containerHeight, setContainerHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [sideBarMode, setSideBarMode] = useState(null);
  const [localParticipantAllowedJoin, setLocalParticipantAllowedJoin] =
    useState(null);
  const [meetingError, setMeetingError] = useState(false);

  const mMeetingRef = useRef(); // Meeting reference to access meeting methods
  const containerRef = createRef(); // Ref to access container height and width
  const containerHeightRef = useRef(); // Ref to access container height
  const containerWidthRef = useRef(); // Ref to access container width
  const { enqueueSnackbar } = useSnackbar(); // Snackbar for showing notifications

  useEffect(() => {
    containerHeightRef.current = containerHeight;
    containerWidthRef.current = containerWidth;
  }, [containerHeight, containerWidth]); // Updating container height and width refs wheneever container height and width changes

  const sideBarContainerWidth = useResponsiveSize({
    xl: 400,
    lg: 360,
    md: 320,
    sm: 280,
    xs: 240,
  });

  useEffect(() => {
    const boundingRect = containerRef.current.getBoundingClientRect(); // Getting container height and width from container ref
    const { width, height } = boundingRect;

    if (height !== containerHeightRef.current) {
      setContainerHeight(height);
    }

    if (width !== containerWidthRef.current) {
      setContainerWidth(width);
    }
  }, [containerRef]); // Updating container height and width wheneever container ref changes

  const { participantRaisedHand } = useRaisedHandParticipants(); // Getting raised hand participants from useRaisedHandParticipants hook

  const _handleMeetingLeft = () => {
    setIsMeetingLeft(true); // Setting meeting left state to true
  };

  const _handleOnRecordingStateChanged = ({ status }) => {
    if (
      status === Constants.recordingEvents.RECORDING_STARTED ||
      status === Constants.recordingEvents.RECORDING_STOPPED
    ) {
      enqueueSnackbar(
        status === Constants.recordingEvents.RECORDING_STARTED
          ? "Meeting recording is started."
          : "Meeting recording is stopped."
      ); // Showing snackbar notification when recording is started or stopped
    }
  };

  function onParticipantJoined(participant) {
    // Change quality to low, med or high based on resolution
    participant && participant.setQuality("high"); // Setting participant quality to high
  }

  function onEntryResponded(participantId, name) {
    // console.log(" onEntryResponded", participantId, name);
    if (mMeetingRef.current?.localParticipant?.id === participantId) {
      if (name === "allowed") {
        setLocalParticipantAllowedJoin(true);
      } else {
        setLocalParticipantAllowedJoin(false);
        setTimeout(() => {
          _handleMeetingLeft();
        }, 3000);
      }
    }
  }

  async function onMeetingJoined() {
    const { changeWebcam, changeMic, muteMic, disableWebcam } =
      mMeetingRef.current; // Getting meeting methods from meeting ref

    if (webcamEnabled && selectedWebcam.id) {
      // If webcam is enabled and selected webcam id is present
      await new Promise((resolve) => {
        disableWebcam();
        setTimeout(async () => {
          const track = await createCameraVideoTrack({
            cameraId: selectedWebcam.id,
            optimizationMode: "motion",
            encoderConfig: "h1080p_w1920p",
            facingMode: "environment",
            multiStream: false,
          }); // Creating camera video track with selected webcam id
          changeWebcam(track); // Changing webcam to selected webcam
          resolve();
        }, 500);
      });
    }

    if (micEnabled && selectedMic.id) {
      // If mic is enabled and selected mic id is present
      await new Promise((resolve) => {
        muteMic();
        setTimeout(() => {
          changeMic(selectedMic.id); // Changing mic to selected mic
          resolve(); // Resolving promise
        }, 500);
      });
    }
  }
  function onMeetingLeft() {
    // console.log("onMeetingLeft");
    onMeetingLeave(); // Calling onMeetingLeave function
  }

  const _handleOnError = (data) => {
    // Handling meeting error
    const { code, message } = data;

    const joiningErrCodes = [
      4001, 4002, 4003, 4004, 4005, 4006, 4007, 4008, 4009, 4010,
    ];

    const isJoiningError = joiningErrCodes.findIndex((c) => c === code) !== -1; // Checking if error code is joining error code
    const isCriticalError = `${code}`.startsWith("500");

    new Audio(
      isCriticalError
        ? `https://static.videosdk.live/prebuilt/notification_critical_err.mp3`
        : `https://static.videosdk.live/prebuilt/notification_err.mp3`
    ).play(); // Playing error sound

    setMeetingError({
      code,
      message: isJoiningError ? "Unable to join meeting!" : message,
    });
  };

  const mMeeting = useMeeting({
    // Using useMeeting hook to create meeting
    onParticipantJoined,
    onEntryResponded,
    onMeetingJoined,
    onMeetingLeft,
    onError: _handleOnError,
    onRecordingStateChanged: _handleOnRecordingStateChanged,
  });

  const isPresenting = mMeeting.presenterId ? true : false; // Checking if presenter id is present

  useEffect(() => {
    mMeetingRef.current = mMeeting;
  }, [mMeeting]); // Updating meeting ref whenever meeting changes

  usePubSub("RAISE_HAND", {
    // Using usePubSub hook to subscribe to raise hand pubsub
    onMessageReceived: (data) => {
      const localParticipantId = mMeeting?.localParticipant?.id; // Which participant raised hand

      const { senderId, senderName } = data; // Getting sender id and name from data

      const isLocal = senderId === localParticipantId; // Checking if sender is local participant

      new Audio(
        `https://static.videosdk.live/prebuilt/notification.mp3`
      ).play();

      enqueueSnackbar(
        `${isLocal ? "You" : nameTructed(senderName, 15)} raised hand 🖐🏼` // Showing snackbar notification
      );

      participantRaisedHand(senderId); // Calling participantRaisedHand function to add participant to raised hand participants
    },
  });

  usePubSub("CHAT", {
    // Using usePubSub hook to subscribe to chat pubsub
    onMessageReceived: (data) => {
      const localParticipantId = mMeeting?.localParticipant?.id;

      const { senderId, senderName, message } = data;

      const isLocal = senderId === localParticipantId; // Checking if sender is local participant

      if (!isLocal) {
        new Audio(
          `https://static.videosdk.live/prebuilt/notification.mp3`
        ).play();

        enqueueSnackbar(
          trimSnackBarText(`${nameTructed(senderName, 15)} says: ${message}`) // Showing snackbar notification
        );
      }
    },
  });

  const isMobile = window.matchMedia(
    "only screen and (max-width: 768px)"
  ).matches;

  return (
    <div
      ref={containerRef}
      className="h-screen flex flex-col bg-gray-800" // Meeting container
    >
      {typeof localParticipantAllowedJoin === "boolean" ? ( // Checking if local participant is allowed to join
        localParticipantAllowedJoin ? (
          <>
            <div className={` flex flex-1 flex-row bg-gray-800 `}>
              <div className={`flex flex-1 `}>
                {/* Presenter View (Screen Sharing) */}
                {isPresenting ? (
                  <PresenterView height={containerHeight - bottomBarHeight} /> // If presenter is presenting then showing presenter view
                ) : null}
                {isPresenting && isMobile ? null : ( // If presenter is presenting and device is mobile then not showing participant view
                  <MemorizedParticipantView
                    isPresenting={isPresenting}
                    sideBarMode={sideBarMode}
                  />
                )}
              </div>

              <SidebarConatiner
                height={containerHeight - bottomBarHeight}
                sideBarContainerWidth={sideBarContainerWidth}
                setSideBarMode={setSideBarMode}
                sideBarMode={sideBarMode}
                raisedHandsParticipants={raisedHandsParticipants}
              />
            </div>

            <BottomBar
              bottomBarHeight={bottomBarHeight}
              sideBarMode={sideBarMode}
              setSideBarMode={setSideBarMode}
              setIsMeetingLeft={setIsMeetingLeft}
              selectWebcamDeviceId={selectWebcamDeviceId}
              setSelectWebcamDeviceId={setSelectWebcamDeviceId}
              selectMicDeviceId={selectMicDeviceId}
              setSelectMicDeviceId={setSelectMicDeviceId}
            />
          </>
        ) : (
          <></>
        )
      ) : (
        !mMeeting.isMeetingJoined && <WaitingToJoinScreen />
      )}
      <ConfirmBox
        open={meetingError}
        successText="OKAY"
        onSuccess={() => {
          setMeetingError(false);
        }}
        title={`Error Code: ${meetingError.code}`}
        subTitle={meetingError.message}
      />
    </div>
  );
}
