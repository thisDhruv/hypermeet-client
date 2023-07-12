import React from 'react'
import ReactPlayer from 'react-player'

const Player = (props) => {
  return (
    <ReactPlayer playing muted className="m-auto bg-black" width="500px" height="500px" url={props.stream}/>
  )
}

export default Player