import { useState, useEffect } from 'react';
import { FileUploader, UploadedFile } from './components/FileUploader';
import { DistillProcess } from './components/DistillProcess';
import { SkillProfileView } from './components/SkillProfileView';
import { distillSkill, SkillProfile, ApiConfig } from './lib/gemini';
import { Zap, AlertCircle, Sparkles, Link as LinkIcon, Loader2, Settings, X } from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDistilling, setIsDistilling] = useState(false);
  const [distillStep, setDistillStep] = useState(0);
  const [profile, setProfile] = useState<SkillProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  
  const [showSettings, setShowSettings] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    provider: 'gemini',
    apiKey: '',
    baseUrl: '',
    model: 'gemini-2.5-flash'
  });

  useEffect(() => {
    const saved = localStorage.getItem('nuwa_api_config');
    if (saved) {
      try {
        setApiConfig(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveApiConfig = (newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    localStorage.setItem('nuwa_api_config', JSON.stringify(newConfig));
  };
  
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  const handleDistill = async () => {
    if (files.length === 0) return;
    
    setIsDistilling(true);
    setDistillStep(0);
    setError(null);
    
    try {
      const result = await distillSkill(files, language, setDistillStep, apiConfig);
      setProfile(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : (language === 'zh' ? '蒸馏过程中发生未知错误。' : 'An unknown error occurred during distillation.'));
    } finally {
      setIsDistilling(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setProfile(null);
    setError(null);
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    
    let targetUrl = urlInput.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    setIsFetchingUrl(true);
    setError(null);
    
    try {
      // Use Jina Reader API to extract clean markdown from any URL
      const response = await fetch(`https://r.jina.ai/${targetUrl}`, {
        headers: {
          'Accept': 'text/plain',
          'X-Return-Format': 'markdown'
        }
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const text = await response.text();
      
      if (!text || text.length < 50) {
        throw new Error(language === 'zh' ? '未能在该网页找到足够的有效文本内容。' : 'Could not find enough valid text content on this page.');
      }

      const newFile: UploadedFile = {
        name: targetUrl,
        mimeType: 'text/markdown',
        base64: '', // Not needed since we have text
        text: text,
        size: text.length
      };
      
      setFiles(prev => [...prev, newFile]);
      setUrlInput('');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : (language === 'zh' ? '无法抓取该网页，请检查链接或稍后重试。' : 'Failed to fetch URL. Please check the link or try again.'));
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const loadExample = async (type: 'steve_jobs' | 'linus_torvalds') => {
    setIsDistilling(true);
    setDistillStep(0);
    setError(null);
    
    try {
      // Create a mock file with some text to trigger the distillation
      const mockText = type === 'steve_jobs' 
        ? "Design is not just what it looks like and feels like. Design is how it works. Innovation distinguishes between a leader and a follower. Stay hungry, stay foolish." 
        : "Talk is cheap. Show me the code. I'm doing a (free) operating system (just a hobby, won't be big and professional like gnu) for 386(486) AT clones.";
      
      const mockFile: UploadedFile = {
        name: `${type}_quotes.txt`,
        mimeType: 'text/plain',
        base64: btoa(mockText),
        text: mockText,
        size: mockText.length
      };
      
      const result = await distillSkill([mockFile], language, setDistillStep, apiConfig);
      setProfile(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : (language === 'zh' ? '加载示例时发生错误。' : 'Error loading example.'));
    } finally {
      setIsDistilling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gallery-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="mb-12 border-b-4 border-brutal-black pb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-6xl md:text-8xl uppercase tracking-tighter leading-none">{language === 'zh' ? '女娲 Nuwa' : 'Nuwa'}</h1>
            <p className="font-mono text-lg md:text-xl font-bold mt-2 uppercase tracking-widest text-neon-green bg-brutal-black inline-block px-2">{language === 'zh' ? '技能蒸馏器 (Skill Distiller)' : 'Skill Distiller'}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowSettings(true)} 
                className="brutal-btn px-2 py-1 flex items-center justify-center bg-white hover:bg-gray-100"
                title="API Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setLanguage(l => l === 'zh' ? 'en' : 'zh')} 
                className="brutal-btn px-3 py-1 text-sm font-mono"
              >
                {language === 'zh' ? 'EN' : '中文'}
              </button>
            </div>
            <div className="hidden md:block font-mono text-xs text-right uppercase mt-2">
              <p>{language === 'zh' ? '版本 1.2' : 'Version 1.2'}</p>
              <p>{language === 'zh' ? '系统状态：在线' : 'System: Online'}</p>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main>
          {error && (
            <div className="brutal-border bg-red-100 p-4 mb-8 flex items-start space-x-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold font-mono uppercase text-red-800">{language === 'zh' ? '操作失败' : 'Operation Failed'}</h3>
                <p className="font-mono text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!isDistilling && !profile && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <FileUploader files={files} setFiles={setFiles} language={language} />
                
                {/* URL Input Section */}
                <div className="brutal-border bg-white p-6">
                  <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black pb-2">
                    <LinkIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="font-display text-xl uppercase">{language === 'zh' ? '或者输入网页链接' : 'Or Import from URL'}</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                      placeholder={language === 'zh' ? 'https://example.com/blog-post' : 'https://example.com/blog-post'}
                      className="flex-1 brutal-border px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neon-green"
                    />
                    <button 
                      onClick={handleAddUrl}
                      disabled={isFetchingUrl || !urlInput.trim()}
                      className="brutal-btn px-6 py-2 flex items-center justify-center space-x-2 whitespace-nowrap"
                    >
                      {isFetchingUrl ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{language === 'zh' ? '抓取中...' : 'Fetching...'}</span>
                        </>
                      ) : (
                        <span>{language === 'zh' ? '提取网页' : 'Extract URL'}</span>
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-gray-500 mt-3">
                    {language === 'zh' ? '支持抓取博客文章、公开主页等纯文本内容。' : 'Supports extracting text from blog posts, public profiles, etc.'}
                  </p>
                </div>

                {/* Example Section */}
                <div className="brutal-border bg-white p-6">
                  <div className="flex items-center space-x-2 mb-4 border-b-2 border-brutal-black pb-2">
                    <Sparkles className="h-5 w-5 text-neon-green" />
                    <h3 className="font-display text-xl uppercase">{language === 'zh' ? '或者尝试示例' : 'Or Try Examples'}</h3>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => loadExample('steve_jobs')}
                      className="brutal-btn px-4 py-2 text-sm flex items-center space-x-2"
                    >
                      <span>{language === 'zh' ? '🍎 史蒂夫·乔布斯' : '🍎 Steve Jobs'}</span>
                    </button>
                    <button 
                      onClick={() => loadExample('linus_torvalds')}
                      className="brutal-btn px-4 py-2 text-sm flex items-center space-x-2"
                    >
                      <span>{language === 'zh' ? '🐧 林纳斯·托瓦兹' : '🐧 Linus Torvalds'}</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="brutal-border bg-brutal-black text-white p-6 flex flex-col justify-between">
                <div>
                  <h2 className="font-display text-3xl uppercase mb-4 text-neon-green">{language === 'zh' ? '使用说明' : 'Instructions'}</h2>
                  <ol className="font-mono text-sm space-y-4 list-decimal list-inside text-gray-300">
                    <li>{language === 'zh' ? '上传代表某人数字足迹的文档，或输入网页链接。' : 'Upload documents or enter URLs representing a person\'s digital footprint.'}</li>
                    <li>{language === 'zh' ? '可以包括代码、文章、聊天记录导出或简历。' : 'This can include code, essays, chat exports, or resumes.'}</li>
                    <li>{language === 'zh' ? '点击“蒸馏”按钮提取他们的人格特征。' : 'Click the distill button to extract their persona.'}</li>
                    <li>{language === 'zh' ? '系统将生成一个可复用的 AI 技能档案 (System Prompt)。' : 'The system will generate a reusable AI skill profile.'}</li>
                  </ol>
                </div>
                
                <button 
                  onClick={handleDistill}
                  disabled={files.length === 0 || files.some(f => f.isProcessing)}
                  className="brutal-btn w-full py-4 mt-8 flex items-center justify-center space-x-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-5 w-5" />
                  <span>
                    {files.some(f => f.isProcessing) 
                      ? (language === 'zh' ? '文件处理中...' : 'Processing Files...') 
                      : (language === 'zh' ? '开始蒸馏人格' : 'Distill Persona')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {isDistilling && (
            <DistillProcess language={language} currentStep={distillStep} />
          )}

          {profile && !isDistilling && (
            <SkillProfileView profile={profile} onUpdateProfile={setProfile} onReset={handleReset} language={language} />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white brutal-border p-6 w-full max-w-md relative">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-display uppercase mb-6">{language === 'zh' ? 'API 设置' : 'API Settings'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-sm mb-1 font-bold">API Provider</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="provider" 
                      value="gemini" 
                      checked={apiConfig.provider === 'gemini'} 
                      onChange={() => saveApiConfig({...apiConfig, provider: 'gemini', model: 'gemini-2.5-flash'})}
                      className="text-neon-green focus:ring-neon-green"
                    />
                    <span className="font-mono text-sm">Google Gemini</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="provider" 
                      value="openai" 
                      checked={apiConfig.provider === 'openai'} 
                      onChange={() => saveApiConfig({...apiConfig, provider: 'openai', model: 'gpt-4o-mini'})}
                      className="text-neon-green focus:ring-neon-green"
                    />
                    <span className="font-mono text-sm">OpenAI Compatible</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block font-mono text-sm mb-1 font-bold">API Key</label>
                <input
                  type="password"
                  value={apiConfig.apiKey || ''}
                  onChange={e => saveApiConfig({...apiConfig, apiKey: e.target.value})}
                  className="w-full brutal-border p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neon-green"
                  placeholder={language === 'zh' ? '留空则使用默认 Key' : 'Leave empty to use default'}
                />
              </div>
              <div>
                <label className="block font-mono text-sm mb-1 font-bold">Base URL</label>
                <input
                  type="text"
                  value={apiConfig.baseUrl || ''}
                  onChange={e => saveApiConfig({...apiConfig, baseUrl: e.target.value})}
                  className="w-full brutal-border p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neon-green"
                  placeholder={apiConfig.provider === 'openai' ? "https://api.openai.com/v1" : "https://generativelanguage.googleapis.com"}
                />
              </div>
              <div>
                <label className="block font-mono text-sm mb-1 font-bold">Model</label>
                <input
                  type="text"
                  value={apiConfig.model || ''}
                  onChange={e => saveApiConfig({...apiConfig, model: e.target.value})}
                  className="w-full brutal-border p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neon-green"
                  placeholder={apiConfig.provider === 'openai' ? "gpt-4o-mini" : "gemini-2.5-flash"}
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="brutal-btn px-6 py-2 bg-neon-green text-sm font-bold"
              >
                {language === 'zh' ? '保存并关闭' : 'Save & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
