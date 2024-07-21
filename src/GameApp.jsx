import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import { gameSubject, initGame, resetGame } from "./Game";
import Board from "./Board";
import { useParams, useHistory } from "react-router-dom";
import { db } from "./firebase";
import SimplePeer from "simple-peer";

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

  ///////////////////////////////VIDEO STREAMING/////////////////////////////
  const [peer, setPeer] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const startScreenSharing = async () => {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      videoRef.current.srcObject = stream;

      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: stream,
      });

      peer.on("signal", (data) => {
        // Send `data` to your signaling server to share with the other peer
        // This part requires a signaling server to exchange WebRTC signals
        console.log("Signal data:", data);
      });

      peer.on("connect", () => {
        console.log("Connected to peer");
      });

      peer.on("stream", (stream) => {
        // Display the incoming stream in your app
        videoRef.current.srcObject = stream;
      });

      setPeer(peer);
    };

    startScreenSharing();
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
        </div>
      )}
    </div>
  );
}

export default GameApp;
