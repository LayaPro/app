import { motion } from 'framer-motion';
import styles from './Footer.module.css';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'Instagram', icon: '📷', url: '#' },
    { name: 'Facebook', icon: '📘', url: '#' },
    { name: 'Twitter', icon: '🐦', url: '#' },
    { name: 'LinkedIn', icon: '💼', url: '#' },
  ];

  const quickLinks = [
    { name: 'Home', url: '#' },
    { name: 'About Us', url: '#about' },
    { name: 'Portfolio', url: '#portfolio' },
    { name: 'Services', url: '#' },
    { name: 'Contact', url: '#quote' },
  ];

  const services = [
    'Wedding Photography',
    'Corporate Events',
    'Portrait Sessions',
    'Product Photography',
    'Video Production',
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.topSection}>
        <motion.div
          className={styles.brand}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className={styles.logo}>STUDIO</h3>
          <p className={styles.tagline}>
            Crafting timeless memories through the art of photography.
            Every moment tells a story worth preserving.
          </p>
          <div className={styles.socialLinks}>
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                className={styles.socialLink}
                aria-label={social.name}
              >
                <span>{social.icon}</span>
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div
          className={styles.linksColumn}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <h4 className={styles.columnTitle}>Quick Links</h4>
          <ul className={styles.linksList}>
            {quickLinks.map((link) => (
              <li key={link.name}>
                <a href={link.url} className={styles.link}>
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className={styles.linksColumn}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h4 className={styles.columnTitle}>Services</h4>
          <ul className={styles.linksList}>
            {services.map((service) => (
              <li key={service}>
                <span className={styles.serviceItem}>{service}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className={styles.contactColumn}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h4 className={styles.columnTitle}>Get in Touch</h4>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📍</span>
              <span>123 Creative Avenue, Art District</span>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📞</span>
              <span>+1 (555) 123-4567</span>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>✉️</span>
              <span>hello@studio.com</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className={styles.divider} />

      <div className={styles.bottomSection}>
        <p className={styles.copyright}>
          © {currentYear} Studio. All rights reserved.
        </p>
        <div className={styles.legalLinks}>
          <a href="#" className={styles.legalLink}>Privacy Policy</a>
          <span className={styles.separator}>|</span>
          <a href="#" className={styles.legalLink}>Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};
