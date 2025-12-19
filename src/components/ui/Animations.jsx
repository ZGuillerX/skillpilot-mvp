"use client";
import { motion } from "framer-motion";

/**
 * Componente de animación para fade in
 */
export const FadeIn = ({ children, delay = 0, duration = 0.5, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de animación para slide in desde la izquierda
 */
export const SlideInLeft = ({
  children,
  delay = 0,
  duration = 0.5,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de animación para slide in desde la derecha
 */
export const SlideInRight = ({
  children,
  delay = 0,
  duration = 0.5,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de animación para scale in
 */
export const ScaleIn = ({ children, delay = 0, duration = 0.3, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de animación para lista con stagger
 */
export const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  ...props
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, ...props }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de botón con animación de hover
 */
export const AnimatedButton = ({
  children,
  whileHover,
  whileTap,
  ...props
}) => {
  return (
    <motion.button
      whileHover={whileHover || { scale: 1.05 }}
      whileTap={whileTap || { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

/**
 * Componente de progreso animado
 */
export const AnimatedProgress = ({ value, max = 100, className = "" }) => {
  return (
    <div
      className={`w-full bg-muted rounded-full h-2 overflow-hidden ${className}`}
    >
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
};

/**
 * Componente de badge con animación de entrada
 */
export const AnimatedBadge = ({ children, className = "", delay = 0 }) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de card con hover effect
 */
export const HoverCard = ({ children, className = "", ...props }) => {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)" }}
      transition={{ type: "spring", stiffness: 300 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de pulse para indicadores
 */
export const Pulse = ({ children, className = "" }) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de slide up para modales
 */
export const SlideUp = ({ children, ...props }) => {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
