import React from 'react';
import { GameProvider, useGame } from '@/game/state/GameContext';
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
  const { state } = useGame();
  if (!state || state.noSave) return <CharacterCreation />;
  return <GameScreen />;
}