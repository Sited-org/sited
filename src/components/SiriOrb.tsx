import { motion } from "framer-motion";

interface SiriOrbProps {
  isListening?: boolean;
  isThinking?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

// Solar system-like orbital paths
const orbits = [
  { scale: 0.6, tiltX: 70, tiltZ: 20, duration: 8 },
  { scale: 0.75, tiltX: 65, tiltZ: 80, duration: 12 },
  { scale: 0.85, tiltX: 75, tiltZ: 140, duration: 15 },
  { scale: 0.95, tiltX: 60, tiltZ: 200, duration: 10 },
  { scale: 1.05, tiltX: 72, tiltZ: 260, duration: 18 },
];

export const SiriOrb = ({ isListening = false, isThinking = false, size = "lg", onClick }: SiriOrbProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  return (
    <motion.div
      onClick={onClick}
      className={`${sizeClasses[size]} relative cursor-pointer`}
      style={{ perspective: "500px" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isThinking ? [1, 0.96, 1.04, 0.98, 1.02, 1] : [1, 1.06, 1, 0.96, 1],
      }}
      transition={{
        duration: isThinking ? 2 : 6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Soft ambient glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(0 0% 100% / 0.4) 0%, transparent 70%)",
          filter: "blur(20px)",
          transform: "scale(1.3)",
        }}
      />

      {/* Pure white sphere */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: "15%",
          background: "radial-gradient(circle at 35% 35%, hsl(0 0% 100%) 0%, hsl(0 0% 96%) 50%, hsl(0 0% 92%) 100%)",
          boxShadow: "0 0 30px hsl(0 0% 100% / 0.5)",
        }}
        animate={{
          scale: isThinking ? [1, 0.98, 1.02, 1] : [1, 1.02, 0.99, 1],
        }}
        transition={{
          duration: isThinking ? 1.5 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Rotating orbital system container */}
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          rotateY: [0, 360],
          rotateX: [0, 15, 0, -15, 0],
        }}
        transition={{
          rotateY: {
            duration: isThinking ? 8 : 20,
            repeat: Infinity,
            ease: "linear",
          },
          rotateX: {
            duration: isThinking ? 4 : 10,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      >
        {/* Thin orbital rings - solar system style */}
        {orbits.map((orbit, i) => (
          <div
            key={`orbit-${i}`}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `rotateX(${orbit.tiltX}deg) rotateZ(${orbit.tiltZ}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: `${orbit.scale * 100}%`,
                height: `${orbit.scale * 100}%`,
                border: "1px solid hsl(0 0% 15%)",
                opacity: 0.7,
              }}
            />
          </div>
        ))}

        {/* Small orbiting dots (planets) */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`planet-${i}`}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `rotateX(${65 + i * 8}deg) rotateZ(${i * 120}deg)`,
              transformStyle: "preserve-3d",
            }}
            animate={{
              rotateZ: [i * 120, i * 120 + 360],
            }}
            transition={{
              duration: isThinking ? 4 + i * 2 : 8 + i * 4,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="absolute bg-foreground rounded-full"
              style={{
                width: "4px",
                height: "4px",
                left: "50%",
                top: "0%",
                transform: "translateX(-50%)",
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Subtle top highlight */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: "18%",
          background: "linear-gradient(145deg, hsl(0 0% 100% / 0.8) 0%, transparent 40%)",
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
                border: "1px solid hsl(0 0% 20%)",
              }}
              animate={{
                scale: [0.5, 1.4],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Listening waves */}
      {isListening && (
        <>
          {[0, 1].map((i) => (
            <motion.div
              key={`wave-${i}`}
              className="absolute inset-4 rounded-full"
              style={{
                border: "1px solid hsl(0 0% 25%)",
              }}
              animate={{
                scale: [1, 1.3],
                opacity: [0.3, 0],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};