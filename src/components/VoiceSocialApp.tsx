import React, { useState, useEffect } from 'react';

interface Post {
  id: number;
  content: string;
  timestamp: string;
}

// Web Speech API の型定義
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const VoiceSocialApp: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results);
        const transcript = results
          .map(result => result[0].transcript)
          .join('');
        setCurrentTranscript(transcript);
      };

      recognition.onerror = (event: Event) => {
        console.error('Speech recognition error:', event);
        setIsRecording(false);
      };

      setRecognition(recognition);
    }
  }, []);

  // 残りのコードは変更なし

  return (
    // JSXの部分は変更なし
  );
};

export default VoiceSocialApp;
