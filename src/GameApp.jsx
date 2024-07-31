import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import { gameSubject, initGame, resetGame } from "./Game";
import Board from "./Board";
import { useParams, useHistory } from "react-router-dom";
import { db } from "./firebase";
import Peer from "simple-peer";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "./redux/hook";
import {
  addIngestor,
  addStreamKey,
  addStreamServer,
} from "./redux/slice/EdgeCloudSlice";

import Hls from "hls.js";

const api_key = "srvacc_nf4ptxvez6tx1x9hsaagumcm9";
const api_secret = "d4j9vesvbeubsrqfpxd990h1gk14guxb";

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
  const videoRef = useRef(null);

  const params = useAppSelector((state) => state.edgeCloud);
  const dispatch = useAppDispatch();

  async function createStream() {
    const url = "https://api.thetavideoapi.com/stream";
    const headers = {
      "x-tva-sa-id": api_key,
      "x-tva-sa-secret": api_secret,
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
      console.log("createStream", data);
      // setStreamId(data.body.id);
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
      "x-tva-sa-id": api_key,
      "x-tva-sa-secret": api_secret,
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
      console.log("ingestorID", data);
      // setIngestorId(data.body.ingestors[1].id);
      dispatch(addIngestor(data.body.ingestors[0].id));
      // Call the function to select the ingestor
      await selectIngestor(data.body.ingestors[0].id);
    } catch (error) {
      toast("INGESTOR not avaialble, sorry, can't livestream at the moment");
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    }
  }

  async function selectIngestor(id) {
    const stream_id = localStorage.getItem("streamId");
    if (id.length > 10 && stream_id.length > 10) {
      console.log("ingestor id", id);
      const url = `https://api.thetavideoapi.com/ingestor/ingestor_${id}/select`;
      const headers = {
        "x-tva-sa-id": api_key,
        "x-tva-sa-secret": api_secret,
        "Content-Type": "application/json",
      };
      const body = JSON.stringify({
        tva_stream: `${stream_id}`,
      });

      try {
        const response = await fetch(url, {
          method: "PUT",
          headers: headers,
          body: body,
        });

        const data = await response.json();
        if (data.status === "error") {
          console.log(data);
          // await unselectIngestor(id);
          throw new Error(data.message + response.statusText);
        }
        console.log("got here");
        console.log(data);
        // setStreamServer(data.body.stream_server);
        // setStreamKey(data.body.stream_key);
        dispatch(addStreamKey(data.body.stream_key));
        localStorage.setItem("streamKey", data.body.stream_key);
        localStorage.setItem("streamServer", data.body.stream_server);
        dispatch(addStreamServer(data.body.stream_server));
      } catch (error) {
        toast(error.message);
        console.error(
          "There has been a problem with your fetch operation:",
          error
        );
      }
    }
  }

  async function unselectIngestor(ingestor) {
    const url = `https://api.thetavideoapi.com/ingestor/ingestor_${ingestor}/unselect`;

    const headers = {
      "x-tva-sa-id": api_key,
      "x-tva-sa-secret": api_secret,
      "Content-Type": "application/json",
    };
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.status === "error") {
        console.log("got here error block");
        throw new Error(data.message + response.statusText);
      }
      console.log(data);
      // await selectIngestor(ingestor);
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    }
  }

  async function getStreamInfo(streamId) {
    const url = `https://api.thetavideoapi.com/stream/${streamId}`;

    const headers = {
      "x-tva-sa-id": api_key,
      "x-tva-sa-secret": api_secret,
      "Content-Type": "application/json",
    };
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      const data = await response.json();
      if (data.status === "error") {
        console.log("got here error block");
        throw new Error(data.message + response.statusText);
      }
      console.log(data);
      // await selectIngestor(ingestor);
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    }
  }
  async function ListLiveStreamAcc() {
    const url = `https://api.thetavideoapi.com/service_account/srvacc_si4ctqs3g959v1uukq6chi4qi/streams`;

    const headers = {
      "x-tva-sa-id": "srvacc_si4ctqs3g959v1uukq6chi4qi",
      "x-tva-sa-secret": "nrmpczp7shujzndx1rd5bhvreajs5fhy",
      "Content-Type": "application/json",
    };
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      const data = await response.json();
      if (data.status === "error") {
        console.log("got here error block");
        throw new Error(data.message + response.statusText);
      }
      console.log(data);
      // await selectIngestor(ingestor);
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
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
  // Signaling server setup (WebSocket connection)

  const [ws, setWs] = useState(null);
  const [peer, setPeer] = useState(null);

  async function startStream() {
    const stream_id = localStorage.getItem("streamId");
    if (stream_id === null) {
      await createStream();
    }

    await getIngestors();

    const stream = await startScreenCapture();

    if (stream) {
      // const response = await fetch("http://localhost:3001/start-stream", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     stream_server:
      //       "rtmp://34.173.223.115:1935/live" /* params.addStreamServer */,
      //     stream_key:
      //       "P0RMTTzh9XkjQuW5i8O0Ixu4iiewB8E8" /* params.addStreamKey */,
      //   }),
      // });

      // if (response.ok) {
      const socket = new WebSocket("ws://localhost:3001");

      socket.onopen = () => {
        console.log("Connected to signaling server");
        // Inform the server to start streaming
        socket.send(JSON.stringify({ type: "start-stream" }));
      };

      socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (peer && data.type === "signal") {
          peer.signal(data.signal);
        }
      };

      setWs(socket);

      const p = new Peer({ initiator: true, trickle: false });

      p.on("signal", (signal) => {
        socket.send(JSON.stringify({ type: "signal", signal }));
      });

      p.on("connect", () => {
        console.log("Peer connected");
      });

      p.on("error", (err) => console.error("Peer error:", err));

      setPeer(p);

      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then((stream) => {
          p.addStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }

          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/webm; codecs=vp8",
          });

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              socket.send(
                JSON.stringify({ type: "stream-data", stream: event.data })
              );
            }
          };

          mediaRecorder.start(100); // Send data every 100ms
        });

      return () => {
        socket.close();
        p.destroy();
      };

      // } else {
      //   console.error("Failed to start stream");
      // }
    }
  }

  useEffect(() => {
    startStream();
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
          {/* <video
            ref={videoRef}
            controls
            autoPlay
            style={{ width: "100%", height: "auto" }}
          /> */}
        </div>
      )}
    </div>
  );
}

export default GameApp;
