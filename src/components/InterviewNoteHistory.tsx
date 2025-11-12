import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { History, RotateCcw, Clock, User, FileText, Trash2 } from 'lucide-react';
import { apiRequest } from '@/services/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface InterviewNoteHistoryProps {
  userId: string;
  noteKey: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (content: string) => void;
}

interface HistoryRecord {
  id: number;
  content: string;
  action_type: string;
  source: string;
  timestamp: string;
  session_id?: string;
}

export default function InterviewNoteHistory({ 
  userId, 
  noteKey, 
  isOpen, 
  onClose, 
  onRestore 
}: InterviewNoteHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch version history for this note
  const { data: history, isLoading } = useQuery<HistoryRecord[]>({
    queryKey: ['/api/interview-notes', userId, noteKey, 'history'],
    queryFn: async () => {
      const response = await fetch(`/api/interview-notes/${userId}/${noteKey}/history?limit=10`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json();
    },
    enabled: isOpen && !!userId && !!noteKey
  });

  // Track which button is currently loading
  const [loadingButtonId, setLoadingButtonId] = useState<number | null>(null);

  // Restore from history
  const restoreMutation = useMutation({
    mutationFn: async (historyId: number) => {
      setLoadingButtonId(historyId);
      const response = await apiRequest('POST', '/api/interview-notes/restore', {
        userId: parseInt(userId),
        noteKey,
        historyId,
        sessionId: `restore-${Date.now()}`
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setLoadingButtonId(null);
      toast({
        title: "Version restored",
        description: "Your interview note has been restored to the selected version."
      });
      
      // Extract content from the response
      const restoredContent = data?.content || '';
      onRestore(restoredContent);
      
      // Comprehensive cache invalidation to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/interview-notes', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/interview-notes', userId, noteKey, 'history'] });
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('interviewNotesUpdated', { 
        detail: { userId, noteKey, content: restoredContent } 
      }));
      
      onClose();
    },
    onError: () => {
      setLoadingButtonId(null);
      toast({
        title: "Restore failed",
        description: "Could not restore this version. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create': return <FileText className="w-3 h-3" />;
      case 'update': return <User className="w-3 h-3" />;
      case 'delete': return <Trash2 className="w-3 h-3" />;
      case 'restore': return <RotateCcw className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'restore': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-slate-600" />
            <CardTitle className="text-lg">Version History</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No version history found for this question.
            </div>
          ) : (
            <div className="space-y-4">
              {history
                .filter(record => record.content && record.content.trim() !== '') // Only show records with actual content
                .map((record, index) => (
                <div 
                  key={record.id}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge className={`${getActionColor(record.action_type)} flex items-center space-x-1`}>
                        {getActionIcon(record.action_type)}
                        <span className="capitalize">{record.action_type}</span>
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {format(new Date(record.timestamp), 'MMM d, yyyy h:mm a')}
                      </span>
                      {index === 0 && (
                        <Badge variant="outline" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    {index > 0 && record.content && record.content.trim() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restoreMutation.mutate(record.id)}
                        disabled={loadingButtonId === record.id}
                        className="text-xs"
                      >
                        {loadingButtonId === record.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-600 mr-1"></div>
                            Restoring...
                          </div>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {record.action_type === 'delete' || !record.content || record.content.trim() === '' ? (
                    <div className="text-sm text-red-600 italic">
                      Content was deleted
                    </div>
                  ) : record.content ? (
                    <Textarea
                      value={record.content}
                      readOnly
                      className="min-h-[60px] bg-slate-50 text-sm resize-none"
                    />
                  ) : (
                    <div className="text-sm text-slate-400 italic">
                      No content
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>Source: {record.source}</span>
                    {record.session_id && (
                      <span>Session: {record.session_id.substring(0, 12)}...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
