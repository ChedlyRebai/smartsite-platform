import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getMainContentElement, getSpeakablePlainText } from "./getMainContent";

/**
 * App-wide: skip link, read-aloud (Web Speech API), status for screen readers.
 * Place once at the root of the app (next to RouterProvider).
 */
export function GlobalAccessibilityBar() {
  const [status, setStatus] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const pathRef = useRef(typeof window !== "undefined" ? window.location.pathname : "");
  const cancelSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  useEffect(() => {
    const onPathPoll = () => {
      const p = window.location.pathname;
      if (p !== pathRef.current) {
        pathRef.current = p;
        cancelSpeech();
        setStatus("Page changed. Speech stopped.");
      }
    };
    const id = window.setInterval(onPathPoll, 350);
    window.addEventListener("popstate", onPathPoll);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("popstate", onPathPoll);
      cancelSpeech();
    };
  }, [cancelSpeech]);

  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = getMainContentElement();
    if (main) {
      main.focus();
    }
  };

  const handleReadAloud = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setStatus("Read aloud is not supported in this browser.");
      return;
    }

    cancelSpeech();

    const main = getMainContentElement();
    const text = getSpeakablePlainText(main);
    if (!text) {
      setStatus("No readable content found on this page.");
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = document.documentElement.lang || navigator.language || "en-US";
    utter.rate = 1;
    utter.onend = () => {
      setSpeaking(false);
      setStatus("Finished reading page.");
    };
    utter.onerror = () => {
      setSpeaking(false);
      setStatus("Speech was interrupted.");
    };

    setSpeaking(true);
    setStatus("Reading page aloud…");
    window.speechSynthesis.speak(utter);
  };

  const handleStop = () => {
    cancelSpeech();
    setStatus("Stopped reading.");
  };

  return (
    <>
      <a
        href="#main-content"
        onClick={handleSkip}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-background focus:text-foreground focus:px-3 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-ring focus:outline-none"
      >
        Skip to main content
      </a>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {status}
      </div>
    </>
  );
}
