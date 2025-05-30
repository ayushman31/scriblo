"use client";
import { useEffect } from 'react';

const Animation = () => {
  useEffect(() => {
    const createDot = () => {
      const dot = document.createElement('div');
      dot.classList.add('dot');

      // Random initial position within the viewport
      const maxWidth = window.innerWidth;
      const maxHeight = window.innerHeight;

      const randomX = Math.random() * maxWidth;
      const randomY = Math.random() * maxHeight;

      dot.style.left = `${randomX}px`;
      dot.style.top = `${randomY}px`;

      // Random animation duration for variety
      const duration =  10+ Math.random()*10;
      dot.style.animationDuration = `${duration}s`;

      // Random end position within the viewport
      const endX = Math.random() * maxWidth;
      const endY = Math.random() * maxHeight;

      dot.style.setProperty('--end-x', `${endX}px`);
      dot.style.setProperty('--end-y', `${endY}px`);

      document.body.appendChild(dot);

      // Remove the dot after animation to clean up
      setTimeout(() => {
        dot.remove();
      }, 10000);
    };

    // Create a new dot every few seconds
    const interval = setInterval(createDot, 100);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(interval);
      // Clean up existing dots
      document.querySelectorAll('.dot').forEach(dot => dot.remove());
    };
  }, []);

  return null;
};

export default Animation;
