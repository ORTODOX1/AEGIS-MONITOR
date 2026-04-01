import React, { useRef } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Mesh } from 'three';
import type { SystemName } from '../types/sensor';

interface ShipModelProps {
  onSystemClick: (system: SystemName) => void;
}

interface SectionProps {
  position: [number, number, number];
  color: string;
  system: SystemName;
  onClick: (system: SystemName) => void;
}

const HullSection: React.FC<SectionProps> = ({ position, color, system, onClick }) => {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick(system);
  };

  return (
    <mesh ref={meshRef} position={position} onClick={handleClick}>
      <boxGeometry args={[1.2, 0.6, 0.8]} />
      <meshStandardMaterial color={color} transparent opacity={0.85} />
    </mesh>
  );
};

const SECTIONS: SectionProps[] = [
  { position: [-2, 0, 0], color: '#1e40af', system: 'Main Engine', onClick: () => {} },
  { position: [0, 0, 0], color: '#065f46', system: 'Generators', onClick: () => {} },
  { position: [2, 0, 0], color: '#854d0e', system: 'Pumps', onClick: () => {} },
  { position: [0, 1, 0], color: '#7c3aed', system: 'Steering Gear', onClick: () => {} },
];

const ShipModel: React.FC<ShipModelProps> = ({ onSystemClick }) => (
  <div className="w-full h-64 bg-slate-950 rounded-lg overflow-hidden">
    <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      {SECTIONS.map((sec) => (
        <HullSection
          key={sec.system}
          position={sec.position}
          color={sec.color}
          system={sec.system}
          onClick={onSystemClick}
        />
      ))}
      <OrbitControls enableZoom enablePan={false} />
    </Canvas>
  </div>
);

export default ShipModel;
