import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";

const Viewer = () => {
  const videoRef = useRef(null);
  const [ws, setWs] = useState(null);
  const [peer, setPeer] = useState(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");

    socket.onopen = () => {
      console.log("Connected to signaling server");
    };

    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (peer && data.type === "signal") {
        peer.signal(data.signal);
      }
    };

    setWs(socket);

    const p = new Peer({ trickle: false });

    p.on("signal", (signal) => {
      socket.send(JSON.stringify({ type: "signal", signal }));
    });

    p.on("connect", () => {
      console.log("Peer connected");
    });

    p.on("stream", (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    p.on("error", (err) => console.error("Peer error:", err));

    setPeer(p);

    return () => {
      socket.close();
      p.destroy();
    };
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        controls
        autoPlay
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
};

export default Viewer;
