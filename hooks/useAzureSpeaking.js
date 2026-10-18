"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAzureToken, classifyAzureError } from "@/utils/azureToken";
import { aggregateSegments } from "@/utils/speakingScore";

// Free-speaking (unscripted) pronunciation assessment with continuous
// recognition, so answers can be longer than the 30 s single-shot limit.
// No reference text: Azure returns accuracy / fluency / prosody for what the
// student actually said, plus the transcript.

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

function parseWords(jsonString) {
  try {
    const best = JSON.parse(jsonString)?.NBest?.[0];
    return (best?.Words || []).map((w) => ({
      word: w.Word,
      accuracy: w.PronunciationAssessment?.AccuracyScore ?? 0,
      errorType: w.PronunciationAssessment?.ErrorType || "None",
    }));
  } catch (_) {
    return [];
  }
}

export function useAzureSpeaking({ maxSeconds = 120 } = {}) {
  const [status, setStatus] = useState("idle"); // idle | preparing | recording | processing | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null); // { kind: "mic" | "service", message }
  const [elapsedMs, setElapsedMs] = useState(0);

  const recognizerRef = useRef(null);
  const segmentsRef = useRef([]);
  const tickRef = useRef(null);
  const startedAtRef = useRef(0);
  const durationRef = useRef(0);
  const runIdRef = useRef(0);
  const recordingRef = useRef(false);
  const finalizedRef = useRef(false);
  const stopRef = useRef(() => {});

  const dispose = useCallback(() => {
    clearInterval(tickRef.current);
    tickRef.current = null;
    recordingRef.current = false;
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

  useEffect(
    () => () => {
      runIdRef.current += 1;
      dispose();
    },
    [dispose]
  );

  const fail = useCallback(
    (kind, message) => {
      dispose();
      setError({ kind, message: String(message || "") });
      setStatus("error");
    },
    [dispose]
  );

  const finalize = useCallback(
    (runId) => {
      if (finalizedRef.current || runId !== runIdRef.current) return;
      finalizedRef.current = true;
      const durationMs = durationRef.current;
      const aggregated = aggregateSegments(segmentsRef.current);
      dispose();
      setResult(
        aggregated
          ? { ...aggregated, noSpeech: false, durationMs }
          : { noSpeech: true, durationMs }
      );
      setStatus("done");
    },
    [dispose]
  );

  // Graceful stop: lets Azure finish the last utterance, then grades.
  const stop = useCallback(() => {
    const recognizer = recognizerRef.current;
    if (!recognizer || !recordingRef.current) return;
    const runId = runIdRef.current;
    recordingRef.current = false;
    clearInterval(tickRef.current);
    durationRef.current = Date.now() - startedAtRef.current;
    setStatus("processing");
    recognizer.stopContinuousRecognitionAsync(
      () => setTimeout(() => finalize(runId), 300),
      (err) => fail(classifyAzureError(err), err)
    );
  }, [fail, finalize]);
  stopRef.current = stop;

  const start = useCallback(async () => {
    dispose();
    const runId = ++runIdRef.current;
    segmentsRef.current = [];
    finalizedRef.current = false;
    durationRef.current = 0;
    setResult(null);
    setError(null);
    setElapsedMs(0);
    setStatus("preparing");

    try {
      // Need headroom: the token must outlive the whole recording.
      const [{ token, region }, mod] = await Promise.all([
        getAzureToken({ minRemainingMs: (maxSeconds + 30) * 1000 }),
        import("microsoft-cognitiveservices-speech-sdk"),
      ]);
      if (runId !== runIdRef.current) return;
      const sdk = mod.SpeechConfig ? mod : mod.default;

      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = "en-US";
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();

      // Empty reference text = unscripted assessment
      const pronConfig = new sdk.PronunciationAssessmentConfig(
        "",
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Word,
        false
      );
      pronConfig.enableProsodyAssessment = true; // en-US only

      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      recognizerRef.current = recognizer;
      pronConfig.applyTo(recognizer);

      recognizer.sessionStarted = () => {
        if (runId !== runIdRef.current) return;
        startedAtRef.current = Date.now();
        recordingRef.current = true;
        setStatus("recording");
        tickRef.current = setInterval(() => {
          const ms = Date.now() - startedAtRef.current;
          setElapsedMs(Math.min(ms, maxSeconds * 1000));
          if (ms >= maxSeconds * 1000) stopRef.current();
        }, 250);
      };

      recognizer.recognized = (_s, e) => {
        if (runId !== runIdRef.current) return;
        const res = e.result;
        if (res.reason !== sdk.ResultReason.RecognizedSpeech) return;
        const pa = sdk.PronunciationAssessmentResult.fromResult(res);
        segmentsRef.current.push({
          text: res.text || "",
          accuracy: num(pa.accuracyScore),
          fluency: num(pa.fluencyScore),
          prosody: num(pa.prosodyScore),
          words: parseWords(
            res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)
          ),
        });
      };

      recognizer.canceled = (_s, e) => {
        if (runId !== runIdRef.current) return;
        if (e.reason === sdk.CancellationReason.Error) {
          fail(classifyAzureError(e.errorDetails), e.errorDetails);
        }
      };

      recognizer.sessionStopped = () => {
        // Covers the service closing the session on its own
        if (runId === runIdRef.current && !finalizedRef.current) {
          durationRef.current = durationRef.current || Date.now() - startedAtRef.current;
          setTimeout(() => finalize(runId), 300);
        }
      };

      recognizer.startContinuousRecognitionAsync(
        () => {},
        (err) => {
          if (runId === runIdRef.current) fail(classifyAzureError(err), err);
        }
      );
    } catch (err) {
      if (runId !== runIdRef.current) return;
      fail(err?.kind || classifyAzureError(err?.message || err), err?.message || err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispose, fail, finalize, maxSeconds]);

  // Abort and discard the attempt.
  const cancel = useCallback(() => {
    runIdRef.current += 1;
    dispose();
    setElapsedMs(0);
    setStatus("idle");
  }, [dispose]);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    dispose();
    setResult(null);
    setError(null);
    setElapsedMs(0);
    setStatus("idle");
  }, [dispose]);

  return { status, result, error, elapsedMs, start, stop, cancel, reset };
}
