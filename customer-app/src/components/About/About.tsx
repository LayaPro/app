import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import styles from './About.module.css';

export const About = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);

  const stats = [
    { number: "500+", label: "Events Captured" },
    { number: "12+", label: "Years Experience" },
    { number: "50+", label: "Awards Won" },
    { number: "100%", label: "Client Satisfaction" },
  ];

  return (
    <section ref={containerRef} className={styles.about}>
      <div className={styles.container}>
        {/* Left Side - Text Content */}
        <motion.div 
          className={styles.textContent}
          style={{ opacity, y }}
        >
          <motion.span 
            className={styles.eyebrow}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            About Us
          </motion.span>

          <motion.h2 
            className={styles.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Where <span className={styles.accent}>Artistry</span> Meets Emotion
          </motion.h2>

          <motion.div 
            className="divider"
            initial={{ width: 0 }}
            whileInView={{ width: 60 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          />

          <motion.p 
            className={styles.description}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
          >
            With over a decade of experience, we've dedicated ourselves to the art of visual storytelling. Every frame we capture is a testament to the beauty of human connection, the joy of celebration, and the fleeting moments that make life extraordinary.
          </motion.p>

          <motion.p 
            className={styles.description}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            Our approach combines technical excellence with an intuitive understanding of emotion, ensuring that every photograph and film we create resonates with authenticity and timeless elegance.
          </motion.p>

          <motion.button 
            className="btn-premium"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            viewport={{ once: true }}
            style={{ marginTop: '32px' }}
          >
            Our Story
          </motion.button>
        </motion.div>

        {/* Right Side - Images */}
        <div className={styles.imageContent}>
          <motion.div 
            className={styles.imageMain}
            style={{ scale }}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <img 
              src="https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80" 
              alt="Wedding photography"
            />
            <div className={styles.imageOverlay} />
          </motion.div>

          <motion.div 
            className={styles.imageSecondary}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <img 
              src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80" 
              alt="Couple portrait"
            />
          </motion.div>

          {/* Floating Badge */}
          <motion.div 
            className={styles.floatingBadge}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            <span className={styles.badgeNumber}>15+</span>
            <span className={styles.badgeText}>Years of Excellence</span>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <motion.div 
        className={styles.stats}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.label}
            className={styles.statItem}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <span className={styles.statNumber}>{stat.number}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
