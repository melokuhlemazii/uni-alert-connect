
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";

interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

interface AlertCommentsProps {
  alertId: string;
}

const AlertComments = ({ alertId }: AlertCommentsProps) => {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const commentsRef = collection(db, "comments");
      const q = query(
        commentsRef, 
        where("alertId", "==", alertId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      const fetchedComments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedComments.push({
          id: doc.id,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy,
          createdByName: data.createdByName || "Anonymous"
        });
      });
      
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [alertId, showComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !userData) return;
    
    try {
      setIsSubmitting(true);
      
      await addDoc(collection(db, "comments"), {
        alertId,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
        createdBy: userData.uid,
        createdByName: userData.displayName || "Anonymous"
      });
      
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully"
      });
      
      // Refresh comments
      fetchComments();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post your comment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="text-muted-foreground flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          {showComments ? "Hide Comments" : "Show Comments"}
          {comments.length > 0 && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{comments.length}</span>}
        </Button>
      </div>

      {showComments && (
        <>
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-20"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newComment.trim() || isSubmitting}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <div className="space-y-4 mt-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 border rounded-lg bg-gray-50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {comment.createdByName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{comment.createdByName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(comment.createdAt, "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AlertComments;
