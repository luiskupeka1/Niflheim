import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { 
  NotebookPen, 
  Plus, 
  FileText, 
  Heading1, 
  Heading2, 
  CheckSquare, 
  Mic, 
  PenTool, 
  Trash2, 
  FolderPlus, 
  Play, 
  Square,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifestyle } from '@/components/lifestyle-provider';
import { SectionHeading } from '@/components/page-ui';

export const Route = createFileRoute('/notas')({
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Workspace & Notas em Blocos' },
      { name: 'description', content: 'Workspace notion-like com blocos dinâmicos, áudio in-line e canvas stylus.' },
    ],
  }),
  component: NotasPage,
});

export type BlockType = 'text' | 'h1' | 'h2' | 'check' | 'audio' | 'drawing';

interface NoteBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

function NotasPage() {
  const { user, data, save, reward } = useLifestyle();

  // Páginas do workspace
  const [pages, setPages] = useState<{ id: string; title: string; parentId: string | null }[]>([
    { id: 'p1', title: 'Projetos Manuais & Engenharia', parentId: null },
    { id: 'p2', title: 'Calibração Impressora 3D', parentId: 'p1' },
    { id: 'p3', title: 'Manutenção de Moto & Peças', parentId: 'p1' },
    { id: 'p4', title: 'Filosofia & Revisão Alemão', parentId: null },
  ]);

  const [activePageId, setActivePageId] = useState<string>('p1');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  // Blocos da página ativa
  const [blocks, setBlocks] = useState<NoteBlock[]>([
    { id: 'b1', type: 'h1', content: 'Planejamento e Execução Semanal' },
    { id: 'b2', type: 'text', content: 'Notas rápidas, documentação de montagem e calibrações.' },
    { id: 'b3', type: 'check', content: 'Calibrar fluxo e nivelamento da mesa 3D a 60°C', checked: true },
    { id: 'b4', type: 'check', content: 'Comprar kit relação e lubrificante de corrente', checked: false },
    { id: 'b5', type: 'audio', content: 'Nota de voz: Ajuste de tensão do bico extrusor' },
  ]);

  // Modo Stylus / Canvas Transparente
  const [isPenActive, setIsPenActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Iniciar / Limpar Canvas ao mudar Pen Mode
  useEffect(() => {
    if (isPenActive && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#FFD700'; // Amarelo de destaque NIFLHEIM
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isPenActive]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPenActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isPenActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock: NoteBlock = {
      id: crypto.randomUUID(),
      type,
      content: type === 'audio' ? 'Áudio gravado' : '',
      checked: false,
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<NoteBlock>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const handleCreatePage = () => {
    if (!newPageTitle.trim()) return;
    const newPage = {
      id: crypto.randomUUID(),
      title: newPageTitle.trim(),
      parentId: null,
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
    setNewPageTitle('');
    setIsCreatingPage(false);
  };

  const activePage = pages.find((p) => p.id === activePageId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Produtividade & Notion-Like Workspace
          </span>
          <h1 className="text-3xl font-extrabold md:text-4xl">
            Blocos, Ideias & Stylus<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Documente projetos, checklists aninhados, anotações de voz e desenhos à mão livre.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Modo Stylus / Caneta */}
          <Button
            variant={isPenActive ? 'default' : 'outline'}
            onClick={() => setIsPenActive(!isPenActive)}
            className={`text-xs flex items-center gap-1.5 ${
              isPenActive ? 'bg-primary text-primary-foreground font-bold' : ''
            }`}
          >
            <PenTool size={14} /> {isPenActive ? 'Sair do Modo Caneta' : 'Modo Caneta (Stylus)'}
          </Button>

          {isPenActive && (
            <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-xs">
              Limpar Rabiscos
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* Painel Lateral: Páginas e Sub-páginas */}
        <div className="panel p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              Páginas & Pastas
            </span>
            <button
              onClick={() => setIsCreatingPage(true)}
              className="text-primary hover:text-primary/80"
            >
              <Plus size={16} />
            </button>
          </div>

          {isCreatingPage && (
            <div className="space-y-2 border-b border-border pb-3">
              <input
                type="text"
                placeholder="Nome da página..."
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                className="text-xs"
              />
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => setIsCreatingPage(false)} className="text-[10px] h-6">
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleCreatePage} className="text-[10px] h-6 bg-primary text-primary-foreground font-bold">
                  Criar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {pages.map((p) => (
              <div
                key={p.id}
                onClick={() => setActivePageId(p.id)}
                className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                  activePageId === p.id
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                } ${p.parentId ? 'pl-6 text-[11px]' : ''}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText size={14} />
                  <span className="truncate">{p.title}</span>
                </div>
                {activePageId === p.id && <ChevronRight size={13} />}
              </div>
            ))}
          </div>
        </div>

        {/* Editor Central Notion-Like com Suporte a Canvas Stylus */}
        <div className="relative panel p-6 min-h-[500px]">
          {/* Canvas Stylus Sobreposto */}
          {isPenActive && (
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              className="absolute inset-0 z-40 h-full w-full cursor-crosshair touch-none"
            />
          )}

          {/* Barra de Ações de Blocos */}
          <div className="mb-6 flex flex-wrap items-center gap-1.5 border-b border-border pb-3 text-xs">
            <span className="text-[11px] text-muted-foreground mr-2">Inserir bloco:</span>
            <Button variant="ghost" size="sm" onClick={() => addBlock('text')} className="text-xs h-7">
              <FileText size={13} className="mr-1" /> Texto
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addBlock('h1')} className="text-xs h-7">
              <Heading1 size={13} className="mr-1" /> H1
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addBlock('h2')} className="text-xs h-7">
              <Heading2 size={13} className="mr-1" /> H2
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addBlock('check')} className="text-xs h-7">
              <CheckSquare size={13} className="mr-1" /> Checklist
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addBlock('audio')} className="text-xs h-7 text-primary">
              <Mic size={13} className="mr-1" /> Gravar Áudio
            </Button>
          </div>

          <h2 className="text-2xl font-black mb-6 text-foreground">
            {activePage?.title ?? 'Sem título'}
          </h2>

          {/* Renderizador de Blocos Dinâmicos */}
          <div className="space-y-3">
            {blocks.map((block) => {
              if (block.type === 'h1') {
                return (
                  <div key={block.id} className="group relative flex items-center gap-2">
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder="Título H1..."
                      className="border-0 bg-transparent text-xl font-black text-foreground focus:ring-0 p-1"
                    />
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              }

              if (block.type === 'h2') {
                return (
                  <div key={block.id} className="group relative flex items-center gap-2">
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder="Subtítulo H2..."
                      className="border-0 bg-transparent text-lg font-bold text-foreground focus:ring-0 p-1"
                    />
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              }

              if (block.type === 'check') {
                return (
                  <div key={block.id} className="group relative flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={block.checked}
                      onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
                      className="size-4 rounded border-border"
                    />
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder="Item do checklist..."
                      className={`border-0 bg-transparent text-xs text-foreground focus:ring-0 p-1 flex-1 ${
                        block.checked ? 'line-through text-muted-foreground' : ''
                      }`}
                    />
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              }

              if (block.type === 'audio') {
                return (
                  <div
                    key={block.id}
                    className="group relative flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <button className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Play size={15} fill="currentColor" />
                      </button>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {block.content}
                        </div>
                        {/* Fake Waveform Visualizer */}
                        <div className="flex items-center gap-1 mt-1.5 h-3">
                          {[40, 70, 30, 90, 60, 100, 45, 80, 20, 50, 75, 40].map((h, i) => (
                            <span
                              key={i}
                              style={{ height: `${h}%` }}
                              className="w-1 rounded-full bg-primary/70"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              }

              return (
                <div key={block.id} className="group relative flex items-start gap-2">
                  <textarea
                    rows={2}
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Digite seu texto ou use formatação rápida..."
                    className="border-0 bg-transparent text-xs text-foreground focus:ring-0 p-1 flex-1 resize-none"
                  />
                  <button
                    onClick={() => removeBlock(block.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs mt-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
