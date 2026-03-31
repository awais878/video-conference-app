import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const [room, setRoom] = useState("");
    const navigate = useNavigate();

    const createRoom = () => {
        const randomId = Math.random().toString(36).substring(2, 8);
        navigate(`/${randomId}`);
    };

    const joinRoom = () => {
        if (room.trim() !== "") {
            navigate(`/${room}`);
        }
    };

    return (
        <div style={styles.container}>
            <h1>Video Call App</h1>

            <button onClick={createRoom} style={styles.button}>
                Create New Room
            </button>

            <div style={{ marginTop: "20px" }}>
                <input
                    placeholder="Enter Room ID"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    style={styles.input}
                />
                <button onClick={joinRoom} style={styles.button}>
                    Join Room
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        height: "100vh",
        background: "#0f172a",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
    button: {
        padding: "12px 20px",
        marginTop: "10px",
        borderRadius: "10px",
        border: "none",
        background: "#3b82f6",
        color: "white",
        cursor: "pointer",
    },
    input: {
        padding: "10px",
        borderRadius: "8px",
        border: "none",
        marginRight: "10px",
    },
};

export default Home;