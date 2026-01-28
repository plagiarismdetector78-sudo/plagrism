// pages/meeting/[roomId].js
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import io from "socket.io-client";
import QuestionPanel from "../../components/QuestionPanel";

let socket;

export default function MeetingPage() {
  const router = useRouter();
  const { roomId } = router.query;
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const transcriptionIntervalRef = useRef(null);

  const audioChunksRef = useRef([]);
  const localVideoContainerRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [userRole, setUserRole] = useState(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [fullTranscript, setFullTranscript] = useState(""); // Entire interview transcript (for display)
  const [currentQuestionTranscript, setCurrentQuestionTranscript] = useState(""); // Transcript for CURRENT question only
  const [questionAnswers, setQuestionAnswers] = useState([]); // Store all Q&A pairs: [{questionId, questionText, answer}]
  const [interviewStartTime, setInterviewStartTime] = useState(null); // Track when interview started
  const [questionCount, setQuestionCount] = useState(1); // Track total questions asked (start at 1)
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true); // Always show transcript
  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(true);
  // Question and plagiarism detection state
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [plagiarismScore, setPlagiarismScore] = useState(null);
  const [plagiarismDetails, setPlagiarismDetails] = useState(null);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [showQuestionPanel, setShowQuestionPanel] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [questionCategory, setQuestionCategory] = useState('Computer Science');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  // Draggable video state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVideoHidden, setIsVideoHidden] = useState(false);

  // 🔐 FORCE ROLE LOGIC (PHASE 2)
useEffect(() => {
  const role = localStorage.getItem("role");
  if (role === "interviewer") {
    setUserRole("interviewer");
  } else {
    setUserRole("candidate");
    localStorage.setItem("role", "candidate");
  }
}, []);


  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Initialize interview start time when first question appears
  useEffect(() => {
    if (currentQuestion && userRole === 'interviewer' && !interviewStartTime) {
      const startTime = Date.now();
      setInterviewStartTime(startTime);
      console.log('⏱️ Interview initialized with first question at:', new Date(startTime).toISOString());
      console.log('📊 Initial question count:', questionCount);
    }
  }, [currentQuestion, userRole]);

  // Auto-hide controls on mobile after 3 seconds
  useEffect(() => {
    if (!isMobile) return;

    let timeoutId;
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setShowControls(false), 3000);
    };

    const handleInteraction = () => {
      resetTimer();
    };

    resetTimer();

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('click', handleInteraction);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [isMobile]);



useEffect(() => {
    // Don't run if roomId or userRole is not ready
    if (!roomId || !userRole) {
      console.log("Waiting for roomId and userRole...");
      return;
    }

    console.log("🚀 Initializing meeting for room:", roomId, "as", userRole);

    // Connect to the signaling server with enhanced error handling
    const signalingServerUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER || "http://localhost:4000";
    console.log("🔌 Connecting to signaling server:", signalingServerUrl);
    
    socket = io(signalingServerUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

// Socket connection event handlers
socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
  setConnectionStatus("Socket connected");
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error);
  setConnectionStatus(`Connection failed - Check if signaling server is running at ${signalingServerUrl}`);
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ Socket disconnected:", reason);
  setConnectionStatus("Disconnected: " + reason);
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`🔄 Reconnection attempt ${attemptNumber}`);
  setConnectionStatus(`Reconnecting... (${attemptNumber})`);
});

 const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ],
});
pcRef.current = pc;

console.log("✅ PeerConnection created");



    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setConnectionStatus(state);
      console.log("🔗 Connection state:", state);
      
      if (state === "connected") {
        console.log("✅ WebRTC connection established!");
      } else if (state === "failed" || state === "disconnected") {
        console.log("❌ Connection failed/disconnected");
      }
    };

    // FIXED: Proper track event handling
    pc.ontrack = (event) => {
      console.log("📹 Received remote track:", event.track.kind, event.track.id);
      console.log("   - Track readyState:", event.track.readyState);
      console.log("   - Streams:", event.streams.length);

      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        console.log("📺 Setting remote stream with", stream.getTracks().length, "tracks");
        console.log("   - Audio tracks:", stream.getAudioTracks().length);
        console.log("   - Video tracks:", stream.getVideoTracks().length);
        
        setRemoteStream(stream);
        setHasRemoteVideo(true);
        setConnectionStatus("Connected - Receiving video");

        // Set up track ended listeners
        event.track.onended = () => {
          console.log("Remote track ended:", event.track.kind);
          if (event.track.kind === 'video') {
            setHasRemoteVideo(false);
          }
        };
      } else {
        console.warn("⚠️ Received track but no stream:", event.track.kind);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 Sending ICE candidate");
        socket.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    // Socket event handlers - SET UP BEFORE GETTING MEDIA
    // Handle incoming offer
    socket.on("offer", async ({ offer, from }) => {
      console.log("📨 Received offer from:", from);
      setConnectionStatus("Received offer, creating answer...");

      try {
        console.log("Setting remote description");
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        console.log("Creating answer");
        const answer = await pc.createAnswer();
        
        console.log("Setting local description");
        await pc.setLocalDescription(answer);
        
        console.log("Sending answer");
        socket.emit("answer", { roomId, answer });
        setConnectionStatus("Answer sent");
        console.log("✅ Answer sent successfully");
      } catch (error) {
        console.error("❌ Error handling offer:", error);
        setConnectionStatus("Error handling offer");
      }
    });

    // Handle incoming answer
    socket.on("answer", async ({ answer, from }) => {
      console.log("📨 Received answer from:", from);
      setConnectionStatus("Received answer");

      try {
        console.log("Setting remote description with answer");
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        
        // Log transceivers after setting remote description
        const transceivers = pc.getTransceivers();
        console.log("📡 Transceivers after answer:", transceivers.length);
        transceivers.forEach((t, i) => {
          console.log(`   [${i}] ${t.mid || 'no-mid'}: ${t.direction}, receiver track:`, t.receiver.track?.kind);
        });
        
        setConnectionStatus("Connected");
        console.log("✅ Connection established!");
      } catch (error) {
        console.error("❌ Error handling answer:", error);
        setConnectionStatus("Error handling answer");
      }
    });

    // Handle ICE candidates
    socket.on("ice-candidate", async ({ candidate, from }) => {
      try {
        if (candidate) {
          console.log("🧊 Adding ICE candidate from:", from);
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("❌ Error adding ICE candidate:", err);
      }
    });

    // Get user media and set up local stream
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: isMobile ? 640 : 1280 },
          height: { ideal: isMobile ? 480 : 720 },
          frameRate: { ideal: 30 },
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      .then((stream) => {
        console.log("Got local stream with tracks:", {
          video: stream.getVideoTracks().length,
          audio: stream.getAudioTracks().length
        });

        setLocalStream(stream);
        
        // Set video source after a slight delay to ensure ref is ready
        setTimeout(() => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.muted = true; // Prevent audio feedback
            localVideoRef.current.play().catch(e => console.log("Local video play error:", e));
          }
        }, 100);

        // Add all tracks to peer connection
        stream.getTracks().forEach((track) => {
          if (
            pcRef.current &&
            pcRef.current.signalingState !== "closed"
          ) {
            console.log("➕ Adding local track:", track.kind, track.id, "state:", track.readyState);
            const sender = pcRef.current.addTrack(track, stream);
            console.log("✅ Track added, sender:", sender);
          } else {
            console.warn("⚠️ PeerConnection closed, skipping track:", track.kind);
          }
        });

        // Log all senders after adding tracks
        const senders = pcRef.current.getSenders();
        console.log("📤 Total senders:", senders.length);
        senders.forEach(sender => {
          if (sender.track) {
            console.log("  - Sender track:", sender.track.kind, sender.track.id);
          }
        });

        setMediaReady(true);
        console.log("✅ Media ready, joining room...");

        // Join the room after media is ready
        if (roomId) {
          socket.emit("join-room", roomId);
          setConnectionStatus("Joining room...");
        }
      })
      .catch((error) => {
        console.error("❌ Error accessing media devices:", error);
        setConnectionStatus(`Media Error: ${error.message}`);
        
        // Show helpful error message
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          alert('No camera/microphone found. Please connect a camera and microphone and try again.');
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          alert('Camera/microphone permission denied. Please allow access in your browser settings.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          alert('Camera/microphone is already in use by another application.');
        } else {
          alert(`Error: ${error.message}`);
        }
      });


// ✅ Handle when another user joins
socket.on("user-joined", (userId) => {
  console.log("👥 User joined:", userId);
  setConnectionStatus("User joined, establishing connection...");
  
  // If we're the interviewer and media is ready, create offer
  if (userRole === "interviewer" && mediaReady && pcRef.current) {
    console.log("🚀 Creating offer for new user");
    pcRef.current.createOffer()
      .then(offer => pcRef.current.setLocalDescription(offer))
      .then(() => {
        socket.emit("offer", {
          roomId,
          offer: pcRef.current.localDescription,
        });
        console.log("📤 Offer sent");
      })
      .catch(err => console.error("Error creating offer:", err));
  }
});

// ✅ Handle room users update
socket.on("room-users", ({ count, users }) => {
  console.log(`👥 Room has ${count} users:`, users);
  if (count === 2) {
    setConnectionStatus("Both users present, connecting...");
  }
});

// ✅ START CALL WHEN BOTH USERS ARE READY
socket.on("ready-to-call", async () => {
  console.log("🔥 ready-to-call event received, userRole:", userRole, "mediaReady:", mediaReady);
  
  // Small delay to ensure media is ready
  setTimeout(async () => {
    if (userRole === "interviewer" && pcRef.current) {
      console.log("🚀 Interviewer creating offer, PC state:", pcRef.current.signalingState);

      try {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);

        socket.emit("offer", {
          roomId,
          offer,
        });
        console.log("📤 Offer created and sent");
        setConnectionStatus("Offer sent");
      } catch (error) {
        console.error("❌ Error creating offer:", error);
        setConnectionStatus("Error creating offer");
      }
    }
  }, 100);
});

    // Socket event handlers for questions and plagiarism
    socket.on("question-asked", ({ question, previousQuestionId, previousQuestionText }) => {
      console.log("📬 Question-asked event received:", { questionId: question?.id, previousQuestionId });
      
      // Set start time on first question
      setInterviewStartTime(prev => {
        if (!prev) {
          const startTime = Date.now();
          console.log('⏱️ Interview started at:', new Date(startTime).toISOString());
          return startTime;
        }
        return prev;
      });
      
      setQuestionCount(prev => {
        const newCount = prev + 1;
        console.log('📊 Question count:', newCount);
        return newCount;
      });
      
      // Save previous question's answer before switching (for both users)
      if (previousQuestionId) {
        setCurrentQuestionTranscript(prev => {
          if (prev && prev.trim()) {
            console.log("💾 Saving answer for question", previousQuestionId, ":", prev.substring(0, 50) + "...");
            setQuestionAnswers(answers => [
              ...answers.filter(qa => qa.questionId !== previousQuestionId),
              { questionId: previousQuestionId, questionText: previousQuestionText, answer: prev.trim() }
            ]);
          }
          console.log("🧹 Clearing currentQuestionTranscript for new question");
          return ""; // Clear for new question
        });
      }
      
      setCurrentQuestion(question);
      setPlagiarismScore(null);
      setPlagiarismDetails(null);
    });


    socket.on("answer-submitted", ({ questionId, transcript: submittedTranscript }) => {
      console.log("Answer submitted for question:", questionId);
      // Interviewer receives the answer
      if (userRole === 'interviewer') {
        setTranscript(submittedTranscript);
      }
    });

    socket.on("plagiarism-result", ({ questionId, score, interpretation }) => {
      console.log("Plagiarism result received:", score);
      setPlagiarismScore(score);
      if (interpretation) {
        setPlagiarismDetails({ interpretation });
      }
    });
    socket.on("transcript-update", ({ transcript: newText, timestamp }) => {
      console.log("📥 Received transcript update:", newText);
      console.log("👤 User role:", userRole);
      // Update BOTH full transcript and current question transcript
      setFullTranscript(prev => {
        const updated = prev ? prev + " " + newText : newText;
        console.log("📝 Full transcript length:", updated.length);
        return updated;
      });
      setCurrentQuestionTranscript(prev => {
        const updated = prev ? prev + " " + newText : newText;
        console.log("📝 Current question transcript:", updated.substring(0, 50) + "...");
        return updated;
      });
    });


    // Set initial position for local video
    setPosition({ x: 16, y: 16 });

    // Generate interview ID from roomId
    setInterviewId(roomId);

    setJoined(true);

    return () => {
        if (socket) {
    socket.off("connect");
    socket.off("connect_error");
    socket.off("disconnect");
    socket.off("reconnect_attempt");
    socket.off("user-joined");
    socket.off("room-users");
    socket.off("ready-to-call");
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");
    socket.off("question-asked");
    socket.off("answer-submitted");
    socket.off("plagiarism-result");
    socket.off("transcript-update");
  }
      cleanupMedia();
    };
}, [roomId, userRole, isMobile]);

// Handle remote stream updates
useEffect(() => {
  if (remoteStream && remoteVideoRef.current) {
    console.log("Setting remote stream to video element");
    remoteVideoRef.current.srcObject = remoteStream;
    
    // Try to play with proper error handling
    const playPromise = remoteVideoRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("✅ Remote video playing");
        })
        .catch(e => {
          console.log("⚠️ Autoplay prevented, trying muted:", e.message);
          // If autoplay fails, try with muted
          remoteVideoRef.current.muted = true;
          remoteVideoRef.current.play()
            .then(() => {
              console.log("✅ Remote video playing (muted)");
              // Unmute after a short delay
              setTimeout(() => {
                remoteVideoRef.current.muted = false;
              }, 500);
            })
            .catch(err => console.error("❌ Remote video play failed:", err));
        });
    }
  }
}, [remoteStream]);

// ✅ Load questions from database
const loadQuestions = async () => {
  setLoadingQuestions(true);
  try {
    const response = await fetch(
      `/api/get-questions?category=${encodeURIComponent(
        questionCategory
      )}&limit=20&random=true`
    );

    const data = await response.json();

    if (data.success && data.questions.length > 0) {
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
     
      setPlagiarismScore(null);
      setPlagiarismDetails(null);
      setCurrentQuestionTranscript("");

      return data.questions; // 🔥 REQUIRED for startTest
    }

    return [];
  } catch (error) {
    console.error("Error loading questions:", error);
    return [];
  } finally {
    setLoadingQuestions(false);
  }
};

const startTest = async () => {
  if (userRole !== "interviewer") return;
  if (!socket || !roomId) return;


  setTestStarted(true);

  const loadedQuestions = await loadQuestions();
  if (!loadedQuestions.length) return;

  const firstQuestion = loadedQuestions[0];
  setCurrentQuestion(firstQuestion);


  // 🔥 SEND TO CANDIDATE
  socket.emit("question-asked", {
    roomId,
    question: firstQuestion,
  });
};

  // Cleanup media resources
  const cleanupMedia = () => {
    console.log("Cleaning up media resources...");

    // Stop transcription if active
    if (mediaRecorderRef.current?.state === "recording") {
  mediaRecorderRef.current.stop();
}
setTranscriptionEnabled(false);


    // Stop local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });
      setLocalStream(null);
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Disconnect socket
    if (socket) {
      socket.disconnect();
    }
  };

// Toggle video hide/show (UI + CAMERA TRACK)
// Toggle video hide/show (NO MOVEMENT, SAME POSITION)
const toggleVideoHide = () => {
  if (!localStream) return;

  const videoTrack = localStream.getVideoTracks()[0];
  if (!videoTrack) return;

  if (isVideoHidden) {
    // 👉 SHOW: turn camera back ON
    videoTrack.enabled = true;
    setIsVideoHidden(false);
  } else {
    // 👉 HIDE: turn camera OFF (same position)
    videoTrack.enabled = false;
    setIsVideoHidden(true);
  }
};



  // Draggable video handlers
  const handleMouseDown = (e) => {
    if (isVideoHidden) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = localVideoContainerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleTouchStart = (e) => {
    if (isVideoHidden) return;
    const touch = e.touches[0];
    setIsDragging(true);
    const rect = localVideoContainerRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isVideoHidden) return;

    const container = document.querySelector('.main-video-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const videoRect = localVideoContainerRef.current.getBoundingClientRect();

    const x = Math.max(8, Math.min(
      e.clientX - dragOffset.x,
      containerRect.width - videoRect.width - 8
    ));

    const y = Math.max(8, Math.min(
      e.clientY - dragOffset.y,
      containerRect.height - videoRect.height - 8
    ));

    setPosition({ x, y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isVideoHidden) return;

    const touch = e.touches[0];
    const container = document.querySelector('.main-video-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const videoRect = localVideoContainerRef.current.getBoundingClientRect();

    const x = Math.max(8, Math.min(
      touch.clientX - dragOffset.x,
      containerRect.width - videoRect.width - 8
    ));

    const y = Math.max(8, Math.min(
      touch.clientY - dragOffset.y,
      containerRect.height - videoRect.height - 8
    ));

    setPosition({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

const toggleTranscription = async () => {
  if (userRole !== "candidate") return;
  if (!localStream) return;

  const audioTracks = localStream.getAudioTracks();
  if (!audioTracks.length || !audioTracks[0].enabled) {
    alert("Unmute microphone before starting transcription");
    return;
  }

  // 🛑 STOP transcription
  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    setTranscriptionEnabled(false);
    console.log("🛑 Transcription stopped");
    return;
  }

  // 🎯 CREATE AUDIO-ONLY STREAM (CRITICAL FIX)
  const audioStream = new MediaStream([audioTracks[0]]);

  // 🎯 SAFELY PICK MIME TYPE
  let mimeType = "audio/webm;codecs=opus";
  if (!window.MediaRecorder || !MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "audio/webm";
  }

  if (!MediaRecorder.isTypeSupported(mimeType)) {
    alert("MediaRecorder not supported in this browser");
    return;
  }

  const recorder = new MediaRecorder(audioStream, { mimeType });
  mediaRecorderRef.current = recorder;
  setTranscriptionEnabled(true);

  recorder.ondataavailable = async (e) => {
    if (!e.data || e.data.size === 0) {
      console.log("⚠️ Audio chunk is empty, skipping");
      return;
    }

    console.log("🎤 Audio chunk received, size:", e.data.size, "bytes");
    
    const formData = new FormData();
    formData.append("file", e.data, "chunk.webm");

    try {
      const res = await fetch("/api/transcribe-realtime", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("📡 API Response:", data);
      
      // Check for errors from API
      if (data.error) {
        console.warn("⚠️ Transcription API error:", data.errorMessage);
        console.log("Skipping this chunk and continuing...");
      } else if (data.skipped) {
        console.log("⚠️ Chunk skipped:", data.reason);
      } else if (data.text && data.text.trim().length > 0) {
        console.log("📝 Transcript:", data.text);
        const newTranscript = data.text.trim();
        
        // Update BOTH full transcript and current question transcript (for candidate)
        setFullTranscript((prev) => prev ? prev + " " + newTranscript : newTranscript);
        setCurrentQuestionTranscript((prev) => prev ? prev + " " + newTranscript : newTranscript);
        
        // 🔥 SEND TRANSCRIPT TO INTERVIEWER VIA SOCKET (real-time)
        if (socket && roomId && newTranscript.length > 2) {
          socket.emit("transcript-update", {
            roomId,
            transcript: newTranscript,
            timestamp: Date.now()
          });
          console.log("📤 Sent transcript to interviewer:", newTranscript);
        }
      } else {
        console.log("⚠️ Empty transcript (probably silence), continuing...");
      }
    } catch (err) {
      console.error("❌ Transcription error:", err);
      console.log("Continuing despite error...");
    }
  };

  // Handle recorder stop event to restart automatically
  recorder.onstop = () => {
    console.log("🔄 Recorder stopped, checking if should restart...");
    
    // Check if recorder still exists and wasn't manually cleared (user didn't click stop)
    if (mediaRecorderRef.current) {
      setTimeout(() => {
        if (!localStream) {
          console.log("❌ No local stream, cannot restart");
          return;
        }
        
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0 && audioTracks[0].enabled) {
          console.log("🔄 Restarting recorder for next chunk...");
          
          const audioStream = new MediaStream([audioTracks[0]]);
          const newRecorder = new MediaRecorder(audioStream, { mimeType });
          mediaRecorderRef.current = newRecorder;
          
          // Reattach handlers
          newRecorder.ondataavailable = recorder.ondataavailable;
          newRecorder.onstop = recorder.onstop;
          
          try {
            newRecorder.start();
            console.log("✅ Recorder restarted, will record for 10 seconds");
            
            // Stop after 10 seconds to get a complete WebM file
            setTimeout(() => {
              if (newRecorder.state === "recording") {
                newRecorder.stop();
                console.log("⏹ Stopping recorder after 10 seconds");
              }
            }, 10000);
          } catch (err) {
            console.error("❌ Failed to restart recorder:", err);
          }
        } else {
          console.log("❌ Audio tracks not available or disabled");
        }
      }, 100);
    } else {
      console.log("❌ Recorder ref cleared, user stopped recording");
    }
  };

  try {
    recorder.start();
    console.log("🎙 Recorder started:", mimeType);
    
    // Stop after 10 seconds to get complete WebM file
    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
        console.log("⏹ Stopping recorder after 10 seconds");
      }
    }, 10000);
  } catch (err) {
    console.error("❌ MediaRecorder start failed", err);
  }
};




  // Listen for transcript updates from candidate (for interviewer)
  

  // FIXED: Update remote video when remoteStream changes
useEffect(() => {
  if (!remoteVideoRef.current || !remoteStream) return;

  const videoEl = remoteVideoRef.current;
  videoEl.srcObject = remoteStream;
  videoEl.muted = false;
  videoEl.volume = 1.0;

  videoEl.play().catch(() => {});
}, [remoteStream]);


useEffect(() => {
  const unlockAudio = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.volume = 1.0;
      remoteVideoRef.current.play().catch(() => {});
    }

    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
  };

  window.addEventListener("click", unlockAudio);
  window.addEventListener("touchstart", unlockAudio);

  return () => {
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
  };
}, []);



  // Toggle audio mute/unmute
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Toggle video on/off
const toggleVideo = () => {
  if (!localStream) return;

  const videoTrack = localStream.getVideoTracks()[0];
  if (!videoTrack) return;

  const nextState = !videoTrack.enabled;
  videoTrack.enabled = nextState;

  setIsVideoOff(!nextState);

  // 🔥 CRITICAL: keep Hide/Show in sync
  if (!nextState) {
    setIsVideoHidden(true);
  }
};




  // Navigate to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Save current question's answer before switching (interviewer side)
      if (currentQuestion && currentQuestionTranscript.trim()) {
        setQuestionAnswers(prev => [
          ...prev.filter(qa => qa.questionId !== currentQuestion.id),
          {
            questionId: currentQuestion.id,
            questionText: currentQuestion.questiontext || currentQuestion.question,
            answer: currentQuestionTranscript.trim()
          }
        ]);
      }
      
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      setCurrentQuestion(questions[newIndex]);
      setCurrentQuestionTranscript(""); // Clear for new question
      setPlagiarismScore(null);
      setPlagiarismDetails(null);
      
      // Track interview start time and question count for interviewer
      if (userRole === 'interviewer') {
        setInterviewStartTime(prev => {
          if (!prev) {
            const startTime = Date.now();
            console.log('⏱️ Interview started at:', new Date(startTime).toISOString());
            return startTime;
          }
          return prev;
        });
        
        setQuestionCount(prev => {
          const newCount = prev + 1;
          console.log('📊 Question count incremented to:', newCount);
          return newCount;
        });
      }

      if (socket && userRole === 'interviewer') {
        socket.emit('question-asked', {
          roomId,
          question: questions[newIndex],
          previousQuestionId: currentQuestion?.id,
          previousQuestionText: currentQuestion?.questiontext || currentQuestion?.question
        });
      }
    }
  };

  // Navigate to previous question
  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current question's answer before switching (interviewer side)
      if (currentQuestion && currentQuestionTranscript.trim()) {
        setQuestionAnswers(prev => [
          ...prev.filter(qa => qa.questionId !== currentQuestion.id),
          {
            questionId: currentQuestion.id,
            questionText: currentQuestion.questiontext || currentQuestion.question,
            answer: currentQuestionTranscript.trim()
          }
        ]);
      }
      
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      setCurrentQuestion(questions[newIndex]);
      setCurrentQuestionTranscript(""); // Clear for new question
      setPlagiarismScore(null);
      setPlagiarismDetails(null);

      if (socket && userRole === 'interviewer') {
        socket.emit('question-asked', {
          roomId,
          question: questions[newIndex],
          previousQuestionId: currentQuestion?.id,
          previousQuestionText: currentQuestion?.questiontext || currentQuestion?.question
        });
      }
    }
  };

  // Analyze FULL INTERVIEW TRANSCRIPT
  const checkPlagiarism = async () => {
    if (!fullTranscript || fullTranscript.trim().length === 0) {
      alert("No transcript available. Please wait for the candidate to speak.");
      return;
    }

    setIsCheckingPlagiarism(true);
    try {
      console.log('📝 Full Transcript to Analyze:', fullTranscript.substring(0, 300) + (fullTranscript.length > 300 ? '...' : ''));
      console.log('📏 Transcript Length:', fullTranscript.length, 'characters');
      
      // Calculate plagiarism score for FULL TRANSCRIPT
      const plagiarismResponse = await fetch('/api/calculate-plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion?.id || 1,
          transcribedAnswer: fullTranscript.trim()
        })
      });

      const plagiarismData = await plagiarismResponse.json();
      
      console.log('📊 Plagiarism Check Response:', JSON.stringify(plagiarismData, null, 2));

      if (plagiarismData.success) {
        setPlagiarismScore(plagiarismData.plagiarismScore);
        setPlagiarismDetails({
          interpretation: plagiarismData.interpretation,
          breakdown: plagiarismData.breakdown,
          details: plagiarismData.details
        });

        // Broadcast result to interviewee
        if (socket) {
          socket.emit('plagiarism-result', {
            roomId,
            questionId: currentQuestion?.id || 1,
            score: plagiarismData.plagiarismScore,
            interpretation: plagiarismData.interpretation
          });
        }

        // Save complete interview report
        const interviewerName = localStorage.getItem('userName') || localStorage.getItem('name') || 'Interviewer';
        const interviewerEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
        const candidateName = 'Candidate'; // Get from session if available
        const candidateEmail = '';
        
        console.log('👤 Interviewer Info:', { name: interviewerName, email: interviewerEmail });
        console.log('⏱️ Interview Start Time:', interviewStartTime ? new Date(interviewStartTime).toISOString() : 'NOT SET');
        console.log('⏱️ Current Time:', new Date().toISOString());
        
        // Calculate interview duration
        const durationMs = interviewStartTime ? Date.now() - interviewStartTime : 0;
        const durationMinutes = Math.floor(durationMs / 60000);
        const durationSeconds = Math.floor((durationMs % 60000) / 1000);
        const formattedDuration = durationMs > 0 ? `${durationMinutes}m ${durationSeconds}s` : '0m 0s';
        
        console.log('⏱️ Interview Duration:', formattedDuration, '(', durationMs, 'ms)');
        console.log('❓ Total Questions Asked:', questionCount);
        console.log('🤖 AI Detection Data:', plagiarismData.aiDetection || plagiarismData.details?.aiDetection || 'NOT FOUND');

        const reportPayload = {
          interviewId: interviewId || `interview_${Date.now()}`,
          interviewerId: localStorage.getItem('userId'),
          candidateId: null,
          interviewerName,
          candidateName,
          interviewerEmail,
          candidateEmail,
          questionCategory,
          questionsAsked: questionAnswers,
          questionsCount: questionCount,
          fullTranscript: fullTranscript.trim(),
          transcribedAnswer: fullTranscript.trim(),
          evaluation: {
            overallScore: plagiarismData.plagiarismScore,
            ...plagiarismData.details?.scores,
            interpretation: plagiarismData.interpretation,
            strengths: plagiarismData.details?.strengths || [],
            weaknesses: plagiarismData.details?.weaknesses || [],
            matchedConcepts: plagiarismData.details?.matchedKeywords || [],
            feedback: plagiarismData.details?.feedback || '',
            aiDetection: plagiarismData.aiDetection || plagiarismData.details?.aiDetection || null
          },
          roomId,
          duration: formattedDuration,
          durationMs: durationMs
        };
        
        console.log('💾 Report Save Payload:', JSON.stringify(reportPayload, null, 2));

        const reportResponse = await fetch('/api/save-interview-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportPayload)
        });

        const reportData = await reportResponse.json();
        
        console.log('💾 Report Save Response:', JSON.stringify(reportData, null, 2));
        
        if (reportData.success) {
          console.log('✅ Report saved to database with ID:', reportData.reportId);
          // Silently save the report - no redirect, stay in meeting
        } else {
          console.warn('⚠️ Failed to save report to database');
        }
      }
    } catch (error) {
      console.error('Error checking plagiarism:', error);
      alert('Failed to analyze transcript. Please try again.');
    } finally {
      setIsCheckingPlagiarism(false);
    }
  };

  // Submit answer (for interviewee) - now submits current question transcript
  const submitAnswer = () => {
    if (socket && currentQuestionTranscript) {
      socket.emit('answer-submitted', {
        roomId,
        questionId: currentQuestion?.id || 1,
        transcript: currentQuestionTranscript.trim()
      });
    }
  };

  // End call and leave meeting - FIXED: Proper cleanup
 const endCall = async () => {
  console.log("Ending call and cleaning up...");

  // 🔥 Notify the other participant FIRST
  if (socket && userRole === "interviewer") {
    socket.emit("end-call", { roomId });
  }

  // Clean up local media
  cleanupMedia();

  // Small delay for graceful teardown
  await new Promise(resolve => setTimeout(resolve, 500));

  // Redirect self
  const role = localStorage.getItem("role");
  if (role === "interviewer") {
    router.push("/dashboard/interviewer");
  } else {
    router.push("/");
  }
};


  // Copy room ID to clipboard
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    // Show toast instead of alert
    const event = new CustomEvent('showToast', {
      detail: { message: `Room ID ${roomId} copied!`, type: 'success' }
    });
    window.dispatchEvent(event);
  };

  // Clear transcript
  const clearTranscript = () => {
    setTranscript("");
  };

  // Get connection status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "Connected": return "bg-green-500";
      case "Connecting...":
      case "Joining room...":
      case "Creating offer...":
      case "Offer sent":
      case "Received offer, creating answer...":
      case "Answer sent":
      case "Received answer": return "bg-yellow-500";
      default: return connectionStatus.includes("Error") ? "bg-red-500" : "bg-yellow-500";
    }
  };

  // Get status text
  const getStatusText = () => {
    if (connectionStatus === "Connected") return "Connected";
    if (connectionStatus.includes("Error")) return "Connection Error";
    return "Connecting...";
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Enhanced Professional Header */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-2xl z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="flex items-center space-x-3 bg-gray-800/50 px-4 py-2 rounded-xl border border-white/10">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse shadow-lg`}></div>
                <span className="text-sm font-semibold text-white">{getStatusText()}</span>
              </div>
              
              {/* Room ID */}
              <div className="hidden md:flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-xl border border-white/10">
                <i className="fas fa-door-open text-purple-400 text-sm"></i>
                <span className="text-xs text-gray-400">Room:</span>
                <button
                  onClick={copyRoomId}
                  className="flex items-center space-x-2 hover:bg-white/10 px-2 py-1 rounded-lg transition-all group"
                >
                  <code className="text-white font-mono font-semibold text-sm">{roomId}</code>
                  <i className="fas fa-copy text-gray-400 group-hover:text-purple-400 transition-colors"></i>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* User Role Badge */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 rounded-xl border border-purple-400/30 shadow-lg">
                <span className="text-sm font-bold capitalize text-white tracking-wide">
                  <i className={`fas ${userRole === 'interviewer' ? 'fa-user-tie' : 'fa-user-graduate'} mr-2`}></i>
                  {userRole || 'Guest'}
                </span>
              </div>
              
              {/* Mobile Controls Toggle */}
              <button
                onClick={() => setShowControls(!showControls)}
                className="md:hidden bg-gray-800/50 p-2 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
              >
                <i className={`fas fa-${showControls ? 'chevron-up' : 'chevron-down'} text-white`}></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Area - Optimized Layout */}
      <div className="flex-1 flex relative bg-black overflow-hidden">
        {/* Video Container */}
        <div
          className="flex-1 relative"
          onClick={() => isMobile && setShowControls(!showControls)}
        >
          {/* Remote Video - Main Participant */}
          <div className="absolute inset-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!hasRemoteVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                <div className="text-center px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center mx-auto border-2 border-purple-500/30 shadow-2xl">
                      <i className="fas fa-user-friends text-5xl text-purple-400"></i>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Waiting for Participant
                  </h3>
                  <p className="text-gray-300 text-base max-w-md mx-auto mb-6">
                    Share Room ID <strong className="text-purple-400 font-mono">{roomId}</strong> to start the interview
                  </p>
                  <button
                    onClick={copyRoomId}
                    className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-900/50 hover:scale-105"
                  >
                    <i className="fas fa-copy"></i>
                    <span>Copy Room ID</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Participant Label */}
            <div className="absolute bottom-6 left-6 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <i className="fas fa-user text-purple-400"></i>
                <span className="text-white font-semibold">Participant</span>
              </div>
            </div>
          </div>

          {/* Local Video - Enhanced Draggable Picture-in-Picture */}
          <div
            ref={localVideoContainerRef}
            className={`absolute bg-black rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-2xl z-10 ${isVideoHidden
              ? 'border-purple-500/60'
              : isDragging
                ? 'border-purple-500 scale-105'
                : 'border-white/30'
              } ${isVideoHidden ? 'cursor-default' : 'cursor-move'} ${isMobile ? 'w-40 h-56' : 'w-56 h-40 md:w-72 md:h-52'
              }`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: `translate(0, 0) ${isDragging ? 'scale(1.05)' : 'scale(1)'}`,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover pointer-events-none"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-3 mx-auto">
                    <i className="fas fa-video-slash text-3xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-300 font-semibold">Camera Off</p>
                </div>
              </div>
            )}

            {/* Enhanced Overlay Info */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8 pb-3 px-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <i className="fas fa-user text-green-400"></i>
                  <span className="text-white font-semibold text-sm">You</span>
                  {isVideoOff && <span className="text-gray-400 text-xs">(Off)</span>}
                </div>
                <div className="flex items-center space-x-2">
                  {!isVideoHidden && (
                    <div className="bg-white/10 rounded-lg px-2 py-1">
                      <i className="fas fa-up-down-left-right text-white text-xs"></i>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Connection Status */}
          {isMobile && connectionStatus !== "Connected" && (
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-xl z-20">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusColor()}`}></div>
                <span className="text-xs text-white font-medium">{connectionStatus}</span>
              </div>
            </div>
          )}
        </div>

        {/* Integrated Transcript Sidebar - Interviewer Only */}
        {userRole === 'interviewer' && showTranscript && (
          <div className="w-96 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 hidden lg:flex">
            {/* Transcript Header */}
            <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {transcriptionEnabled && (
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </div>
                  )}
                  <i className="fas fa-microphone-lines text-purple-400 text-lg"></i>
                  <h3 className="text-white font-bold text-lg">Live Transcript</h3>
                </div>
                <button
                  onClick={() => setShowTranscript(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
              <p className="text-gray-400 text-xs mt-2">Real-time speech transcription</p>
            </div>
            
            {/* Transcript Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
              {fullTranscript ? (
                <div className="space-y-3">
                  {fullTranscript.split('. ').filter(s => s.trim()).map((sentence, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                      <p className="text-gray-100 leading-relaxed">{sentence.trim()}.</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                    <i className="fas fa-microphone-slash text-3xl text-gray-600"></i>
                  </div>
                  <p className="text-gray-500 font-medium">No transcript yet</p>
                  <p className="text-gray-600 text-sm mt-2">Waiting for candidate to start recording...</p>
                </div>
              )}
            </div>
            
            {/* Transcript Footer - Stats */}
            <div className="bg-black/30 px-6 py-4 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-400">
                  <i className="fas fa-align-left"></i>
                  <span>{fullTranscript ? fullTranscript.split(' ').length : 0} words</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <i className="fas fa-clock"></i>
                  <span>{fullTranscript ? Math.ceil(fullTranscript.split(' ').length / 150) : 0} min read</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Panel */}
      <QuestionPanel
        userRole={userRole}
        currentQuestion={currentQuestion}
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        questionCategory={questionCategory}
        loadingQuestions={loadingQuestions}
        plagiarismScore={plagiarismScore}
        plagiarismDetails={plagiarismDetails}
        isCheckingPlagiarism={isCheckingPlagiarism}
        transcript={currentQuestionTranscript}
        onStartTest={startTest}
        testStarted={testStarted}
        transcriptionEnabled={transcriptionEnabled}
        onNextQuestion={nextQuestion}
        onPreviousQuestion={previousQuestion}
        onCheckPlagiarism={checkPlagiarism}
        onLoadQuestions={loadQuestions}
        onCategoryChange={(category) => {
          setQuestionCategory(category);
        }}
        showPanel={showQuestionPanel}
        onTogglePanel={() => setShowQuestionPanel(!showQuestionPanel)}
      />

      {/* Minimal Control Bar */}
      <div className={`bg-black/80 backdrop-blur-md border-t border-white/10 transition-all duration-300 z-50 ${showControls ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="px-4 py-2.5">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            {/* Left: Interview Panel Toggle */}
            <button
              onClick={() => setShowQuestionPanel(!showQuestionPanel)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all hover:scale-105 ${showQuestionPanel
                ? 'bg-purple-600/80 hover:bg-purple-500/80 text-white'
                : 'bg-gray-700/80 hover:bg-gray-600/80 text-gray-300'
                }`}
            >
              <i className={`fas fa-${showQuestionPanel ? 'chevron-down' : 'chevron-up'} text-sm`}></i>
              <span className="text-xs font-semibold hidden sm:inline">Interview Panel</span>
            </button>

            {/* Center: Main Controls */}
            <div className="flex items-center space-x-2">
              {/* Audio */}
              <button
                onClick={toggleAudio}
                className={`p-2.5 rounded-lg transition-all hover:scale-105 ${isAudioMuted
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-700/80 hover:bg-gray-600/80'
                  }`}
                title={isAudioMuted ? 'Unmute' : 'Mute'}
              >
                <i className={`fas fa-${isAudioMuted ? 'microphone-slash' : 'microphone'} text-white`}></i>
              </button>

              {/* Video */}
              <button
                onClick={toggleVideo}
                className={`p-2.5 rounded-lg transition-all hover:scale-105 ${isVideoOff
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-700/80 hover:bg-gray-600/80'
                  }`}
                title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
              >
                <i className={`fas fa-${isVideoOff ? 'video-slash' : 'video'} text-white`}></i>
              </button>

              {/* Recording (Candidate Only) */}
              {userRole === 'candidate' && (
                <button
                  onClick={toggleTranscription}
                  className={`p-2.5 rounded-lg transition-all hover:scale-105 ${transcriptionEnabled
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-green-500 hover:bg-green-600'
                    }`}
                  title={transcriptionEnabled ? 'Stop Recording' : 'Start Recording'}
                >
                  <i className={`fas fa-${transcriptionEnabled ? 'stop-circle' : 'circle-dot'} text-white`}></i>
                </button>
              )}

              {/* End Call */}
              <button
                onClick={endCall}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 transition-all hover:scale-105 flex items-center space-x-2"
                title="End Call"
              >
                <i className="fas fa-phone-slash text-white"></i>
                <span className="text-white text-xs font-bold hidden sm:inline">End</span>
              </button>

              {/* Transcript Toggle (Interviewer Only) */}
              {userRole === 'interviewer' && (
                <>
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className={`hidden lg:flex p-2.5 rounded-lg transition-all hover:scale-105 ${showTranscript
                      ? 'bg-purple-600 hover:bg-purple-500'
                      : 'bg-gray-700/80 hover:bg-gray-600/80'
                      }`}
                    title="Toggle Transcript"
                  >
                    <i className="fas fa-comment-alt text-white"></i>
                  </button>

                  {/* Generate Report */}
                  <button
                    onClick={checkPlagiarism}
                    disabled={!fullTranscript || fullTranscript.trim().length === 0 || isCheckingPlagiarism}
                    className={`p-2.5 rounded-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      !fullTranscript || fullTranscript.trim().length === 0
                        ? 'bg-gray-800 text-gray-600'
                        : isCheckingPlagiarism
                          ? 'bg-yellow-500 hover:bg-yellow-600 animate-pulse'
                          : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                    title={isCheckingPlagiarism ? 'Analyzing...' : 'Generate Report'}
                  >
                    <i className={`fas fa-${isCheckingPlagiarism ? 'spinner fa-spin' : 'chart-line'} text-white`}></i>
                  </button>
                </>
              )}
            </div>

            {/* Right: Connection Status */}
            <div className="hidden md:flex items-center space-x-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
              <span className="text-gray-300 font-medium">{getStatusText()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tap Indicator */}
      {isMobile && !showControls && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium animate-bounce shadow-xl border border-white/20 z-40">
          <i className="fas fa-hand-pointer mr-2"></i>
          Tap to show controls
        </div>
      )}
    </div>
  );
} 