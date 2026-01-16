import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import styles from './Quote.module.css';

export const Quote = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  return (
    <section ref={containerRef} className={styles.quote}>
      {/* Parallax Background */}
      <motion.div 
        className={styles.background}
        style={{ y: backgroundY }}
      >
        <img 
          src="https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1920&q=80" 
          alt="Background"
        />
        <div className={styles.overlay} />
      </motion.div>

      {/* Content */}
      <motion.div 
        className={styles.content}
        style={{ y: textY }}
      >
        <motion.div
          className={styles.inner}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className={styles.decorTop}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <path d="M30 0V60M0 30H60" stroke="var(--color-gold)" strokeWidth="1" strokeOpacity="0.5"/>
            </svg>
          </motion.div>

          <motion.span 
            className={styles.eyebrow}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Ready to Begin?
          </motion.span>

          <motion.h2 
            className={styles.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Let's Create Something
            <span className={styles.accent}> Extraordinary</span>
            <br />Together
          </motion.h2>

          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
          >
            Every great story begins with a conversation. Share your vision with us, and we'll craft a bespoke experience tailored to your unique celebration.
          </motion.p>

          <motion.div 
            className={styles.cta}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.button 
              className="btn-premium btn-premium-filled"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Request a Quote
            </motion.button>
            <motion.button 
              className="btn-premium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Schedule a Call
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            className={styles.trust}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <div className={styles.trustItem}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Free Consultation</span>
            </div>
            <div className={styles.trustItem}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Customized Packages</span>
            </div>
            <div className={styles.trustItem}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Response within 24 hrs</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Decorative Lines */}
      <div className={styles.decorLines}>
        <motion.div 
          className={styles.line}
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
        />
        <motion.div 
          className={styles.line}
          initial={{ width: 0 }}
          whileInView={{ width: '60%' }}
          transition={{ duration: 1.2, delay: 0.2 }}
          viewport={{ once: true }}
        />
      </div>
    </section>
  );
};
