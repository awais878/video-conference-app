import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useParams } from "react-router-dom";
import "./VideoCall.css";

const socket = io("https://video-call-server-8hip.onrender.com");

const VideoCall = () => {
    const { roomId } = useParams();

    const localVideo = useRef();
    const remoteVideo = useRef();
    const peerConnection = useRef(null);

    const [stream, setStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [status, setStatus] = useState("Waiting for user...");

    // 🎥 Start Video + Peer Setup
    const startVideo = async () => {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        setStream(mediaStream);
        localVideo.current.srcObject = mediaStream;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ],
        });

        peerConnection.current = pc;

        mediaStream.getTracks().forEach((track) => {
            pc.addTrack(track, mediaStream);
        });

        pc.ontrack = (event) => {
            remoteVideo.current.srcObject = event.streams[0];
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", {
                    candidate: event.candidate,
                });
            }
        };
    };

    // 🚀 Main logic
    useEffect(() => {
        startVideo();

        socket.emit("join-room", roomId);

        socket.on("user-joined", async (userId) => {
            setStatus("User joined!");

            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            socket.emit("offer", { offer, to: userId });
        });

        socket.on("offer", async ({ offer, from }) => {
            setStatus("Connected!");

            await peerConnection.current.setRemoteDescription(offer);

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            socket.emit("answer", { answer, to: from });
        });

        socket.on("answer", async ({ answer }) => {
            await peerConnection.current.setRemoteDescription(answer);
        });

        socket.on("ice-candidate", async ({ candidate }) => {
            try {
                if (candidate) {
                    await peerConnection.current.addIceCandidate(candidate);
                }
            } catch (err) {
                console.error(err);
            }
        });

        return () => {
            socket.off("user-joined");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");

            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
        };

    }, [roomId]);

    // 🔇 Mute
    const toggleMute = () => {
        stream?.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setIsMuted(!isMuted);
    };

    // 🎥 Camera
    const toggleCamera = () => {
        stream?.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setIsCameraOff(!isCameraOff);
    };

    // 🖥 Screen Share
    const startScreenShare = async () => {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
        });

        const screenTrack = screenStream.getTracks()[0];

        localVideo.current.srcObject = screenStream;

        const sender = peerConnection.current
            ?.getSenders()
            .find((s) => s.track.kind === "video");

        if (sender) {
            sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
            const videoTrack = stream.getVideoTracks()[0];
            localVideo.current.srcObject = stream;

            if (sender) {
                sender.replaceTrack(videoTrack);
            }
        };
    };

    return (
        <div className="container">
            {/* Header */}
            <div className="header">
                <h2>Video Call</h2>
                <p className="status">{status}</p>

                <p style={{ marginTop: "10px", color: "#94a3b8" }}>
                    Share this link:
                </p>

                <div
                    style={{
                        background: "#1e293b",
                        padding: "10px",
                        borderRadius: "8px",
                        display: "inline-block",
                    }}
                >
                    {window.location.href}
                </div>
            </div>

            {/* Videos */}
            <div className="video-grid">
                <div className="video-wrapper">
                    <video ref={localVideo} autoPlay playsInline muted className="video" />
                    <span className="label">You</span>
                </div>

                <div className="video-wrapper">
                    <video ref={remoteVideo} autoPlay playsInline className="video" />
                    <span className="label">Remote</span>
                </div>
            </div>

            {/* Controls */}
            <div className="controls">
                <button onClick={toggleMute} className="button">
                    {isMuted ? "🔊 Unmute" : "🔇 Mute"}
                </button>

                <button onClick={toggleCamera} className="button">
                    {isCameraOff ? "🎥 Camera On" : "🚫 Camera Off"}
                </button>

                <button onClick={startScreenShare} className="button primary">
                    🖥 Share Screen
                </button>

                <button
                    onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link copied!");
                    }}
                    className="button"
                >
                    🔗 Copy Link
                </button>
            </div>
        </div>
    );
};

export default VideoCall;