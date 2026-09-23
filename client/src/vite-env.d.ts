/// <reference types="vite/client" />
import * as THREE from 'three'
import { ReactThreeFiber } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactThreeFiber.IntrinsicElements {
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      group: ReactThreeFiber.Object3DNode<THREE.Group, typeof THREE.Group>
      color: any
      ambientLight: any
      directionalLight: any
      octahedronGeometry: any
      meshPhysicalMaterial: any
      points: any
      bufferGeometry: any
      bufferAttribute: any
      pointsMaterial: any
      boxGeometry: any
      meshStandardMaterial: any
    }
  }
}
