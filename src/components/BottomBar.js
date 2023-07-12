import React from 'react'

const BottomBar = (props) => {
    const status = props.status;
  return (
       
<nav class="bg-slate-300 h-14 border-gray-200 dark:bg-gray-900 shadow-inner bottom-0">
  <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
    <div className='call_status mx-auto'>
        {
            status==="Connected" && <div className='text-lg font-extrabold text-emerald-500 m-auto'>Connected</div>
        }
        {
            status!=="Connected" && <div className='text-lg font-extrabold text-red-700 m-auto'>You are alone here!</div>
        }
    </div>
  </div>
</nav>

  )
}

export default BottomBar