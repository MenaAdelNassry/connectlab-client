import { useWebRTC } from './hooks/useWebRTC';
import VideoGrid from './components/VideoGrid';
import ChatBox from './components/ChatBox';

function App() {
  const {
    roomId,
    setRoomId,
    joined,
    status,
    messages,
    inputMessage,
    setInputMessage,
    localVideoRef,
    remoteVideoRef,
    handleJoinRoom,
    sendMessage,
    transferProgress,
    sendFile,
    incomingFileRequest,
    acceptIncomingFile,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  } = useWebRTC();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-6xl w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
        
        {/* Header & Status */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              ConnectLab 🚀 <span className="text-xs text-slate-400">Clean Architecture</span>
            </h1>
          </div>
          <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-emerald-400 border border-slate-700">
            {status}
          </div>
        </div>

        {/* Room Join Section */}
        {!joined ? (
          <div className="flex gap-3 max-w-md mx-auto w-full py-10">
            <input
              type="text"
              placeholder="Enter Room ID (e.g. room-1)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleJoinRoom}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Join Room
            </button>
          </div>
        ) : (
          /* Workspace: Videos + Chat */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <VideoGrid 
              localVideoRef={localVideoRef} 
              remoteVideoRef={remoteVideoRef}
              isAudioMuted={isAudioMuted}
              isVideoOff={isVideoOff}
              isScreenSharing={isScreenSharing}
              toggleAudio={toggleAudio}
              toggleVideo={toggleVideo}
              toggleScreenShare={toggleScreenShare}
            />
            <ChatBox 
              messages={messages} 
              inputMessage={inputMessage} 
              setInputMessage={setInputMessage} 
              sendMessage={sendMessage} 
              sendFile={sendFile}
              transferProgress={transferProgress}
              incomingFileRequest={incomingFileRequest}
              acceptIncomingFile={acceptIncomingFile}
            />
          </div>
        )}

      </div>
    </div>
  );
}

export default App;