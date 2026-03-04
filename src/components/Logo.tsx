import React from 'react';
import { motion } from 'framer-motion';
import logoImg from '../../images/Logo1-removebg.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = { sm: 32, md: 52, lg: 68 };
  const dimension = sizeMap[size];

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`inline-flex items-center ${className}`}
    >
      <img
        src={logoImg}
        alt="RightMob"
        width={dimension}
        height={dimension}
        className="object-contain shrink-0"
      />
    </motion.div>
  );
};

export default Logo;
