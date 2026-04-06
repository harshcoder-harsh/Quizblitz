import { emitSocket } from "../hooks/useSocket";
import useGameStore from "../store/gameStore";
import Leaderboard from "./Leaderboard";

export default function TeacherDashboard({ code }) {
  const store = useGameStore();

  const isRevealing = store.gameState === "revealing";
  const players = Object.values(store.leaderboard || []);
  const answersThisRound = store.answerResult ? 1 : 0; // The teacher doesn't answer, we just approximate or get exact numbers from store. Wait, how do we know who answered?
  // Let's just track players count for now.
  
  return (
    <div className="min-h-[80vh] flex flex-col p-6 bg-surface-900 rounded-2xl border border-brand-500/30 shadow-2xl">
      <div className="flex justify-between items-center mb-8 border-b border-surface-700 pb-4">
        <div>
          <h2 className="text-3xl font-black text-brand-400">👩‍🏫 Teacher Control Panel</h2>
          <p className="text-gray-400 mt-1">Room Code: <span className="font-mono text-white tracking-widest text-lg bg-surface-800 px-2 rounded">{code}</span></p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Connected Students</p>
          <p className="text-3xl font-bold text-white">{players.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
        
        {/* Main Controls */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 bg-surface-800 rounded-xl border border-surface-600">
            <h3 className="text-xl font-bold text-white mb-4">Live Session: Question {Math.max(1, store.questionNumber)} / {store.totalQuestions || '?'}</h3>
            
            {store.currentQuestion ? (
              <div className="bg-surface-900 p-4 rounded-lg mb-6 shadow-inner">
                <p className="text-lg font-medium text-gray-200">{store.currentQuestion.questionText}</p>
                {isRevealing && store.answerReveal && (
                  <p className="text-brand-400 mt-4 text-sm font-bold bg-brand-500/10 p-2 rounded border border-brand-500/20">
                    Explanation: {store.answerReveal.explanation || 'No explanation provided.'}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic mb-6">Waiting to start the quiz...</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              {!store.currentQuestion && store.gameState !== 'playing' ? (
                <button disabled className="btn-primary btn py-4 opacity-50 cursor-not-allowed w-full col-span-2">
                  Waiting in Lobby...
                </button>
              ) : !store.currentQuestion ? (
                <button onClick={() => emitSocket("teacherNext", { code })} className="btn-primary btn py-4 text-lg font-bold w-full col-span-2 animate-glow">
                  Launch First Question 🚀
                </button>
              ) : isRevealing ? (
                <button onClick={() => emitSocket("teacherNext", { code })} className="btn-primary btn py-4 text-lg font-bold w-full col-span-2 animate-glow">
                  Next Question ⏭️
                </button>
              ) : (
                <button onClick={() => emitSocket("teacherReveal", { code })} className="btn-secondary btn py-4 text-lg font-bold w-full col-span-2 border-brand-500 text-brand-400 hover:bg-brand-500/20">
                  Force Complete & Reveal Stats 👀
                </button>
              )}
            </div>
            
            {store.currentQuestion && (
              <div className="mt-8 pt-6 border-t border-red-500/20">
                <button onClick={() => emitSocket("teacherEndGame", { code })} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg border border-red-500/30 transition-colors">
                  🛑 Terminate Quiz Early
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Leaderboard / Roster */}
        <div className="bg-surface-800 rounded-xl border border-surface-600 overflow-hidden flex flex-col">
          <div className="bg-surface-700 p-4">
             <h3 className="font-bold text-white">Student Roster</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
             {players.length === 0 ? (
               <p className="text-center text-gray-500 mt-10">No students joined yet.</p>
             ) : (
               <Leaderboard players={players} compact />
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
