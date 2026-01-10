/**
 * UI Component for Live Interview
 */

import { useState, useEffect } from "react";
import {
  Mic, MicOff, Volume2, VolumeX, Phone, Send,
  Bot, Settings, Sparkles, AlertCircle, User
} from 'lucide-react';
import { ChatMessage, ConnectionStatus, InterviewReport } from "./types";

interface LiveInterviewUIProps {
  status: ConnectionStatus;
  micAllowed: boolean | null;
  isMicOn: boolean;
  textInput: string;
  setTextInput: (value: string) => void;
  chat: ChatMessage[];
  warning: string | null;
  busy: boolean;
  isAIPlaying: boolean;
  elapsedSeconds: number;
  report: InterviewReport | null;
  reportStatus: "idle" | "loading" | "error" | "ready";
  reportError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMic: () => void;
  onSendText: () => void;
}

const formatDecision = (decision: string) =>
  decision
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export function LiveInterviewUI({
  status,
  micAllowed,
  isMicOn,
  textInput,
  setTextInput,
  chat,
  warning,
  busy,
  isAIPlaying,
  elapsedSeconds,
  report,
  reportStatus,
  reportError,
  onConnect,
  onDisconnect,
  onToggleMic,
  onSendText,
}: LiveInterviewUIProps) {
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Track user speaking state
  useEffect(() => {
    setIsListening(isMicOn && status === "connected");
  }, [isMicOn, status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                  <p className="text-xs text-gray-400">Gemini-powered interviewer</p>
                </div>
              </div>
              {status === "connected" && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-green-400">Connected • {formatTime(elapsedSeconds)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <Settings className="w-5 h-5" />
              </button>
              {status === "connected" ? (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={onConnect}
                  disabled={status === "connecting"}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-60"
                >
                  {status === "connecting" ? "Connecting..." : "Connect"}
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
                  <div className={`w-64 h-64 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center transition-all duration-300 ${
                    isAIPlaying ? 'scale-110 shadow-2xl shadow-blue-500/50' : 'scale-100'
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
                    {isAIPlaying ? '🎙️ Speaking...' : isListening ? '👂 Listening...' : '💭 Thinking...'}
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
                    className={`w-3 rounded-full transition-all duration-300 ${
                      isAIPlaying 
                        ? 'bg-gradient-to-t from-blue-500 to-cyan-500' 
                        : isListening
                        ? 'bg-gradient-to-t from-purple-500 to-pink-500'
                        : 'bg-slate-700'
                    }`}
                    style={{
                      height: (isAIPlaying || isListening) 
                        ? `${20 + Math.random() * 80}%` 
                        : '20%',
                      transition: 'height 0.15s ease'
                    }}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">
                {isAIPlaying ? 'AI is speaking' : isListening ? 'You are speaking' : 'Waiting...'}
              </p>
            </div>

            {/* Control Panel */}
            <div className="p-6 bg-slate-900/50 border-t border-white/10">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={onToggleMic}
                  disabled={status !== "connected" || micAllowed === false}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    !isMicOn 
                      ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isMicOn ? 'Mute' : 'Unmute'}
                >
                  {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>

                <button
                  onClick={status === "connected" ? onDisconnect : onConnect}
                  disabled={status === "connecting"}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    status === "connected"
                      ? 'bg-gradient-to-br from-red-600 to-orange-600 hover:shadow-lg hover:shadow-red-500/50'
                      : 'bg-gradient-to-br from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={status === "connected" ? "Disconnect" : "Connect"}
                >
                  <Phone className="w-7 h-7" />
                </button>

                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    !isSpeakerOn 
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
              {chat.map((msg) => {
                if (msg.sender === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-full text-sm text-gray-400">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{ borderRadius: '5px' }}
                  >
                    <div 
                      className={`flex items-start max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                      style={{ gap: '6px' }}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender === 'assistant' 
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }`}>
                        {msg.sender === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>

                      {/* Message Bubble */}
                      <div className="flex flex-col" style={{ gap: '8px' }}>
                        <div
                          className={`px-5 rounded-2xl ${
                            msg.sender === 'assistant'
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
                            {msg.sender === 'assistant' ? 'AI Interviewer' : 'You'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
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
            {reportStatus === "loading" && (
              <div className="mx-6 mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-300 text-sm">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span>Generating interview report...</span>
                </div>
              </div>
            )}
            {reportStatus === "error" && reportError && (
              <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2 text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{reportError}</span>
                </div>
              </div>
            )}
            {reportStatus === "ready" && report && (
              <div className="mx-6 mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="flex items-start space-x-3 text-emerald-50 text-sm">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <div className="space-y-3 w-full">
                    <div>
                      <span className="font-semibold block">Interview Report</span>
                      <p className="text-xs text-emerald-100/80">
                        {report.candidateOverview?.name || "Unknown candidate"} •{" "}
                        {report.candidateOverview?.roleInterviewedFor || "Role N/A"}
                      </p>
                    </div>

                    <div className="grid gap-3 text-xs">
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                        <p className="text-emerald-100/80 text-[11px] uppercase tracking-wide mb-2">Scores</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(report.scores || {}).map(([label, value]) => (
                            <div
                              key={label}
                              className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-500/30 text-[11px] font-semibold"
                            >
                              {label}: {value ?? "—"}
                            </div>
                          ))}
                        </div>
                      </div>

                      {report.technicalSkillsAssessment?.length > 0 && (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2">
                          <p className="text-emerald-100/80 text-[11px] uppercase tracking-wide">Technical Skills</p>
                          <div className="space-y-2">
                            {report.technicalSkillsAssessment.map((skill, idx) => (
                              <div key={`${skill.skill}-${idx}`} className="flex flex-col gap-1 border border-emerald-500/10 rounded-lg p-2 bg-black/10">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold">{skill.skill}</span>
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-400/15 border border-emerald-400/20 uppercase tracking-wide">
                                    {skill.proficiency}
                                  </span>
                                </div>
                                <p className="text-emerald-100/70 leading-relaxed">{skill.evidence}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2">
                          <p className="text-emerald-100/80 text-[11px] uppercase tracking-wide">Problem Solving</p>
                          <ul className="space-y-1 text-emerald-100/80">
                            <li>Logical reasoning: {report.problemSolving?.logicalReasoning ?? "N/A"}</li>
                            <li>Approach: {report.problemSolving?.approachToUnknownProblems || "No data"}</li>
                            <li>Use of examples: {report.problemSolving?.useOfExamples ?? "N/A"}</li>
                          </ul>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2">
                          <p className="text-emerald-100/80 text-[11px] uppercase tracking-wide">Communication</p>
                          <ul className="space-y-1 text-emerald-100/80">
                            <li>Clarity: {report.communicationSkills?.clarity}</li>
                            <li>Structure: {report.communicationSkills?.structure}</li>
                            <li>Confidence: {report.communicationSkills?.confidence}</li>
                          </ul>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2">
                          <p className="text-emerald-100/80 text-[11px] uppercase tracking-wide">Strengths</p>
                          {report.strengths?.length ? (
                            <ul className="space-y-1 text-emerald-100/80">
                              {report.strengths.map((item, idx) => (
                                <li key={`strength-${idx}`}>
                                  <span className="font-semibold">{item.description}</span>: {item.evidence}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-emerald-100/60">No strengths captured.</p>
                          )}
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2">
                          <p className="text-emerald-100/80 text-[11px] uppercase tracking-wide">Areas to Improve</p>
                          {report.areasForImprovement?.length ? (
                            <ul className="space-y-1 text-emerald-100/80">
                              {report.areasForImprovement.map((item, idx) => (
                                <li key={`improve-${idx}`}>
                                  <span className="font-semibold">{item.description}</span>: {item.evidence}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-emerald-100/60">No gaps documented.</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2">
                        <p className="text-emerald-100/80 text-[11px] uppercase tracking-wide">Hiring Recommendation</p>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold">
                            {formatDecision(report.hiringRecommendation?.decision || "borderline")}
                          </span>
                          <p className="text-emerald-100/80">{report.hiringRecommendation?.justification}</p>
                        </div>
                      </div>

                      {report.recruiterSummary && (
                        <div className="bg-black/10 border border-emerald-500/10 rounded-lg p-3">
                          <p className="text-emerald-100/70 text-[11px] uppercase tracking-wide mb-1">Summary</p>
                          <p className="text-emerald-50 leading-relaxed">{report.recruiterSummary}</p>
                        </div>
                      )}
                    </div>
                  </div>
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
                  onKeyPress={(e) => e.key === 'Enter' && onSendText()}
                  placeholder={status === "connected" ? "Type if your mic is unavailable..." : "Connect to start chatting..."}
                  disabled={status !== "connected"}
                  className="flex-1 px-5 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={onSendText}
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Interview Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-lg transition">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Microphone</span>
                  <input 
                    type="checkbox" 
                    checked={isMicOn} 
                    onChange={onToggleMic}
                    disabled={status !== "connected" || micAllowed === false}
                    className="w-5 h-5" 
                  />
                </label>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Speaker</span>
                  <input 
                    type="checkbox" 
                    checked={isSpeakerOn} 
                    onChange={(e) => setIsSpeakerOn(e.target.checked)} 
                    className="w-5 h-5" 
                  />
                </label>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Show Transcription</span>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </label>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

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
                    Ending now will stop the session and redirect to the report page.
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
                    onDisconnect();
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
