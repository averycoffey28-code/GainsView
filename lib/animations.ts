// Framer Motion animation variants for GainsView

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// Stagger children animations
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

// Button hover/tap animations
export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2, ease: "easeOut" },
};

export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

// Card hover animation
export const cardHover = {
  y: -2,
  boxShadow: "0 8px 30px rgba(212, 184, 150, 0.1)",
  transition: { duration: 0.2, ease: "easeOut" },
};

// Nav icon bounce
export const navBounce = {
  scale: [1, 1.2, 0.9, 1.1, 1],
  transition: { duration: 0.4, ease: "easeInOut" },
};

// Spring config for smooth animations
export const springConfig = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const gentleSpring = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

// Page transition settings
export const pageTransition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

// Toast animations
export const toastVariants = {
  initial: { opacity: 0, y: -50, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// Chart draw animation
export const chartDraw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1, ease: "easeInOut" },
      opacity: { duration: 0.3 },
    },
  },
};

// Shimmer keyframes for CSS
export const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;
