import React, { useState, useEffect } from 'react';
import { TrashIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Post {
  id: string;
  content: string;
  created_at: string;
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    fetchPosts();

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

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognition?.stop();
    } else {
      recognition?.start();
      setCurrentTranscript('');
    }
    setIsRecording(!isRecording);
  };

  const handlePost = async () => {
    if (currentTranscript.trim()) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .insert([
            {
              content: currentTranscript,
              created_at: new Date().toISOString(),
            }
          ])
          .select();

        if (error) throw error;
        if (data) {
          setPosts([data[0], ...posts]);
        }

        setCurrentTranscript('');
        recognition?.stop();
        setIsRecording(false);
      } catch (error) {
        console.error('Error saving post:', error);
        alert('投稿の保存に失敗しました。');
      }
    }
  };

  const handleDelete = async (postId: number) => {
    if (window.confirm('この投稿を削除してもよろしいですか？')) {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId);

        if (error) throw error;
        setPosts(posts.filter(post => post.id !== postId));
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('投稿の削除に失敗しました。');
      }
    }
  };

  if (isLoading) {
    return <div className="max-w-2xl mx-auto p-4">Loading...</div>;
  }

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
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <p className="text-gray-600 text-sm mb-2">{new Date(post.created_at).toLocaleString()}</p>
                <p className="text-gray-800">{post.content}</p>
              </div>
              <button
                onClick={() => handleDelete(post.id)}
                className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                title="削除"
              >
                <TrashIcon size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceSocialApp;
