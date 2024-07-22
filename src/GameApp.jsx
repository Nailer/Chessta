import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import { gameSubject, initGame, resetGame } from "./Game";
import Board from "./Board";
import { useParams, useHistory } from "react-router-dom";
import { db } from "./firebase";
import SimplePeer from "simple-peer";
import toast from "react-hot-toast";

function GameApp() {
  const [board, setBoard] = useState([]);
  const [isGameOver, setIsGameOver] = useState();
  const [result, setResult] = useState();
  const [position, setPosition] = useState();
  const [initResult, setInitResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [game, setGame] = useState({});
  const { id } = useParams();
  const history = useHistory();
  const sharebleLink = window.location.href;
  const [streamId, setStreamId] = useState("");
  const [ingestorId, setIngestorId] = useState("");
  const [streamServer, setStreamServer] = useState("");
  const [streamKey, setStreamKey] = useState("");

  async function createStream() {
    const url = "https://api.thetavideoapi.com/stream";
    const headers = {
      "x-tva-sa-id": "srvacc_si4ctqs3g959v1uukq6chi4qi",
      "x-tva-sa-secret": "nrmpczp7shujzndx1rd5bhvreajs5fhy",
      "Content-Type": "application/json",
    };
    const body = JSON.stringify({ name: "demo" });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: body,
      });

      const data = await response.json();
      if (data.status === "error") {
        throw new Error(data.message + response.statusText);
      }
      setStreamId(data.body.id);
      localStorage.setItem("streamId", data.body.id);
    } catch (error) {
      toast(error.message);
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    }
  }

  async function getIngestors() {
    const url = "https://api.thetavideoapi.com/ingestor/filter";
    const headers = {
      "x-tva-sa-id": "srvacc_si4ctqs3g959v1uukq6chi4qi",
      "x-tva-sa-secret": "nrmpczp7shujzndx1rd5bhvreajs5fhy",
    };

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      const data = await response.json();
      if (data.status === "error") {
        throw new Error(data.message + response.statusText);
      }
      console.log(data);
      setIngestorId(data.body.ingestors[0].id);
    } catch (error) {
      toast(error.message);
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    }
  }

  async function selectIngestor() {
    const stream_id = localStorage.getItem("streamId");
    if (ingestorId.length > 10 && stream_id.length > 10) {
      const url = `https://api.thetavideoapi.com/ingestor/ingestor_${ingestorId}/select`;
      const headers = {
        "x-tva-sa-id": "srvacc_si4ctqs3g959v1uukq6chi4qi",
        "x-tva-sa-secret": "nrmpczp7shujzndx1rd5bhvreajs5fhy",
        "Content-Type": "application/json",
      };
      const body = JSON.stringify({
        tva_stream: `stream_${stream_id}`,
      });

      try {
        const response = await fetch(url, {
          method: "PUT",
          headers: headers,
          body: body,
        });

        const data = await response.json();
        if (data.status === "error") {
          throw new Error(data.message + response.statusText);
        }
        console.log(data);
        setStreamServer(data.body.stream_server);
        setStreamKey(data.body.stream_key);
      } catch (error) {
        toast(error.message);
        console.error(
          "There has been a problem with your fetch operation:",
          error
        );
      }
    }
  }

  async function startScreenCapture() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      return stream;
    } catch (err) {
      console.error("Error: " + err);
      return null;
    }
  }

  async function startStream() {
    if (streamId.length < 10) {
      // Call the function to create the stream
      createStream();
    }

    // Call the function to get ingestors
    getIngestors();

    // Call the function to select the ingestor
    selectIngestor();

    console.log(
      "streamId =",
      streamId,
      "ingestorId=",
      ingestorId,
      "streamServer=",
      streamServer,
      "streamKey=",
      streamKey
    );
    const stream = await startScreenCapture();

    if (stream) {
      const response = await fetch("http://localhost:3001/start-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stream_server: streamServer,
          stream_key: streamKey,
        }),
      });

      if (response.ok) {
        console.log("Stream started");
      } else {
        console.error("Failed to start stream");
      }
    }
  }

  ///////////////////////////////VIDEO STREAMING/////////////////////////////
  const [peer, setPeer] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    async function initPeer() {
      const stream = await startScreenCapture();
      const newPeer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: stream,
      });

      newPeer.on("signal", (data) => {
        console.log("Signal data:", data);
        // Send `data` to your signaling server to share with the other peer
      });

      newPeer.on("connect", () => {
        console.log("Connected to peer");
      });

      newPeer.on("stream", (remoteStream) => {
        // Display the incoming stream in your app
        videoRef.current.srcObject = remoteStream;
      });

      setPeer(newPeer);
    }

    initPeer();
  }, []);

  ///////////////////////////////VIDEO STREAMING/////////////////////////////

  useEffect(() => {
    let subscribe;
    async function init() {
      console.log("[db]", db);
      const res = await initGame(id !== "local" ? db.doc(`games/${id}`) : null);
      console.log("[res]", res);

      setInitResult(res);
      setLoading(false);
      if (!res) {
        subscribe = gameSubject.subscribe((game) => {
          setBoard(game.board);
          setIsGameOver(game.isGameOver);
          setResult(game.result);
          setPosition(game.position);
          setStatus(game.status);
          setGame(game);
        });
      }
    }

    init();

    return () => subscribe && subscribe.unsubscribe();
  }, [id]);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(sharebleLink);
  }

  if (loading) {
    return "Loading ...";
  }
  if (initResult === "notfound") {
    return "Game Not found";
  }

  if (initResult === "intruder") {
    return "The game is already full";
  }

  return (
    <div className="app-container">
      {isGameOver && (
        <h2 className="vertical-text">
          GAME OVER
          <button
            onClick={async () => {
              await resetGame();
              history.push("/");
            }}
          >
            <span className="vertical-text"> NEW GAME</span>
          </button>
        </h2>
      )}
      <div className="board-container">
        {game.oponent && game.oponent.name && (
          <span className="tag is-link">{game.oponent.name}</span>
        )}
        <Board board={board} position={position} />
        {game.member && game.member.name && (
          <span className="tag is-link">{game.member.name}</span>
        )}
      </div>
      {result && <p className="vertical-text">{result}</p>}
      {status === "waiting" && (
        <div className="notification is-link share-game">
          <strong>Share this game to continue</strong>
          <br />
          <br />
          <div className="field has-addons">
            <div className="control is-expanded">
              <input
                type="text"
                name=""
                id=""
                className="input"
                readOnly
                value={sharebleLink}
              />
            </div>
            <div className="control">
              <button className="button is-info" onClick={copyToClipboard}>
                Copy
              </button>
            </div>
          </div>
          <div className="button is-info" onClick={startStream}>
            Go live{" "}
          </div>
        </div>
      )}
    </div>
  );
}

export default GameApp;
