import React, { startTransition, useCallback, useEffect, useState, useRef } from 'react'
import { useSocket } from '../context/SocketProvider'
import ReactPlayer from 'react-player'
import peer from '../service/peer'
import Chat from '../components/Chat'
import BottomBar from '../components/BottomBar'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';


import * as tf from '@tensorflow/tfjs';
import * as handpose from"@tensorflow-models/handpose" ;
import * as fp from 'fingerpose'
import Webcam from "react-webcam";


const Room = (props) => {
    const socket = useSocket();
    const [remoteSocketId,setRemoteSocketId] = useState(null);
    const [myStream,setMyStream] = useState(null);
    const [remoteStream,setRemoteStream] = useState(null);
    const [remoteEmail,setRemoteEmail] = useState(null);
    const [videoOn,setVideoOn] = useState(true);
    const [remoteVideo,setRemoteVideo] = useState(true);
    const webcamRef=useRef(null);
    const canvasRef=useRef(null);
    const[state,toggletensor]=useState(1);
    const [handrun,handchange]=useState(1);
    const[combinedTranscript,setCombinedTranscript]=useState([]);
    const [message,setMessage] = useState('');


    const {
      transcript,
      interimTranscript,
      finalTranscript,
      resetTranscript,
      listening
    } = useSpeechRecognition({
      commands: [
        {
          command: "reset",
          callback: () => resetTranscript()
        }
      ]
    });
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      console.log(
        "Your browser does not support speech recognition software! Try Chrome desktop, maybe?"
      );
    }
  

    



  


    // const [roomStatus,setRoomStatus] = useState("You are alone here!");
    // let videoelement = null;

    // handpose
    const runHandPose=async()=>{
      const net=await handpose.load();
      console.log('handpose model loaded');
      console.log(state);
     if(state==1){ 
     setTimeout(function() {
      setInterval(()=>{detect(net)},1000);
     }, 10000);
    }}
    const detect =async (net)=>{
     
      if(typeof webcamRef.current!='undefined' && webcamRef.current!=null ){
        const video=webcamRef.current.video;
        
        
  
       
         const videoWidth=video.width;
         const videoHeight=video.height;
             
         video.width=videoWidth;
         video.height=videoHeight;
  
         canvasRef.current.width=videoWidth;
         canvasRef.current.height=videoHeight;
        
        const hand= await net.estimateHands(video);
        //console.log(hand);
        if(hand.length>0){
          const GE= new fp.GestureEstimator([
            fp.Gestures.VictoryGesture,
            fp.Gestures.ThumbsUpGesture,
            
          ])
          const gesture=await GE.estimate(hand[0].landmarks,8);
         // console.log(gesture);
          await sendEmoji(gesture);
        }
      }
    }
   if(handrun==1){
    runHandPose();
    handchange(0);
  }

  async function sendEmoji(data){
    if(!data.gestures[0])return;
    console.log("hi");
    if(data.gestures[0].name=="victory")setMessage(message+" ✌️");
    if(data.gestures[0].name=="thumbs_up")setMessage(message+" 👍");

    console.log(data.gestures[0].name);
  }
    //end

    const listenContinuously = () => {
      
      if(!listening){
        SpeechRecognition.startListening({
          continuous: true,
          language: "en"
        });
      }else{
        SpeechRecognition.stopListening();
      }
      
    }


    const handleUserJoined = useCallback(({email,id})=>{
        setRemoteSocketId(id);
        setRemoteEmail(email);
        console.log(email+", "+id+" joined");
    },[])

    const handleCallUser = async ()=>{
          const offer = await peer.getOffer();
          console.log("handleCallUser")
          sendStreams();
          socket.emit("user:call", { to: remoteSocketId, offer,fromEmail:props.email });
    }
    const handleIncomingCall = async ({from,offer,fromEmail})=>{
        setRemoteSocketId(from);
        // const offer = await peer.getOffer();
        const ans = await peer.getAnswer(offer);
        console.log("handleIncomingCall")
        setRemoteEmail(fromEmail);
        socket.emit("call:accepted",{to:from, ans});
    }
    const handleCallAccepted = useCallback(async ({from,ans})=>{
        console.log("handleCallAccepted")

        peer.setLocalDescription(ans);
        
        console.log("Call Accepted!");
        sendStreams();
    },[myStream]);
    

    const startUserStream = async()=>{
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        }); 
        
        setMyStream(stream);
    }

    const handleNegoNeeded = useCallback(async ()=>{
        console.log("handleNegoNeeded")

        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed',{offer,to:remoteSocketId});
    },[socket,remoteSocketId])
    
    const handleNegoNeedIncoming = useCallback(({from,offer})=>{
        console.log("handleNegoNeedIncoming")

        const ans = peer.getAnswer(offer);
        socket.emit("peer:nego:done",{to:from,ans});
    },[socket])

    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        console.log("handleNegoNeedFinal")

        await peer.setLocalDescription(ans);
      }, []);

      const sendStreams = useCallback(() => {
        console.log("sendStreams")

        for (const track of myStream.getTracks()) {
          peer.peer.addTrack(track, myStream);
        }
      }, [myStream]);

      const cameraToggleRemote = useCallback(() => {
        console.log("cameraToggleRemote camera use "+ !remoteVideo);
        setRemoteVideo(!remoteVideo);
      }, [myStream]);

      
      async function muteCam() {
        const temp=state;
        if(state==1)toggletensor(0);
        if(state==0)toggletensor(1);
      
        socket.emit("camera:toggle",{to:remoteSocketId});
        console.log("send camera toggle");
        setVideoOn(!videoOn);
      }
      
      const handleIncomingTranscript = useCallback(({from,speech,frommail}) => {
        let temp = combinedTranscript;
        temp.push(frommail +": "+speech)
        setCombinedTranscript(temp);
      }, []);
    
    
    useEffect(() => {
      console.log("useEffect1")

      peer.peer.addEventListener("negotiationneeded",handleNegoNeeded)
      return () => {
        peer.peer.removeEventListener("negotiationneeded",handleNegoNeeded)
      }
    }, [handleNegoNeeded])
    
    useEffect(() => {
        console.log("useEffect2")

      peer.peer.addEventListener('track',async (ev)=>{
        const remoteStream = ev.streams;
        setRemoteStream(remoteStream[0]);
      })
    
      return () => {
        
      }
    }, [peer])
    
    useEffect(() => {
        startUserStream();
        

    }, [socket,handleUserJoined,startUserStream,handleIncomingCall])
    

    useEffect(() => {

        socket.on("user:joined",handleUserJoined);
        socket.on("incoming:call",handleIncomingCall);
        socket.on("call:accepted",handleCallAccepted);
        socket.on("pero:nego:needed",handleNegoNeedIncoming);
        socket.on("peer:nego:final", handleNegoNeedFinal);
        socket.on("camera:toggle",cameraToggleRemote);
        socket.on("transcript:incoming",handleIncomingTranscript);

      return () => {
        socket.off("user:joined",handleUserJoined);
        socket.off("incoming:call",handleIncomingCall);
        socket.off("call:accepted",handleCallAccepted);
        socket.off("pero:nego:needed",handleNegoNeedIncoming);
        socket.off("peer:nego:final", handleNegoNeedFinal);
        socket.off("camera:toggle",cameraToggleRemote);
        socket.off("transcript:incoming",handleIncomingTranscript);


      }
    }, [socket,handleUserJoined,startUserStream,handleIncomingCall])

    useEffect(() => {
      if (finalTranscript !== "") {
        console.log("Got final result:", finalTranscript);
        socket.emit("transcript:outgoing", { to: remoteSocketId,speech:finalTranscript,frommail:props.email});
        let temp = combinedTranscript;
        temp.push(props.email +": "+finalTranscript)
        setCombinedTranscript(temp);
        console.log(combinedTranscript)
        resetTranscript();
      }
    }, [interimTranscript, finalTranscript]);

  return (
    <>
    <div className='m-auto m-10'>
<div className='w-full flex flex-row'>
    <div className="flex flex-row w-4/5">
   
   {
       myStream && <div className='relative player-wrapper m-auto'>
       <h4 class="text-2xl font-bold dark:text-white">{props.email}</h4>
       {
        videoOn &&   <Webcam ref={webcamRef}   style={{     width: 450,  height: 450,  }}/>
       }
       {
        !videoOn && <ReactPlayer muted className="m-auto bg-black" width="450px" height="450px" url={myStream}/>
       }
        
       </div>
   }
   
   {
       remoteStream &&
       <div className='relative player-wrapper m-auto'>
       <h4 class="text-2xl font-bold dark:text-white m-auto">{remoteEmail}</h4>
        {
        remoteVideo && <ReactPlayer playing className="m-auto bg-black" width="450px" height="450px" url={remoteStream}/>
        }
        {
            !remoteVideo &&  <ReactPlayer muted className="m-auto bg-black" width="450px" height="450px" url={remoteStream}/>
        }
        
       </div>
   }

   </div>
   <div className='w-1/5 mt-1 mr-2'>
    <div className="bg-slate-300 shadow-md p-3 text-2xl">
        CHAT
    </div>
    <Chat remoteSocketId={remoteSocketId} message={message} setMessage={setMessage}/>
   </div>

</div>

    
    
    {
        remoteSocketId && <>
        <button type="button"  onClick={handleCallUser} class="text-white mt-1 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">CALL</button>
        </>
    }
     <button type="button"  onClick={muteCam} class="text-white mt-1 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">{videoOn?<>Stream Off</>:<>Stream On</>}</button>
     <button type="button"  onClick={listenContinuously} class="text-white mt-1 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">{listening?"Off":"Start"} Transcript</button>

     <canvas ref={canvasRef}
      style={{
        position: "absolute",
        marginLeft: "auto",
        marginRight: "auto",
        left: 0,
        right: 0,
        textAlign: "center",
        zindex: 9,
        width: 450,
        height: 450,
      }}
    />
    
    
    </div>
    
    <BottomBar status={remoteSocketId==null?"You are alone":"Connected"}/>

    <h1 className="m-auto text-6xl">Transcript</h1>
    <h1 className="m-auto text-lime-200 text-2xl">{transcript}</h1>
    <div className='m-auto w-1/2 text-left'>
      {
        combinedTranscript.map((s)=>{
          return <div className='m-auto text-xl'>{s}</div>
        })
      }
    </div>
    </>
  )
}




// function App() {

//   return (
//    <div>

// videoOn &&   <Webcam ref={webcamRef}   style={{     width: 450,  height: 450,  }}
      
//     />
//     <canvas ref={canvasRef}
//       style={{
//         position: "absolute",
//         marginLeft: "auto",
//         marginRight: "auto",
//         left: 0,
//         right: 0,
//         textAlign: "center",
//         zindex: 9,
//         width: 450,
//         height: 450,
//       }}
//     />
//    </div>
//   );
// }


export default Room