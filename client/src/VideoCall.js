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
    const socketIdRef = useRef(null);

    const [status, setStatus] = useState("Waiting...");

    useEffect(() => {
        const init = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            localVideo.current.srcObject = stream;

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });

            peerConnection.current = pc;

            // add tracks
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            // remote video
            pc.ontrack = (event) => {
                remoteVideo.current.srcObject = event.streams[0];
            };

            // ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate && socketIdRef.current) {
                    socket.emit("ice-candidate", {
                        candidate: event.candidate,
                        to: socketIdRef.current,
                    });
                }
            };

            // join room
            socket.emit("join-room", roomId);

            // when someone joins
            socket.on("user-joined", async (userId) => {
                socketIdRef.current = userId;
                setStatus("User joined");

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                socket.emit("offer", {
                    offer,
                    to: userId,
                });
            });

            // receive offer
            socket.on("offer", async ({ offer, from }) => {
                socketIdRef.current = from;
                setStatus("Connected");

                await pc.setRemoteDescription(offer);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit("answer", {
                    answer,
                    to: from,
                });
            });

            // receive answer
            socket.on("answer", async ({ answer }) => {
                await pc.setRemoteDescription(answer);
            });

            // receive ICE
            socket.on("ice-candidate", async ({ candidate }) => {
                try {
                    if (candidate) {
                        await pc.addIceCandidate(candidate);
                    }
                } catch (err) {
                    console.error("ICE error:", err);
                }
            });
        };

        init();

        return () => {
            socket.off("user-joined");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
        };
    }, [roomId]);

    return (
        <div className="container">
            <h2>Room: {roomId}</h2>
            <p>{status}</p>

            <p>Share this link:</p>
            <input value={window.location.href} readOnly />

            <div className="videos">
                <video ref={localVideo} autoPlay muted />
                <video ref={remoteVideo} autoPlay />
            </div>
        </div>
    );
};

export default VideoCall;