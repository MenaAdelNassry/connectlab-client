import { useState, useEffect, useRef } from 'react';
import signalRService from '../services/signalRService';

export function useWebRTC() {
  // 1. الـ States الأساسية وحالات التحكم الجديدة
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [transferProgress, setTransferProgress] = useState(0);
  const [incomingFileRequest, setIncomingFileRequest] = useState(null);

  // حالات الأزرار (مكتوم ولا شغال)
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // 2. الـ Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const dataChannelRef = useRef(null);
  
  const fileWriterRef = useRef(null);
  const receivedSizeRef = useRef(0);
  const totalExpectedSizeRef = useRef(0);
  const fileReadyResolverRef = useRef(null);
  
  // مرجع لحفظ مسار الكاميرا الأصلي أثناء مشاركة الشاشة للرجوع إليه لاحقاً
  const cameraStreamRef = useRef(null);

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        cameraStreamRef.current = stream; // حفظ النسخة الأصلية
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setStatus("Camera permission denied!");
      }
    }
    startCamera();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      signalRService.stopConnection();
    };
  }, []);

  useEffect(() => {
    if (joined && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [joined]);

  // --- دوال التحكم في الصوت والكاميرا والشاشة ---

  // 1. كتم / فتح الصوت
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // 2. إيقاف / تشغيل الكاميرا
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // 3. مشاركة الشاشة (Screen Sharing) عبر replaceTrack
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // طلب مشاركة الشاشة من المتصفح
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // تحديث عرض الفيديو المحلي للشاشة المشتَركة
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // استبدال مسار الكاميرا بمسار الشاشة في الـ PeerConnection المرسل للطرف التاني
        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            await sender.replaceTrack(screenTrack);
          }
        }

        setIsScreenSharing(true);
        setStatus("Screen sharing active 🖥️");

        // لو المستخدم ضغط على زر Stop Sharing الأصلي الخاص بشريط المتصفح العلوي
        screenTrack.onended = () => {
          stopScreenShare();
        };

      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Error sharing screen:", err);
      setStatus("Screen share cancelled or failed.");
    }
  };

  // دالة مساعدة لإيقاف مشاركة الشاشة والرجوع للكاميرا
  const stopScreenShare = async () => {
    if (cameraStreamRef.current && pcRef.current) {
      const cameraVideoTrack = cameraStreamRef.current.getVideoTracks()[0];
      
      const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        await sender.replaceTrack(cameraVideoTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStreamRef.current;
      }
    }

    setIsScreenSharing(false);
    setStatus("Connected P2P Successfully! 🚀");
  };

  // --- دوال الـ WebRTC والـ Data Channel ---

  const setupDataChannel = (channel) => {
    dataChannelRef.current = channel;
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => setStatus("Connected P2P & Stream Ready! 📁💬");

    channel.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const data = JSON.parse(event.data);

        if (data.type === 'chat') {
          setMessages(prev => [...prev, { sender: 'peer', type: 'text', text: data.text }]);
        } 
        else if (data.type === 'file-meta') {
          totalExpectedSizeRef.current = data.size;
          receivedSizeRef.current = 0;
          setIncomingFileRequest(data);
          setStatus(`Incoming file offer: ${data.name}`);
        }
        else if (data.type === 'file-ready') {
          if (fileReadyResolverRef.current) {
            fileReadyResolverRef.current();
            fileReadyResolverRef.current = null;
          }
        }
      } 
      else if (event.data instanceof ArrayBuffer) {
        if (fileWriterRef.current) {
          await fileWriterRef.current.write(event.data);
          receivedSizeRef.current += event.data.byteLength;

          const progress = Math.round((receivedSizeRef.current / totalExpectedSizeRef.current) * 100);
          setTransferProgress(progress);

          if (receivedSizeRef.current === totalExpectedSizeRef.current) {
            await fileWriterRef.current.close();
            fileWriterRef.current = null;

            setMessages(prev => [
              ...prev,
              { 
                sender: 'peer', 
                type: 'file', 
                fileName: incomingFileRequest?.name || "Received File", 
                fileSize: totalExpectedSizeRef.current,
                savedToDisk: true 
              }
            ]);

            setStatus("File saved successfully to disk! 🚀");
            setTransferProgress(0);
            setIncomingFileRequest(null);
          }
        }
      }
    };
  };

  const createPeerConnection = (currentRoomId, isCaller) => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    if (isCaller) {
      const channel = pc.createDataChannel("connectlab-file-chat");
      setupDataChannel(channel);
    } else {
      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalRService.sendIceCandidate(currentRoomId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setStatus("Connected P2P Successfully! 🚀");
      }
    };

    if (isCaller) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          signalRService.sendOffer(currentRoomId, pc.localDescription);
          setStatus("Offer sent, waiting for answer...");
        })
        .catch(err => console.error("Error creating offer:", err));
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId) return;
    setStatus("Connecting to SignalR...");

    try {
      await signalRService.startConnection();
      await signalRService.joinRoom(roomId);
      setJoined(true);
      setStatus("Joined room. Waiting for peers...");

      signalRService.onUserJoined(() => {
        setStatus("Peer joined! Creating offer...");
        createPeerConnection(roomId, true);
      });

      signalRService.onReceiveOffer(async (offer) => {
        setStatus("Received offer, creating answer...");
        if (!pcRef.current) {
          createPeerConnection(roomId, false);
        }
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        signalRService.sendAnswer(roomId, answer);
        setStatus("Answer sent!");
      });

      signalRService.onReceiveAnswer(async (answer) => {
        setStatus("Received answer, establishing connection...");
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      signalRService.onReceiveIceCandidate(async (candidate) => {
        if (pcRef.current && candidate) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Error adding received ice candidate", e);
          }
        }
      });

      signalRService.onUserLeft(() => {
        setStatus("Peer left the room.");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        dataChannelRef.current = null;
      });

    } catch (err) {
      console.error("Failed to join room:", err);
      setStatus("Failed to connect!");
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      const payload = JSON.stringify({ type: 'chat', text: inputMessage });
      dataChannelRef.current.send(payload);

      setMessages(prev => [...prev, { sender: 'me', type: 'text', text: inputMessage }]);
      setInputMessage('');
    } else {
      alert("Data channel is not open yet!");
    }
  };

  const acceptIncomingFile = async () => {
    if (!incomingFileRequest) return;

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: incomingFileRequest.name
      });
      
      const writableStream = await handle.createWritable();
      fileWriterRef.current = writableStream;

      setStatus(`Ready for stream: ${incomingFileRequest.name}`);
      dataChannelRef.current.send(JSON.stringify({ type: 'file-ready' }));
      
      setIncomingFileRequest(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error creating file writer:", err);
        setStatus("File save cancelled or failed.");
      }
      setIncomingFileRequest(null);
    }
  };

  const sendFile = async (file) => {
    if (!file) return;

    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      alert("Data channel is not open!");
      return;
    }

    const metaPayload = JSON.stringify({
      type: 'file-meta',
      name: file.name,
      size: file.size,
      mimeType: file.type
    });
    dataChannelRef.current.send(metaPayload);

    setMessages(prev => [
      ...prev,
      { sender: 'me', type: 'file', fileName: file.name, fileSize: file.size }
    ]);

    setStatus(`Waiting for peer to accept ${file.name}...`);

    await new Promise((resolve) => {
      fileReadyResolverRef.current = resolve;
    });

    const stream = file.stream();
    const reader = stream.getReader();
    let sentBytes = 0;
    const CHUNK_SIZE = 32768;

    setStatus(`Streaming file: ${file.name}...`);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (let offset = 0; offset < value.byteLength; offset += CHUNK_SIZE) {
          const chunk = value.subarray(offset, offset + CHUNK_SIZE);

          while (dataChannelRef.current.bufferedAmount > 512 * 1024) {
            await new Promise(resolve => setTimeout(resolve, 2));
          }

          dataChannelRef.current.send(chunk);
        }

        sentBytes += value.byteLength;
        const progress = Math.round((sentBytes / file.size) * 100);
        setTransferProgress(progress);
      }

      setStatus("File stream sent successfully! 🚀");
      setTransferProgress(0);
    } catch (err) {
      console.error("Error during file streaming:", err);
      setStatus("File stream failed!");
      setTransferProgress(0);
    }
  };

  return {
    roomId,
    setRoomId,
    joined,
    status,
    messages,
    inputMessage,
    setInputMessage,
    transferProgress,
    incomingFileRequest,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    localVideoRef,
    remoteVideoRef,
    handleJoinRoom,
    sendMessage,
    sendFile,
    acceptIncomingFile,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  };
}