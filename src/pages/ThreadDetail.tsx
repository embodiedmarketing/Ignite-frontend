import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  ArrowLeft,
  Calendar,
  User,
  Reply,
  Trash2,
  CornerDownRight,
  Pencil,
  Search,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertForumPostSchema, type InsertForumPost, insertForumThreadSchema, type InsertForumThread } from "@shared/schema";
import { queryClient } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo, useEffect } from "react";
import { MentionTextarea } from "@/components/MentionTextarea";
import { MentionText } from "@/utils/mentionUtils";
import RichTextEditor, { RichTextEditorRef } from "@/components/RichTextEditor";
import RichContentDisplay from "@/components/RichContentDisplay";
import { useRef } from "react";

export default function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [replyingToPostId, setReplyingToPostId] = useState<number | null>(null);
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [deletePostDialogOpen, setDeletePostDialogOpen] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  const threadEditorRef = useRef<RichTextEditorRef>(null);
  const postEditorRef = useRef<RichTextEditorRef>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [threadAttachments, setThreadAttachments] = useState<File[]>([]);
  const [postAttachments, setPostAttachments] = useState<File[]>([]);
  
  // Mention popup state
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [activeEditorWrapperId, setActiveEditorWrapperId] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const mentionPopupRef = useRef<HTMLDivElement | null>(null);
  const activeEditorRef = useRef<HTMLElement | null>(null);
  const mentionRangeRef = useRef<Range | null>(null);
  const activeFormRef = useRef<{ setValue: (field: string, value: string) => void } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/forum/threads", id],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_BASE_URL}/api/forum/threads/${id}`, {
        credentials: 'include'
      }).then(
        (res) => res.json()
      ),
    enabled: !!id,
  });

  const form = useForm<InsertForumPost>({
    resolver: zodResolver(insertForumPostSchema),
    defaultValues: {
      body: "",
    },
  });

  const editPostForm = useForm<InsertForumPost>({
    resolver: zodResolver(insertForumPostSchema),
    defaultValues: {
      body: "",
    },
  });

  const editThreadForm = useForm<InsertForumThread>({
    resolver: zodResolver(insertForumThreadSchema),
    defaultValues: {
      title: data?.thread?.title || "",
      body: data?.thread?.body || "",
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (data?.thread && !isEditingThread) {
      editThreadForm.reset({
        title: data.thread.title || "",
        body: data.thread.body || "",
      });
    }
  }, [data?.thread, isEditingThread]);
  
  // Insert mention into editor
  const insertMention = (mentionText: string) => {
    if (!activeEditorRef.current) {
      console.log('No active editor found');
      return;
    }
    
    const editorElement = activeEditorRef.current;
    editorElement.focus();
    
    // Restore selection from saved range if available
    let selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      if (mentionRangeRef.current) {
        selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(mentionRangeRef.current.cloneRange());
        }
      }
    }
    
    // Get all text content to find @ position
    const allText = editorElement.textContent || '';
    const lastAt = allText.lastIndexOf('@');
    
    if (lastAt === -1) {
      console.log('No @ symbol found');
      return;
    }
    
    // Use TreeWalker to find the exact nodes containing the @ symbol
    const range = document.createRange();
    const walker = document.createTreeWalker(
      editorElement,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    let charCount = 0;
    let startNode: Node | null = null;
    let startOffset = 0;
    let endNode: Node | null = null;
    let endOffset = 0;
    
    // Find the node containing @ and the end of the text
    while ((node = walker.nextNode())) {
      const text = node.textContent || '';
      const nodeStart = charCount;
      const nodeEnd = charCount + text.length;
      
      // Check if @ is in this node
      if (nodeStart <= lastAt && nodeEnd > lastAt && !startNode) {
        startNode = node;
        startOffset = lastAt - nodeStart;
      }
      
      // Find the end of the text (where cursor should be)
      if (nodeEnd >= allText.length) {
        endNode = node;
        endOffset = allText.length - nodeStart;
        break;
      }
      
      charCount = nodeEnd;
    }
    
    if (!startNode) {
      console.log('Could not find @ symbol in text nodes');
      return;
    }
    
    // Create range from @ to end of text
    if (startNode && endNode && startNode.nodeType === Node.TEXT_NODE && endNode.nodeType === Node.TEXT_NODE) {
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      range.deleteContents();
      
      // Insert the mention as plain text
      const mentionNode = document.createTextNode(`@${mentionText} `);
      range.insertNode(mentionNode);
      
      // Position cursor after the mention and space
      range.setStartAfter(mentionNode);
      range.collapse(true);
      
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      // Fallback: try to use the current selection
      if (selection && selection.rangeCount > 0) {
        const currentRange = selection.getRangeAt(0);
        const textNode = currentRange.startContainer;
        
        if (textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent || '';
          const offset = currentRange.startOffset;
          const textBefore = text.substring(0, offset);
          const atPos = textBefore.lastIndexOf('@');
          
          if (atPos !== -1) {
            const rangeToReplace = document.createRange();
            rangeToReplace.setStart(textNode, atPos);
            rangeToReplace.setEnd(textNode, offset);
            rangeToReplace.deleteContents();
            
            // Insert mention as plain text
            const mentionNode = document.createTextNode(`@${mentionText} `);
            rangeToReplace.insertNode(mentionNode);
            
            rangeToReplace.setStartAfter(mentionNode);
            rangeToReplace.collapse(true);
            
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(rangeToReplace);
            }
          }
        }
      } else {
        // Last resort: insert at end
        const range = document.createRange();
        range.selectNodeContents(editorElement);
        range.collapse(false);
        
        // Find last @ and replace
        const allText2 = editorElement.textContent || '';
        const lastAt2 = allText2.lastIndexOf('@');
        if (lastAt2 !== -1) {
          // Remove the @ from the end
          const textNodes: Text[] = [];
          const walker2 = document.createTreeWalker(
            editorElement,
            NodeFilter.SHOW_TEXT,
            null
          );
          let n;
          while ((n = walker2.nextNode())) {
            if (n.nodeType === Node.TEXT_NODE) {
              textNodes.push(n as Text);
            }
          }
          
          if (textNodes.length > 0) {
            const lastNode = textNodes[textNodes.length - 1];
            const text = lastNode.textContent || '';
            if (text.endsWith('@')) {
              lastNode.textContent = text.slice(0, -1);
            }
          }
          
          // Insert mention as plain text
          const mentionNode = document.createTextNode(`@${mentionText} `);
          editorElement.appendChild(mentionNode);
          
          // Set cursor after mention
          const newRange = document.createRange();
          newRange.setStartAfter(mentionNode);
          newRange.collapse(true);
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }
    }
    
    // Update form value
    if (activeFormRef.current && editorElement) {
      const html = editorElement.innerHTML;
      activeFormRef.current.setValue('body', html);
    }
    
    // Close popup
    setShowMentionPopup(false);
    setActiveEditorWrapperId(null);
    activeEditorRef.current?.focus();
  };
  
  // Listen for @ symbol in RichTextEditor
  useEffect(() => {
    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Check if this is a RichTextEditor contentEditable
      if (target.getAttribute('data-testid') !== 'rich-text-editor-content') {
        return;
      }
      
      console.log('Input event detected in RichTextEditor');
      
      // Small delay to ensure content is updated
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          setShowMentionPopup(false);
          setActiveEditorWrapperId(null);
          return;
        }
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Get text content from the editor (use textContent to get plain text)
        const editorElement = target as HTMLElement;
        const allText = editorElement.textContent || '';
        console.log('Editor text:', allText);
        
        // Get text before cursor
        let textBeforeCursor = '';
        const textNode = range.startContainer;
        
        if (textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent || '';
          const offset = range.startOffset;
          textBeforeCursor = text.substring(0, offset);
          console.log('Text before cursor:', textBeforeCursor);
        } else {
          // For non-text nodes, use a simpler approach
          // Check if the last character in the editor is @
          const trimmedText = allText.trim();
          if (trimmedText.endsWith('@')) {
            console.log('@ found at end of text');
            // Store editor and range for mention insertion
            activeEditorRef.current = editorElement;
            if (selection && selection.rangeCount > 0) {
              mentionRangeRef.current = selection.getRangeAt(0).cloneRange();
            }
            
            // Determine which form this editor belongs to
            const editorWrapper = editorElement.closest('[data-editor-wrapper]');
            let wrapperId: string | null = null;
            if (editorWrapper) {
              wrapperId = editorWrapper.getAttribute('data-editor-wrapper');
              setActiveEditorWrapperId(wrapperId);
              if (wrapperId === 'main-reply') {
                activeFormRef.current = { setValue: (field: string, value: string) => form.setValue(field as any, value) };
              } else if (wrapperId === 'thread-edit') {
                activeFormRef.current = { setValue: (field: string, value: string) => editThreadForm.setValue(field as any, value) };
              } else if (wrapperId?.startsWith('post-edit-')) {
                activeFormRef.current = { setValue: (field: string, value: string) => editPostForm.setValue(field as any, value) };
              } else if (wrapperId?.startsWith('reply-to-')) {
                activeFormRef.current = { setValue: (field: string, value: string) => form.setValue(field as any, value) };
              }
            }
            
            const popupHeight = 256;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            let topPosition: number;
            if (spaceBelow >= popupHeight || spaceBelow > spaceAbove) {
              topPosition = rect.bottom + 5;
            } else {
              topPosition = rect.top - popupHeight - 5;
            }
            
            setMentionPosition({
              top: Math.max(5, Math.min(topPosition, window.innerHeight - popupHeight - 5)),
              left: Math.max(5, Math.min(rect.left, window.innerWidth - 288 - 5)),
            });
            setShowMentionPopup(true);
            return;
          }
          setShowMentionPopup(false);
          setActiveEditorWrapperId(null);
          return;
        }
        
        // Check if last character is @
        if (textBeforeCursor.endsWith('@')) {
          console.log('@ detected at cursor, showing popup');
          // Store editor and range for mention insertion
          activeEditorRef.current = editorElement;
          if (selection && selection.rangeCount > 0) {
            mentionRangeRef.current = selection.getRangeAt(0).cloneRange();
          }
          
          // Determine which form this editor belongs to
          const editorWrapper = editorElement.closest('[data-editor-wrapper]');
          let wrapperId: string | null = null;
          if (editorWrapper) {
            wrapperId = editorWrapper.getAttribute('data-editor-wrapper');
            setActiveEditorWrapperId(wrapperId);
            if (wrapperId === 'main-reply') {
              activeFormRef.current = { setValue: (field: string, value: string) => form.setValue(field as any, value) };
            } else if (wrapperId === 'thread-edit') {
              activeFormRef.current = { setValue: (field: string, value: string) => editThreadForm.setValue(field as any, value) };
            } else if (wrapperId?.startsWith('post-edit-')) {
              activeFormRef.current = { setValue: (field: string, value: string) => editPostForm.setValue(field as any, value) };
            } else if (wrapperId?.startsWith('reply-to-')) {
              activeFormRef.current = { setValue: (field: string, value: string) => form.setValue(field as any, value) };
            }
          }
          
          // Use getBoundingClientRect() directly for fixed positioning (viewport coordinates)
          // Position below cursor, but check if there's enough space
          const popupHeight = 256; // max-h-64 = 256px
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          let topPosition: number;
          if (spaceBelow >= popupHeight || spaceBelow > spaceAbove) {
            // Position below cursor
            topPosition = rect.bottom + 5;
          } else {
            // Position above cursor if not enough space below
            topPosition = rect.top - popupHeight - 5;
          }
          
          setMentionPosition({
            top: Math.max(5, Math.min(topPosition, window.innerHeight - popupHeight - 5)), // Keep within viewport
            left: Math.max(5, Math.min(rect.left, window.innerWidth - 288 - 5)), // Keep within viewport (w-72 = 288px)
          });
          setShowMentionPopup(true);
        } else {
          // Check if there's @ followed by text (hide if space after @)
          const lastAt = textBeforeCursor.lastIndexOf('@');
          if (lastAt !== -1) {
            const afterAt = textBeforeCursor.substring(lastAt + 1);
            if (/\s/.test(afterAt)) {
              console.log('Space after @, hiding popup');
              setShowMentionPopup(false);
              setActiveEditorWrapperId(null);
            } else {
              // Show popup if @ exists and no space after
              console.log('@ found with text after, showing popup');
              // Store editor and range for mention insertion
              activeEditorRef.current = editorElement;
              if (selection && selection.rangeCount > 0) {
                mentionRangeRef.current = selection.getRangeAt(0).cloneRange();
              }
              
              // Determine which form this editor belongs to
              const editorWrapper = editorElement.closest('[data-editor-wrapper]');
              let wrapperId: string | null = null;
              if (editorWrapper) {
                wrapperId = editorWrapper.getAttribute('data-editor-wrapper');
                setActiveEditorWrapperId(wrapperId);
                if (wrapperId === 'main-reply') {
                  activeFormRef.current = { setValue: (field: string, value: string) => form.setValue(field as any, value) };
                } else if (wrapperId === 'thread-edit') {
                  activeFormRef.current = { setValue: (field: string, value: string) => editThreadForm.setValue(field as any, value) };
                } else if (wrapperId?.startsWith('post-edit-')) {
                  activeFormRef.current = { setValue: (field: string, value: string) => editPostForm.setValue(field as any, value) };
                } else if (wrapperId?.startsWith('reply-to-')) {
                  activeFormRef.current = { setValue: (field: string, value: string) => form.setValue(field as any, value) };
                }
              }
              
              const popupHeight = 256;
              const spaceBelow = window.innerHeight - rect.bottom;
              const spaceAbove = rect.top;
              
              let topPosition: number;
              if (spaceBelow >= popupHeight || spaceBelow > spaceAbove) {
                topPosition = rect.bottom + 5;
              } else {
                topPosition = rect.top - popupHeight - 5;
              }
              
              setMentionPosition({
                top: Math.max(5, Math.min(topPosition, window.innerHeight - popupHeight - 5)),
                left: Math.max(5, Math.min(rect.left, window.innerWidth - 288 - 5)),
              });
              setShowMentionPopup(true);
            }
          } else {
            console.log('No @ found, hiding popup');
            setShowMentionPopup(false);
            setActiveEditorWrapperId(null);
          }
        }
      }, 50);
    };
    
    // Also listen for keydown to catch @ keypress
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      if (target.getAttribute('data-testid') !== 'rich-text-editor-content') {
        return;
      }
      
      // Check if @ key was pressed (Shift+2 on most keyboards, or @ key directly)
      if (e.key === '@' || (e.shiftKey && e.key === '2')) {
        console.log('@ key pressed');
        // Small delay to let the character be inserted
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Store editor and range for mention insertion
            activeEditorRef.current = target as HTMLElement;
            mentionRangeRef.current = range.cloneRange();
            
            // Determine which form this editor belongs to
            const editorWrapper = target.closest('[data-editor-wrapper]');
            let wrapperId: string | null = null;
            if (editorWrapper) {
              wrapperId = editorWrapper.getAttribute('data-editor-wrapper');
              setActiveEditorWrapperId(wrapperId);
              if (wrapperId === 'main-reply') {
                activeFormRef.current = { setValue: (field: string, value: string) => form.setValue(field as any, value) };
              } else if (wrapperId === 'thread-edit') {
                activeFormRef.current = { setValue: (field: string, value: string) => editThreadForm.setValue(field as any, value) };
              } else if (wrapperId?.startsWith('post-edit-')) {
                activeFormRef.current = { setValue: (field: string, value: string) => editPostForm.setValue(field as any, value) };
              } else if (wrapperId?.startsWith('reply-to-')) {
                activeFormRef.current = { setValue: (field: string, value: string) => form.setValue(field as any, value) };
              }
            }
            
            const popupHeight = 256;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            let topPosition: number;
            if (spaceBelow >= popupHeight || spaceBelow > spaceAbove) {
              topPosition = rect.bottom + 5;
            } else {
              topPosition = rect.top - popupHeight - 5;
            }
            
            setMentionPosition({
              top: Math.max(5, Math.min(topPosition, window.innerHeight - popupHeight - 5)),
              left: Math.max(5, Math.min(rect.left, window.innerWidth - 288 - 5)),
            });
            setShowMentionPopup(true);
            console.log('Popup should be visible now at:', topPosition, rect.left);
          }
        }, 100);
      }
    };
    
    // Use event delegation on document to catch all input and keydown events
    document.addEventListener('input', handleInput, true);
    document.addEventListener('keydown', handleKeyDown as EventListener, true);
    
    console.log('Mention listener attached');
    
    return () => {
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('keydown', handleKeyDown as EventListener, true);
    };
  }, []);
  
  // Debug: log when popup state changes
  useEffect(() => {
    console.log('showMentionPopup changed to:', showMentionPopup);
  }, [showMentionPopup]);
  
  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mentionPopupRef.current &&
        !mentionPopupRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[data-testid="rich-text-editor-content"]')
      ) {
        setShowMentionPopup(false);
      }
    };

    if (showMentionPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMentionPopup]);

  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertForumPost & { parentId?: number }) => {
      console.log("Submitting post data:", postData);

      // Upload attachments first if any
      let uploadedAttachments: any[] = [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadResponse = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/forum/upload-attachment`,
            {
              method: "POST",
              body: formData,
              credentials: "include",
            }
          );
          if (uploadResponse.ok) {
            const attachment = await uploadResponse.json();
            uploadedAttachments.push(attachment);
          }
        }
      }

      const dataWithAttachments = {
        ...postData,
        attachments:
          uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      };

      const response = await apiRequest(
        "POST",
        `/api/forum/threads/${id}/posts`,
        dataWithAttachments
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to post reply");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories"] });
      form.reset();
      setReplyingToPostId(null);
      setAttachments([]);
      editorRef.current?.clear();
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Error posting reply:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/forum/threads/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories"] });
      toast({
        title: "Thread deleted",
        description: "Your thread has been deleted successfully.",
      });
      navigate(`/forum/${data?.category?.slug}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete thread",
        variant: "destructive",
      });
    },
  });

  const updateThreadMutation = useMutation({
    mutationFn: async (threadData: InsertForumThread) => {
      // Upload attachments first if any
      let uploadedAttachments: any[] = [];
      if (threadAttachments.length > 0) {
        for (const file of threadAttachments) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadResponse = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/forum/upload-attachment`,
            {
              method: "POST",
              body: formData,
              credentials: "include",
            }
          );
          if (uploadResponse.ok) {
            const attachment = await uploadResponse.json();
            uploadedAttachments.push(attachment);
          }
        }
      }

      const dataWithAttachments = {
        ...threadData,
        attachments:
          uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      };

      const response = await apiRequest(
        "PUT",
        `/api/forum/threads/${id}`,
        dataWithAttachments
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update thread");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories"] });
      setIsEditingThread(false);
      setThreadAttachments([]);
      threadEditorRef.current?.clear();
      toast({
        title: "Thread updated",
        description: "Your thread has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Error updating thread:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update thread. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Organize posts into a tree structure
  // const organizedPosts = useMemo(() => {
  //   if (!data?.posts) return { topLevel: [], replies: new Map() };

  //   const topLevel: any[] = [];
  //   const replies = new Map<number, any[]>();

  //   data.posts.forEach((post: any) => {
  //     if (!post.parentId) {
  //       topLevel.push(post);
  //     } else {
  //       if (!replies.has(post.parentId)) {
  //         replies.set(post.parentId, []);
  //       }
  //       replies.get(post.parentId)!.push(post);
  //     }
  //   });

  //   return { topLevel, replies };
  // }, [data?.posts]);


  const organizedPosts = useMemo(() => {
    if (!data?.posts) return { topLevel: [], replies: new Map() };

    const topLevel: any[] = [];
    const replies = new Map<number, any[]>();
    
    // Create a set of all post IDs for quick lookup
    const postIds = new Set(data.posts.map((post: any) => post.id));

    data.posts.forEach((post: any) => {
      if (!post.parentId) {
        // Top-level post (no parent)
        topLevel.push(post);
      } else {
        // Check if parent exists in the posts array
        if (postIds.has(post.parentId)) {
          // Parent exists, add as nested reply
          if (!replies.has(post.parentId)) {
            replies.set(post.parentId, []);
          }
          replies.get(post.parentId)!.push(post);
        } else {
          // Orphaned reply (parent doesn't exist), show as top-level
          topLevel.push(post);
        }
      }
    });

    return { topLevel, replies };
  }, [data?.posts]);

  const onSubmit = (postData: InsertForumPost) => {
    const payload = replyingToPostId
      ? { body: postData.body, parentId: replyingToPostId }
      : { body: postData.body };
    createPostMutation.mutate(payload);
  };

  const handleDeleteThread = () => {
    deleteThreadMutation.mutate();
    setDeleteDialogOpen(false);
  };

  const handleEditThread = () => {
    setIsEditingThread(true);
    editThreadForm.reset({
      title: data?.thread?.title || "",
      body: data?.thread?.body || "",
    });
  };

  const handleCancelEdit = () => {
    setIsEditingThread(false);
    setThreadAttachments([]);
    editThreadForm.reset({
      title: data?.thread?.title || "",
      body: data?.thread?.body || "",
    });
  };

  const handleUpdateThread = (threadData: InsertForumThread) => {
    updateThreadMutation.mutate(threadData);
  };

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, postData }: { postId: number; postData: InsertForumPost }) => {
      // Upload attachments first if any
      let uploadedAttachments: any[] = [];
      if (postAttachments.length > 0) {
        for (const file of postAttachments) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadResponse = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/forum/upload-attachment`,
            {
              method: "POST",
              body: formData,
              credentials: "include",
            }
          );
          if (uploadResponse.ok) {
            const attachment = await uploadResponse.json();
            uploadedAttachments.push(attachment);
          }
        }
      }

      const dataWithAttachments = {
        ...postData,
        attachments:
          uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      };

      const response = await apiRequest(
        "PUT",
        `/api/forum/posts/${postId}`,
        dataWithAttachments
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update post");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories"] });
      setEditingPostId(null);
      setPostAttachments([]);
      postEditorRef.current?.clear();
      editPostForm.reset();
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest("DELETE", `/api/forum/posts/${postId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete post");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/threads", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories"] });
      setDeletePostId(null);
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
      setDeletePostDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const handleEditPost = (post: any) => {
    setEditingPostId(post.id);
    editPostForm.reset({
      body: post.body || "",
    });
    setPostAttachments([]);
  };

  const handleCancelEditPost = () => {
    setEditingPostId(null);
    setPostAttachments([]);
    editPostForm.reset();
  };

  const handleUpdatePost = (postData: InsertForumPost) => {
    if (editingPostId) {
      updatePostMutation.mutate({ postId: editingPostId, postData });
    }
  };

  const handleDeletePost = (postId: number) => {
    setDeletePostId(postId);
    setDeletePostDialogOpen(true);
  };

  const confirmDeletePost = () => {
    if (deletePostId) {
      deletePostMutation.mutate(deletePostId);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Thread Not Found
          </h2>
          <p className="text-slate-600 mt-2">
            The thread you're looking for doesn't exist.
          </p>
        </div>
        <Link href="/community-forum">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-slate-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>

        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded w-4/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href={`/forum/${data?.category?.slug}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {data?.category?.name}
              </Button>
            </Link>
            <Badge variant="outline">{data?.category?.name}</Badge>
          </div>

          {user && data?.thread?.userId === user.id && (
            <div className="flex gap-2">
              {!isEditingThread && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditThread}
                    data-testid="button-edit-thread"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Thread
                  </Button>
                  <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        data-testid="button-delete-thread"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Thread
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your thread and all its
                          replies. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteThread}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleteThreadMutation.isPending}
                        >
                          {deleteThreadMutation.isPending
                            ? "Deleting..."
                            : "Delete Thread"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          )}
        </div>

        {!isEditingThread ? (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              {data?.thread?.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {data?.thread?.authorName || "Anonymous"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(data?.thread?.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {data?.thread?.replyCount} replies
              </span>
            </div>
          </div>
        ) : (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Edit Thread</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...editThreadForm}>
                <form
                  onSubmit={editThreadForm.handleSubmit(handleUpdateThread)}
                  className="space-y-4"
                >
                  <FormField
                    control={editThreadForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thread Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="What's your question or topic?"
                            {...field}
                            data-testid="input-edit-thread-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editThreadForm.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thread Content</FormLabel>
                        <FormControl>
                          <div className="relative" data-editor-wrapper="thread-edit">
                            { showMentionPopup && activeEditorWrapperId === 'thread-edit' && <MentionPopup mentionPopupRef={mentionPopupRef} insertMention={insertMention} data={data} />}
                            <RichTextEditor
                              ref={threadEditorRef}
                              value={field.value || ""}
                              onChange={field.onChange}
                              onAttachmentsChange={setThreadAttachments}
                              placeholder="Provide more details about your question or topic. Use the toolbar to format text, add links, or attach files..."
                              minHeight="200px"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updateThreadMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateThreadMutation.isPending}
                      data-testid="button-save-thread"
                    >
                      {updateThreadMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Original Thread */}
        {!isEditingThread && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {data?.thread?.authorName?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {data?.thread?.authorName || "Anonymous"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(data?.thread?.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                  Original Post
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <RichContentDisplay
                content={data?.thread?.body || ""}
                attachments={data?.thread?.attachments}
              />
            </CardContent>
          </Card>
        )}

        {/* Replies */}
        {data?.posts?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Replies ({data.posts.length})
            </h2>

            {organizedPosts.topLevel.map((post: any, index: number) => (
              <div key={post.id}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {post.authorName?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {post.authorName || "Anonymous"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(post.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {editingPostId === post.id ? (
                      <Card className="bg-slate-50">
                        <CardContent className="pt-4">
                          <Form {...editPostForm}>
                            <form
                              onSubmit={editPostForm.handleSubmit(handleUpdatePost)}
                              className="space-y-4"
                            >
                              <FormField
                                control={editPostForm.control}
                                name="body"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Edit Your Reply</FormLabel>
                                    <FormControl>
                                      <div className="relative" data-editor-wrapper={`post-edit-${post.id}`}>
                                      { showMentionPopup && activeEditorWrapperId === `post-edit-${post.id}` && <MentionPopup mentionPopupRef={mentionPopupRef} insertMention={insertMention} data={data} />}
                                        <RichTextEditor
                                          ref={postEditorRef}
                                          value={field.value || ""}
                                          onChange={field.onChange}
                                          onAttachmentsChange={setPostAttachments}
                                          placeholder="Edit your reply. Use the toolbar to format text, add links, or attach files..."
                                          minHeight="120px"
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleCancelEditPost}
                                  disabled={updatePostMutation.isPending}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={updatePostMutation.isPending}
                                  data-testid={`button-save-post-${post.id}`}
                                >
                                  {updatePostMutation.isPending
                                    ? "Saving..."
                                    : "Save Changes"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        <RichContentDisplay
                          content={post.body || ""}
                          attachments={post.attachments}
                        />

                        {/* Action buttons */}
                        {user && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setReplyingToPostId(
                                  replyingToPostId === post.id ? null : post.id
                                )
                              }
                              data-testid={`button-reply-to-${post.id}`}
                            >
                              <Reply className="w-4 h-4 mr-2" />
                              Reply
                            </Button>
                            {user.id === post.userId && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPost(post)}
                                  data-testid={`button-edit-post-${post.id}`}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <AlertDialog
                                  open={deletePostDialogOpen && deletePostId === post.id}
                                  onOpenChange={(open) => {
                                    if (!open) {
                                      setDeletePostDialogOpen(false);
                                      setDeletePostId(null);
                                    }
                                  }}
                                >
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeletePost(post.id)}
                                      data-testid={`button-delete-post-${post.id}`}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete your post. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={confirmDeletePost}
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={deletePostMutation.isPending}
                                      >
                                        {deletePostMutation.isPending
                                          ? "Deleting..."
                                          : "Delete Post"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Reply form for this specific post */}
                    {replyingToPostId === post.id && user && (
                      <Card className="bg-slate-50">
                        <CardContent className="pt-4">
                          <Form {...form}>
                            <form
                              onSubmit={form.handleSubmit(onSubmit)}
                              className="space-y-4"
                            >
                              <FormField
                                control={form.control}
                                name="body"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Your Reply</FormLabel>
                                    <FormControl>
                                      <div className="relative" data-editor-wrapper={`reply-to-${post.id}`}>
{ showMentionPopup && activeEditorWrapperId === `reply-to-${post.id}` && <MentionPopup mentionPopupRef={mentionPopupRef} insertMention={insertMention} data={data} />}


                                        <RichTextEditor
                                          value={field.value || ""}
                                          onChange={field.onChange}
                                          onAttachmentsChange={setAttachments}
                                          placeholder="Write your reply. Use the toolbar to format text, add links, or attach files..."
                                          minHeight="120px"
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingToPostId(null);
                                    form.reset();
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={createPostMutation.isPending}
                                  data-testid={`button-submit-reply-to-${post.id}`}
                                >
                                  {createPostMutation.isPending
                                    ? "Posting..."
                                    : "Post Reply"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>

                {/* Nested replies */}
                {organizedPosts.replies.has(post.id) && (
                  <div className="ml-8 mt-4 space-y-4 border-l-2 border-slate-200 pl-4">
                    {organizedPosts.replies.get(post.id)!.map((reply: any) => (
                      <Card key={reply.id} className="bg-slate-50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <CornerDownRight className="w-4 h-4 text-slate-400" />
                            <div className="w-7 h-7 bg-slate-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {reply.authorName?.charAt(0)?.toUpperCase() ||
                                "A"}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {reply.authorName || "Anonymous"}
                              </p>
                              <p className="text-sm text-slate-500">
                                {new Date(reply.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                          {editingPostId === reply.id ? (
                            <Card className="bg-white">
                              <CardContent className="pt-4">
                                <Form {...editPostForm}>
                                  <form
                                    onSubmit={editPostForm.handleSubmit(handleUpdatePost)}
                                    className="space-y-4"
                                  >
                                    <FormField
                                      control={editPostForm.control}
                                      name="body"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Edit Your Reply</FormLabel>
                                          <FormControl>
                                            <div className="relative" data-editor-wrapper={`post-edit-${reply.id}`}> 

                                            { showMentionPopup && activeEditorWrapperId === `post-edit-${reply.id}` && <MentionPopup mentionPopupRef={mentionPopupRef} insertMention={insertMention} data={data} />}
                                            <RichTextEditor
                                              ref={postEditorRef}
                                              value={field.value || ""}
                                              onChange={field.onChange}
                                              onAttachmentsChange={setPostAttachments}
                                              placeholder="Edit your reply. Use the toolbar to format text, add links, or attach files..."
                                              minHeight="120px"
                                            />
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancelEditPost}
                                        disabled={updatePostMutation.isPending}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        type="submit"
                                        disabled={updatePostMutation.isPending}
                                        data-testid={`button-save-reply-${reply.id}`}
                                      >
                                        {updatePostMutation.isPending
                                          ? "Saving..."
                                          : "Save Changes"}
                                      </Button>
                                    </div>
                                  </form>
                                </Form>
                              </CardContent>
                            </Card>
                          ) : (
                            <>
                              <RichContentDisplay
                                content={reply.body || ""}
                                attachments={reply.attachments}
                              />
                              {user && user.id === reply.userId && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditPost(reply)}
                                    data-testid={`button-edit-reply-${reply.id}`}
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </Button>
                                  <AlertDialog
                                    open={deletePostDialogOpen && deletePostId === reply.id}
                                    onOpenChange={(open) => {
                                      if (!open) {
                                        setDeletePostDialogOpen(false);
                                        setDeletePostId(null);
                                      }
                                    }}
                                  >
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeletePost(reply.id)}
                                        data-testid={`button-delete-reply-${reply.id}`}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete your reply. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={confirmDeletePost}
                                          className="bg-red-600 hover:bg-red-700"
                                          disabled={deletePostMutation.isPending}
                                        >
                                          {deletePostMutation.isPending
                                            ? "Deleting..."
                                            : "Delete Reply"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reply Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Reply className="w-5 h-5 text-blue-600" />
              Post a Reply
            </CardTitle>
            <CardDescription>
              Join the discussion and share your thoughts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Reply</FormLabel>
                        <FormControl>
                          <div className="relative" data-editor-wrapper="main-reply">
                          { showMentionPopup && activeEditorWrapperId === 'main-reply' && <MentionPopup mentionPopupRef={mentionPopupRef} insertMention={insertMention} data={data} />}
                            <RichTextEditor
                              ref={editorRef}
                              value={field.value || ""}
                              onChange={field.onChange}
                              onAttachmentsChange={setAttachments}
                              placeholder="Share your thoughts, provide help, or ask follow-up questions. Use the toolbar to format text, add links, or attach files..."
                              minHeight="150px"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={createPostMutation.isPending}
                      data-testid="button-submit-reply"
                    >
                      {createPostMutation.isPending
                        ? "Posting..."
                        : "Post Reply"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">
                  You must be logged in to post a reply
                </p>
                <Link href="/login">
                  <Button variant="default">Log In to Reply</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


const MentionPopup = ({mentionPopupRef, insertMention, data}: {mentionPopupRef: React.RefObject<HTMLDivElement>, insertMention: (mention: string) => void, data: any}) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all users from the API (empty query to get all users, or use search query)
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ['/api/forum/users/search', searchQuery || 'all'],
    queryFn: () => {
      const queryParam = searchQuery.trim() || '';
      return fetch(`${import.meta.env.VITE_BASE_URL || ''}/api/forum/users/search?q=${encodeURIComponent(queryParam)}`, {
        credentials: 'include'
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }
        return res.json();
      });
    },
  });

console.log("allUsers",allUsers);

  // Filter and limit users based on search query
  const filteredUsers = useMemo(() => {
    if (!allUsers || allUsers.length === 0) return [];



    
    if (!searchQuery.trim()) {
      // Show first 8 users when no search
      return allUsers.slice(0, 8);
    }
    
    return allUsers.slice(0, 50);
  }, [allUsers, searchQuery]);

  return (
      <div
        ref={mentionPopupRef}
        className="absolute bottom-[80%] left-[2%] z-[9999] w-72 h-80 overflow-hidden bg-slate-900 rounded-lg shadow-2xl border border-slate-700"
        data-testid="mention-popup"
      >
        <div className="px-3 py-2 bg-slate-800 border-b border-slate-700">
          <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <span className="text-orange-400">@</span>
            Mention someone
          </p>
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-slate-700 border-slate-600 text-white text-sm placeholder:text-slate-400 focus:ring-orange-400 focus:border-orange-400"
              autoFocus
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-64 py-1">
          {/* @Everyone option - only show when not searching */}
          {!searchQuery.trim() && (
            <button
              type="button"
              onClick={() => insertMention('everyone')}
              className="w-full text-left px-3 py-2.5 transition-all duration-150 hover:bg-slate-800 border-l-3 border-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-br from-orange-500 to-orange-600">
                  E
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    Everyone
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    @everyone
                  </div>
                </div>
              </div>
            </button>
          )}
        
          {/* Loading state */}
          {isLoadingUsers ? (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-slate-400">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-slate-400">
                {searchQuery.trim() ? 'No users found' : 'No users available'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user: any, index: number) => {
              const fullName = user.authorName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
              const mentionHandle = fullName.split(' ')[0].toLowerCase();
              
              return (
                <button
                  key={user.userId || user.id || index}
                  type="button"
                  onClick={() => insertMention(mentionHandle)}
                  className="w-full text-left px-3 py-2.5 transition-all duration-150 hover:bg-slate-800 border-l-3 border-transparent"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with dynamic background */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      index % 5 === 0 ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                      index % 5 === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      index % 5 === 2 ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                      index % 5 === 3 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                      'bg-gradient-to-br from-pink-400 to-pink-500'
                    }`}>
                      {fullName.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* User Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {fullName}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        @{mentionHandle}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    )}