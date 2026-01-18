import './PageTransition.css';

export const PageTransition = () => {
  return (
    <div className="page-transition">
      <div className="transition-logo">LAYA PRODUCTIONS</div>
      
      {/* Floating Particles */}
      <div className="transition-particles">
        {[...Array(40)].map((_, i) => (
          <div 
            key={i} 
            className="transition-particle"
            style={{
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--delay': `${Math.random() * 3}s`,
              '--duration': `${3 + Math.random() * 4}s`,
            } as any}
          ></div>
        ))}
      </div>
    </div>
  );
};
