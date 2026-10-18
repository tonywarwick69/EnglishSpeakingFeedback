"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAzureToken, invalidateAzureToken, classifyAzureError } from "@/utils/azureToken";

// Azure Speech pronunciation assessment (scripted / reading scenario).
// The browser SDK streams microphone audio straight to Azure; we only fetch a
// short-lived token from our own /api/speech-token route.

const LISTEN_TIMEOUT_MS = 25 * 1000; // hard stop if Azure never answers
const UNAVAILABLE_COOLDOWN_MS = 5 * 60 * 1000;

// Module-level state so it survives between questions (each QuestionCard remounts).
let unavailableUntil = 0;

function markUnavailable() {
  unavailableUntil = Date.now() + UNAVAILABLE_COOLDOWN_MS;
  invalidateAzureToken();
}

function parseWords(jsonString) {
  try {
    const json = JSON.parse(jsonString);
    const best = json?.NBest?.[0];
    return (best?.Words || []).map((w) => ({
      word: w.Word,
      accuracy: w.PronunciationAssessment?.AccuracyScore ?? 0,
      errorType: w.PronunciationAssessment?.ErrorType || "None",
    }));
  } catch (_) {
    return [];
  }
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function useAzurePronunciation() {
  const [status, setStatus] = useState("idle"); // idle | preparing | listening | processing | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null); // { kind: "mic" | "service" | "unknown", message }
  const [unavailable, setUnavailable] = useState(() => Date.now() < unavailableUntil);

  const recognizerRef = useRef(null);
  const timerRef = useRef(null);
  const runIdRef = useRef(0);

  const dispose = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    const recognizer = recognizerRef.current;
    recognizerRef.current = null;
    if (recognizer) {
      try {
        recognizer.close();
      } catch (_) {
        /* already closed */
      }
    }
  }, []);

  useEffect(() => () => {
    runIdRef.current += 1;
    dispose();
  }, [dispose]);

  const fail = useCallback(
    (kind, message) => {
      dispose();
      if (kind === "service") {
        markUnavailable();
        setUnavailable(true);
      }
      setError({ kind, message: String(message || "") });
      setStatus("error");
    },
    [dispose]
  );

  const start = useCallback(
    async (referenceText) => {
      dispose();
      const runId = ++runIdRef.current;
      setResult(null);
      setError(null);
      setStatus("preparing");

      try {
        const [{ token, region }, mod] = await Promise.all([
          getAzureToken(),
          import("microsoft-cognitiveservices-speech-sdk"),
        ]);
        if (runId !== runIdRef.current) return; // cancelled while preparing
        const sdk = mod.SpeechConfig ? mod : mod.default;

        const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
        speechConfig.speechRecognitionLanguage = "en-US";
        const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();

        const pronConfig = new sdk.PronunciationAssessmentConfig(
          referenceText,
          sdk.PronunciationAssessmentGradingSystem.HundredMark,
          sdk.PronunciationAssessmentGranularity.Word,
          true // enableMiscue -> Omission / Insertion error types
        );
        pronConfig.enableProsodyAssessment = true; // en-US only (setter in the JS SDK)

        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
        recognizerRef.current = recognizer;
        pronConfig.applyTo(recognizer);

        recognizer.sessionStarted = () => {
          if (runId === runIdRef.current) setStatus("listening");
        };
        recognizer.speechEndDetected = () => {
          if (runId === runIdRef.current) setStatus("processing");
        };

        timerRef.current = setTimeout(() => {
          if (runId === runIdRef.current) fail("service", "timeout");
        }, LISTEN_TIMEOUT_MS);

        recognizer.recognizeOnceAsync(
          (res) => {
            if (runId !== runIdRef.current) return;

            if (res.reason === sdk.ResultReason.RecognizedSpeech) {
              const pa = sdk.PronunciationAssessmentResult.fromResult(res);
              const jsonString = res.properties.getProperty(
                sdk.PropertyId.SpeechServiceResponse_JsonResult
              );
              setResult({
                spoken: res.text || "",
                pronScore: num(pa.pronunciationScore) ?? 0,
                accuracy: num(pa.accuracyScore),
                fluency: num(pa.fluencyScore),
                completeness: num(pa.completenessScore),
                prosody: num(pa.prosodyScore),
                words: parseWords(jsonString),
                noSpeech: false,
              });
              dispose();
              setStatus("done");
            } else if (res.reason === sdk.ResultReason.NoMatch) {
              setResult({
                spoken: "",
                pronScore: 0,
                accuracy: null,
                fluency: null,
                completeness: null,
                prosody: null,
                words: [],
                noSpeech: true,
              });
              dispose();
              setStatus("done");
            } else {
              const details = sdk.CancellationDetails.fromResult(res);
              fail(classifyAzureError(details?.errorDetails), details?.errorDetails);
            }
          },
          (err) => {
            if (runId !== runIdRef.current) return;
            fail(classifyAzureError(err), err);
          }
        );
      } catch (err) {
        if (runId !== runIdRef.current) return;
        const kind = err?.kind || classifyAzureError(err?.message || err);
        fail(kind, err?.message || err);
      }
    },
    [dispose, fail]
  );

  // Cancels an in-progress attempt and discards it.
  const stop = useCallback(() => {
    runIdRef.current += 1;
    dispose();
    setStatus("idle");
  }, [dispose]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setStatus("idle");
  }, []);

  const isActive = status === "preparing" || status === "listening" || status === "processing";

  return { status, isActive, result, error, unavailable, start, stop, reset };
}
