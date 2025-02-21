import React, { useState, useEffect } from 'react';

interface Post {
  id: number;
  content: string;
  timestamp: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

const VoiceSocialApp: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setCurrentTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognition?.stop();
    } else {
      recognition?.start();
      setCurrentTranscript('');
    }
    setIsRecording(!isRecording);
  };

  const handlePost = () => {
    if (currentTranscript.trim()) {
      const newPost: Post = {
        id: Date.now(),
        content: currentTranscript,
        timestamp: new Date().toLocaleString(),
      };
      setPosts([newPost, ...posts]);
      setCurrentTranscript('');
      recognition?.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gray-50">
      <div className="mb-6 sticky top-0 bg-white p-4 shadow-md rounded-lg border border-gray-200">
        <div className="flex gap-4 items-center">
          <button 
            onClick={toggleRecording}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isRecording 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRecording ? '録音停止' : '録音開始'}
          </button>
          <button 
            onClick={handlePost}
            disabled={!currentTranscript.trim()}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            投稿
          </button>
        </div>
        {currentTranscript && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-gray-800">{currentTranscript}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">{post.timestamp}</p>
            <p className="text-gray-800">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceSocialApp;
