import React from 'react';
import { SkillProfile, generateMarkdown } from '../lib/gemini';
import { User, Brain, MessageSquare, Code, Copy, Check, Download } from 'lucide-react';
import { motion } from 'motion/react';

interface SkillProfileViewProps {
  profile: SkillProfile;
  onReset: () => void;
  language: 'zh' | 'en';
}

export const SkillProfileView: React.FC<SkillProfileViewProps> = ({ profile, onReset, language }) => {
  const [copied, setCopied] = React.useState(false);
  const markdownContent = generateMarkdown(profile);

  const copyPrompt = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.name || 'skill'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="brutal-border bg-white p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green rounded-bl-full -mr-16 -mt-16 brutal-border-b brutal-border-l z-0" />
        
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-16 h-16 brutal-border bg-brutal-black text-neon-green flex items-center justify-center">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display text-5xl uppercase tracking-tight leading-none">{profile.title}</h2>
              <p className="font-mono text-sm mt-2 font-bold italic">「{profile.quote}」</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="brutal-border bg-white p-6">
          <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black pb-2">
            <User className="h-5 w-5" />
            <h3 className="font-display text-xl uppercase">{language === 'zh' ? '身份卡' : 'Identity Card'}</h3>
          </div>
          <div className="space-y-4 font-mono text-sm">
            <p><strong className="text-neon-green bg-brutal-black px-1">我是谁</strong> {profile.identityCard.whoAmI}</p>
            <p><strong className="text-neon-green bg-brutal-black px-1">我的起点</strong> {profile.identityCard.background}</p>
            <p><strong className="text-neon-green bg-brutal-black px-1">当前状态</strong> {profile.identityCard.currentStatus}</p>
          </div>
        </div>

        <div className="brutal-border bg-white p-6">
          <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black pb-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-display text-xl uppercase">{language === 'zh' ? '表达DNA' : 'Expression DNA'}</h3>
          </div>
          <div className="space-y-4 font-mono text-sm">
            <p><strong>{language === 'zh' ? '语气' : 'Tone'}:</strong> {profile.expressionDNA.tone}</p>
            <div>
              <strong>{language === 'zh' ? '口头禅' : 'Catchphrases'}:</strong>
              <ul className="mt-2 space-y-1">
                {profile.expressionDNA.catchphrases.map((c, idx) => (
                  <li key={idx} className="flex items-start"><span className="text-neon-green mr-2">►</span> 「{c}」</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="brutal-border bg-white p-6 mb-8">
        <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black pb-2">
          <Brain className="h-5 w-5" />
          <h3 className="font-display text-xl uppercase">{language === 'zh' ? '核心心智模型' : 'Core Mental Models'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.coreMentalModels.map((model, idx) => (
            <div key={idx} className="border-2 border-brutal-black p-4 flex flex-col">
              <h4 className="font-bold text-lg mb-2 bg-neon-green inline-block px-1 self-start">{model.name}</h4>
              <p className="font-mono text-sm mb-2"><strong>{language === 'zh' ? '一句话' : 'One-liner'}:</strong> {model.oneLiner}</p>
              <p className="font-mono text-xs text-gray-600 mb-4 flex-grow">{model.application}</p>
              
              {model.sourceSnippets && model.sourceSnippets.length > 0 && (
                <div className="mt-auto pt-3 border-t-2 border-dashed border-gray-300">
                  <p className="font-bold text-xs uppercase mb-2 text-brutal-black">
                    {language === 'zh' ? '来源证据 (Source Evidence)' : 'Source Evidence'}
                  </p>
                  <div className="space-y-2">
                    {model.sourceSnippets.map((snippet, sIdx) => (
                      <div key={sIdx} className="font-mono text-xs bg-gray-50 p-2 border border-gray-200 text-gray-700 italic relative flex flex-col">
                        <div className="relative">
                          <span className="absolute -left-1 -top-1 text-neon-green text-lg leading-none font-serif">"</span>
                          <span className="relative z-10 pl-2">{snippet.quote}</span>
                          <span className="absolute -right-1 -bottom-2 text-neon-green text-lg leading-none font-serif">"</span>
                        </div>
                        <div className="text-right mt-2 text-[10px] text-gray-500 font-bold not-italic">
                          — {snippet.source}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="brutal-border bg-brutal-black text-white p-6 mb-8 relative">
        <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-4">
          <h3 className="font-display text-2xl uppercase text-neon-green">{language === 'zh' ? '生成的 SKILL.md' : 'Generated SKILL.md'}</h3>
          <div className="flex space-x-3">
            <button 
              onClick={copyPrompt}
              className="flex items-center space-x-2 bg-white text-brutal-black px-3 py-1 font-mono text-xs uppercase hover:bg-neon-green transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? (language === 'zh' ? '已复制！' : 'Copied!') : (language === 'zh' ? '复制' : 'Copy')}</span>
            </button>
            <button 
              onClick={downloadMarkdown}
              className="flex items-center space-x-2 bg-neon-green text-brutal-black px-3 py-1 font-mono text-xs uppercase hover:bg-white transition-colors font-bold"
            >
              <Download className="h-4 w-4" />
              <span>{language === 'zh' ? '下载 SKILL.md' : 'Download SKILL.md'}</span>
            </button>
          </div>
        </div>
        <div className="max-h-[500px] overflow-y-auto brutal-scrollbar bg-brutal-black p-4 border border-gray-800">
          <pre className="font-mono text-xs whitespace-pre-wrap text-gray-300 leading-relaxed">
            {markdownContent}
          </pre>
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={onReset}
          className="brutal-btn px-8 py-4 text-xl"
        >
          {language === 'zh' ? '蒸馏另一个人格' : 'Distill Another Persona'}
        </button>
      </div>
    </motion.div>
  );
};
