import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import useGameStore from "../store/gameStore";
import { useSocket, emitSocket } from "../hooks/useSocket";
import { useTimer } from "../hooks/useTimer";
import QuestionCard from "../components/QuestionCard";
import AnswerOptions from "../components/AnswerOptions";
import Timer from "../components/Timer";
import Leaderboard from "../components/Leaderboard";
import Explanation from "../components/Explanation";

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const store = useGameStore();
  const submitTimeRef = useRef(null);

  const { timeLeft, isRunning, start: startTimer, stop: stopTimer } = useTimer(
    store.timeLimit || 20,
    () => { } // auto-advance handled server-side
  );

  // Socket: next question
  useSocket("nextQuestion", ({ question, questionNumber, total, timeLimit }) => {
    store.setCurrentQuestion(question, questionNumber, total, timeLimit);
    startTimer(timeLimit);
    submitTimeRef.current = Date.now();
  }, []);

  // Socket: my answer result
  useSocket("answerResult", (result) => {
    store.setAnswerResult(result);
    // We strictly do NOT stop the timer here to maintain standard time sync globally.
  }, []);

  // Socket: reveal correct answer + explanation
  useSocket("answerReveal", (data) => {
    store.setAnswerReveal(data);
    stopTimer();
  }, []);

  // Socket: leaderboard update
  useSocket("leaderboardUpdate", (lb) => { store.setLeaderboard(lb); }, []);

  // Socket: game over
  useSocket("gameOver", ({ finalScores, winner }) => {
    store.setGameOver(finalScores, winner);
    navigate(`/results/${code}`);
  }, [code, navigate]);

  useSocket("error", ({ message }) => { toast.error(message); navigate("/"); }, [navigate]);

  function handleSelectOption(optionId) {
    if (store.selectedOptionId) return; // already answered
    store.setSelectedOption(optionId);
    const timeTaken = submitTimeRef.current
      ? Math.min(Math.round((Date.now() - submitTimeRef.current) / 1000), store.timeLimit)
      : store.timeLimit;
    emitSocket("submitAnswer", { code, optionId, timeTaken });
  }

  function handleReport() {
    if (!store.currentQuestion) return;
    emitSocket("reportQuestion", { questionId: store.currentQuestion.id, reason: "inaccurate" });
    toast.success("Question reported. Thanks!");
  }

  const isAnswered = !!store.selectedOptionId;
  const isRevealing = store.gameState === "revealing";

  if (!store.currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Loading question...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 font-medium">
              Q {store.questionNumber} / {store.totalQuestions}
            </span>
            {/* Progress bar */}
            <div className="hidden sm:block w-32 h-1.5 bg-surface-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-400 to-purple-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((store.questionNumber - 1) / store.totalQuestions) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Score: <span className="text-brand-400 font-bold">{store.myScore.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main question area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Timer + Question card row */}
            <div className="flex items-start gap-4">
              <Timer timeLeft={timeLeft} duration={store.timeLimit} isRunning={isRunning} />
              <div className="flex-1">
                <QuestionCard
                  question={store.currentQuestion}
                  questionNumber={store.questionNumber}
                  totalQuestions={store.totalQuestions}
                />
              </div>
            </div>

            {/* Answer options */}
            <AnswerOptions
              options={store.currentQuestion?.options || []}
              onSelect={handleSelectOption}
              selectedId={store.selectedOptionId}
              answerResult={store.answerResult}
              answerReveal={store.answerReveal}
              disabled={isAnswered || isRevealing}
            />

            {/* Answer feedback banner */}
            <AnimatePresence>
              {store.answerResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-xl p-4 text-center font-bold text-lg border ${store.answerResult.correct
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                      : "bg-red-500/15 border-red-500/40 text-red-400"
                    }`}
                >
                  {store.answerResult.correct
                    ? `✓ Correct! +${store.answerResult.points} pts`
                    : "✗ Incorrect — better luck next time!"}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Explanation */}
            {isRevealing && store.answerReveal && (
              <Explanation
                text={store.currentQuestion?.explanation}
                referenceUrl={store.currentQuestion?.referenceUrl}
              />
            )}

            {/* Report */}
            {(isAnswered || isRevealing) && (
              <div className="text-center">
                <button onClick={handleReport} className="btn-ghost btn text-xs text-gray-500">
                  🚩 Report this question
                </button>
              </div>
            )}
          </div>

          {/* Live leaderboard sidebar */}
          <div className="lg:block">
            <Leaderboard players={store.leaderboard} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
