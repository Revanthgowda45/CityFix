import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useReports, ReportStatus } from '@/contexts/ReportContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface ManageIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueId: string;
  currentStatus: ReportStatus;
}

const ManageIssueDialog: React.FC<ManageIssueDialogProps> = ({
  open,
  onOpenChange,
  issueId,
  currentStatus
}) => {
  const { updateReport, addComment } = useReports();
  const { currentUser } = useAuth();
  const [status, setStatus] = React.useState<ReportStatus>(currentStatus);
  const [comment, setComment] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // Update status
      await updateReport(issueId, { status });

      // Add admin comment if provided
      if (comment.trim()) {
        await addComment(issueId, {
          text: `[Status Update: ${status.replace('_', ' ').toUpperCase()}]\n${comment.trim()}`,
          user: {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
          },
        });
      }

      toast({
        title: 'Issue Updated',
        description: 'The issue status has been updated successfully.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating issue:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the issue. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Issue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Update Status</label>
            <Select value={status} onValueChange={(value: ReportStatus) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Comment (Optional)</label>
            <Textarea
              placeholder="Add a comment about this status update..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Issue'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManageIssueDialog; 