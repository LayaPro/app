import { useEffect } from 'react';
import './ScrollProgress.css';

export const ScrollProgress = () => {
  useEffect(() => {
    const progressReel = document.getElementById('progressReel');
    
    const handleScroll = () => {
      if (!progressReel) return;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercentage = (scrollTop / scrollHeight) * 100;
      progressReel.style.width = scrollPercentage + '%';
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="scroll-progress">
      <div className="progress-reel" id="progressReel"></div>
    </div>
  );
};
