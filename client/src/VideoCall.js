import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://video-call-server-8hip.onrender.com");

function VideoCall() {
    const { roomId } = useParams();

    const localVideo = useRef();
    const remoteVideo = useRef();
    const peerConnection = useRef();

    useEffect(() => {
        const init = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            localVideo.current.srcObject = stream;

            peerConnection.current = new RTCPeerConnection();

            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
            });

            peerConnection.current.ontrack = (event) => {
                remoteVideo.current.srcObject = event.streams[0];
            };

            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("ice-candidate", {
                        candidate: event.candidate
                    });
                }
            };

            socket.emit("join-room", roomId);

            socket.on("user-joined", async (userId) => {
                const offer = await peerConnection.current.createOffer();
                await peerConnection.current.setLocalDescription(offer);

                socket.emit("offer", { offer, to: userId });
            });

            socket.on("offer", async ({ offer, from }) => {
                await peerConnection.current.setRemoteDescription(offer);

                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);

                socket.emit("answer", { answer, to: from });
            });

            socket.on("answer", async ({ answer }) => {
                await peerConnection.current.setRemoteDescription(answer);
            });

            socket.on("ice-candidate", async ({ candidate }) => {
                if (candidate) {
                    await peerConnection.current.addIceCandidate(candidate);
                }
            });
        };

        init();
    }, [roomId]);

    return (
        <div style={{ textAlign: "center" }}>
            <h2>Room: {roomId}</h2>

            <p>Share this link:</p>
            <input value={window.location.href} readOnly />

            <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                <video ref={localVideo} autoPlay muted style={{ width: "300px" }} />
                <video ref={remoteVideo} autoPlay style={{ width: "300px" }} />
            </div>
        </div>
    );
}

export default VideoCall;