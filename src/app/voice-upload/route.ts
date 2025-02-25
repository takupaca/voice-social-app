// src/app/api/voice-upload/route.ts の修正版
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SpeechClient } from '@google-cloud/speech';

// 環境変数からGoogleの認証情報を取得
const googleCredentials = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}'
);

// Supabaseクライアント初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GoogleのSpeech-to-Textクライアント初期化
const speechClient = new SpeechClient({
  credentials: googleCredentials
});

// エラー型の定義
interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(error: unknown): ErrorWithMessage {
  if (isErrorWithMessage(error)) return error;
  
  try {
    return new Error(JSON.stringify(error));
  } catch {
    // fallback in case there's an error stringifying the error
    return new Error(String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    // 音声バイナリデータを取得
    const arrayBuffer = await request.arrayBuffer();
    const audioBytes = Buffer.from(arrayBuffer);
    
    // Google Cloud Speech-to-Textに送信
    const [response] = await speechClient.recognize({
      audio: { content: audioBytes.toString('base64') },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'ja-JP',
      },
    });
    
    // 認識結果を取得
    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript || '')
      .join('\n') || '';
    
    if (!transcription) {
      return NextResponse.json({ 
        error: '音声を認識できませんでした' 
      }, { status: 400 });
    }
    
    // Supabaseに保存
    const { data, error } = await supabase
      .from('posts')
      .insert([{ 
        content: transcription, 
        created_at: new Date().toISOString() 
      }])
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      transcription, 
      post: data?.[0] 
    });
    
  } catch (error: unknown) {
    console.error('Error processing audio:', error);
    const errorWithMessage = toErrorWithMessage(error);
    return NextResponse.json({ 
      error: errorWithMessage.message || '音声処理中にエラーが発生しました' 
    }, { status: 500 });
  }
}
