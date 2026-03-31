import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
        <div style={{ textAlign: "center", marginTop: "100px" }}>
            <h1>Video Call App</h1>

            <button onClick={createRoom}>Create New Room</button>

            <br /><br />

            <input
                placeholder="Enter Room ID"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
            />

            <button onClick={joinRoom}>Join Room</button>
        </div>
    );
}

export default Home;