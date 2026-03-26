'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Download,
  Share2,
  Save,
  Type,
  Palette,
  Eye,
  Send,
  Copy,
  Check,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  LayoutTemplate,
  Settings2,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Layers,
  Image as ImageIcon,
  Smartphone,
  Undo2,
  Redo2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { EInvite, EInviteTemplate } from '@/lib/api/types/einvite.types';
import { einviteService } from '@/lib/api/services/einvite.service';
import { cn } from '@/lib/utils';

interface EInviteEditorProps {
  eventId: string;
  einvite: EInvite | null;
  templates: EInviteTemplate[];
  onSave: (canvasJson: Record<string, any>, previewUrl?: string) => Promise<void>;
  onPublish?: () => void;
  onSendToGuests?: () => void;
}

interface EditableField {
  id: string;
  type: string;
  text: string;
  editable: boolean;
}

const FONT_FAMILIES = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Great Vibes', label: 'Great Vibes' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Lora', label: 'Lora' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Cormorant Garamond', label: 'Cormorant' },
  { value: 'Dancing Script', label: 'Dancing Script' },
  { value: 'Pacifico', label: 'Pacifico' },
];

export function EInviteEditor({
  eventId,
  einvite,
  templates,
  onSave,
  onPublish,
  onSendToGuests,
}: EInviteEditorProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [editableFields, setEditableFields] = useState<EditableField[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(einvite?.templateId || null);
  const [zoom, setZoom] = useState(100);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<'templates' | 'properties' | null>(null);

  // Undo/Redo history
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isLoadingHistory = useRef(false);

  // Canvas dimensions
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 800;

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // Load existing canvas or template
    if (einvite?.canvasJson) {
      canvas.loadFromJSON(einvite.canvasJson, () => {
        canvas.renderAll();
        extractEditableFields(canvas);
      });
    } else if (selectedTemplate) {
      const template = templates.find((t) => t.id === selectedTemplate);
      if (template?.canvasJson) {
        canvas.loadFromJSON(template.canvasJson, () => {
          canvas.renderAll();
          extractEditableFields(canvas);
        });
      }
    }

    // Event listeners
    canvas.on('selection:created', (e) => setSelectedObject(e.selected?.[0] || null));
    canvas.on('selection:updated', (e) => setSelectedObject(e.selected?.[0] || null));
    canvas.on('selection:cleared', () => setSelectedObject(null));
    canvas.on('object:modified', () => {
      extractEditableFields(canvas);
      saveHistory();
    });
    canvas.on('object:added', () => saveHistory());
    canvas.on('object:removed', () => saveHistory());

    // Save initial state to history
    setTimeout(() => saveHistory(), 100);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Load template when selected
  useEffect(() => {
    if (!fabricRef.current || !selectedTemplate) return;

    const template = templates.find((t) => t.id === selectedTemplate);
    if (template?.canvasJson) {
      fabricRef.current.loadFromJSON(template.canvasJson, () => {
        fabricRef.current?.renderAll();
        extractEditableFields(fabricRef.current!);
      });
    }
  }, [selectedTemplate, templates]);

  // Extract editable text fields
  const extractEditableFields = useCallback((canvas: fabric.Canvas) => {
    const fields: EditableField[] = [];
    canvas.getObjects().forEach((obj) => {
      if (obj.type === 'textbox' && (obj as any).editable !== false) {
        fields.push({
          id: (obj as any).id || obj.toString(),
          type: 'text',
          text: (obj as fabric.Textbox).text || '',
          editable: true,
        });
      }
    });
    setEditableFields(fields);
  }, []);

  // Save canvas state to history
  const saveHistory = useCallback(() => {
    if (!fabricRef.current || isLoadingHistory.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON(['id', 'editable']));

    // Remove any redo states after current index
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;

    // Limit history to 50 states
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Undo
  const handleUndo = useCallback(() => {
    if (!fabricRef.current || historyIndexRef.current <= 0) return;

    isLoadingHistory.current = true;
    historyIndexRef.current--;
    const json = historyRef.current[historyIndexRef.current];

    fabricRef.current.loadFromJSON(JSON.parse(json), () => {
      fabricRef.current?.renderAll();
      extractEditableFields(fabricRef.current!);
      isLoadingHistory.current = false;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, [extractEditableFields]);

  // Redo
  const handleRedo = useCallback(() => {
    if (!fabricRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;

    isLoadingHistory.current = true;
    historyIndexRef.current++;
    const json = historyRef.current[historyIndexRef.current];

    fabricRef.current.loadFromJSON(JSON.parse(json), () => {
      fabricRef.current?.renderAll();
      extractEditableFields(fabricRef.current!);
      isLoadingHistory.current = false;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, [extractEditableFields]);

  // Update text field
  const updateTextField = useCallback((fieldId: string, newText: string) => {
    if (!fabricRef.current) return;
    const obj = fabricRef.current.getObjects().find((o) => (o as any).id === fieldId);
    if (obj && obj.type === 'textbox') {
      (obj as fabric.Textbox).set('text', newText);
      fabricRef.current.renderAll();
      extractEditableFields(fabricRef.current);
    }
  }, [extractEditableFields]);

  // Update selected object properties
  const updateSelectedProperty = useCallback((property: string, value: any) => {
    if (!selectedObject || !fabricRef.current) return;
    selectedObject.set(property as keyof fabric.Object, value);
    fabricRef.current.renderAll();
  }, [selectedObject]);

  // Save canvas
  const handleSave = async () => {
    if (!fabricRef.current) return;
    setIsSaving(true);
    try {
      const canvasJson = fabricRef.current.toJSON(['id', 'editable']);
      const previewDataUrl = fabricRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      });
      await onSave(canvasJson, previewDataUrl);
      toast.success('Invitation saved!');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Download as PNG
  const handleDownload = () => {
    if (!fabricRef.current) return;
    const dataUrl = fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    const link = document.createElement('a');
    link.download = `invitation-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast.success('Downloaded!');
  };

  // Copy share link
  const copyShareLink = () => {
    if (!einvite?.shareCode) return;
    navigator.clipboard.writeText(einviteService.getShareUrl(einvite.shareCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  // Add text
  const addText = () => {
    if (!fabricRef.current) return;
    const text = new fabric.Textbox('New Text', {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      width: 200,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#333333',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
    });
    (text as any).id = `text_${Date.now()}`;
    (text as any).editable = true;
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
    extractEditableFields(fabricRef.current);
  };

  // Delete selected
  const deleteSelected = () => {
    if (!fabricRef.current || !selectedObject) return;
    fabricRef.current.remove(selectedObject);
    setSelectedObject(null);
    extractEditableFields(fabricRef.current);
  };

  // Get field label
  const getFieldLabel = (id: string): string => {
    const labels: Record<string, string> = {
      couple_names: 'Names',
      person_name: 'Name',
      host_names: 'Host Names',
      event_date: 'Date',
      event_time: 'Time',
      venue_name: 'Venue',
      venue_address: 'Address',
      invitation_text: 'Message',
      custom_message: 'Custom Message',
    };
    return labels[id] || id.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Zoom controls
  const handleZoom = (newZoom: number) => {
    setZoom(Math.max(25, Math.min(200, newZoom)));
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const selectedTextbox = selectedObject?.type === 'textbox' ? (selectedObject as fabric.Textbox) : null;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b gap-2">
          {/* Left: Panel toggles & File actions */}
          <div className="flex items-center gap-1">
            {/* Desktop panel toggles */}
            <div className="hidden lg:flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                  >
                    {leftPanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Templates</TooltipContent>
              </Tooltip>
            </div>

            {/* Mobile panel triggers */}
            <div className="flex lg:hidden items-center gap-1">
              <Sheet open={mobilePanel === 'templates'} onOpenChange={(open) => setMobilePanel(open ? 'templates' : null)}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1">
                    <LayoutTemplate className="h-4 w-4" />
                    <span className="hidden sm:inline">Templates</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b flex-shrink-0">
                    <SheetTitle>Templates</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-hidden">
                    <TemplatePanel
                      templates={templates}
                      selectedTemplate={selectedTemplate}
                      onSelectTemplate={(id) => {
                        setSelectedTemplate(id);
                        setMobilePanel(null);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet open={mobilePanel === 'properties'} onOpenChange={(open) => setMobilePanel(open ? 'properties' : null)}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1">
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b flex-shrink-0">
                    <SheetTitle>Properties</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-hidden">
                    <PropertiesPanel
                      editableFields={editableFields}
                      selectedObject={selectedObject}
                      selectedTextbox={selectedTextbox}
                      onUpdateField={updateTextField}
                      onUpdateProperty={updateSelectedProperty}
                      onDelete={deleteSelected}
                      getFieldLabel={getFieldLabel}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

            {/* Add elements */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={addText}>
                  <Type className="h-4 w-4" />
                  <span className="hidden sm:inline">Text</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Text</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

            {/* Undo/Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleUndo}
                  disabled={!canUndo}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRedo}
                  disabled={!canRedo}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>

          {/* Center: Zoom controls */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleZoom(zoom - 10)}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleZoom(zoom + 10)}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(100)}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  <span className="hidden md:inline">Download</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download PNG</TooltipContent>
            </Tooltip>

            {einvite?.shareCode && (
              <>
                <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyShareLink}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="hidden md:inline">Copy Link</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy Share Link</TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Desktop panel toggle */}
            <div className="hidden lg:flex items-center">
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  >
                    {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Properties</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Templates (Desktop) */}
          {leftPanelOpen && (
            <div className="hidden lg:flex w-64 flex-shrink-0 border-r bg-white dark:bg-gray-800 flex-col overflow-hidden">
              <div className="p-3 border-b flex-shrink-0">
                <h3 className="font-semibold text-sm">Templates</h3>
              </div>
              <div className="flex-1 min-h-0">
                <TemplatePanel
                  templates={templates}
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={setSelectedTemplate}
                />
              </div>
            </div>
          )}

          {/* Canvas Area */}
          <div
            ref={canvasContainerRef}
            className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8"
            style={{ background: 'repeating-conic-gradient(#f5f5f5 0% 25%, #ffffff 0% 50%) 50% / 20px 20px' }}
          >
            <div
              className="shadow-2xl rounded-lg overflow-hidden bg-white transition-transform"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
            >
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* Right Panel - Properties (Desktop) */}
          {rightPanelOpen && (
            <div className="hidden lg:flex w-72 flex-shrink-0 border-l bg-white dark:bg-gray-800 flex-col overflow-hidden">
              <div className="p-3 border-b flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-sm">Properties</h3>
                {selectedObject && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedObject.type}
                  </Badge>
                )}
              </div>
              <div className="flex-1 min-h-0">
                <PropertiesPanel
                  editableFields={editableFields}
                  selectedObject={selectedObject}
                  selectedTextbox={selectedTextbox}
                  onUpdateField={updateTextField}
                  onUpdateProperty={updateSelectedProperty}
                  onDelete={deleteSelected}
                  getFieldLabel={getFieldLabel}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        {einvite && (
          <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-t">
            <div className="flex items-center gap-2">
              <Badge variant={einvite.isPublished ? 'default' : 'secondary'}>
                {einvite.isPublished ? 'Published' : 'Draft'}
              </Badge>
              {einvite.sentCount ? (
                <span className="text-xs text-muted-foreground">
                  Sent to {einvite.sentCount} guests
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {!einvite.isPublished && onPublish && (
                <Button size="sm" onClick={onPublish} className="gap-1">
                  <Eye className="h-4 w-4" />
                  Publish
                </Button>
              )}
              {einvite.isPublished && onSendToGuests && (
                <Button size="sm" onClick={onSendToGuests} className="gap-1">
                  <Send className="h-4 w-4" />
                  Send to Guests
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Template Preview Component - Renders a mini canvas preview
function TemplatePreview({ canvasJson, colors }: { canvasJson: Record<string, any> | null; colors?: { primary?: string; secondary?: string } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !canvasJson) return;

    const canvas = new fabric.StaticCanvas(canvasRef.current, {
      width: 90,
      height: 120,
      backgroundColor: colors?.secondary || '#ffffff',
    });

    canvas.loadFromJSON(canvasJson, () => {
      // Scale down to fit preview
      const scale = 90 / 600; // Original width is 600
      canvas.setZoom(scale);
      canvas.setDimensions({ width: 90, height: 120 });
      canvas.renderAll();
      setLoaded(true);
    });

    return () => {
      canvas.dispose();
    };
  }, [canvasJson, colors]);

  if (!canvasJson) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: colors?.secondary || '#fafafa' }}
      >
        <LayoutTemplate className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <canvas ref={canvasRef} className={cn("transition-opacity", loaded ? "opacity-100" : "opacity-0")} />
    </div>
  );
}

// Template Panel Component
function TemplatePanel({
  templates,
  selectedTemplate,
  onSelectTemplate,
}: {
  templates: EInviteTemplate[];
  selectedTemplate: string | null;
  onSelectTemplate: (id: string) => void;
}) {
  const categories = [...new Set(templates.map((t) => t.category))];

  return (
    <div className="h-full overflow-auto">
      <div className="p-3 space-y-4">
        {categories.map((category) => (
          <div key={category}>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              {category.replace(/_/g, ' ')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {templates
                .filter((t) => t.category === category)
                .map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onSelectTemplate(template.id)}
                    className={cn(
                      "relative aspect-[3/4] rounded-lg border-2 overflow-hidden transition-all hover:shadow-md group",
                      selectedTemplate === template.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <TemplatePreview
                      canvasJson={template.canvasJson as Record<string, any> | null}
                      colors={template.defaultColors || undefined}
                    />
                    {/* Template name overlay on hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] text-white font-medium line-clamp-2 leading-tight">
                        {template.name}
                      </span>
                    </div>
                    {template.isPremium && (
                      <span className="absolute top-1 right-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-medium shadow-sm">
                        PRO
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No templates available
          </p>
        )}
      </div>
    </div>
  );
}

// Properties Panel Component
function PropertiesPanel({
  editableFields,
  selectedObject,
  selectedTextbox,
  onUpdateField,
  onUpdateProperty,
  onDelete,
  getFieldLabel,
}: {
  editableFields: EditableField[];
  selectedObject: fabric.Object | null;
  selectedTextbox: fabric.Textbox | null;
  onUpdateField: (id: string, text: string) => void;
  onUpdateProperty: (property: string, value: any) => void;
  onDelete: () => void;
  getFieldLabel: (id: string) => string;
}) {
  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-6">
        {/* Selected Object Properties */}
        {selectedObject && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Selected Element
              </h4>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {selectedTextbox && (
              <>
                {/* Text Formatting */}
                <div className="space-y-2">
                  <Label className="text-xs">Font</Label>
                  <Select
                    value={selectedTextbox.fontFamily || 'Arial'}
                    onValueChange={(value) => onUpdateProperty('fontFamily', value)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Size</Label>
                    <Input
                      type="number"
                      value={selectedTextbox.fontSize || 24}
                      onChange={(e) => onUpdateProperty('fontSize', parseInt(e.target.value) || 24)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Color</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={(selectedTextbox.fill as string) || '#333333'}
                        onChange={(e) => onUpdateProperty('fill', e.target.value)}
                        className="w-9 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={(selectedTextbox.fill as string) || '#333333'}
                        onChange={(e) => onUpdateProperty('fill', e.target.value)}
                        className="flex-1 h-9 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Text Style Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant={selectedTextbox.fontWeight === 'bold' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateProperty('fontWeight', selectedTextbox.fontWeight === 'bold' ? 'normal' : 'bold')}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedTextbox.fontStyle === 'italic' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateProperty('fontStyle', selectedTextbox.fontStyle === 'italic' ? 'normal' : 'italic')}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button
                    variant={selectedTextbox.textAlign === 'left' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateProperty('textAlign', 'left')}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedTextbox.textAlign === 'center' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateProperty('textAlign', 'center')}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedTextbox.textAlign === 'right' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateProperty('textAlign', 'right')}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {!selectedTextbox && selectedObject && (
              <div className="space-y-2">
                <Label className="text-xs">Fill Color</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={(selectedObject.fill as string) || '#333333'}
                    onChange={(e) => onUpdateProperty('fill', e.target.value)}
                    className="w-9 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={(selectedObject.fill as string) || '#333333'}
                    onChange={(e) => onUpdateProperty('fill', e.target.value)}
                    className="flex-1 h-9 text-sm font-mono"
                  />
                </div>
              </div>
            )}

            <Separator />
          </div>
        )}

        {/* Editable Text Fields */}
        <div className="space-y-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Edit Content
          </h4>
          {editableFields.length > 0 ? (
            editableFields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label className="text-xs font-medium">{getFieldLabel(field.id)}</Label>
                {field.text.includes('\n') || field.text.length > 50 ? (
                  <Textarea
                    value={field.text}
                    onChange={(e) => onUpdateField(field.id, e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                ) : (
                  <Input
                    value={field.text}
                    onChange={(e) => onUpdateField(field.id, e.target.value)}
                    className="h-9 text-sm"
                  />
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Select a template to edit content
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
