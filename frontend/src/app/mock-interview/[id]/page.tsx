"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks/useSpeech";

type InterviewState = "idle" | "active" | "paused" | "completed" | "feedback";

interface Question {
  id: string;
  category: string;
  difficulty: string;
  prompt: string;
  competency: string;
  rubric: Record<string, string>;
  expected_signals: string[];
}

interface Feedback {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_points: string[];
  better_answer_guidance: string;
  confidence: number;
  star_assessments: Array<{
    question: string;
    situation: number;
    task: number;
    action: number;
    result: number;
    feedback: string;
  }>;
  practice_recommendations: string[];
}

export default function MockInterviewPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const [state, setState] = useState<InterviewState>("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAutoSubmitEnabled, setIsAutoSubmitEnabled] = useState(true);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const answerRef = useRef<HTMLTextareaElement>(null);

  // Speech hooks
  const { isListening, transcript, error: sttError, start: startListening, stop: stopListening, reset: resetTranscript } = useSpeechRecognition({
    onResult: (newTranscript, isFinal) => {
      if (answerRef.current) {
        answerRef.current.value = newTranscript;
      }
      setAnswers({ ...answers, [currentQuestionIndex]: newTranscript });

      // Reset silence timer on new speech
      if (isAutoSubmitEnabled && isFinal) {
        if (silenceTimer) clearTimeout(silenceTimer);
        const timer = setTimeout(() => {
          handleSubmitAnswer();
        }, 3000); // Auto-submit after 3 seconds of silence
        setSilenceTimer(timer);
      }
    },
    onEnd: () => {
      if (silenceTimer) clearTimeout(silenceTimer);
    },
  });

  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();

  // Speak question when it changes
  useEffect(() => {
    if (state === "active" && currentQuestion) {
      speak(currentQuestion.prompt);
    }
    return () => stopSpeaking();
  }, [currentQuestionIndex, state, speak, stopSpeaking]);

  // Redirect if not logged in
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/auth/signin");
    }
  }, [router]);

  const questions: Question[] = [
    {
      id: "q1",
      category: "behavioral",
      difficulty: "medium",
      prompt: "Tell me about a challenging technical project you worked on. What was the problem, your approach, and the outcome?",
      competency: "problem-solving",
      rubric: {
        situation: "Clearly describes the context and challenge",
        task: "Defines specific role and responsibility",
        action: "Details concrete steps taken",
        result: "Quantifies impact with metrics",
      },
      expected_signals: ["STAR format", "Technical depth", "Ownership", "Measurable results"],
    },
    {
      id: "q2",
      category: "technical",
      difficulty: "hard",
      prompt: "How would you design a rate-limiting system for a high-traffic API? Consider distributed systems challenges.",
      competency: "system-design",
      rubric: {
        requirements: "Clarifies functional and non-functional requirements",
        design: "Proposes scalable architecture with trade-offs",
        bottlenecks: "Identifies and addresses potential issues",
        alternatives: "Discusses alternative approaches",
      },
      expected_signals: ["Token bucket/leaky bucket", "Redis/distributed cache", "Consistency models", "Monitoring"],
    },
    {
      id: "q3",
      category: "system_design",
      difficulty: "hard",
      prompt: "Design a real-time notification system for a social media app with millions of users.",
      competency: "system-design",
      rubric: {
        scale: "Handles millions of concurrent connections",
        delivery: "Guarantees message delivery with ordering",
        fault_tolerance: "Handles failures gracefully",
      },
      expected_signals: ["WebSockets/Server-Sent Events", "Message queues", "Sharding", "Presence system"],
    },
    {
      id: "q4",
      category: "behavioral",
      difficulty: "medium",
      prompt: "Describe a time you had a disagreement with a teammate. How did you resolve it?",
      competency: "collaboration",
      rubric: {
        situation: "Describes the conflict objectively",
        action: "Shows active listening and compromise",
        result: "Positive outcome for team/project",
      },
      expected_signals: ["Empathy", "Data-driven discussion", "Team-first mindset"],
    },
    {
      id: "q5",
      category: "product",
      difficulty: "medium",
      prompt: "How would you prioritize features for a new product launch with limited engineering resources?",
      competency: "product-sense",
      rubric: {
        framework: "Uses structured prioritization (RICE, ICE, etc.)",
        stakeholders: "Balances user needs, business goals, technical constraints",
        metrics: "Defines success metrics",
      },
      expected_signals: ["User research", "MVP thinking", "Iterative approach"],
    },
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleSubmitAnswer = () => {
    const answer = answers[currentQuestionIndex]?.trim();
    if (!answer) return;

    if (silenceTimer) clearTimeout(silenceTimer);
    stopListening();
    resetTranscript();

    setAnswers({ ...answers, [currentQuestionIndex]: answer });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeInterview();
    }
  };

  const completeInterview = async () => {
    setState("feedback");
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setFeedback({
      overall_score: 0.78,
      strengths: [
        "Strong technical depth in system design questions",
        "Clear communication using STAR format for behavioral questions",
        "Good understanding of distributed systems trade-offs",
      ],
      weaknesses: [
        "Could provide more specific metrics in behavioral answers",
        "Rate limiting answer missed edge cases around distributed consensus",
      ],
      missing_points: [
        "Monitoring and alerting strategies",
        "Cost optimization considerations",
      ],
      better_answer_guidance: "For system design questions, always clarify requirements first, then propose a high-level architecture before diving into components. Mention monitoring, alerting, and cost implications.",
      confidence: 0.82,
      star_assessments: [
        {
          question: questions[0].prompt,
          situation: 0.9,
          task: 0.85,
          action: 0.8,
          result: 0.7,
          feedback: "Good context setting, but result could be more quantified",
        },
        {
          question: questions[3].prompt,
          situation: 0.85,
          task: 0.9,
          action: 0.85,
          result: 0.8,
          feedback: "Strong STAR structure throughout",
        },
      ],
      practice_recommendations: [
        "Practice quantifying results in behavioral answers",
        "Review distributed systems patterns: consensus, caching, sharding",
        "Mock interview: System design - 30 min practice session",
      ],
    });

    setLoading(false);
  };

  const handlePause = () => {
    setState("paused");
    stopSpeaking();
    stopListening();
    if (silenceTimer) clearTimeout(silenceTimer);
  };
  const handleResume = () => {
    setState("active");
    if (currentQuestion) speak(currentQuestion.prompt);
  };
  const handleSkip = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    stopListening();
    resetTranscript();
    stopSpeaking();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeInterview();
    }
  };
  const handleRestart = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    stopListening();
    resetTranscript();
    stopSpeaking();
    setState("idle");
    setCurrentQuestionIndex(0);
    setAnswers({});
    setFeedback(null);
  };

  if (state === "idle") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          <div className="glass-card p-8 stack-lg text-center">
            <h1 className="text-headline-lg">Mock Interview</h1>
            <p className="text-body-md text-on-surface-variant">
              {questions.length} questions • ~30 minutes • Text-based
            </p>
            <div className="stack-md mt-4">
              <div className="p-4 bg-surface-container rounded-lg stack-sm text-left">
                <h3 className="font-medium">Interview Configuration</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-on-surface-variant">Type</p>
                    <p className="font-medium">Text-based</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant">Personality</p>
                    <p className="font-medium">Technical</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant">Duration</p>
                    <p className="font-medium">30 minutes</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant">Questions</p>
                    <p className="font-medium">{questions.length}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setState("active")} className="btn-primary w-full py-3 text-lg">
                Start Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "feedback") {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border">
          <div className="container-main h-16 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary">InterviewMate</Link>
            <Link href="/readiness" className="btn-primary">View Readiness</Link>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="container-main max-w-4xl">
            <div className="stack-lg mb-8">
              <h1 className="text-headline-lg">Interview Feedback</h1>
              <p className="text-body-md text-on-surface-variant">
                Your performance analysis with rubric-based scoring
              </p>
            </div>

            <div className="glass-card p-6 stack-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-title-md font-medium">Overall Score</h2>
                <span className="status-chip status-chip-info">Coaching Guidance</span>
              </div>
              <div className="relative w-40 h-40 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#e5eeff" strokeWidth="10" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="url(#feedbackGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(feedback?.overall_score ?? 0) * 440}`}
                    strokeDashoffset="0"
                  />
                  <defs>
                    <linearGradient id="feedbackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4648d4" />
                      <stop offset="100%" stopColor="#6063ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-on-surface">
                    {Math.round((feedback?.overall_score ?? 0) * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-body-sm text-on-surface-variant text-center">
                Confidence: {Math.round((feedback?.confidence ?? 0) * 100)}% • This is coaching guidance, not a claim about what you said
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="glass-card p-6 stack-md">
                <h3 className="text-title-md font-medium flex items-center gap-2 text-green-600">
                  <span>✓</span> Strengths
                </h3>
                <ul className="space-y-2">
                  {feedback?.strengths?.map((s: string, i: number) => (
                    <li key={i} className="text-body-sm flex items-start gap-2">
                      <span className="text-green-600">→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-6 stack-md">
                <h3 className="text-title-md font-medium flex items-center gap-2 text-red-600">
                  <span>✕</span> Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {feedback?.weaknesses?.map((w: string, i: number) => (
                    <li key={i} className="text-body-sm flex items-start gap-2">
                      <span className="text-red-600">→</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="glass-card p-6 stack-md mb-6">
              <h3 className="text-title-md font-medium flex items-center gap-2 text-amber-600">
                <span>⚠</span> Missing Points
              </h3>
              <ul className="space-y-2">
                {feedback?.missing_points?.map((m: string, i: number) => (
                  <li key={i} className="text-body-sm flex items-start gap-2">
                    <span className="text-amber-600">→</span> {m}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-6 stack-md mb-6">
              <h3 className="text-title-md font-medium">Better Answer Guidance</h3>
              <p className="text-body-md">{feedback?.better_answer_guidance}</p>
            </div>

            {feedback?.star_assessments && feedback.star_assessments.length > 0 && (
              <div className="glass-card p-6 stack-md mb-6">
                <h3 className="text-title-md font-medium">STAR Assessment (Behavioral Questions)</h3>
                <div className="space-y-4">
                  {feedback.star_assessments.map((star: any, i: number) => (
                    <div key={i} className="p-4 bg-surface-container rounded-lg stack-sm">
                      <p className="text-body-sm font-medium text-on-surface-variant">
                        Q{i + 1}: {star.question.substring(0, 60)}.
                      </p>
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { label: "Situation", score: star.situation },
                          { label: "Task", score: star.task },
                          { label: "Action", score: star.action },
                          { label: "Result", score: star.result },
                        ].map((s) => (
                          <div key={s.label} className="stack-xs text-center">
                            <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center mx-auto">
                              <span className="text-2xl font-bold text-primary">{Math.round(s.score * 100)}%</span>
                            </div>
                            <span className="label-sm">{s.label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-body-sm text-on-surface-variant">{star.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card p-6 stack-md">
              <h3 className="text-title-md font-medium">Practice Recommendations</h3>
              <ul className="space-y-2">
                {feedback?.practice_recommendations?.map((rec: string, i: number) => (
                  <li key={i} className="text-body-sm flex items-start gap-2">
                    <span className="text-primary">→</span>
                    <Link href="/practice" className="underline hover:text-primary">
                      {rec}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4 pt-8">
              <button onClick={handleRestart} className="btn-secondary flex-1">Restart Interview</button>
              <Link href="/readiness" className="btn-primary flex-1 text-center">View Readiness Dashboard</Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container-main h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">InterviewMate</Link>

          <div className="flex items-center gap-4">
            <div className="hidden md:block w-48">
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-on-surface-variant text-center mt-1">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            {state === "active" && (
              <>
                <button onClick={handlePause} className="btn-secondary text-sm">Pause</button>
                <button onClick={handleSkip} className="btn-secondary text-sm">Skip</button>
              </>
            )}

            {state === "paused" && (
              <button onClick={handleResume} className="btn-primary text-sm">Resume</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 overflow-auto">
        <div className="container-main max-w-3xl">
          <div className="stack-lg mb-6">
            <div className="flex items-center gap-3">
              <span className="status-chip status-chip-info capitalize">{currentQuestion.category}</span>
              <span className="status-chip status-chip-warning capitalize">{currentQuestion.difficulty}</span>
              <span className="text-body-sm text-on-surface-variant">Competency: {currentQuestion.competency}</span>
            </div>

            <div className="glass-card p-6 stack-md">
              <h2 className="text-title-md font-medium">{currentQuestion.prompt}</h2>
              <div className="p-4 bg-surface-container rounded-lg stack-xs">
                <p className="label-sm text-on-surface-variant">Evaluation Rubric</p>
                <ul className="space-y-1 text-body-sm">
                  {Object.entries(currentQuestion.rubric).map(([key, value]) => (
                    <li key={key} className="flex items-start gap-2">
                      <span className="font-medium capitalize">{key.replace("_", " ")}:</span>
                      <span className="text-on-surface-variant">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 stack-md">
            <div className="flex items-center justify-between mb-2">
              <label className="label-sm">Your Answer</label>
              <div className="flex items-center gap-3">
                {isListening && (
                  <span className="flex items-center gap-1 text-red-500 text-sm animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Listening...
                  </span>
                )}
                {isSpeaking && (
                  <span className="flex items-center gap-1 text-primary text-sm">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Speaking question
                  </span>
                )}
                <label className="flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoSubmitEnabled}
                    onChange={(e) => setIsAutoSubmitEnabled(e.target.checked)}
                    className="rounded border-border"
                  />
                  Auto-submit on silence (3s)
                </label>
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={answerRef}
                value={answers[currentQuestionIndex] || ""}
                onChange={(e) => setAnswers({ ...answers, [currentQuestionIndex]: e.target.value })}
                className="input-field min-h-[200px] resize-y pr-20"
                placeholder={isListening ? "Speak your answer..." : "Type or speak your answer..."}
                rows={10}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isSpeaking}
                  className={`p-3 rounded-full transition-colors ${
                    isListening
                      ? "bg-red-100 text-red-600"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else if (currentQuestion) {
                      speak(currentQuestion.prompt);
                    }
                  }}
                  className={`p-3 rounded-full transition-colors ${
                    isSpeaking
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                  title={isSpeaking ? "Stop reading" : "Re-read question"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isSpeaking ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2h-8a2 2 0 01-2-2v-4zM15 14h.01M17 14h.01M10 14h.01M12 14h.01M8 14h.01" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v2.828l2.707-2.707a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0l2.707 2.707V5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-1.414l-2.707-2.707a1 1 0 01-1.414 1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {sttError && (
              <p className="text-body-sm text-red-500 mt-2">
                Speech recognition error: {sttError}. Please try again or type manually.
              </p>
            )}

            <div className="flex items-center justify-between pt-4">
              <p className="text-body-sm text-on-surface-variant">
                {answers[currentQuestionIndex]?.length || 0} characters
              </p>
              <button
                onClick={handleSubmitAnswer}
                disabled={!answers[currentQuestionIndex]?.trim() || loading}
                className="btn-primary px-8"
              >
                {currentQuestionIndex === questions.length - 1 ? "Complete Interview" : "Next Question"}
              </button>
            </div>
          </div>

          {currentQuestionIndex > 0 && (
            <details className="glass-card p-6 stack-md">
              <summary className="font-medium cursor-pointer">Previous Answers ({currentQuestionIndex})</summary>
              <div className="stack-md mt-4">
                {Object.entries(answers).slice(0, currentQuestionIndex).map(([idx, answer]) => (
                  <div key={idx} className="p-4 bg-surface-container rounded-lg stack-xs">
                    <p className="label-sm">Q{parseInt(idx, 10) + 1}: {questions[parseInt(idx, 10)].prompt.substring(0, 50)}.</p>
                    <p className="text-body-sm font-mono text-on-surface-variant">{answer}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </main>
    </div>
  );
}
