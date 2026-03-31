import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Home.css";

function Home() {
    const navigate = useNavigate();
    const [roomInput, setRoomInput] = useState("");

    const createRoom = () => {
        const roomId = Math.random().toString(36).substring(2, 8);
        navigate(`/room/${roomId}`);
    };

    const joinRoom = () => {
        if (roomInput.trim() !== "") {
            navigate(`/room/${roomInput}`);
        }
    };

    return (
        <div className="home-container">
            <h1>Video Conference App</h1>

            <button className="btn" onClick={createRoom}>
                Create New Room
            </button>

            <div className="join-box">
                <input
                    placeholder="Enter Room ID"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                />
                <button className="btn" onClick={joinRoom}>
                    Join Room
                </button>
            </div>
        </div>
    );
}

export default Home;