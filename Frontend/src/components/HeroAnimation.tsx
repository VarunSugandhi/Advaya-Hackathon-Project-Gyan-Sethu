
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const HeroAnimation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Create particle geometry
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);
    
    // Create an array of colors
    const colors = [
      new THREE.Color('#1E3A8A'), // blue
      new THREE.Color('#7C3AED'), // purple
      new THREE.Color('#10B981'), // green
    ];
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Position
      posArray[i] = (Math.random() - 0.5) * 5;
      posArray[i + 1] = (Math.random() - 0.5) * 5;
      posArray[i + 2] = (Math.random() - 0.5) * 5;
      
      // Color
      const colorIndex = Math.floor(Math.random() * colors.length);
      const color = colors[colorIndex];
      colorsArray[i] = color.r;
      colorsArray[i + 1] = color.g;
      colorsArray[i + 2] = color.b;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
    
    // Material
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    
    // Create points
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Additional meshes - a few larger spheres for highlights
    const spheres: THREE.Mesh[] = [];
    const sphereColors = [
      new THREE.Color('#1E3A8A'), // blue
      new THREE.Color('#7C3AED'), // purple
      new THREE.Color('#10B981'), // green
    ];
    
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 16, 16);
      const material = new THREE.MeshBasicMaterial({ 
        color: sphereColors[i % sphereColors.length],
        transparent: true,
        opacity: 0.6
      });
      const sphere = new THREE.Mesh(geometry, material);
      
      sphere.position.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      
      scene.add(sphere);
      spheres.push(sphere);
    }
    
    // Camera positioning
    camera.position.z = 2;
    
    // Mouse movement effect
    let mouseX = 0;
    let mouseY = 0;
    
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate particle system
      particlesMesh.rotation.x += 0.0005;
      particlesMesh.rotation.y += 0.0005;
      
      // Move particle system based on mouse
      particlesMesh.rotation.x += mouseY * 0.0005;
      particlesMesh.rotation.y += mouseX * 0.0005;
      
      // Animate spheres
      spheres.forEach((sphere, i) => {
        sphere.position.x += Math.sin(Date.now() * 0.001 + i) * 0.002;
        sphere.position.y += Math.cos(Date.now() * 0.001 + i) * 0.002;
      });
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full z-0 opacity-80" />;
};

export default HeroAnimation;
