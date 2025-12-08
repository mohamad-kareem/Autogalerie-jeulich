// app/translator/page.jsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function TranslatorPage() {
  // Speech recognition state
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Text state
  const [germanDetected, setGermanDetected] = useState("");
  const [englishDetected, setEnglishDetected] = useState("");

  const [englishReply, setEnglishReply] = useState("");
  const [germanReply, setGermanReply] = useState("");

  // ---------- API helper ----------
  async function translate(text, target) {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Translate error:", data);
      throw new Error(data.error || "Failed to translate");
    }

    return data.translated;
  }

  // ---------- When German speech is detected ----------
  async function handleGermanDetected(germanText) {
    setGermanDetected(germanText);

    try {
      const en = await translate(germanText, "English");
      setEnglishDetected(en);
    } catch (err) {
      console.error(err);
    }
  }

  // ---------- Translate your English reply to German ----------
  async function handleTranslateReply() {
    if (!englishReply.trim()) return;
    try {
      const de = await translate(englishReply, "German");
      setGermanReply(de);
    } catch (err) {
      console.error(err);
    }
  }

  // ---------- Setup SpeechRecognition inside the page ----------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      setSupported(false);
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = "de-DE";
    recog.continuous = true;
    recog.interimResults = false;

    recog.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      console.log("🎙️ Recognized German:", transcript);
      handleGermanDetected(transcript);
    };

    recog.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recog.onstart = () => {
      console.log("Speech recognition started");
    };

    recog.onend = () => {
      console.log("Speech recognition ended");
      // no auto-restart to keep it simple
    };

    recognitionRef.current = recog;

    return () => {
      recog.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 mt-25">
      <h1 className="text-2xl font-bold mb-4">
        📞 Live Phone Translator (Deutsch ↔ Englisch)
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT SIDE: English + your reply */}
        <div className="md:w-2/3 space-y-4">
          {/* English translation */}
          <div className="p-3 bg-gray-100 rounded">
            <p className="font-bold mb-1">English translation of customer:</p>
            <p>
              {englishDetected || "Here you will see the English translation."}
            </p>
          </div>

          {/* Your custom English reply */}
          <div className="space-y-2">
            <p className="font-semibold">Write your reply in English:</p>
            <textarea
              value={englishReply}
              onChange={(e) => setEnglishReply(e.target.value)}
              placeholder="Write your reply in English and I will translate it to German..."
              className="w-full p-3 border rounded"
              rows={3}
            />
            <button
              onClick={handleTranslateReply}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Translate my reply to German
            </button>
          </div>

          {/* Final German reply (big) */}
          <div className="p-3 bg-gray-100 rounded">
            <p className="font-bold mb-1">Your reply to read in German:</p>
            <p className="text-xl font-semibold">
              {germanReply ||
                "After translating, your German reply will appear here."}
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Listening + German text from customer */}
        <div className="md:w-1/3 space-y-4">
          {!supported && (
            <div className="p-3 bg-red-100 text-red-700 rounded">
              Your browser does not support speech recognition. Please use
              Chrome on desktop.
            </div>
          )}

          <button
            onClick={toggleListening}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {listening ? "Stop Listening" : "Start Listening"}
          </button>

          <div className="p-3 bg-gray-100 rounded h-full">
            <p className="font-bold mb-1">Customer (German):</p>
            <p>
              {germanDetected ||
                "When you click Start, recognized German will appear here."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
