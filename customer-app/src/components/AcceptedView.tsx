import { motion } from 'framer-motion';
import './AcceptedView.css';

interface AcceptedViewProps {
  projectName: string;
  organizationName?: string;
}

export const AcceptedView: React.FC<AcceptedViewProps> = ({ projectName, organizationName }) => {
  return (
    <div className="accepted-container">
      {/* Floating Particles Background */}
      <div className="accepted-floating-particles">
        {[...Array(40)].map((_, i) => (
          <div 
            key={i} 
            className="accepted-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--delay': `${Math.random() * 8}s`,
              '--duration': `${6 + Math.random() * 8}s`,
              '--x': `${(Math.random() - 0.5) * 150}px`,
            } as any}
          ></div>
        ))}
      </div>

      <div className="accepted-content">
        <motion.div
          className="accepted-icon-wrapper"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2 
          }}
        >
          <div className="accepted-icon">
            <svg width="60" height="60" fill="none" viewBox="0 0 24 24">
              <motion.path
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </svg>
          </div>
        </motion.div>

        <motion.h1 
          className="accepted-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Quotation Accepted
        </motion.h1>

        <motion.div
          className="accepted-divider"
          initial={{ width: 0 }}
          animate={{ width: '100px' }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />

        <motion.p 
          className="accepted-project-name"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          {projectName}
        </motion.p>

        <motion.div 
          className="accepted-message"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <p className="accepted-message-main">
            Thank you for accepting our proposal. We're thrilled to be part of your special journey.
          </p>
          <p className="accepted-message-sub">
            Our team is currently setting up your project. You'll receive an update shortly, 
            and your event timeline will appear here once everything is ready.
          </p>
        </motion.div>

        <motion.div 
          className="accepted-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          <div className="loader-dots">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="loader-text">Preparing your timeline...</p>
        </motion.div>

        {organizationName && (
          <motion.p 
            className="accepted-signature"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
          >
            — Team {organizationName}
          </motion.p>
        )}
      </div>

      {/* Decorative Corner Elements */}
      <div className="accepted-corner accepted-corner-tl"></div>
      <div className="accepted-corner accepted-corner-tr"></div>
      <div className="accepted-corner accepted-corner-bl"></div>
      <div className="accepted-corner accepted-corner-br"></div>
    </div>
  );
};
