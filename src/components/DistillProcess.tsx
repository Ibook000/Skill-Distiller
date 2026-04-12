import React from 'react';
import { motion } from 'motion/react';
import { Zap, CheckCircle2, CircleDashed, Loader2 } from 'lucide-react';

export const DistillProcess: React.FC<{ language: 'zh' | 'en', currentStep: number }> = ({ language, currentStep }) => {
  const steps = [
    { zh: '唤醒多智能体...', en: 'WAKING UP AGENTS...' },
    { zh: '并行提取特征...', en: 'PARALLEL EXTRACTION...' },
    { zh: '交叉验证数据...', en: 'CROSS-VALIDATING...' },
    { zh: '合成最终档案...', en: 'SYNTHESIZING PROFILE...' }
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-24 h-24 brutal-border rounded-full flex items-center justify-center bg-neon-green mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <Zap className="h-10 w-10" />
      </motion.div>
      
      <h2 className="font-display text-4xl uppercase mb-8 tracking-wide text-center">
        {language === 'zh' ? '正在蒸馏人格...' : 'Distilling Persona...'}
      </h2>
      
      <div className="w-full max-w-md space-y-3">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isPending = index > currentStep;

          return (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                ...(isActive ? {
                  boxShadow: ["4px 4px 0px 0px rgba(0,255,0,0.2)", "4px 4px 0px 0px rgba(0,255,0,0.8)", "4px 4px 0px 0px rgba(0,255,0,0.2)"]
                } : {
                  boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)"
                })
              }}
              transition={{ 
                delay: index * 0.1,
                boxShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
              className={`relative overflow-hidden flex items-center p-4 brutal-border transition-colors duration-300 ${
                isActive ? 'bg-brutal-black text-neon-green scale-[1.02]' : 
                isCompleted ? 'bg-white text-brutal-black' : 
                'bg-gray-50 text-gray-400 border-gray-300'
              }`}
            >
              {/* Subtle scanning line effect for the active step */}
              {isActive && (
                <motion.div
                  className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-neon-green/20 to-transparent -skew-x-12"
                  initial={{ left: '-20%' }}
                  animate={{ left: '120%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              )}
              
              <div className="relative z-10 flex items-center space-x-4 w-full">
                {isCompleted && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
                {isActive && <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />}
                {isPending && <CircleDashed className="h-5 w-5 flex-shrink-0" />}
                <span className="font-mono text-sm font-bold tracking-wider uppercase flex items-center">
                  {language === 'zh' ? step.zh : step.en}
                  {isActive && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="ml-2 inline-block w-2 h-4 bg-neon-green"
                    />
                  )}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
