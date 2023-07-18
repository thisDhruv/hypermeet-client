import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../context/SocketProvider'
import { BsFillEmojiSmileFill } from 'react-icons/bs';
import EmojiPicker, {
    EmojiStyle,
    SkinTones,
    Theme,
    Categories,
    EmojiClickData,
    Emoji,
    SuggestionMode,
    SkinTonePickerLocation
  } from "emoji-picker-react";


const Chat = (props) => {
    const socket = useSocket();
    const [message,setMessage] = useState('');
    const remoteSocketId=props.remoteSocketId;
    const [chat,setChat] = useState([]);
    const [emojiSelector,setEmojiSelector] = useState(false);

  function handleEmojiClick(emojiData) {
    setMessage(message+emojiData.emoji)
  }


    const handleSendMessage = (e)=>{
        setEmojiSelector(false)
        e.preventDefault();
        socket.emit("outgoing:message", { to: remoteSocketId,message:message});
        let newchat = chat;
        newchat.push({message:message,code:0})
        setChat(newchat);
        setMessage("");
    }
    const handleIncomingMessage = useCallback(({from,message})=>{
        let newchat = chat;
        newchat.push({message:message,code:1})
        setChat(newchat);
        console.log(message);
        console.log(chat);
    },[])
    useEffect(() => {
        socket.on("incoming:message",handleIncomingMessage);
      return () => {
        socket.off("incoming:message",handleIncomingMessage);
      }
    }, [socket])
    

  return (
    <div className='relative h-[500px] shadow-md '>
        <div className='h-[500px] overflow-auto'>
        <div className="h-max overflow-y-scroll flex flex-col p-2">
            
            {
                
                chat.map((object)=>{
                    // console.log(object);
                   if(object.code==1){
                        return <div className="break-words w-min max-w-full  shadow-md h-auto rounded-md mt-5 border bg-green-100 text-left p-2">
                        {object.message}
                    </div>
                   }else{
                    return <div className="w-min max-w-full break-words shadow-md h-auto rounded-md mt-5 border right-0 self-end  bg-green-100 text-left p-2 ">
                    {object.message}
                </div>
                   }
                    
                })
            }
            
        </div>
        </div>
       
        
 
    
        <div className='absolute m-auto bottom-0 w-full bg-slate-300'>
    <div class="relative"> 
        {
            emojiSelector && <EmojiPicker onEmojiClick={handleEmojiClick}  className="absolute" height={420} width={270} />
        }
        <form>
        <BsFillEmojiSmileFill onClick={()=>{setEmojiSelector(!emojiSelector)}} className='absolute left-2.5 bottom-5 cursor-pointer'/>
        <input type="search" id="search" onChange={(e)=>{setMessage(e.target.value)}}value={message} class="block w-full p-4 pl-8 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Type Here.." required/>
        <button type="submit" onClick={handleSendMessage} class="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Send</button>
        
        </form>
    </div>


        </div>
    </div>
  )
}

export default Chat