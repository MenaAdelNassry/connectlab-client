import { useRef } from 'react';

export default function ChatBox({ 
  messages, 
  inputMessage, 
  setInputMessage, 
  sendMessage, 
  sendFile, 
  transferProgress,
  incomingFileRequest,
  acceptIncomingFile 
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      sendFile(file);
      e.target.value = null;
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col h-[420px]">
      <h2 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
        <span>P2P Zero-RAM Stream 📁💬</span>
        {transferProgress > 0 && (
          <span className="text-xs text-blue-400 font-mono animate-pulse">
            Transfer: {transferProgress}%
          </span>
        )}
      </h2>

      {/* تنبيه استقبال ملف جديد مع زر الموافقة الأمني */}
      {incomingFileRequest && (
        <div className="bg-blue-950/60 border border-blue-500/50 rounded-lg p-3 mb-3 flex flex-col gap-2 animate-bounce">
          <p className="text-xs text-blue-200">
            📥 Incoming File: <span className="font-bold">{incomingFileRequest.name}</span> ({Math.round(incomingFileRequest.size / 1024)} KB)
          </p>
          <button
            onClick={acceptIncomingFile}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 px-3 rounded font-medium transition-colors text-center"
          >
            Accept & Save to Disk 💾
          </button>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm">
        {messages.length === 0 ? (
          <p className="text-slate-600 text-center text-xs mt-16">No messages or files yet. Stream directly P2P!</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2.5 rounded-lg max-w-[85%] ${
                msg.sender === 'me'
                  ? 'bg-blue-600 text-white ml-auto text-right'
                  : 'bg-slate-800 text-slate-200 mr-auto text-left'
              }`}
            >
              {msg.type === 'text' ? (
                <p className="break-words">{msg.text}</p>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold truncate">📎 {msg.fileName}</span>
                  <span className="text-[10px] opacity-75">({Math.round(msg.fileSize / 1024)} KB)</span>
                  {msg.sender === 'me' ? (
                    <span className="text-[10px] text-emerald-400 font-mono">Sent successfully ✓</span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-mono">Saved to Disk ✓</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} className="mt-3 flex gap-2 items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          title="Send File"
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-sm transition-colors border border-slate-700"
        >
          📎
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded text-sm font-medium transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}