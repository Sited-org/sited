import { motion } from "framer-motion";

interface SiriOrbProps {
  isListening?: boolean;
  isThinking?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

// Generate random orbital paths for black lines
const orbitalPaths = [
  { rotation: 15, tilt: 75, duration: 12 },
  { rotation: 45, tilt: 60, duration: 18 },
  { rotation: 90, tilt: 80, duration: 15 },
  { rotation: 135, tilt: 55, duration: 20 },
  { rotation: 180, tilt: 70, duration: 14 },
  { rotation: 225, tilt: 65, duration: 22 },
];

export const SiriOrb = ({ isListening = false, isThinking = false, size = "lg", onClick }: SiriOrbProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  const scale = size === "lg" ? 1 : size === "md" ? 0.625 : 0.375;

  return (
    <motion.div
      onClick={onClick}
      className={`${sizeClasses[size]} relative cursor-pointer`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isThinking ? [1, 0.95, 1.05, 0.97, 1.03, 1] : [1, 1.08, 1, 0.94, 1],
      }}
      transition={{
        duration: isThinking ? 2 : 5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Soft white outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(0 0% 100% / 0.5) 0%, transparent 60%)",
          filter: "blur(16px)",
        }}
        animate={{
          scale: [1, 1.3, 1.1, 1.25, 1],
          opacity: isThinking ? [0.5, 0.7, 0.5] : [0.3, 0.5, 0.4, 0.3],
        }}
        transition={{
          duration: isThinking ? 2 : 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Pure white core sphere */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: `${8 * scale}px`,
          background: "radial-gradient(circle at 30% 30%, hsl(0 0% 100%) 0%, hsl(0 0% 98%) 40%, hsl(0 0% 94%) 70%, hsl(0 0% 90%) 100%)",
          boxShadow: "inset 0 0 30px hsl(0 0% 100% / 0.8), 0 0 40px hsl(0 0% 100% / 0.3)",
        }}
        animate={{
          scale: isThinking ? [1, 0.97, 1.02, 0.98, 1] : [1, 1.01, 0.99, 1],
        }}
        transition={{
          duration: isThinking ? 1.5 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Bold black orbital lines */}
      {orbitalPaths.map((path, i) => (
        <motion.div
          key={`orbit-${i}`}
          className="absolute inset-0"
          style={{
            transform: `rotateX(${path.tilt}deg) rotateZ(${path.rotation}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: `${2 + (i % 2)}px solid hsl(0 0% 5%)`,
              borderRadius: "50%",
            }}
            animate={{
              rotate: i % 2 === 0 ? [0, 360] : [360, 0],
            }}
            transition={{
              duration: isThinking ? path.duration / 2 : path.duration,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>
      ))}

      {/* Additional crossing orbital arcs */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`arc-${i}`}
          className="absolute"
          style={{
            inset: `${4 * scale}px`,
            transform: `rotate(${i * 60}deg)`,
          }}
        >
          <motion.div
            className="absolute w-full h-full rounded-full"
            style={{
              borderTop: "2.5px solid hsl(0 0% 8%)",
              borderRight: "2.5px solid transparent",
              borderBottom: "2.5px solid transparent",
              borderLeft: "2.5px solid hsl(0 0% 8%)",
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: isThinking ? 6 + i * 2 : 10 + i * 4,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>
      ))}

      {/* Subtle white highlight on top */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: `${14 * scale}px`,
          background: "linear-gradient(135deg, hsl(0 0% 100% / 0.7) 0%, transparent 50%)",
        }}
        animate={{
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Inner glow pulse */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: `${20 * scale}px`,
          background: "radial-gradient(circle at 40% 40%, hsl(0 0% 100% / 0.6) 0%, transparent 60%)",
        }}
        animate={{
          opacity: [0.5, 0.8, 0.6, 0.7, 0.5],
          scale: [1, 1.05, 0.98, 1.02, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Thinking ripples */}
      {isThinking && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ripple-${i}`}
              className="absolute inset-0 rounded-full"
              style={{
                border: "2px solid hsl(0 0% 10%)",
              }}
              animate={{
                scale: [1, 1.6],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Listening gentle waves */}
      {isListening && (
        <>
          {[0, 1].map((i) => (
            <motion.div
              key={`wave-${i}`}
              className="absolute inset-2 rounded-full"
              style={{
                border: "2px solid hsl(0 0% 15%)",
              }}
              animate={{
                scale: [1, 1.3],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};