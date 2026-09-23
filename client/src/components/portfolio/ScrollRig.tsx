import React from 'react';
import { ScrollControls } from '@react-three/drei';
import { CoreChapter } from './chapters/CoreChapter';
import { ArchitectureChapter } from './chapters/ArchitectureChapter';
import { ProjectsChapter } from './chapters/ProjectsChapter';
import { HtmlOverlays } from './HtmlOverlays';

export const ScrollRig: React.FC = () => {
  return (
    <ScrollControls pages={3} damping={0.2}>
      {/* 3D Content */}
      <CoreChapter />
      <ArchitectureChapter />
      <ProjectsChapter />
      
      {/* HTML Content synced with scroll */}
      <HtmlOverlays />
    </ScrollControls>
  );
};
