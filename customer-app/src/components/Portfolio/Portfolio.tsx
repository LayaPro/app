import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import styles from './Portfolio.module.css';

interface PortfolioItem {
  id: number;
  category: string;
  title: string;
  subtitle: string;
  image: string;
  size: 'large' | 'medium' | 'small';
}

const portfolioItems: PortfolioItem[] = [
  {
    id: 1,
    category: "Wedding",
    title: "Sarah & Michael",
    subtitle: "Tuscan Villa Romance",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    size: 'large'
  },
  {
    id: 2,
    category: "Pre-Wedding",
    title: "Emma & James",
    subtitle: "Santorini Dreams",
    image: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&q=80",
    size: 'medium'
  },
  {
    id: 3,
    category: "Wedding Film",
    title: "Priya & Raj",
    subtitle: "Royal Palace Celebration",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80",
    size: 'medium'
  },
  {
    id: 4,
    category: "Engagement",
    title: "Maria & Carlos",
    subtitle: "Parisian Love Story",
    image: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80",
    size: 'small'
  },
  {
    id: 5,
    category: "Wedding",
    title: "Aisha & Omar",
    subtitle: "Desert Sunset Wedding",
    image: "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800&q=80",
    size: 'large'
  },
  {
    id: 6,
    category: "Reception",
    title: "Jennifer & David",
    subtitle: "Garden Party Elegance",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80",
    size: 'small'
  },
];

const categories = ['All', 'Wedding', 'Pre-Wedding', 'Engagement', 'Wedding Film', 'Reception'];

export const Portfolio = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const headerY = useTransform(scrollYProgress, [0, 0.3], [50, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  const filteredItems = activeCategory === 'All' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeCategory);

  return (
    <section ref={containerRef} className={styles.portfolio}>
      {/* Background Pattern */}
      <div className={styles.backgroundPattern} />

      {/* Header */}
      <motion.div 
        className={styles.header}
        style={{ y: headerY, opacity: headerOpacity }}
      >
        <motion.span 
          className={styles.eyebrow}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Portfolio
        </motion.span>

        <motion.h2 
          className={styles.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
        >
          Our <span className={styles.accent}>Finest</span> Work
        </motion.h2>

        <motion.p 
          className={styles.subtitle}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          A curated selection of our most cherished projects
        </motion.p>

        {/* Category Filter */}
        <motion.div 
          className={styles.categories}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.categoryBtn} ${activeCategory === category ? styles.active : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Gallery Grid */}
      <div className={styles.gallery}>
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            className={`${styles.galleryItem} ${styles[item.size]}`}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{ y: -10 }}
          >
            <div className={styles.imageWrapper}>
              <motion.img 
                src={item.image} 
                alt={item.title}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.6 }}
              />
              <div className={styles.overlay}>
                <motion.div 
                  className={styles.content}
                  initial={{ opacity: 0, y: 20 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className={styles.category}>{item.category}</span>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  <p className={styles.itemSubtitle}>{item.subtitle}</p>
                  <motion.button 
                    className={styles.viewBtn}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All Button */}
      <motion.div 
        className={styles.viewAll}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <button className="btn-premium">
          View All Projects
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </motion.div>
    </section>
  );
};
