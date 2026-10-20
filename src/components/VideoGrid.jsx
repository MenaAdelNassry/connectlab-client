export default function VideoGrid({ 
  localVideoRef, 
  remoteVideoRef, 
  isAudioMuted, 
  isVideoOff, 
  isScreenSharing, 
  toggleAudio, 
  toggleVideo, 
  toggleScreenShare 
}) {
  return (
    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* Local Video Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-between relative overflow-hidden group">
        <span className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur z-10 font-mono">
          You {isScreenSharing && '(Sharing Screen 🖥️)'}
        </span>
        
        <div className="w-full h-64 bg-slate-900 rounded flex items-center justify-center overflow-hidden my-2">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform -scale-x-100" 
          />
        </div>

        {/* Media Control Buttons Bar */}
        <div className="flex gap-2 w-full justify-center mt-2">
          <button
            onClick={toggleAudio}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
              isAudioMuted 
                ? 'bg-red-600/20 border-red-500 text-red-400 hover:bg-red-600/30' 
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isAudioMuted ? 'Unmute 🎤' : 'Mute 🎤'}
          </button>

          <button
            onClick={toggleVideo}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
              isVideoOff 
                ? 'bg-red-600/20 border-red-500 text-red-400 hover:bg-red-600/30' 
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isVideoOff ? 'Camera On 📹' : 'Camera Off 📹'}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
              isScreenSharing 
                ? 'bg-blue-600 border-blue-500 text-white animate-pulse' 
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isScreenSharing ? 'Stop Share 🖥️' : 'Share Screen 🖥️'}
          </button>
        </div>
      </div>

      {/* Remote Video Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-between relative overflow-hidden">
        <span className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur z-10 font-mono">
          Peer (Connected)
        </span>
        
        <div className="w-full h-64 bg-slate-900 rounded flex items-center justify-center overflow-hidden my-2">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover" 
          />
        </div>
        
        <div className="text-xs text-slate-500 font-mono mt-2">
          P2P Secure Video Stream
        </div>
      </div>

    </div>
  );
}