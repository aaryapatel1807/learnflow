import { Object3DNode, MaterialNode, LightNode } from '@react-three/fiber';
import * as THREE from 'three';

declare module '@react-three/fiber' {
  interface ThreeElements {
    mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
    group: Object3DNode<THREE.Group, typeof THREE.Group>;
    color: any;
    ambientLight: LightNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
    directionalLight: LightNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
    octahedronGeometry: any;
    meshPhysicalMaterial: any;
    points: any;
    bufferGeometry: any;
    bufferAttribute: any;
    pointsMaterial: any;
    boxGeometry: any;
    meshStandardMaterial: any;
  }
}
