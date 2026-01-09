import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import {
    ChevronRight,
    Plus,
    FileText,
    Trash2,
    File,
    Menu, // Hamburger for mobile
    Pencil,
    Bold,
    Italic,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    List,
    ListOrdered
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// --- Types ---
interface Document {
    id: string;
    title: string;
    content: any; // JSON from Tiptap
    icon: string | null;
    parent_id: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
}

// --- Icons / Emoji Helper (Simplified) ---
// In a full app, use an emoji picker.
// const DEFAULT_ICON = '📄'; // Removed unused

// --- Components ---

// 1. Recursive Document Tree Item
// 1. Recursive Document Tree Item
const DocumentTreeItem = ({
    doc,
    level = 0,
    activeId,
    expandedIds,
    editingId,
    onToggleExpand,
    onSelect,
    onContextMenu,
    onCreateChild,
    onDelete,
    onRename
}: {
    doc: Document & { children: any[] },
    level?: number,
    activeId: string | null,
    expandedIds: Set<string>,
    editingId: string | null,
    onToggleExpand: (id: string, e: React.MouseEvent) => void,
    onSelect: (id: string) => void,
    onContextMenu: (id: string, e: React.MouseEvent) => void,
    onCreateChild: (parentId: string, e: React.MouseEvent) => void,
    onDelete: (id: string, e: React.MouseEvent) => void,
    onRename: (id: string, newTitle: string) => void
}) => {
    const hasChildren = doc.children && doc.children.length > 0;
    const isExpanded = expandedIds.has(doc.id);
    const isActive = activeId === doc.id;
    const isEditing = editingId === doc.id;

    const [editValue, setEditValue] = useState(doc.title);

    // Reset edit value when title changes externally or editing starts
    useEffect(() => {
        if (isEditing) setEditValue(doc.title);
    }, [isEditing, doc.title]);

    const handleSave = () => {
        if (editValue.trim() !== "") {
            onRename(doc.id, editValue);
        } else {
            setEditValue(doc.title); // Revert if empty
            onRename(doc.id, doc.title); // Close edit mode
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <div>
            <div
                role="button"
                onClick={() => !isEditing && onSelect(doc.id)}
                onContextMenu={(e) => onContextMenu(doc.id, e)}
                className={`
                    group flex items-center gap-2 py-1 px-2 pr-2 rounded-lg text-sm select-none transition-colors min-h-[30px]
                    ${isActive ? 'bg-[var(--color-glass)] text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass)] hover:text-[var(--color-text-primary)]'}
                `}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
                title=""
            >
                <div
                    className={`
                        p-0.5 rounded-sm hover:bg-[var(--color-border)] transition-colors
                        ${!hasChildren && 'opacity-0 group-hover:opacity-100'} 
                    `}
                    onClick={(e) => hasChildren ? onToggleExpand(doc.id, e) : undefined}
                >
                    <ChevronRight
                        size={14}
                        className={`transition-transform duration-200 ${isExpanded && hasChildren ? 'rotate-90' : ''} ${!hasChildren && 'text-transparent'}`}
                    />
                </div>

                <span className="opacity-70">{doc.icon || '📄'}</span>

                {isEditing ? (
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-indigo-500 rounded px-1 py-0.5 text-sm outline-none min-w-0"
                    />
                ) : (
                    <span className="truncate flex-1">{doc.title || 'Sem título'}</span>
                )}

                {/* Hover Actions */}
                {!isEditing && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => onCreateChild(doc.id, e)}
                            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded"
                            title="Adicionar página dentro"
                        >
                            <Plus size={14} />
                        </button>
                        <button
                            onClick={(e) => onDelete(doc.id, e)}
                            className="p-1 text-[var(--color-text-secondary)] hover:text-rose-400 rounded"
                            title="Excluir"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            {isExpanded && hasChildren && (
                <div>
                    {doc.children.map(child => (
                        <DocumentTreeItem
                            key={child.id}
                            doc={child}
                            level={level + 1}
                            activeId={activeId}
                            expandedIds={expandedIds}
                            editingId={editingId}
                            onToggleExpand={onToggleExpand}
                            onSelect={onSelect}
                            onContextMenu={onContextMenu}
                            onCreateChild={onCreateChild}
                            onDelete={onDelete}
                            onRename={onRename}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// 2. Main Component
export default function Notes() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [activeDocId, setActiveDocId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For responsive or toggle
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; docId: string | null }>({
        visible: false,
        x: 0,
        y: 0,
        docId: null,
    });

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ visible: boolean; id: string | null }>({
        visible: false,
        id: null
    });

    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchDocuments(user.id);
            } else {
                setLoading(false);
            }
        };
        init();

        const handleClickOutside = () => setContextMenu(prev => ({ ...prev, visible: false }));
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchDocuments = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', uid)
                .eq('is_archived', false) // Soft delete check if implemented
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (data) setDocuments(data);
        } catch (error) {
            console.error('Error fetching docs:', error);
            // toast.error('Erro ao carregar documentos.');
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const createDocument = async (parentId: string | null = null, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!userId) return;

        const newDoc = {
            title: 'Sem título',
            user_id: userId,
            parent_id: parentId,
            content: null,
            icon: null
        };

        try {
            const { data, error } = await supabase
                .from('documents')
                .insert([newDoc])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setDocuments(prev => [...prev, data]);
                setActiveDocId(data.id);
                if (parentId) {
                    setExpandedIds(prev => new Set([...prev, parentId]));
                }
            }
        } catch (error) {
            console.error('Error creating doc:', error);
            toast.error('Erro ao criar página. A tabela "documents" existe?');
        }
    };

    const updateDocument = async (id: string, updates: Partial<Document>) => {
        // Optimistic UI Update
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

        try {
            const { error } = await supabase
                .from('documents')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating doc:', error);
            toast.error('Erro ao salvar.');
        }
    };

    const initiateDelete = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setDeleteConfirmation({ visible: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.id) return;
        const id = deleteConfirmation.id;

        // Optimistic
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (activeDocId === id) setActiveDocId(null);

        setDeleteConfirmation({ visible: false, id: null }); // Close modal immediately

        try {
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Página excluída.');

            if (userId) fetchDocuments(userId);
        } catch (error) {
            console.error('Error deleting doc:', error);
            toast.error('Erro ao excluir.');
        }
    };

    // --- Helpers ---
    const buildTree = (docs: Document[]) => {
        const docMap = new Map();
        docs.forEach(d => docMap.set(d.id, { ...d, children: [] }));

        const roots: any[] = [];
        docs.forEach(d => {
            const node = docMap.get(d.id);
            if (d.parent_id && docMap.has(d.parent_id)) {
                docMap.get(d.parent_id).children.push(node);
            } else {
                roots.push(node);
            }
        });
        return roots;
    };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleDocumentSelect = (id: string) => {
        // Find children of the selected document
        const children = documents.filter(d => d.parent_id === id);

        if (children.length > 0) {
            // It's a folder: Expand it locally so visual state matches
            setExpandedIds(prev => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });

            // Redirect to the first child (recursive to drill down potential sub-folders)
            // documents are sorted by created_at in fetch (older first)
            handleDocumentSelect(children[0].id);
        } else {
            // It's a leaf node: Select it
            setActiveDocId(id);
        }
    };

    const handleContextMenu = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            docId: id
        });
    };

    const handleRename = () => {
        if (!contextMenu.docId) return;
        setEditingId(contextMenu.docId);
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const handleRenameSubmit = (id: string, newTitle: string) => {
        updateDocument(id, { title: newTitle });
        setEditingId(null);
    };

    const handleContextDelete = () => {
        if (contextMenu.docId) {
            initiateDelete(contextMenu.docId);
        }
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const handleContextAddChild = (e: React.MouseEvent) => {
        if (contextMenu.docId) {
            createDocument(contextMenu.docId, e);
        }
        setContextMenu(prev => ({ ...prev, visible: false }));
    };



    const activeDocument = documents.find(d => d.id === activeDocId);
    // const hasChildren = documents.some(d => d.parent_id === activeDocId); // Removed as we want to edit parents too now
    const tree = buildTree(documents);

    return (
        <div className="flex h-full animate-fade-in bg-[var(--color-bg)] rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-xl">
            {/* Sidebar */}
            <aside
                className={`
                    w-64 bg-[var(--color-sidebar)] border-r border-[var(--color-border)] flex flex-col transition-all duration-300
                    ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}
                `}
            >
                <div className="p-4 flex items-center justify-between border-b border-[var(--color-border)]/50">
                    <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-medium text-sm">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                            {userId && documents.length > 0 ? documents.length : 0}
                        </div>
                        Páginas
                    </div>
                    <button
                        onClick={() => createDocument(null)}
                        className="p-1 hover:bg-[var(--color-glass)] rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        title="Nova Página"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="space-y-2 p-2">
                            <div className="h-4 bg-[var(--color-glass)] rounded animate-pulse w-3/4"></div>
                            <div className="h-4 bg-[var(--color-glass)] rounded animate-pulse w-1/2"></div>
                        </div>
                    ) : tree.length > 0 ? (
                        tree.map((root: any) => (
                            <DocumentTreeItem
                                key={root.id}
                                doc={root}
                                activeId={activeDocId}
                                expandedIds={expandedIds}
                                editingId={editingId}
                                onToggleExpand={toggleExpand}
                                onSelect={handleDocumentSelect}
                                onContextMenu={handleContextMenu}
                                onCreateChild={createDocument}
                                onDelete={initiateDelete}
                                onRename={handleRenameSubmit}
                            />
                        ))

                    ) : (
                        <div className="text-center py-10 text-[var(--color-text-secondary)] text-sm px-4">
                            <FileText size={24} className="mx-auto mb-2 opacity-30" />
                            <p>Nenhuma página.</p>
                            <button
                                onClick={() => createDocument(null)}
                                className="mt-2 text-indigo-400 hover:text-indigo-300 underline"
                            >
                                Criar a primeira
                            </button>
                        </div>
                    )}
                </div>
            </aside>



            {/* Context Menu Portal */}
            {
                contextMenu.visible && createPortal(
                    <div
                        className="fixed z-[100] min-w-[160px] bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-xl backdrop-blur-md p-1 flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-left"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        onClick={(e) => e.stopPropagation()}
                    >

                        <button onClick={handleRename} className="flex items-center gap-2 px-2 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-glass)] rounded text-left">
                            <Pencil size={14} /> Renomear
                        </button>
                        <button onClick={handleContextAddChild} className="flex items-center gap-2 px-2 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-glass)] rounded text-left">
                            <Plus size={14} /> Nova sub-página
                        </button>
                        <div className="h-px bg-[var(--color-border)] my-1" />
                        <button onClick={handleContextDelete} className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded text-left">
                            <Trash2 size={14} /> Excluir
                        </button>
                    </div>,
                    document.body
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteConfirmation.visible && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div
                            className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col gap-2">
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Excluir página?</h3>
                                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                                    Tem certeza que deseja excluir esta página?
                                    <br />
                                    <span className="text-amber-500 font-medium mt-1 inline-block">Isso apagará todas as sub-páginas também.</span>
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-2">
                                <button
                                    onClick={() => setDeleteConfirmation({ visible: false, id: null })}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-glass)] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Toggle Sidebar Button (Visible when collapsed) */}
            {
                !isSidebarOpen && (
                    <div className="absolute left-4 top-4 z-10">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                )
            }

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-[var(--color-bg)] h-full cursor-text relative">
                {isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute left-4 top-4 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] opacity-0 hover:opacity-100 transition-opacity z-10"
                        title="Fechar Sidebar"
                    >
                        <Menu size={20} />
                    </button>
                )}

                {activeDocument ? (
                    <Editor
                        key={activeDocument.id}
                        document={activeDocument}
                        onChange={(content) => updateDocument(activeDocument.id, { content })}
                        onTitleChange={(title) => updateDocument(activeDocument.id, { title })}
                        onIconChange={(icon) => updateDocument(activeDocument.id, { icon })}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--color-glass)] flex items-center justify-center mb-4">
                            <File size={32} className="opacity-50" />
                        </div>
                        <p className="text-lg font-medium">Selecione ou crie uma página</p>
                    </div>
                )}
            </main>
        </div >
    );
}

// --- Custom Bubble Menu ---
const CustomBubbleMenu = ({ editor, containerRef }: { editor: any, containerRef: React.RefObject<HTMLDivElement | null> }) => {
    const [position, setPosition] = useState<{ top: number, left: number } | null>(null);

    useEffect(() => {
        if (!editor || !containerRef.current) return;

        const updatePosition = () => {
            const { selection } = editor.state;

            if (selection.empty) {
                setPosition(null);
                return;
            }

            // Use native selection for better visual bounds
            const domSelection = editor.view.dom.ownerDocument.getSelection();
            if (!domSelection || domSelection.rangeCount === 0) return;

            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            const top = rect.top;
            const left = rect.left + (rect.width / 2);

            setPosition({ top, left });
        };

        editor.on('selectionUpdate', updatePosition);
        editor.on('blur', () => setPosition(null));

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', updatePosition, { passive: true });
        }
        window.addEventListener('scroll', updatePosition, { passive: true });
        window.addEventListener('resize', updatePosition);

        return () => {
            editor.off('selectionUpdate', updatePosition);
            editor.off('blur', () => setPosition(null));

            if (container) {
                container.removeEventListener('scroll', updatePosition);
            }
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        }
    }, [editor, containerRef]);

    if (!position) return null;

    return createPortal(
        <div
            className="fixed z-[9999] flex items-center gap-1 p-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: position.top - 15, // Gap above text
                left: position.left,
                transform: 'translate(-50%, -100%)' // Move up entirely
            }}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
        >
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded hover:bg-[var(--color-glass)] transition-colors ${editor.isActive('bold') ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-secondary)]'}`}
                title="Negrito"
            >
                <Bold size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded hover:bg-[var(--color-glass)] transition-colors ${editor.isActive('italic') ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-secondary)]'}`}
                title="Itálico"
            >
                <Italic size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded hover:bg-[var(--color-glass)] transition-colors ${editor.isActive('strike') ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-secondary)]'}`}
                title="Tachado"
            >
                <Strikethrough size={16} />
            </button>
            <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-1.5 rounded hover:bg-[var(--color-glass)] transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-secondary)]'}`}
                title="Título 1"
            >
                <Heading1 size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-1.5 rounded hover:bg-[var(--color-glass)] transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-secondary)]'}`}
                title="Título 2"
            >
                <Heading2 size={16} />
            </button>
            <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded hover:bg-[var(--color-glass)] transition-colors ${editor.isActive('bulletList') ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-secondary)]'}`}
                title="Lista com marcadores"
            >
                <List size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded hover:bg-[var(--color-glass)] transition-colors ${editor.isActive('orderedList') ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-secondary)]'}`}
                title="Lista numerada"
            >
                <ListOrdered size={16} />
            </button>
            <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
            <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`p-1.5 rounded hover:bg-[var(--color-glass)] transition-colors ${editor.isActive('code') ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-secondary)]'}`}
                title="Código"
            >
                <Code size={16} />
            </button>
        </div>,
        document.body
    );
};

// --- Icon Picker Menu ---
const IconPickerMenu = ({
    targetRef,
    isOpen,
    onClose,
    onSelect
}: {
    targetRef: React.RefObject<HTMLButtonElement | null>,
    isOpen: boolean,
    onClose: () => void,
    onSelect: (emoji: string) => void
}) => {
    const [position, setPosition] = useState<{ top: number, left: number } | null>(null);

    useEffect(() => {
        if (isOpen && targetRef.current) {
            const updatePosition = () => {
                if (targetRef.current) {
                    const rect = targetRef.current.getBoundingClientRect();
                    setPosition({
                        top: rect.bottom + 8,
                        left: rect.left
                    });
                }
            };
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true); // Capture for all elements

            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition, true);
            }
        }
    }, [isOpen, targetRef]);

    useEffect(() => {
        const handleDown = (e: MouseEvent) => {
            if (!isOpen) return;
            const picker = document.getElementById('emoji-picker-portal');
            if (
                picker &&
                !picker.contains(e.target as Node) &&
                targetRef.current &&
                !targetRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };
        window.addEventListener('mousedown', handleDown);
        return () => window.removeEventListener('mousedown', handleDown);
    }, [isOpen, onClose, targetRef]);

    if (!isOpen || !position) return null;

    return createPortal(
        <div
            id="emoji-picker-portal"
            className="fixed z-[99999] animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <div className="bg-[var(--color-card)] rounded-xl shadow-2xl border border-[var(--color-border)] overflow-hidden">
                <EmojiPicker
                    onEmojiClick={(data) => onSelect(data.emoji)}
                    theme={Theme.DARK} // Assuming dark themed app as per "Aesthetics"
                    emojiStyle={EmojiStyle.APPLE}
                    searchPlaceHolder="Buscar emoji..."
                    width={350}
                    height={400}
                    previewConfig={{
                        showPreview: false
                    }}
                    skinTonesDisabled
                />
            </div>
        </div>,
        document.body
    );
};

// --- Editor Component ---
const Editor = ({
    document,
    onChange,
    onTitleChange,
    onIconChange
}: {
    document: Document,
    onChange: (content: any) => void,
    onTitleChange: (title: string) => void
    onIconChange: (icon: string) => void
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                bulletList: false,
                orderedList: false,
                listItem: false,
            }),
            Heading.configure({
                levels: [1, 2, 3],
            }),
            BulletList,
            OrderedList,
            ListItem,
            Placeholder.configure({
                placeholder: 'Digite "/" para comandos ou comece a escrever...',
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            BubbleMenuExtension,
        ],
        content: document.content || '',
        onUpdate: ({ editor }) => {
            // Debounce could be added here
            onChange(editor.getJSON());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none dark:prose-invert max-w-none',
            },
        },
    });

    // Handle Title Change
    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value.replace(/\n/g, ''); // Prevent newlines
        onTitleChange(val);
    };

    // Auto-resize title textarea
    const titleRef = useCallback((node: HTMLTextAreaElement | null) => {
        if (node) {
            node.style.height = 'auto';
            node.style.height = node.scrollHeight + 'px';
        }
    }, [document.title]);

    const containerRef = useRef<HTMLDivElement>(null);
    const iconButtonRef = useRef<HTMLButtonElement>(null);
    const [showIconPicker, setShowIconPicker] = useState(false);

    return (
        <div ref={containerRef} className="w-full max-w-4xl mx-auto px-12 py-12 h-full overflow-y-auto relative">
            {/* Header: Icon & Title */}
            <div className="group mb-4">
                <div className="mb-4 relative group/icon inline-block">
                    <button
                        ref={iconButtonRef}
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className="text-6xl hover:bg-[var(--color-glass)] rounded-xl p-2 transition-colors cursor-pointer select-none"
                    >
                        {document.icon || '📄'}
                    </button>
                    <div className="absolute -bottom-2 right-0 opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-[var(--color-bg)] rounded-full p-1 border border-[var(--color-border)] shadow-sm">
                            <Pencil size={12} className="text-[var(--color-text-secondary)]" />
                        </div>
                    </div>
                </div>

                <IconPickerMenu
                    targetRef={iconButtonRef}
                    isOpen={showIconPicker}
                    onClose={() => setShowIconPicker(false)}
                    onSelect={(emoji) => {
                        onIconChange(emoji);
                        setShowIconPicker(false);
                    }}
                />


                <textarea
                    ref={titleRef}
                    value={document.title}
                    onChange={handleTitleChange}
                    onInput={(e: any) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    placeholder="Sem título"
                    className="w-full bg-transparent border-none text-4xl font-bold text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/30 focus:ring-0 resize-none overflow-hidden p-0"
                    rows={1}
                />
            </div >

            <div className="h-px bg-[var(--color-border)] mb-8 opacity-50"></div>

            {editor && <CustomBubbleMenu editor={editor} containerRef={containerRef} />}

            <EditorContent editor={editor} className="min-h-[300px]" />
        </div >
    );
};
