"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Wraps the browser's Web Speech API (SpeechRecognition) for one-shot
// pronunciation capture. Chrome / Edge only — Safari and Firefox don't ship
// a working implementation yet, so we surface `isSupported` for the UI.
export function useSpeechRecognition({ lang = "en-US" } = {}) {
  const recognitionRef = useRef(null);
  const [isSupported, setIsSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (_) {
        /* no-op */
      }
    };
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    setTranscript("");
    setError(null);
    setListening(true);

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      setTranscript((finalText || interimText).trim());
    };

    recognition.onerror = (event) => {
      setError(event.error || "unknown_error");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setVolume(0);
    };

    try {
      recognition.start();
    } catch (_) {
      // start() throws if already running — ignore, the previous session
      // will end on its own.
    }
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch (_) {
        /* no-op */
      }
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return { isSupported, listening, transcript, volume, error, start, stop, reset };
}

// Lets the student hear a model pronunciation of the target text.
export function speak(text, { lang = "en-US", rate = 0.92 } = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = rate;
  window.speechSynthesis.speak(utter);
}
