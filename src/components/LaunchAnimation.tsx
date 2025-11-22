import { motion, AnimatePresence, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { Heart, Activity, Stethoscope } from "lucide-react";

interface LaunchAnimationProps {
  onComplete: () => void;
}

const LaunchAnimation = ({ onComplete }: LaunchAnimationProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentStep(1);
    }, 800);

    const timer2 = setTimeout(() => {
      setCurrentStep(2);
    }, 1600);

    const timer3 = setTimeout(() => {
      setCurrentStep(3);
    }, 2400);

    const completeTimer = setTimeout(() => {
      setIsComplete(true);
      setTimeout(onComplete, 500);
    }, 3200);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    },
    exit: { 
      opacity: 0,
      scale: 1.1,
      transition: { duration: 0.5 }
    }
  };

  const logoVariants: Variants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
        duration: 0.8
      }
    }
  };

  const textVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        delay: 0.3,
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  };

  const iconVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.2,
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    })
  };

  const pulseVariants: Variants = {
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  const progressVariants: Variants = {
    hidden: { width: 0 },
    visible: {
      width: "100%",
      transition: {
        duration: 2.5,
        ease: "easeInOut" as const
      }
    }
  };

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%234F46E5%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
          </div>

          <div className="relative flex flex-col items-center space-y-8">
            {/* Main Logo/Icon */}
            <motion.div
              className="relative"
              variants={logoVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="flex items-center justify-center"
                variants={pulseVariants}
                animate="pulse"
              >
                <img
                  src="/devora-removebg-preview.png"
                  alt="DevOra logo"
                  className="w-24 h-24 object-contain drop-shadow-2xl"
                />
              </motion.div>
              
              {/* Floating Icons */}
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
                variants={iconVariants}
                initial="hidden"
                animate={currentStep >= 1 ? "visible" : "hidden"}
                custom={0}
              >
                <Activity className="w-4 h-4 text-blue-600" />
              </motion.div>
              
              <motion.div
                className="absolute -bottom-4 -left-4 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
                variants={iconVariants}
                initial="hidden"
                animate={currentStep >= 2 ? "visible" : "hidden"}
                custom={1}
              >
                <Stethoscope className="w-4 h-4 text-green-600" />
              </motion.div>
            </motion.div>

            {/* Title and Subtitle */}
            <motion.div
              className="text-center space-y-2"
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Physio Clinic
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Healing Through Care
              </p>
            </motion.div>

            {/* Loading Progress */}
            <motion.div
              className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden"
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                variants={progressVariants}
                initial="hidden"
                animate="visible"
              />
            </motion.div>

            {/* Loading Text */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.p
                className="text-gray-500 text-sm"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut" as const
                }}
              >
                {currentStep === 0 && "Initializing..."}
                {currentStep === 1 && "Loading patient data..."}
                {currentStep === 2 && "Setting up workspace..."}
                {currentStep === 3 && "Almost ready..."}
              </motion.p>
            </motion.div>

            {/* Animated Dots */}
            <motion.div
              className="flex space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-blue-500 rounded-full"
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut" as const
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Corner Decorations */}
          <motion.div
            className="absolute top-8 left-8 w-16 h-16 border-2 border-blue-200 rounded-full"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear" as const
            }}
          />
          
          <motion.div
            className="absolute bottom-8 right-8 w-12 h-12 border-2 border-green-200 rounded-full"
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear" as const
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LaunchAnimation;
