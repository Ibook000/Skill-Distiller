import React, { useState, useRef } from 'react';
import { SkillProfile, generateMarkdown, generateSkillFiles } from '../lib/gemini';
import { User, Brain, MessageSquare, Code, Copy, Check, Download, BookOpen, Scale, FileArchive, Image as ImageIcon, Loader2, Clock, Plus, Trash2, Edit2, X, ListChecks, GitMerge, Lightbulb, Shield } from 'lucide-react';
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

  const [editingModelIndex, setEditingModelIndex] = useState<number | null>(null);
  const [editingModelData, setEditingModelData] = useState<any>(null);
  const [isEditingHonesty, setIsEditingHonesty] = useState(false);
  const [honestyValue, setHonestyValue] = useState(profile.honestyBoundary || '');

  const handleSaveHonesty = () => {
    if (!onUpdateProfile) return;
    onUpdateProfile({ ...profile, honestyBoundary: honestyValue });
    setIsEditingHonesty(false);
  };

  const openEditModal = (index: number) => {
    setEditingModelIndex(index);
    setEditingModelData({ ...(profile.coreMentalModels?.[index] || {}) });
  };

  const closeEditModal = () => {
    setEditingModelIndex(null);
    setEditingModelData(null);
  };

  const saveEditModal = () => {
    if (!onUpdateProfile || editingModelIndex === null || !editingModelData) return;
    const updatedModels = [...(profile.coreMentalModels || [])];
    updatedModels[editingModelIndex] = editingModelData;
    onUpdateProfile({ ...profile, coreMentalModels: updatedModels });
    closeEditModal();
  };

  const handleAddTimelineEntry = () => {
    if (!onUpdateProfile) return;
    const updatedTimeline = [...(profile.timeline || []), { year: new Date().getFullYear().toString(), event: 'New Event' }];
    onUpdateProfile({ ...profile, timeline: updatedTimeline });
  };

  const handleUpdateTimelineEntry = (index: number, field: 'year' | 'event', value: string) => {
    if (!onUpdateProfile) return;
    const updatedTimeline = [...(profile.timeline || [])];
    updatedTimeline[index] = { ...updatedTimeline[index], [field]: value };
    onUpdateProfile({ ...profile, timeline: updatedTimeline });
  };

  const handleDeleteTimelineEntry = (index: number) => {
    if (!onUpdateProfile) return;
    const updatedTimeline = [...(profile.timeline || [])];
    updatedTimeline.splice(index, 1);
    onUpdateProfile({ ...profile, timeline: updatedTimeline });
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

      <div ref={captureRef} className="bg-[var(--bg-primary)] -mx-8 px-8 pt-4 pb-2 transition-colors duration-300">
        <div className="brutal-border bg-[var(--card-bg)] p-8 mb-8 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green rounded-bl-full -mr-16 -mt-16 brutal-border-b brutal-border-l z-0" />
        
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-16 h-16 brutal-border bg-brutal-black text-neon-green flex items-center justify-center">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display text-5xl uppercase tracking-tight leading-none text-[var(--text-primary)]">{profile.title}</h2>
              <p className="font-mono text-sm mt-2 font-bold italic text-[var(--text-primary)]">「{profile.quote}」</p>
            </div>
          </div>
        </div>
      </div>

      <div className="brutal-border bg-[var(--card-bg)] p-6 mb-8 transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black dark:border-white pb-2">
          <ListChecks className="h-5 w-5" />
          <h3 className="font-display text-xl uppercase">{language === 'zh' ? '角色扮演规则' : 'Roleplay Rules'}</h3>
        </div>
        <ul className="space-y-2 font-mono text-sm">
          {(profile.roleplayRules || []).map((rule, idx) => (
            <li key={idx} className="flex items-start">
              <span className="text-neon-green mr-2 font-bold">#</span>
              <span className="flex-1">{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="brutal-border bg-[var(--card-bg)] p-6 mb-8 transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black dark:border-white pb-2">
          <GitMerge className="h-5 w-5" />
          <h3 className="font-display text-xl uppercase">{language === 'zh' ? '回答工作流' : 'Workflow'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-sm">
          <div className="border-2 border-brutal-black dark:border-white p-4 relative">
            <div className="absolute -top-3 left-4 bg-neon-green px-2 font-bold border-2 border-brutal-black text-brutal-black">Step 1</div>
            <p className="mt-2 whitespace-pre-wrap">{profile.workflow?.step1 || ''}</p>
          </div>
          <div className="border-2 border-brutal-black dark:border-white p-4 relative">
            <div className="absolute -top-3 left-4 bg-neon-green px-2 font-bold border-2 border-brutal-black text-brutal-black">Step 2</div>
            <p className="mt-2 whitespace-pre-wrap">{profile.workflow?.step2 || ''}</p>
          </div>
          <div className="border-2 border-brutal-black dark:border-white p-4 relative">
            <div className="absolute -top-3 left-4 bg-neon-green px-2 font-bold border-2 border-brutal-black text-brutal-black">Step 3</div>
            <p className="mt-2 whitespace-pre-wrap">{profile.workflow?.step3 || ''}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="brutal-border bg-[var(--card-bg)] p-6 transition-colors duration-300">
          <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black dark:border-white pb-2">
            <User className="h-5 w-5" />
            <h3 className="font-display text-xl uppercase">{language === 'zh' ? '身份卡' : 'Identity Card'}</h3>
          </div>
          <div className="space-y-4 font-mono text-sm">
            <p><strong className="text-neon-green bg-brutal-black px-1">我是谁</strong> {profile.identityCard?.whoAmI || ''}</p>
            <p><strong className="text-neon-green bg-brutal-black px-1">我的起点</strong> {profile.identityCard?.background || ''}</p>
            <p><strong className="text-neon-green bg-brutal-black px-1">当前状态</strong> {profile.identityCard?.currentStatus || ''}</p>
          </div>
        </div>

        <div className="brutal-border bg-[var(--card-bg)] p-6 transition-colors duration-300">
          <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black dark:border-white pb-2">
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

      <div className="brutal-border bg-[var(--card-bg)] p-6 mb-8 transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black dark:border-white pb-2">
          <Brain className="h-5 w-5" />
          <h3 className="font-display text-xl uppercase">{language === 'zh' ? '核心心智模型' : 'Core Mental Models'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(profile.coreMentalModels || []).map((model, idx) => (
            <div key={idx} className="border-2 border-brutal-black dark:border-white p-4 flex flex-col relative group">
              {onUpdateProfile && (
                <button 
                  onClick={() => openEditModal(idx)} 
                  className="absolute top-2 right-2 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-neon-green border-2 border-transparent hover:border-brutal-black dark:hover:border-white transition-colors opacity-0 group-hover:opacity-100"
                  title={language === 'zh' ? '编辑此模型' : 'Edit this model'}
                >
                  <Edit2 className="h-4 w-4 text-[var(--text-primary)] group-hover:text-brutal-black" />
                </button>
              )}
              <h4 className="font-bold text-lg mb-2 bg-neon-green text-brutal-black inline-block px-1 self-start pr-8">{model.name || ''}</h4>
              <p className="font-mono text-sm mb-4"><strong>{language === 'zh' ? '一句话' : 'One-liner'}:</strong> {model.oneLiner || ''}</p>
              
              <div className="mb-4 flex-grow flex flex-col space-y-3">
                <div>
                  <strong className="font-bold text-xs uppercase text-brutal-black dark:text-neon-green block mb-1">
                    {language === 'zh' ? '应用 (Application)' : 'Application'}
                  </strong>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {model.application || (language === 'zh' ? '暂无' : 'None')}
                  </p>
                </div>
                <div>
                  <strong className="font-bold text-xs uppercase text-brutal-black dark:text-neon-green block mb-1">
                    {language === 'zh' ? '局限 (Limitation)' : 'Limitation'}
                  </strong>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {model.limitation || (language === 'zh' ? '暂无' : 'None')}
                  </p>
                </div>
              </div>
              
              {model.sourceSnippets && model.sourceSnippets.length > 0 && (
                <div className="mt-auto pt-3 border-t-2 border-dashed border-gray-300 dark:border-gray-600">
                  <p className="font-bold text-xs uppercase mb-2 text-brutal-black dark:text-neon-green">
                    {language === 'zh' ? '来源证据 (Source Evidence)' : 'Source Evidence'}
                  </p>
                  <div className="space-y-2">
                    {model.sourceSnippets.map((snippet, sIdx) => (
                      <div key={sIdx} className="font-mono text-xs bg-gray-50 dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 italic relative flex flex-col">
                        <div className="relative">
                          <span className="absolute -left-1 -top-1 text-neon-green text-lg leading-none font-serif">"</span>
                          <span className="relative z-10 pl-2">{snippet.quote || ''}</span>
                          <span className="absolute -right-1 -bottom-2 text-neon-green text-lg leading-none font-serif">"</span>
                        </div>
                        <div className="text-right mt-2 text-[10px] text-gray-500 dark:text-gray-400 font-bold not-italic">
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

      <div className="brutal-border bg-[var(--card-bg)] p-6 mb-8 transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black dark:border-white pb-2">
          <Lightbulb className="h-5 w-5" />
          <h3 className="font-display text-xl uppercase">{language === 'zh' ? '决策规则清单' : 'Decision Heuristics'}</h3>
        </div>
        <ul className="space-y-3 font-mono text-sm">
          {(profile.decisionHeuristics || []).map((heuristic, idx) => (
            <li key={idx} className="flex items-start bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
              <span className="text-brutal-black bg-neon-green px-2 mr-3 font-bold border-2 border-brutal-black">{idx + 1}</span>
              <span className="flex-1 mt-1">{heuristic}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="brutal-border bg-[var(--card-bg)] p-6 mb-8 transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black dark:border-white pb-2">
          <Scale className="h-5 w-5" />
          <h3 className="font-display text-xl uppercase">{language === 'zh' ? '价值观与反模式' : 'Values & Anti-patterns'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-sm">
          <div>
            <strong className="text-neon-green bg-brutal-black px-1">{language === 'zh' ? '提倡的价值观' : 'Core Values'}</strong>
            <ul className="mt-4 space-y-2">
              {(profile.valuesAndAntiPatterns?.values || []).map((v, idx) => (
                <li key={idx} className="flex items-start"><span className="text-green-600 dark:text-green-400 mr-2 font-bold">✓</span> <span className="flex-1">{v}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <strong className="text-red-400 bg-brutal-black px-1 text-white">{language === 'zh' ? '反对的模式' : 'Anti-patterns'}</strong>
            <ul className="mt-4 space-y-2">
              {(profile.valuesAndAntiPatterns?.antiPatterns || []).map((a, idx) => (
                <li key={idx} className="flex items-start"><span className="text-red-600 dark:text-red-400 mr-2 font-bold">✗</span> <span className="flex-1">{a}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="brutal-border bg-[var(--card-bg)] p-6 mb-8 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4 border-b-2 border-brutal-black dark:border-white pb-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <h3 className="font-display text-xl uppercase">{language === 'zh' ? '关键时间线' : 'Timeline'}</h3>
          </div>
          {onUpdateProfile && (
            <button 
              onClick={handleAddTimelineEntry}
              className="flex items-center space-x-1 text-xs font-mono bg-brutal-black text-neon-green px-2 py-1 hover:bg-gray-800 transition-colors border-2 border-brutal-black dark:border-white"
            >
              <Plus className="h-3 w-3" />
              <span>{language === 'zh' ? '添加记录' : 'Add Entry'}</span>
            </button>
          )}
        </div>
        <div className="font-mono text-sm">
          {(profile.timeline || []).length === 0 ? (
            <p className="text-gray-500 italic">{language === 'zh' ? '暂无时间线记录' : 'No timeline entries yet'}</p>
          ) : (
            <div className="relative border-l-2 border-brutal-black dark:border-white ml-2 sm:ml-4 space-y-6 py-2">
              {(profile.timeline || []).map((item, idx) => (
                <div key={idx} className="relative pl-6 sm:pl-8 group">
                  {/* Timeline Node */}
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-neon-green border-2 border-brutal-black dark:border-white"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                    <div className="w-full sm:w-24 flex-shrink-0">
                      {onUpdateProfile ? (
                        <input
                          type="text"
                          value={item.year || ''}
                          onChange={(e) => handleUpdateTimelineEntry(idx, 'year', e.target.value)}
                          className="w-full font-bold text-brutal-black bg-gray-50 dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 p-1 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none"
                          placeholder={language === 'zh' ? '年份' : 'Year'}
                        />
                      ) : (
                        <span className="font-bold text-brutal-black bg-neon-green px-1 inline-block">{item.year}</span>
                      )}
                    </div>
                    <div className="flex-grow flex items-start gap-2">
                      {onUpdateProfile ? (
                        <textarea
                          value={item.event || ''}
                          onChange={(e) => handleUpdateTimelineEntry(idx, 'event', e.target.value)}
                          className="w-full text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-1 focus:border-neon-green focus:ring-1 focus:ring-neon-green outline-none resize-y min-h-[32px]"
                          placeholder={language === 'zh' ? '事件描述' : 'Event description'}
                        />
                      ) : (
                        <span className="text-gray-700 dark:text-gray-200">{item.event}</span>
                      )}
                      {onUpdateProfile && (
                        <button
                          onClick={() => handleDeleteTimelineEntry(idx)}
                          className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          title={language === 'zh' ? '删除此记录' : 'Delete entry'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="brutal-border bg-[var(--card-bg)] p-6 mb-8 transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black dark:border-white pb-2">
          <BookOpen className="h-5 w-5" />
          <h3 className="font-display text-xl uppercase">{language === 'zh' ? '智识谱系' : 'Intellectual Lineage'}</h3>
        </div>
        <div className="font-mono text-sm">
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(profile.intellectualLineage || []).map((item, idx) => (
              <li key={idx} className="flex items-start border-l-4 border-neon-green pl-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="brutal-border bg-[var(--card-bg)] p-6 mb-8 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4 border-b-2 border-brutal-black dark:border-white pb-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-red-500" />
            <h3 className="font-display text-xl uppercase">{language === 'zh' ? '诚信边界' : 'Honesty Boundary'}</h3>
          </div>
          {onUpdateProfile && !isEditingHonesty && (
            <button 
              onClick={() => setIsEditingHonesty(true)}
              className="p-1 hover:bg-neon-green hover:text-brutal-black border-2 border-transparent hover:border-brutal-black transition-colors"
              title={language === 'zh' ? '编辑边界' : 'Edit Boundary'}
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {isEditingHonesty ? (
          <div className="space-y-4">
            <textarea 
              value={honestyValue}
              onChange={(e) => setHonestyValue(e.target.value)}
              className="w-full brutal-border p-4 font-mono text-sm bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-neon-green min-h-[120px] resize-y"
              placeholder={language === 'zh' ? '定义 AI 承认自己不知道或不能做的事情...' : 'Define what the AI admits it doesn\'t know or can\'t do...'}
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setIsEditingHonesty(false);
                  setHonestyValue(profile.honestyBoundary || '');
                }}
                className="brutal-btn px-4 py-1 text-xs"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button 
                onClick={handleSaveHonesty}
                className="brutal-btn px-4 py-1 text-xs bg-neon-green text-brutal-black"
              >
                {language === 'zh' ? '保存' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="font-mono text-sm leading-relaxed text-gray-700 dark:text-gray-300 italic">
            {profile.honestyBoundary || (language === 'zh' ? '暂未定义诚信边界。' : 'No honesty boundary defined yet.')}
          </p>
        )}
      </div>

      {/* Watermark / Footer for exported image */}
      <div className="mt-4 flex flex-col md:flex-row items-center justify-between border-t-4 border-brutal-black dark:border-white pt-6 pb-4">
        <div className="font-display text-2xl uppercase tracking-tighter flex items-center space-x-2">
          <span>{language === 'zh' ? '女娲 Nuwa' : 'Nuwa'}</span>
          <span className="text-neon-green bg-brutal-black px-2 py-0.5 text-sm font-mono tracking-normal">Skill Distiller</span>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="font-mono text-xs text-right">
            <p className="mb-1">{language === 'zh' ? '由' : 'Created by'} <strong className="bg-neon-green px-1 text-brutal-black">ibook</strong> {language === 'zh' ? '构建' : ''}</p>
            <p className="text-gray-600 dark:text-gray-400">github.com/Ibook000/Skill-Distiller</p>
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

      {/* Edit Mental Model Modal */}
      {editingModelIndex !== null && editingModelData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card-bg)] border-4 border-brutal-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-2xl max-h-[90vh] flex flex-col transition-colors duration-300">
            <div className="flex justify-between items-center p-4 border-b-4 border-brutal-black dark:border-white bg-neon-green text-brutal-black">
              <h3 className="font-display text-xl uppercase font-bold">{language === 'zh' ? '编辑心智模型' : 'Edit Mental Model'}</h3>
              <button onClick={closeEditModal} className="hover:bg-white p-1 border-2 border-transparent hover:border-brutal-black transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-4 font-mono">
              <div>
                <label className="block font-bold text-sm mb-1">{language === 'zh' ? '模型名称 (Name)' : 'Name'}</label>
                <input 
                  type="text" 
                  value={editingModelData.name || ''} 
                  onChange={e => setEditingModelData({...editingModelData, name: e.target.value})} 
                  className="w-full border-2 border-brutal-black dark:border-white p-2 focus:ring-2 focus:ring-neon-green outline-none bg-[var(--bg-primary)] transition-colors duration-300" 
                />
              </div>
              <div>
                <label className="block font-bold text-sm mb-1">{language === 'zh' ? '一句话解释 (One-liner)' : 'One-liner'}</label>
                <input 
                  type="text" 
                  value={editingModelData.oneLiner || ''} 
                  onChange={e => setEditingModelData({...editingModelData, oneLiner: e.target.value})} 
                  className="w-full border-2 border-brutal-black dark:border-white p-2 focus:ring-2 focus:ring-neon-green outline-none bg-[var(--bg-primary)] transition-colors duration-300" 
                />
              </div>
              <div>
                <label className="block font-bold text-sm mb-1">{language === 'zh' ? '应用场景 (Application)' : 'Application'}</label>
                <textarea 
                  value={editingModelData.application || ''} 
                  onChange={e => setEditingModelData({...editingModelData, application: e.target.value})} 
                  className="w-full border-2 border-brutal-black dark:border-white p-2 focus:ring-2 focus:ring-neon-green outline-none min-h-[100px] resize-y bg-[var(--bg-primary)] transition-colors duration-300" 
                />
              </div>
              <div>
                <label className="block font-bold text-sm mb-1">{language === 'zh' ? '局限性 (Limitation)' : 'Limitation'}</label>
                <textarea 
                  value={editingModelData.limitation || ''} 
                  onChange={e => setEditingModelData({...editingModelData, limitation: e.target.value})} 
                  className="w-full border-2 border-brutal-black dark:border-white p-2 focus:ring-2 focus:ring-neon-green outline-none min-h-[100px] resize-y bg-[var(--bg-primary)] transition-colors duration-300" 
                />
              </div>
            </div>
            <div className="p-4 border-t-4 border-brutal-black dark:border-white bg-gray-50 dark:bg-gray-800 flex justify-end space-x-4 transition-colors duration-300">
              <button 
                onClick={closeEditModal} 
                className="px-6 py-2 font-bold border-2 border-brutal-black dark:border-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button 
                onClick={saveEditModal} 
                className="px-6 py-2 font-bold border-2 border-brutal-black dark:border-white bg-neon-green text-brutal-black hover:bg-brutal-black hover:text-neon-green dark:hover:bg-white dark:hover:text-brutal-black transition-colors"
              >
                {language === 'zh' ? '保存' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
