// src/app/api/voice-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// 例えばGoogleのSpeech-to-TextのSDKをインポート
import speech from '@google-cloud/speech';

// Supabaseクライアント初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Google Speech-to-Textクライアント初期化
const speechClient = new speech.SpeechClient();

export async function POST(request: NextRequest) {
  try {
    // 音声ファイルをバイナリとして取得
    const audioBuffer = await request.arrayBuffer();
    
    // Google Cloud Speech-to-Textに送信
    const [response] = await speechClient.recognize({
      audio: { content: Buffer.from(audioBuffer).toString('base64') },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'ja-JP',
      },
    });
    
    // テキストを取得
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    
    // Supabaseに保存
    const { data, error } = await supabase
      .from('posts')
      .insert([{ content: transcription, created_at: new Date().toISOString() }])
      .select();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, post: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
