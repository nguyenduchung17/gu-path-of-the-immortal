import React from 'react';
import { GameProvider, useGame } from '@/game/state/GameContext';
import SlotSelect from '@/components/game/SlotSelect';
import CharacterCreation from '@/components/game/CharacterCreation';
import GameScreen from '@/components/game/GameScreen';

export default function Game() {
  return (
    <GameProvider>
      <GameRoot />
    </GameProvider>
  );
}

function GameRoot() {
  const { state, activeSlot, createSlot } = useGame();
  if (createSlot != null) return <CharacterCreation />;
  if (activeSlot == null || !state || state.noSave) return <SlotSelect />;
  return <GameScreen />;
}