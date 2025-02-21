'use client';
import type { NextPage } from 'next';
import VoiceSocialApp from '@/components/VoiceSocialApp';

const Home: NextPage = () => {
  return (
    <main className="min-h-screen p-4">
      <VoiceSocialApp />
    </main>
  );
};

export default Home;
