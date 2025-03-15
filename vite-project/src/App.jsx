import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";



// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export default function BarkochbaGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [question, setQuestion] = useState("Think of a word and I'll guess it!");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [progress, setProgress] = useState("🟢 Start");
  const [answers, setAnswers] = useState([]);
  const [aiGuess, setAiGuess] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const startGame = () => {
    setIsPlaying(true);
    setQuestion("Think of a word and I'll guess it!");
    setQuestionNumber(1);
    setProgress("🟢 Start");
    setAnswers([]);
    setAiGuess(null);
    setGameOver(false);
  };

  const fetchGeminiResponse = async (prompt) => {
    const response = await fetch("https://gemini.googleapis.com/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({ prompt, max_tokens: 50 }),
    });
    const data = await response.json();
    return data.text;
  };

  const handleAnswer = async (answer) => {
    const newAnswers = [...answers, { question, answer }];
    setAnswers(newAnswers);
    setQuestionNumber((prev) => prev + 1);
    setProgress(questionNumber >= 5 ? "🤖 Guessing" : "🔴 Focusing");

    const prompt = `I am playing a guessing game. Based on these answers: ${JSON.stringify(newAnswers)}, what should my next Yes/No question be? If enough information is available, guess the word.`;
    const response = await fetchGeminiResponse(prompt);

    if (response.toLowerCase().includes("i guess")) {
      setGuessedWord(response.replace("I guess your word is", "").trim());
    } else {
      setQuestion(response || "I'm not sure, can you give me more info?");
    }
  };

  const confirmGuess = async (correct) => {
    if (correct) {
      await addDoc(collection(db, "barkochba"), { word: guessedWord, questions: answers });
      alert("Great! I've learned something new.");
    } else {
      const correctWord = prompt("What was your word?");
      if (correctWord) {
        await addDoc(collection(db, "barkochba"), { word: correctWord, questions: answers });
        alert("Thanks! I'll learn from this.");
      }
    }
    startGame();
  };

  return (
    <div className={`font-montserrat min-h-screen flex items-center justify-center transition-colors duration-300 ${darkMode ? "bg-gray-900" : "bg-gradient-to-br from-white to-purple-300"}`}>
      <motion.div 
        className={`game-box ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button onClick={toggleDarkMode} className="absolute top-4 right-4">
          {darkMode ? <Sun className="text-yellow-400" /> : <Moon className="text-gray-600" />}
        </button>

        {!isPlaying ? (
          <div>
            <h1 className="text-3xl font-bold">🌟 Barkochba Game 🌟</h1>
            <p className="mt-4 text-lg">Think of a word, and I'll try to guess it!</p>
            <button onClick={startGame} className="button bg-gradient-to-r from-purple-500 to-blue-500">Let's Play!</button>
          </div>
        ) : gameOver ? (
          <div>
            <p className="text-lg font-semibold">Is your word "{aiGuess}"?</p>
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={() => saveWordToFirestore(aiGuess)} className="button button-yes">Yes, Save it!</button>
              <button onClick={startGame} className="button button-no">No, Try Again</button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-lg font-semibold">Question {questionNumber}</p>
            <p className="text-xl mt-4 bg-gray-100 p-4 rounded-lg shadow">{question}</p>
            <p className="mt-4">{progress}</p>
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={() => handleAnswer("yes")} className="button button-yes">YES</button>
              <button onClick={() => handleAnswer("no")} className="button button-no">NO</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}