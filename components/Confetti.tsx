import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = [
  'var(--confetti-color-1)',
  'var(--confetti-color-2)',
  'var(--confetti-color-3)',
  'var(--confetti-color-4)',
];

interface ConfettiPieceProps {
  x: number;
  y: number;
  rotate: number;
  rotateX: number[];
  rotateY: number[];
  color: string;
  width: number;
  height: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ x, y, rotate, rotateX, rotateY, color, width, height }) => {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width,
        height,
        backgroundColor: color,
        opacity: 0,
      }}
      animate={{
        x,
        y,
        rotate,
        rotateX,
        rotateY,
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        ease: 'easeOut',
        times: [0, 0.1, 0.8, 1],
      }}
    />
  );
};

interface ConfettiProps {
  numPieces?: number;
  radiusRange?: [number, number];
}

const Confetti: React.FC<ConfettiProps> = ({
  numPieces = 70,
  radiusRange = [50, 300],
}) => {
  const confetti = useMemo(() => {
    return Array.from({ length: numPieces }).map((_, i) => {
      const angle = Math.random() * 2 * Math.PI;
      const radius = radiusRange[0] + Math.random() * (radiusRange[1] - radiusRange[0]);
      
      const isTall = Math.random() > 0.5;
      const width = isTall ? 5 + Math.random() * 5 : 10 + Math.random() * 8;
      const height = isTall ? 12 + Math.random() * 8 : 5 + Math.random() * 5;

      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        rotate: Math.random() * 360,
        rotateX: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
        rotateY: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
        color: COLORS[i % COLORS.length],
        width,
        height,
      };
    });
  }, [numPieces, radiusRange]);

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {confetti.map((props, i) => (
        <ConfettiPiece key={i} {...props} />
      ))}
    </div>
  );
};

export default Confetti;