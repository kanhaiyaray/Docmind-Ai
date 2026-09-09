import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Zap, Loader, FileText, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const Quiz = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionType, setQuestionType] = useState("multiple-choice");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documents?status=completed");
      setDocuments(res.data.documents || []);
    } catch (err) {
      toast.error("Failed to load documents");
    }
  };

  const generateQuiz = async () => {
    if (!selectedDoc) {
      toast.error("Please select a document");
      return;
    }
    setLoading(true);
    setQuestions([]);
    setSubmitted(false);
    setScore(null);
    setAnswers({});
    try {
      const res = await api.post("/quiz/generate", {
        documentId: selectedDoc,
        numQuestions,
        difficulty,
        questionType,
      });
      setQuestions(res.data.questions || []);
      toast.success("Quiz generated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qIndex, value) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: value }));
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    toast.success(`You got ${correct}/${questions.length} correct!`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="h-8 w-8 text-yellow-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz Generator</h1>
      </div>

      <div className="glass-card p-6 mb-8 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Document</label>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="input-custom dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="">Choose a document...</option>
              {documents.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.title} ({doc.pageCount} pages)
                </option>
              ))}
            </select>
          </div>

          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Questions</label>
            <input
              type="number"
              min="1"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Math.min(20, Math.max(1, +e.target.value)))}
              className="input-custom dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="input-custom dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className="input-custom dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True / False</option>
              <option value="fill-in">Fill in the Blank</option>
            </select>
          </div>

          <button
            onClick={generateQuiz}
            disabled={loading || !selectedDoc}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </div>

      {questions.length > 0 && !submitted && (
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className="glass-card p-5 dark:bg-gray-800 dark:border-gray-700">
              <p className="font-medium text-gray-900 dark:text-white mb-2">{idx+1}. {q.question}</p>
              <div className="space-y-2">
                {q.options && q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q${idx}`}
                      value={opt}
                      checked={answers[idx] === opt}
                      onChange={() => handleAnswerChange(idx, opt)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                  </label>
                ))}
                {!q.options && (
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    value={answers[idx] || ''}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    className="input-custom"
                  />
                )}
              </div>
            </div>
          ))}
          <button onClick={handleSubmit} className="btn-primary w-full">Submit Answers</button>
        </div>
      )}

      {submitted && score !== null && (
        <div className="space-y-6">
          <div className="glass-card p-6 text-center dark:bg-gray-800 dark:border-gray-700">
            <div className="text-4xl mb-2">{score === questions.length ? "🎉" : "📝"}</div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{score} / {questions.length} correct</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {score === questions.length ? "Perfect! You know this document well." : "Review the document to improve."}
            </p>
            <button onClick={() => { setQuestions([]); setSubmitted(false); setScore(null); setAnswers({}); }} className="btn-primary mt-4">
              Try Again
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const userAnswer = answers[idx];
              const correctAnswer = q.correctAnswer;
              const isCorrect = userAnswer === correctAnswer;
              return (
                <div key={idx} className="glass-card p-5 dark:bg-gray-800 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">{idx+1}. {q.question}</p>
                  {q.options ? (
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const isCorrectOption = opt === correctAnswer;
                        const isUserSelected = opt === userAnswer;
                        let borderClass = "border-gray-200 dark:border-gray-600";
                        if (isCorrectOption) borderClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
                        else if (isUserSelected && !isCorrectOption) borderClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
                        return (
                          <div key={oi} className={`flex items-center gap-2 p-2 rounded-lg border ${borderClass}`}>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                            {isCorrectOption && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
                            {isUserSelected && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">Your answer: <span className="font-medium">{userAnswer || "(not answered)"}</span></p>
                      <p className="text-sm text-green-600 dark:text-green-400">Correct answer: <span className="font-medium">{correctAnswer}</span></p>
                    </div>
                  )}
                  <div className="mt-2 text-sm flex items-center gap-1">
                    {isCorrect ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Correct!
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                        <XCircle className="h-4 w-4" /> Incorrect. Correct answer: <strong>{correctAnswer}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;