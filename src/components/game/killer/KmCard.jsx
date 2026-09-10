import React from 'react';
import KmMoveCard from './KmMoveCard';

// Compatibility wrapper for the previous card name. All display and actions
// remain owned by KmMoveCard, the canonical Killer Move card.
export default function KmCard({ km, move }) {
  return <KmMoveCard move={move || km} />;
}