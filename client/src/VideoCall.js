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
    const [status, setStatus] = useState("Waiting...");

    useEffect(() => {
        const init = async () => {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            setStream(mediaStream);
            localVideo.current.srcObject = mediaStream;

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
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
                    socket.emit("ice-candidate", { candidate: event.candidate });
                }
            };

            socket.emit("join-room", roomId);

            socket.on("user-joined", async (userId) => {
                setStatus("User joined");

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                socket.emit("offer", { offer, to: userId });
            });

            socket.on("offer", async ({ offer, from }) => {
                setStatus("Connected");

                await pc.setRemoteDescription(offer);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit("answer", { answer, to: from });
            });

            socket.on("answer", async ({ answer }) => {
                await pc.setRemoteDescription(answer);
            });

            socket.on("ice-candidate", async ({ candidate }) => {
                if (candidate) {
                    await pc.addIceCandidate(candidate);
                }
            });
        };

        init();
    }, [roomId]);

    return (
        <div className="container">
            <h2>Room: {roomId}</h2>
            <p>{status}</p>

            <p>Share link:</p>
            <input value={window.location.href} readOnly />

            <div className="videos">
                <video ref={localVideo} autoPlay muted />
                <video ref={remoteVideo} autoPlay />
            </div>
        </div>
    );
};

export default VideoCall;