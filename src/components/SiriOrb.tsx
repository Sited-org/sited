import { motion } from "framer-motion";

interface SiriOrbProps {
  isListening?: boolean;
  isThinking?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export const SiriOrb = ({ isListening = false, isThinking = false, size = "lg", onClick }: SiriOrbProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  const gradientColors = [
    "hsl(var(--accent))",
    "hsl(280, 70%, 60%)",
    "hsl(200, 80%, 50%)",
    "hsl(340, 80%, 60%)",
  ];

  return (
    <motion.div
      onClick={onClick}
      className={`${sizeClasses[size]} relative cursor-pointer`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl opacity-60"
        style={{
          background: `radial-gradient(circle, ${gradientColors[0]} 0%, ${gradientColors[1]} 50%, transparent 70%)`,
        }}
        animate={{
          scale: isListening || isThinking ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: isListening || isThinking ? [0.6, 0.8, 0.6] : [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: isThinking ? 1 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main orb container */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 0deg, ${gradientColors.join(", ")}, ${gradientColors[0]})`,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: isThinking ? 2 : 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Inner blur overlay */}
        <div className="absolute inset-1 rounded-full bg-background/30 backdrop-blur-sm" />

        {/* Shimmering waves */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at ${30 + i * 20}% ${30 + i * 15}%, ${gradientColors[i % gradientColors.length]}40 0%, transparent 50%)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 10, 0],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}

        {/* Center glow */}
        <motion.div
          className="absolute inset-4 rounded-full bg-background/50 backdrop-blur-md"
          animate={{
            scale: isListening ? [1, 0.95, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: isListening ? Infinity : 0,
          }}
        />

        {/* Sound wave visualization when listening */}
        {isListening && (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-foreground/60"
                animate={{
                  height: [8, 20 + Math.random() * 20, 8],
                }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        )}

        {/* Thinking dots */}
        {isThinking && (
          <div className="absolute inset-0 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-foreground/80"
                animate={{
                  y: [-4, 4, -4],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};