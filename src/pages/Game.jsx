import React from 'react';
import { GameProvider, useGame } from '@/game/state/GameContext';
import { LangProvider } from '@/game/i18n/LangContext';
import SlotSelect from '@/components/game/SlotSelect';
import CharacterCreation from '@/components/game/CharacterCreation';
import GameScreen from '@/components/game/GameScreen';

export default function Game() {
  return (
    <LangProvider>
      <GameProvider>
        <GameRoot />
      </GameProvider>
    </LangProvider>
  );
}

function GameRoot() {
  const { state, activeSlot, createSlot, creationSessionId, cloudReady } = useGame();
  if (!cloudReady) {
    return <div className="min-h-screen bg-[#0d1410] text-emerald-200 flex items-center justify-center">Synchronizing saves…</div>;
  }
  if (createSlot != null) return <CharacterCreation key={creationSessionId} />;
  if (activeSlot == null || !state || state.noSave) return <SlotSelect />;
  return <GameScreen />;
}
