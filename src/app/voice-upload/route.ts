// src/app/api/voice-upload/route.ts
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
    
  } catch (error: any) {
    console.error('Error processing audio:', error);
    return NextResponse.json({ 
      error: error.message || '音声処理中にエラーが発生しました' 
    }, { status: 500 });
  }
}
