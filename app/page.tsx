"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

export default function ExamSimulatorWebApp() {
  const [scriptText, setScriptText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState([]);
  const [started, setStarted] = useState(false);
  const [showResult, setShowResult] = useState(null);

  const parseScript = () => {
    const questionBlocks = scriptText.split(/function qst\d+\(\)/g).slice(1);

    const parsed = questionBlocks.map((block, idx) => {
      // Extract correct answers
      const correctMatches = [...block.matchAll(/r_a\d+="([^"]*)"/g)];
      const correctAnswers = correctMatches.map((m) => m[1]).filter(Boolean);

      // Extract options from messages array
      const messageMatches = [...block.matchAll(/\[\d+\]="([^"]*)"/g)];
      const options = messageMatches.map((m) => m[1]);

      // Extract question text from echo lines with cyan color code \e[0;36m
      // The question text is in the second echo line (after "QUESTION:N")
      const echoMatches = [...block.matchAll(/echo\s+-e\s+"\\e\[0;36m([^"\\]+)\\e\[0m"/g)];
      let questionText = `Question ${idx + 1}`;
      if (echoMatches.length >= 2) {
        // First match is "QUESTION:N", second is the actual question
        questionText = echoMatches[1][1].trim();
      } else if (echoMatches.length === 1) {
        const text = echoMatches[0][1].trim();
        if (!text.startsWith("QUESTION")) {
          questionText = text;
        }
      }

      return {
        id: idx,
        question: questionText,
        options,
        correctAnswers,
      };
    });

    const filtered = parsed.filter((q) => q.options.length > 0);
    setQuestions(filtered);
    setCurrentIndex(0);
    setScore(0);
    setSelected([]);
    setShowResult(null);
    setStarted(filtered.length > 0);
  };

  const handleAnswer = (option) => {
    if (showResult !== null) return;
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const submitAnswer = () => {
    const current = questions[currentIndex];
    const isCorrect =
      selected.length === current.correctAnswers.length &&
      selected.every((ans) => current.correctAnswers.includes(ans));
    setShowResult(isCorrect ? "correct" : "incorrect");
    if (isCorrect) setScore((prev) => prev + 1);
  };

  const nextQuestion = () => {
    setSelected([]);
    setShowResult(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStarted(false);
    }
  };

  const restart = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setSelected([]);
    setShowResult(null);
    setStarted(false);
    setScriptText("");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 grid gap-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-center"
      >
        Bash Exam Simulator → Interactive Web Quiz
      </motion.h1>

      {/* Input screen */}
      {!started && questions.length === 0 && (
        <Card className="rounded-2xl shadow-lg p-4 max-w-2xl mx-auto w-full">
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your full bash simulator file here..."
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              className="min-h-[200px]"
            />
            <Button
              onClick={parseScript}
              disabled={!scriptText.trim()}
              className="w-full rounded-2xl"
            >
              Parse File
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quiz screen */}
      {started && questions.length > 0 && (
        <Card className="rounded-2xl shadow-xl p-6 max-w-2xl mx-auto w-full">
          <CardContent className="space-y-6">
            {/* Progress */}
            <div className="text-sm text-gray-500 text-right">
              {currentIndex + 1} / {questions.length}
            </div>

            {/* Question */}
            <div className="text-xl font-semibold leading-relaxed">
              {questions[currentIndex].question}
            </div>

            {/* Options */}
            <div className="grid gap-3">
              {questions[currentIndex].options.map((option, idx) => {
                const isSelected = selected.includes(option);
                const isCorrectOption = questions[currentIndex].correctAnswers.includes(option);

                let bgClass = "bg-white border-gray-200";
                if (showResult !== null) {
                  if (isCorrectOption) bgClass = "bg-green-100 border-green-400";
                  else if (isSelected) bgClass = "bg-red-100 border-red-400";
                } else if (isSelected) {
                  bgClass = "bg-blue-100 border-blue-400";
                }

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${bgClass}`}
                    onClick={() => handleAnswer(option)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleAnswer(option)}
                      readOnly
                    />
                    <span className="flex-1">{option}</span>
                  </div>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {showResult !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-center font-semibold text-lg ${
                    showResult === "correct" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {showResult === "correct" ? "✅ Correct!" : `❌ Incorrect — Correct: ${questions[currentIndex].correctAnswers.join(", ")}`}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              {showResult === null ? (
                <Button
                  onClick={submitAnswer}
                  disabled={selected.length === 0}
                  className="rounded-2xl"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button onClick={nextQuestion} className="rounded-2xl">
                  {currentIndex < questions.length - 1 ? "Next Question →" : "Finish Quiz"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results screen */}
      {!started && questions.length > 0 && (
        <Card className="rounded-2xl shadow-xl p-6 max-w-xl mx-auto text-center w-full">
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">Quiz Finished 🎉</div>
            <div className="text-lg">
              Your Score: {score} / {questions.length}
            </div>
            <div className="text-gray-500">
              {score === questions.length
                ? "Perfect score! 🏆"
                : score >= questions.length / 2
                ? "Good job! Keep practicing."
                : "Keep studying, you'll get there!"}
            </div>
            <Button onClick={restart} className="rounded-2xl w-full">
              Start Over
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}