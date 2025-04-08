import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 4096,
};

let chatSession = null;


export default function BarkochbaGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [question, setQuestion] = useState("Loading...");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [answers, setAnswers] = useState([]);
  const [aiGuess, setAiGuess] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;


  const toggleDarkMode = () => setDarkMode(!darkMode);

  const startChatSession = async () => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
  
    chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{
            text: `You're the Game Master for the Barkochba word guessing game.
            Only ask ONE strategic Yes/No question at a time. Wait for the user's Yes/No response before asking the next.
            Do NOT guess the word until you're 95% sure. 
            Start with general ideas (is it alive, can I touch it, etc) before narrowing down.
            Never ask multiple questions or follow-ups in the same message.
            Let's begin. What's your first question?`,
          }],
        },
        {
          role: "model",
          parts: [{ text: "Okay! I'm ready. Here's my first question:" }],
        },
      ]      
    });
  
    const result = await chatSession.sendMessage("Start the game.");
    return result.response.text();
  };
  
  const sendUserAnswer = async (answer) => {
    if (!chatSession) {
      throw new Error("Chat session not started");
    }
  
    const result = await chatSession.sendMessage(
      `${answer}. Now, ask ONE next Yes/No question ONLY, and wait for my reply before continuing.`
    );
  
    const text = result.response.text();
    console.log("Gemini response:", text);
    return text;
  };


  const startGame = async () => {
    setIsPlaying(true);
    setAnswers([]);
    setAiGuess(null);
    setGameOver(false);
    setQuestionNumber(1);
    setQuestion("Loading...");
    const firstQuestion = await startChatSession();
    setQuestion(firstQuestion);
  };

  const handleAnswer = async (answer) => {
    const newAnswers = [...answers, { question, answer }];
    setAnswers(newAnswers);
    setQuestionNumber((prev) => prev + 1);

    try {
      // Add a small delay (e.g. 2 seconds)
      setQuestion("Thinking..."); // Show a loading message
      await new Promise((res) => setTimeout(res, 2000));

      const response = await sendUserAnswer(answer);
      console.log("Gemini response:", response);

      const match = response.match(/I guess your word is (.+)/i);
    if (match) {
      const guessed = match[1].trim().replace(/[.?!]/, "");
      setAiGuess(guessed);
      setGameOver(true);
    } else {
      setQuestion(response);
    }

    } catch (error) {
      if (error.message.includes("429")) {
        setQuestion("I'm thinking too fast! Let's take a short break and try again in a few seconds.");
      } else {
        setQuestion("Something went wrong. Please try again.");
      }
    }

    console.log("Gemini response:", response);

  // Just set whatever it replies with
  setQuestion(response);

    const match = response.match(/I guess your word is (.+)/i);
    if (match) {
      const guessed = match[1].trim().replace(/[.?!]/, "");
      setAiGuess(guessed);
      setGameOver(true);
    } else {
      setQuestion(response);
    }
  };
  
  const restartGame = () => {
    setIsPlaying(false);
  };


  return (
    <div className={` min-h-screen flex items-center justify-center transition-colors duration-300 ${darkMode ? "bg-gray-900" : "bg-gradient-to-br from-white to-purple-300"}`}>
      <motion.div 
        className={`game-box rounded-xl shadow-md shadow-black/25 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button onClick={toggleDarkMode} className="absolute top-4 right-4">
          {darkMode ? <Sun className="text-yellow-400" /> : <Moon className="text-gray-600" />}
        </button>

        {!isPlaying ? (
          <div className="box-border p-6 sm:p-10 md:p-12 flex flex-col items-center text-center">
            <img src="../logo.png" alt="Logo" className="h-15 object-scale-down" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent font-bold text-center">Barkochba</h1>
            <p className={`-mt-0 text-lg text-gray-600 mb-5 ${darkMode ? "text-neutral-400" : "text-gray-600"}`}>Think of a word, and I'll try to guess it!</p>
            <ol className="pl-0 space-y-2">
              <li className="flex items-center">
            <span className={`w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 text-purple-500 font-bold mr-2
              ${darkMode ? "bg-purple-400 text-white" : "bg-purple-100 text-purple-500"}`} >1</span>
              Think of any word and keep it in your mind.</li>
              <li className="flex items-center">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 text-purple-500 font-bold mr-2
              ${darkMode ? "bg-purple-400 text-white" : "bg-purple-100 text-purple-500"}`}>2</span>
                I'll ask you yes/no questions to figure out your word.</li>
              <li className="flex items-center">
              <span className={`w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 text-purple-500 font-bold mr-2
              ${darkMode ? "bg-purple-400 text-white" : "bg-purple-100 text-purple-500"}`}>3</span>
                Answer honestly by clicking the Yes or No buttons.</li>
              <li className="flex items-center">
              <span className={`w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 text-purple-500 font-bold mr-2
              ${darkMode ? "bg-purple-400 text-white" : "bg-purple-100 text-purple-500"}`}>4</span>
                Let's see if I can guess your word!</li>
            </ol>
            <div className="flex flex-col items-center mt-5">
            <button onClick={startGame} className="button p-2 rounded-md bg-gradient-to-r from-purple-500 to-blue-500 shadow-[rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px]">Let's Play!</button>
            </div>
          </div>
        ) : gameOver ? (
          <div>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold">Is your word "<strong>{aiGuess}</strong>"?</p>
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={restartGame} className="px-4 py-2 rounded bg-green-500 text-white">
                Yes!
              </button>
              <button onClick={restartGame} className="px-4 py-2 rounded bg-red-500 text-white">
                Nope
              </button>
            </div>
          </div>
        ) : (
          <div className="box-border p-6 sm:p-10 md:p-12 flex flex-col items-center text-center">
            <p className="text-lg sm:text-xl md:text-2xl ">Question {questionNumber}</p>
            <p className={`text-xl sm:text-xl md:text-2xl mt-4 bg-gray-100 p-4 rounded-lg shadow ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>{question}</p>
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={() => handleAnswer("yes")} className={`button button-yes bg-green-200 px-4 py-0.5 rounded-sm
              ${darkMode ? "bg-green-500" : "bg-green-200"}`}>YES</button>
              <button onClick={() => handleAnswer("no")} className={`button button-no bg-red-200 px-4 py-0.5 rounded-sm 
              ${darkMode ? "bg-red-500" : "bg-red-200"}`}>NO</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
} 