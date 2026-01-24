import { motion } from 'framer-motion';
import './PortalNotFound.css';

export const PortalNotFound = () => {
  return (
    <motion.div 
      className="portal-not-found-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Floating Particles Background */}
      <div className="portal-not-found-floating-particles">
        {[...Array(40)].map((_, i) => (
          <div 
            key={i} 
            className="portal-not-found-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--delay': `${Math.random() * 2}s`,
              '--duration': `${6 + Math.random() * 8}s`,
              '--x': `${(Math.random() - 0.5) * 150}px`,
            } as any}
          ></div>
        ))}
      </div>

      <div className="portal-not-found-content">
        <motion.div
          className="portal-not-found-icon-wrapper"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2 
          }}
        >
          <div className="portal-not-found-icon">
            <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h1 className="portal-not-found-title">Portal Not Found</h1>
          
          <p className="portal-not-found-message">
            This portal link is either invalid or has been removed.
          </p>
          
          <p className="portal-not-found-submessage">
            If you believe this is an error, please contact the sender for a new link.
          </p>
        </motion.div>
        
        <motion.div 
          className="portal-not-found-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Need help? Contact support</span>
        </motion.div>
      </div>
    </motion.div>
  );
};
