'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const sizeConfig = {
  sm: {
    icon: 28,
    cornerSize: 8,
    borderWidth: 1.5,
    gap: 10,
    frameSize: 16,
    bySize: 10,
    airuSize: 16,
    letterSpacing: '1.5px',
    overlap: -4,
  },
  md: {
    icon: 36,
    cornerSize: 10,
    borderWidth: 1.5,
    gap: 12,
    frameSize: 20,
    bySize: 13,
    airuSize: 20,
    letterSpacing: '2px',
    overlap: -5,
  },
  lg: {
    icon: 48,
    cornerSize: 14,
    borderWidth: 2,
    gap: 16,
    frameSize: 28,
    bySize: 18,
    airuSize: 28,
    letterSpacing: '2.5px',
    overlap: -7,
  },
};

export function Logo({ className = '', size = 'md', animated = true }: LogoProps) {
  const config = sizeConfig[size];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const Wrapper = animated ? motion.div : 'div';
  const IconWrapper = animated ? motion.div : 'div';
  const TextWrapper = animated ? motion.div : 'div';

  return (
    <Wrapper
      className={`flex items-center ${className}`}
      style={{ gap: config.gap }}
      {...(animated && {
        variants: containerVariants,
        initial: 'hidden',
        animate: 'visible',
      })}
    >
      {/* Bracket Icon */}
      <IconWrapper
        className="relative"
        style={{
          width: config.icon,
          height: config.icon,
        }}
        {...(animated && { variants: iconVariants })}
      >
        {/* Top Left Corner */}
        <div
          className="absolute top-0 left-0 border-current dark:border-white border-black"
          style={{
            width: config.cornerSize,
            height: config.cornerSize,
            borderTopWidth: config.borderWidth,
            borderLeftWidth: config.borderWidth,
            borderRightWidth: 0,
            borderBottomWidth: 0,
          }}
        />
        {/* Top Right Corner */}
        <div
          className="absolute top-0 right-0 border-current dark:border-white border-black"
          style={{
            width: config.cornerSize,
            height: config.cornerSize,
            borderTopWidth: config.borderWidth,
            borderRightWidth: config.borderWidth,
            borderLeftWidth: 0,
            borderBottomWidth: 0,
          }}
        />
        {/* Bottom Left Corner */}
        <div
          className="absolute bottom-0 left-0 border-current dark:border-white border-black"
          style={{
            width: config.cornerSize,
            height: config.cornerSize,
            borderBottomWidth: config.borderWidth,
            borderLeftWidth: config.borderWidth,
            borderTopWidth: 0,
            borderRightWidth: 0,
          }}
        />
        {/* Bottom Right Corner */}
        <div
          className="absolute bottom-0 right-0 border-current dark:border-white border-black"
          style={{
            width: config.cornerSize,
            height: config.cornerSize,
            borderBottomWidth: config.borderWidth,
            borderRightWidth: config.borderWidth,
            borderTopWidth: 0,
            borderLeftWidth: 0,
          }}
        />
      </IconWrapper>

      {/* Text */}
      <div className="flex flex-col" style={{ lineHeight: 1 }}>
        <TextWrapper
          className="dark:text-white text-black"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: config.frameSize,
            fontWeight: 600,
            fontStyle: 'italic',
            letterSpacing: config.letterSpacing,
          }}
          {...(animated && { variants: itemVariants })}
        >
          frame
        </TextWrapper>
        <TextWrapper
          className="flex items-baseline"
          style={{ marginTop: config.overlap }}
          {...(animated && { variants: itemVariants })}
        >
          <span
            className="dark:text-neutral-500 text-neutral-400"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: config.bySize,
              fontWeight: 300,
              fontStyle: 'italic',
              marginRight: 3,
            }}
          >
            by
          </span>
          <span
            className="dark:text-white text-black"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: config.airuSize,
              fontWeight: 600,
              fontStyle: 'italic',
              letterSpacing: config.letterSpacing,
            }}
          >
            airu
          </span>
        </TextWrapper>
      </div>
    </Wrapper>
  );
}

export default Logo;