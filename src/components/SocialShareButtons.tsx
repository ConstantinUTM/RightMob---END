import React from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

const SocialShareButtons: React.FC = () => {
  const [isHovered, setIsHovered] = React.useState(false);

  const socialButtons = [
    {
      name: 'Instagram',
      color: 'hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500',
      position: { translate: '0px -70px' },
      delay: 0.5,
      icon: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2c-2.714 0-3.055.013-4.121.06-1.066.05-1.793.217-2.429.465a4.896 4.896 0 0 0-1.771 1.154A4.909 4.909 0 0 0 2.525 5.45c-.248.635-.416 1.362-.465 2.425C2.013 8.944 2 9.284 2 12.001c0 2.715.013 3.055.06 4.121.05 1.066.217 1.792.465 2.428a4.91 4.91 0 0 0 1.154 1.771 4.88 4.88 0 0 0 1.77 1.154c.637.247 1.362.416 2.427.465 1.068.047 1.408.06 4.124.06 2.716 0 3.055-.012 4.122-.06 1.064-.05 1.793-.218 2.43-.465a4.893 4.893 0 0 0 1.77-1.154 4.91 4.91 0 0 0 1.153-1.771c.246-.636.415-1.363.465-2.428.047-1.066.06-1.406.06-4.122s-.012-3.056-.06-4.124c-.05-1.064-.219-1.791-.465-2.426a4.907 4.907 0 0 0-1.154-1.771 4.888 4.888 0 0 0-1.771-1.154c-.637-.248-1.365-.416-2.429-.465-1.067-.047-1.406-.06-4.123-.06H12Zm-.896 1.803H12c2.67 0 2.987.008 4.04.057.975.044 1.505.208 1.858.344.466.181.8.399 1.15.748.35.35.566.683.747 1.15.138.352.3.882.344 1.857.049 1.053.059 1.37.059 4.039 0 2.668-.01 2.986-.059 4.04-.044.974-.207 1.503-.344 1.856a3.09 3.09 0 0 1-.748 1.149 3.09 3.09 0 0 1-1.15.747c-.35.137-.88.3-1.857.345-1.053.047-1.37.059-4.04.059s-2.987-.011-4.041-.059c-.975-.045-1.504-.208-1.856-.345a3.097 3.097 0 0 1-1.15-.747 3.1 3.1 0 0 1-.75-1.15c-.136-.352-.3-.882-.344-1.857-.047-1.054-.057-1.37-.057-4.041 0-2.67.01-2.985.057-4.039.045-.975.208-1.505.345-1.857.181-.466.399-.8.749-1.15a3.09 3.09 0 0 1 1.15-.748c.352-.137.881-.3 1.856-.345.923-.042 1.28-.055 3.144-.056v.003Zm6.235 1.66a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 6.865a5.136 5.136 0 1 0-.16 10.272A5.136 5.136 0 0 0 12 6.865Zm0 1.801a3.334 3.334 0 1 1 0 6.668 3.334 3.334 0 0 1 0-6.668Z"></path>
        </svg>
      ),
    },
    {
      name: 'Facebook',
      color: 'hover:bg-[#1877F2]',
      position: { translate: '-47px -47px' },
      delay: 0.3,
      icon: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z"></path>
        </svg>
      ),
    },
    {
      name: 'Gmail',
      color: 'hover:bg-[#EA4335]',
      position: { translate: '-70px 0px' },
      delay: 0.1,
      icon: (
        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"></path>
        </svg>
      ),
    },
  ];

  return (
    <div 
      className="relative grid place-items-center h-fit w-fit transition-all duration-300 rounded-full share-buttons group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Button */}
      <button className="relative grid place-items-center p-3 border-none bg-gradient-to-br from-primary-50 to-primary-100 shadow-[5px_5px_12px_rgba(251,191,36,0.2),-5px_-5px_12px_rgba(255,255,255,0.8)] rounded-full transition-all duration-200 z-[100] hover:shadow-[5px_5px_12px_rgba(251,191,36,0.3),-5px_-5px_12px_rgba(255,255,255,0.9)]">
        <Share2 className="w-5 h-5 text-primary-600" />
      </button>

      {/* Social Buttons */}
      {socialButtons.map((social) => (
        <motion.button
          key={social.name}
          className={`absolute grid place-items-center p-3 border-none bg-gradient-to-br from-primary-50 to-white transition-all duration-300 rounded-full share-button text-dark-700 ${social.color}`}
          style={{
            transitionDelay: `${social.delay}s, 0s, ${social.delay}s`,
            transitionProperty: 'translate, background, box-shadow',
            transform: isHovered ? `translate(${social.position.translate})` : 'translate(0, 0)',
          }}
          whileHover={{ scale: 1.1 }}
          aria-label={social.name}
        >
          {social.icon}
        </motion.button>
      ))}
    </div>
  );
};

export default SocialShareButtons;
