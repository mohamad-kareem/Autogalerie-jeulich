"use client";

import { useEffect, useRef, useState } from "react";

export default function TranslatorPage() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  // --- Text states ---
  const [germanDetected, setGermanDetected] = useState("");
  const [englishTranslation, setEnglishTranslation] = useState("");
  const [typedEnglish, setTypedEnglish] = useState("");
  const [germanTranslationOfEnglish, setGermanTranslationOfEnglish] =
    useState("");
  const [germanReply, setGermanReply] = useState("");

  // --- Conversation memory ---
  const [history, setHistory] = useState([]);

  // ======================
  // AI CALL (typing or speech)
  // ======================
  async function askAssistant({
    germanText = "",
    englishText = "",
    historyList = [],
  }) {
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ germanText, englishText, history: historyList }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Update UI results
      if (data.english_translation)
        setEnglishTranslation(data.english_translation);
      if (data.german_translation)
        setGermanTranslationOfEnglish(data.german_translation);
      if (data.german_reply) setGermanReply(data.german_reply);

      // store last dealer reply in memory
      if (data.german_reply) {
        setHistory((prev) => {
          const updated = [
            ...prev,
            { role: "dealer", text: data.german_reply },
          ];
          return updated.slice(-3);
        });
      }
    } catch (err) {
      console.error("AI error:", err);
    }
  }

  // ======================
  // Trigger when YOU TYPE ENGLISH
  // ======================
  async function handleTranslateTypedEnglish() {
    if (!typedEnglish.trim()) return;

    // store typed english before sending
    setHistory((prev) => {
      const updated = [...prev, { role: "dealer", text: typedEnglish }];
      return updated.slice(-3);
    });

    await askAssistant({
      englishText: typedEnglish,
      historyList: history,
    });
  }

  // ======================
  // SPEECH HANDLING (CUSTOMER GERMAN)
  // ======================
  function handleGermanDetected(germanText) {
    setGermanDetected(germanText);

    // add to history as customer text
    setHistory((prev) => {
      const updated = [...prev, { role: "customer", text: germanText }];
      return updated.slice(-3);
    });

    askAssistant({
      germanText,
      historyList: history,
    });
  }

  // ======================
  // SPEECH RECOGNITION INIT
  // ======================
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = "de-DE";
    recog.continuous = true;
    recog.interimResults = false;

    recog.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      handleGermanDetected(transcript);
    };

    recog.onerror = (e) => console.error("Speech error:", e.error);
    recog.onend = () => setListening(false);

    recognitionRef.current = recog;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  // ======================
  // RENDER PAGE
  // ======================
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">
        📞 AI Buyer Assistant – Real-Time Translator
      </h1>

      <p className="text-gray-600">
        You write in English → AI translates to German → you read it. Seller
        speaks German → AI translates to English → AI answers in German.
      </p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT: YOU (English input & translations) */}
        <div className="md:w-2/3 space-y-5">
          {/* TYPE ENGLISH */}
          <div>
            <p className="font-semibold">Write your English message:</p>
            <textarea
              value={typedEnglish}
              onChange={(e) => setTypedEnglish(e.target.value)}
              className="w-full p-3 border rounded"
              rows={3}
              placeholder="Type what you want to say to the seller..."
            />
            <button
              onClick={handleTranslateTypedEnglish}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
            >
              Translate to German
            </button>
          </div>

          {/* TRANSLATION TO GERMAN */}
          <div className="p-3 bg-gray-100 rounded">
            <p className="font-bold mb-1">
              German translation (you read this):
            </p>
            <p className="text-xl font-semibold">
              {germanTranslationOfEnglish ||
                "Translated German sentence will appear here."}
            </p>
          </div>

          {/* TRANSLATION OF CUSTOMER (GERMAN → ENGLISH) */}
          <div className="p-3 bg-gray-100 rounded">
            <p className="font-bold">Customer → English:</p>
            <p>
              {englishTranslation || "Customer English meaning appears here."}
            </p>
          </div>

          {/* AI-GENERATED GERMAN REPLY */}
          <div className="p-3 bg-gray-100 rounded">
            <p className="font-bold">
              AI German Reply (you read this to seller):
            </p>
            <p className="text-xl font-semibold">
              {germanReply || "AI reply will appear here."}
            </p>
          </div>
        </div>

        {/* RIGHT: SPEECH */}
        <div className="md:w-1/3 space-y-4">
          {!supported && (
            <div className="p-3 bg-red-100 text-red-700">
              Speech recognition not supported. Use Chrome Desktop.
            </div>
          )}

          <button
            onClick={toggleListening}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded"
          >
            {listening ? "Stop Listening" : "Start Listening"}
          </button>

          <div className="p-3 bg-gray-100 rounded min-h-[100px]">
            <p className="font-bold">Customer German Speech:</p>
            <p>{germanDetected || "Waiting for speech..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
