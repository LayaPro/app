import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import styles from './Hero.module.css';

export const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const textY = useTransform(scrollYProgress, [0, 0.5], ["0%", "100%"]);

  return (
    <section ref={containerRef} className={styles.hero}>
      {/* Video Background */}
      <motion.div className={styles.videoContainer} style={{ scale }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className={styles.video}
          poster="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-couple-walking-on-the-beach-at-sunset-1232-large.mp4"
            type="video/mp4"
          />
        </video>
        <div className={styles.overlay} />
      </motion.div>

      {/* Content */}
      <motion.div 
        className={styles.content}
        style={{ y: textY, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className={styles.tagline}
        >
          <span className={styles.taglineText}>Premium Photography & Videography</span>
        </motion.div>

        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8 }}
        >
          <span className={styles.titleLine}>Capturing</span>
          <span className={`${styles.titleLine} ${styles.titleAccent}`}>
            Timeless
          </span>
          <span className={styles.titleLine}>Moments</span>
        </motion.h1>

        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
        >
          We craft visual stories that transcend time, preserving your most precious moments with artistry and elegance.
        </motion.p>

        <motion.div
          className={styles.cta}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
        >
          <button className="btn-premium">
            Explore Our Work
          </button>
          <button className="btn-premium btn-premium-filled">
            Get a Quote
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        style={{ opacity }}
      >
        <span>Scroll to explore</span>
        <motion.div
          className={styles.scrollLine}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      {/* Decorative Elements */}
      <div className={styles.cornerDecor}>
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <path d="M0 0V100H100" stroke="var(--color-gold)" strokeWidth="1" strokeOpacity="0.3"/>
        </svg>
      </div>
    </section>
  );
};
