import {Routes, Route} from 'react-router-dom';
import './App.css';
import Lobby from './screens/Lobby';
import NavBar from './components/NavBar';
import Room from './screens/Room';
import { useState } from 'react';

function App() {
  const[email,setEmail] = useState('');
  const[room,setRoom] = useState('');
  return (
    <div className="App">
      <NavBar/>
      <Routes>
        <Route path="/" element={<Lobby room={room} setRoom={setRoom} email={email} setEmail={setEmail}/>}/>
        <Route path="/room/:roomId" element={<Room email={email} room={room}/>}/>
      </Routes>
    </div>
  );
}

export default App;
