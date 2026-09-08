import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import {
  Sparkles,
  Loader,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  RefreshCw,
  CheckSquare,
  Square,
} from "lucide-react";
import toast from "react-hot-toast";

const Flashcards = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [numCards, setNumCards] = useState(10);
  const [includeExamples, setIncludeExamples] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState(null);

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

  const generateFlashcards = async () => {
    if (!selectedDoc) {
      toast.error("Please select a document");
      return;
    }
    setLoading(true);
    setError(null);
    setFlashcards([]);
    setCurrentIndex(0);
    setFlipped(false);
    try {
      const res = await api.post("/flashcards/generate", {
        documentId: selectedDoc,
        numCards,
        includeExamples,
      });
      const cards = Array.isArray(res.data.flashcards) ? res.data.flashcards : [];
      if (cards.length === 0) {
        toast.error("No flashcards generated. Try a different document.");
        setError("No flashcards returned.");
      } else {
        setFlashcards(cards);
        toast.success(`${cards.length} flashcards generated!`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to generate flashcards";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const nextCard = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFlipped(false);
    }
  }, [currentIndex, flashcards.length]);

  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  const toggleFlip = () => setFlipped((prev) => !prev);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (flashcards.length === 0) return;
      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
      if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        toggleFlip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextCard, prevCard, toggleFlip, flashcards.length]);

  useEffect(() => {
    setCurrentIndex(0);
    setFlipped(false);
  }, [flashcards]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Generating flashcards...</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="h-8 w-8 text-green-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
      </div>

      <div className="glass-card p-6 mb-8 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Document</label>
            <select
              value={selectedDoc}
              onChange={(e) => {
                setSelectedDoc(e.target.value);
                setError(null);
                setFlashcards([]);
              }}
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
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"># Cards</label>
            <input
              type="number"
              min="5"
              max="30"
              value={numCards}
              onChange={(e) => setNumCards(Math.min(30, Math.max(5, +e.target.value)))}
              className="input-custom dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setIncludeExamples(!includeExamples)}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600"
            >
              {includeExamples ? (
                <CheckSquare className="h-5 w-5 text-purple-600" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
              Context with Examples
            </button>
          </div>
          <button
            onClick={generateFlashcards}
            disabled={!selectedDoc || loading}
            className="btn-primary flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" /> Generate
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {flashcards.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-lg aspect-[3/2] cursor-pointer perspective-1000" onClick={toggleFlip}>
            <div
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                flipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Front (Question) */}
              <div className="absolute inset-0 glass-card p-8 flex flex-col items-center justify-center backface-hidden dark:bg-gray-800 dark:border-gray-700">
                <p className="text-xl font-medium text-gray-800 dark:text-white text-center">
                  {flashcards[currentIndex]?.question || "No question"}
                </p>
                {flashcards[currentIndex]?.example && (
                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic border-t border-gray-200 dark:border-gray-600 pt-3">
                    💡 {flashcards[currentIndex].example}
                  </div>
                )}
              </div>
              {/* Back (Answer) */}
              <div className="absolute inset-0 glass-card p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700">
                <p className="text-xl font-medium text-purple-800 dark:text-purple-200 text-center">
                  {flashcards[currentIndex]?.answer || "No answer"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-8">
            <button
              onClick={prevCard}
              disabled={currentIndex === 0}
              className="p-3 rounded-full border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={toggleFlip}
              className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 transition"
            >
              <RotateCw className="h-6 w-6" />
            </button>
            <button
              onClick={nextCard}
              disabled={currentIndex === flashcards.length - 1}
              className="p-3 rounded-full border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} / {flashcards.length}
          </div>
          <div className="w-full max-w-lg mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => {
                setFlashcards([]);
                setCurrentIndex(0);
                setFlipped(false);
                setError(null);
              }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" /> Regenerate
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 dark:text-gray-500 py-12">
          <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No flashcards yet</p>
          <p className="text-sm">Select a document and click "Generate"</p>
        </div>
      )}
    </div>
  );
};

export default Flashcards;