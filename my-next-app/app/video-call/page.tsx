"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001"); // Replace with your signaling server URL

export default function VideoCall() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [callIncoming, setCallIncoming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [offerData, setOfferData] = useState<RTCSessionDescriptionInit | null>(null);

  useEffect(() => {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    peerConnection.current = new RTCPeerConnection(configuration);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    socket.on("offer", (offer) => {
      setOfferData(offer);
      setCallIncoming(true);
    });

    socket.on("answer", (answer) => {
      if (peerConnection.current) {
        peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", (candidate) => {
      if (peerConnection.current) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("call-ended", () => {
      endCall();
      alert("The other participant has ended the call.");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startCall = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support WebRTC.");
      return;
    }
    if (peerConnection.current && localVideoRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = stream;

      stream.getTracks().forEach((track) => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream);
        }
      });

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("offer", offer);
      setIsConnected(true);
    }
  };

  const acceptCall = async () => {
    if (peerConnection.current && offerData) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current!.srcObject = stream;

      stream.getTracks().forEach((track) => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream);
        }
      });

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offerData));

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("answer", answer);

      setCallIncoming(false);
      setIsConnected(true);
    }
  };

  const startScreenSharing = async () => {
    if (!peerConnection.current) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      videoTrack.onended = () => {
        stopScreenSharing();
      };

      if (peerConnection.current) {
        const senders = peerConnection.current.getSenders();
        const videoSender = senders.find((sender) => sender.track?.kind === "video");

        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      setIsSharingScreen(true);
    } catch (err) {
      console.error("Failed to start screen sharing:", err);
    }
  };

  const stopScreenSharing = () => {
    if (!peerConnection.current) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      const videoTrack = stream.getVideoTracks()[0];
      const senders = peerConnection.current?.getSenders();
      const videoSender = senders?.find((sender) => sender.track?.kind === "video");

      if (videoSender) {
        videoSender.replaceTrack(videoTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsSharingScreen(false);
    });
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localVideoRef.current?.srcObject) {
      const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current?.srcObject) {
      const tracks = (remoteVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      remoteVideoRef.current.srcObject = null;
    }

    socket.emit("end-call");
    setIsConnected(false);
    setCallIncoming(false);
    setIsSharingScreen(false);
  };

  return (
    <div>
      <h1>Video Call</h1>
      <div>
        <video ref={localVideoRef} autoPlay muted style={{ width: "45%", marginRight: "10px" }}></video>
        <video ref={remoteVideoRef} autoPlay style={{ width: "45%" }}></video>
      </div>
      {!isConnected && !callIncoming && <button onClick={startCall}>Start Call</button>}
      {callIncoming && (
        <div>
          <h2>Incoming Call...</h2>
          <button onClick={acceptCall}>Accept Call</button>
        </div>
      )}
      {isConnected && (
        <div>
          <button onClick={endCall}>End Call</button>
          {!isSharingScreen && <button onClick={startScreenSharing}>Share Screen</button>}
          {isSharingScreen && <button onClick={stopScreenSharing}>Stop Sharing</button>}
        </div>
      )}
    </div>
  );
}
