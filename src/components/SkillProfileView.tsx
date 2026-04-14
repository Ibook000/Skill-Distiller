import React, { useState, useRef } from 'react';
import { SkillProfile, generateMarkdown, generateSkillFiles } from '../lib/gemini';
import { User, Brain, MessageSquare, Code, Copy, Check, Download, BookOpen, Scale, FileArchive, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';

interface SkillProfileViewProps {
  profile: SkillProfile;
  onUpdateProfile?: (profile: SkillProfile) => void;
  onReset: () => void;
  language: 'zh' | 'en';
}

export const SkillProfileView: React.FC<SkillProfileViewProps> = ({ profile, onUpdateProfile, onReset, language }) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
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

  const downloadZip = async () => {
    const zip = new JSZip();
    const files = generateSkillFiles(profile);
    
    // Add files to zip
    Object.entries(files).forEach(([path, content]) => {
      zip.file(path, content);
    });
    
    // Generate and download
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${profile.name || 'skill'}-package.zip`);
  };

  const handleUpdateMentalModel = (index: number, field: 'application' | 'limitation', value: string) => {
    if (!onUpdateProfile) return;
    const updatedModels = [...(profile.coreMentalModels || [])];
    updatedModels[index] = { ...updatedModels[index], [field]: value };
    onUpdateProfile({ ...profile, coreMentalModels: updatedModels });
  };

  const exportAsImage = async () => {
    if (!captureRef.current) return;
    try {
      setIsExporting(true);
      // Wait a bit for any re-renders
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(captureRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#f8f9fa', // Match the app's background color
        style: {
          padding: '2rem',
          margin: '0',
        }
      });
      
      const link = document.createElement('a');
      link.download = `${profile.name || 'persona'}-profile.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
      alert(language === 'zh' ? '导出图片失败，请重试。' : 'Failed to export image, please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex justify-end mb-4">
        <button 
          onClick={exportAsImage}
          disabled={isExporting}
          className="brutal-btn px-4 py-2 flex items-center space-x-2 text-sm bg-white hover:bg-neon-green transition-colors disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          <span>{language === 'zh' ? '导出为长图' : 'Export as Image'}</span>
        </button>
      </div>

      <div ref={captureRef} className="bg-[#f8f9fa] -mx-8 px-8 pt-4 pb-2">
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
            <p><strong className="text-neon-green bg-brutal-black px-1">我是谁</strong> {profile.identityCard?.whoAmI || ''}</p>
            <p><strong className="text-neon-green bg-brutal-black px-1">我的起点</strong> {profile.identityCard?.background || ''}</p>
            <p><strong className="text-neon-green bg-brutal-black px-1">当前状态</strong> {profile.identityCard?.currentStatus || ''}</p>
          </div>
        </div>

        <div className="brutal-border bg-white p-6">
          <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black pb-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-display text-xl uppercase">{language === 'zh' ? '表达DNA' : 'Expression DNA'}</h3>
          </div>
          <div className="space-y-4 font-mono text-sm">
            <p><strong>{language === 'zh' ? '语气' : 'Tone'}:</strong> {profile.expressionDNA?.tone || ''}</p>
            <div>
              <strong>{language === 'zh' ? '口头禅' : 'Catchphrases'}:</strong>
              <ul className="mt-2 space-y-1">
                {(profile.expressionDNA?.catchphrases || []).map((c, idx) => (
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
          {(profile.coreMentalModels || []).map((model, idx) => (
            <div key={idx} className="border-2 border-brutal-black p-4 flex flex-col">
              <h4 className="font-bold text-lg mb-2 bg-neon-green inline-block px-1 self-start">{model.name || ''}</h4>
              <p className="font-mono text-sm mb-2"><strong>{language === 'zh' ? '一句话' : 'One-liner'}:</strong> {model.oneLiner || ''}</p>
              
              <div className="mb-2 flex-grow flex flex-col space-y-2">
                <div>
                  <label className="font-bold text-xs uppercase text-brutal-black block mb-1">
                    {language === 'zh' ? '应用 (Application)' : 'Application'}
                  </label>
                  <textarea
                    value={model.application || ''}
                    onChange={(e) => handleUpdateMentalModel(idx, 'application', e.target.value)}
                    className="w-full font-mono text-xs text-gray-700 p-2 border border-gray-300 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none resize-y min-h-[60px]"
                    placeholder={language === 'zh' ? '输入应用场景...' : 'Enter application...'}
                  />
                </div>
                <div>
                  <label className="font-bold text-xs uppercase text-brutal-black block mb-1">
                    {language === 'zh' ? '局限 (Limitation)' : 'Limitation'}
                  </label>
                  <textarea
                    value={model.limitation || ''}
                    onChange={(e) => handleUpdateMentalModel(idx, 'limitation', e.target.value)}
                    className="w-full font-mono text-xs text-gray-700 p-2 border border-gray-300 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none resize-y min-h-[60px]"
                    placeholder={language === 'zh' ? '输入局限性...' : 'Enter limitation...'}
                  />
                </div>
              </div>
              
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
                          <span className="relative z-10 pl-2">{snippet.quote || ''}</span>
                          <span className="absolute -right-1 -bottom-2 text-neon-green text-lg leading-none font-serif">"</span>
                        </div>
                        <div className="text-right mt-2 text-[10px] text-gray-500 font-bold not-italic">
                          — {snippet.source || ''}
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

      <div className="brutal-border bg-white p-6 mb-8">
        <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black pb-2">
          <Scale className="h-5 w-5" />
          <h3 className="font-display text-xl uppercase">{language === 'zh' ? '价值观与反模式' : 'Values & Anti-patterns'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-sm">
          <div>
            <strong className="text-neon-green bg-brutal-black px-1">{language === 'zh' ? '提倡的价值观' : 'Core Values'}</strong>
            <ul className="mt-4 space-y-2">
              {(profile.valuesAndAntiPatterns?.values || []).map((v, idx) => (
                <li key={idx} className="flex items-start"><span className="text-green-600 mr-2 font-bold">✓</span> <span className="flex-1">{v}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <strong className="text-red-400 bg-brutal-black px-1 text-white">{language === 'zh' ? '反对的模式' : 'Anti-patterns'}</strong>
            <ul className="mt-4 space-y-2">
              {(profile.valuesAndAntiPatterns?.antiPatterns || []).map((a, idx) => (
                <li key={idx} className="flex items-start"><span className="text-red-600 mr-2 font-bold">✗</span> <span className="flex-1">{a}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="brutal-border bg-white p-6 mb-8">
        <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black pb-2">
          <BookOpen className="h-5 w-5" />
          <h3 className="font-display text-xl uppercase">{language === 'zh' ? '智识谱系' : 'Intellectual Lineage'}</h3>
        </div>
        <div className="font-mono text-sm">
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(profile.intellectualLineage || []).map((item, idx) => (
              <li key={idx} className="flex items-start border-l-4 border-neon-green pl-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Watermark / Footer for exported image */}
      <div className="mt-4 flex flex-col md:flex-row items-center justify-between border-t-4 border-brutal-black pt-6 pb-4">
        <div className="font-display text-2xl uppercase tracking-tighter flex items-center space-x-2">
          <span>{language === 'zh' ? '女娲 Nuwa' : 'Nuwa'}</span>
          <span className="text-neon-green bg-brutal-black px-2 py-0.5 text-sm font-mono tracking-normal">Skill Distiller</span>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="font-mono text-xs text-right">
            <p className="mb-1">{language === 'zh' ? '由' : 'Created by'} <strong className="bg-neon-green px-1 text-brutal-black">ibook</strong> {language === 'zh' ? '构建' : ''}</p>
            <p className="text-gray-600">github.com/Ibook000/Skill-Distiller</p>
          </div>
          <div className="p-1 bg-white border-2 border-brutal-black">
            <QRCodeSVG value="https://github.com/Ibook000/Skill-Distiller" size={48} />
          </div>
        </div>
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
              className="flex items-center space-x-2 bg-white text-brutal-black px-3 py-1 font-mono text-xs uppercase hover:bg-gray-200 transition-colors font-bold"
            >
              <Download className="h-4 w-4" />
              <span>{language === 'zh' ? '单文件 (.md)' : 'Single File (.md)'}</span>
            </button>
            <button 
              onClick={downloadZip}
              className="flex items-center space-x-2 bg-neon-green text-brutal-black px-3 py-1 font-mono text-xs uppercase hover:bg-white transition-colors font-bold"
            >
              <FileArchive className="h-4 w-4" />
              <span>{language === 'zh' ? '多文件包 (.zip)' : 'Multi-file (.zip)'}</span>
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
