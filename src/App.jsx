import React from "react";
import "./App.css";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Home from "./Home";
import Main from "./Main";
import UserForm from "./Userform";
import GameApp from "./GameApp";
import Viewer from "./Viewer";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

export default function App() {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return "loading ...";
  }
  if (error) {
    return "There was an error";
  }
  if (!user) {
    return <UserForm />;
  }

  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route path="/game/:id">
          <GameApp />
        </Route>
        <Route path="/stream">
          <Viewer />
        </Route>
      </Switch>
    </Router>
  );
}
