
"use client";

import { useState } from "react";
import {
  Mic, MicOff, Volume2, VolumeX, Phone, Send,
  Bot, Settings, Sparkles, AlertCircle, User
} from 'lucide-react';
import { useLiveInterview } from "@/hooks/useLiveInterview";

interface LiveInterviewUIProps {
  interviewId?: string;
}

export function LiveInterviewUI({
  interviewId,
}: LiveInterviewUIProps) {
  // Get all logic from hook
  const {
    status,
    chat,
    warning,
    startTime,
    elapsedSeconds,
    micAllowed,
    textInput,
    setTextInput,
    isAIPlaying,
    isMicOn,
    isLoadingData,
    connectSession,
    endVapiCall,
    toggleMic,
    sendTextMessage,
  } = useLiveInterview(interviewId);

  // UI-only state
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Helper function
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handlers
  const handleConnect = () => {
    connectSession();
  };

  const handleDisconnect = () => {
    endVapiCall();
  };

  const handleToggleMic = () => {
    toggleMic();
  };

  const handleSendText = () => {
    sendTextMessage();
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl overflow-hidden border border-white/10">
      {/* Main Interview Interface */}
      <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Compact Header */}
        <header className="px-6 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Realtime AI Interview</h1>
                  <p className="text-xs text-gray-400">Vapi-powered interviewer</p>
                </div>
              </div>
              {(status === "connected" || status === "disconnected") && startTime && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-green-400">
                    {status === "connected" ? "Connected" : "Disconnected"} • {formatTime(elapsedSeconds)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
             
              {status === "connected" ? (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={status === "connecting" || isLoadingData}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-60"
                >
                  {status === "connecting" || isLoadingData ? "Loading..." : "Connect"}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video/Avatar Section */}
          <div className="w-2/5 border-r border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-950/50 flex flex-col">
            {/* AI Interviewer Video/Avatar */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
              <div className="relative">
                {/* Avatar Circle with Animation */}
                <div className="relative">
                  <div className={`w-64 h-64 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center transition-all duration-300 ${isAIPlaying ? 'scale-110 shadow-2xl shadow-blue-500/50' : 'scale-100'
                    }`}>
                    <div className="w-60 h-60 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <Bot className="w-24 h-24 text-blue-400" />
                    </div>
                  </div>

                  {/* Pulse rings when speaking */}
                  {isAIPlaying && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-ping opacity-20" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse opacity-30" />
                    </>
                  )}
                </div>

                {/* Status Badge */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 border border-white/10 rounded-full">
                  <span className="text-sm font-medium">
                    {isAIPlaying ? '🎙️ Speaking...' : '💭 Thinking...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Audio Visualizer */}
            <div className="p-6 border-t border-white/10">
              <div className="flex justify-center items-end space-x-2 h-24">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 rounded-full transition-all duration-300 ${isAIPlaying
                        ? 'bg-gradient-to-t from-blue-500 to-cyan-500'
                        : 'bg-slate-700'
                      }`}
                    style={{
                      height: isAIPlaying
                        ? `${20 + Math.random() * 80}%`
                        : '20%',
                      transition: 'height 0.15s ease'
                    }}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">
                {isAIPlaying ? 'AI is speaking' : 'Waiting...'}
              </p>
            </div>

            {/* Control Panel */}
            <div className="p-6 bg-slate-900/50 border-t border-white/10">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleToggleMic}
                  disabled={status !== "connected" || micAllowed === false}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!isMicOn
                      ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50'
                      : 'bg-slate-700 hover:bg-slate-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isMicOn ? 'Mute' : 'Unmute'}
                >
                  {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>

                <button
                  onClick={status === "connected" ? handleDisconnect : handleConnect}
                  disabled={status === "connecting" || isLoadingData}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${status === "connected"
                      ? 'bg-gradient-to-br from-red-600 to-orange-600 hover:shadow-lg hover:shadow-red-500/50'
                      : 'bg-gradient-to-br from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={status === "connected" ? "Disconnect" : "Connect"}
                >
                  <Phone className="w-7 h-7" />
                </button>

                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!isSpeakerOn
                      ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50'
                      : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
                >
                  {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">
                Voice input streams automatically. Text chat always available.
              </p>
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900/30 to-slate-950/30">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chat.length === 0 && status === "connected" && (
                <div className="flex justify-center">
                  <div className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-full text-sm text-gray-400">
                    Connected to the AI interviewer. You can speak or type to start.
                  </div>
                </div>
              )}
              {chat.map((msg, idx) => {
                if (msg.role === 'system') {
                  return (
                    <div key={`system-${idx}-${msg.timestamp || Date.now()}`} className="flex justify-center">
                      <div className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-full text-sm text-gray-400">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`${msg.role}-${idx}-${msg.timestamp || Date.now()}`}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{ borderRadius: '5px' }}
                  >
                    <div
                      className={`flex items-start max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                      style={{ gap: '6px' }}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant'
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                        }`}>
                        {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>

                      {/* Message Bubble */}
                      <div className="flex flex-col" style={{ gap: '8px' }}>
                        <div
                          className={`px-5 rounded-2xl ${msg.role === 'assistant'
                              ? 'bg-slate-800/80 backdrop-blur-sm border border-white/10'
                              : 'bg-gradient-to-br from-blue-600 to-cyan-600'
                            }`}
                          style={{
                            paddingTop: '10px',
                            paddingBottom: '10px',
                            borderRadius: '16px'
                          }}
                        >
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                        <div
                          className="flex items-end space-x-2 mb-1"
                          style={{ width: '100%', justifyContent: 'flex-end' }}
                        >
                          <span className="text-xs font-semibold text-gray-400">
                            {msg.role === 'assistant' ? 'AI Interviewer' : 'You'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isAIPlaying && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[75%]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="px-5 py-4 rounded-2xl bg-slate-800/80 border border-white/10">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Warning Banner */}
            {warning && (
              <div className="mx-6 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              </div>
            )}
            {micAllowed === false && (
              <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Microphone access is blocked. Please allow mic permissions and reload.</span>
                </div>
              </div>
            )}
            {status === "idle" && chat.length > 0 && (
              <div className="mx-6 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Connection closed. Please reconnect to continue.</span>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-6 border-t border-white/10 bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                  placeholder={status === "connected" ? "Type if your mic is unavailable..." : "Connect to start chatting..."}
                  disabled={status !== "connected"}
                  className="flex-1 px-5 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendText}
                  disabled={status !== "connected" || !textInput.trim()}
                  className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* End Session Confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">End interview?</h3>
                  <p className="text-sm text-gray-300">
                    Ending now will stop the session.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-sm font-semibold hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowEndConfirm(false);
                    handleDisconnect();
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold transition"
                >
                  End Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
