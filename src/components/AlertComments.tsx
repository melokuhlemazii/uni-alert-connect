import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/useAuth";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

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
  const [loadingProgress, setLoadingProgress] = useState(10);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!showComments) return;
    setLoading(true);
    setLoadingProgress(10);
    const commentsRef = collection(db, "comments");
    const q = query(
      commentsRef,
      where("alertId", "==", alertId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedComments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedComments.push({
          id: doc.id,
          text: data.text,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(),
          createdBy: data.createdBy,
          createdByName: data.createdByName || "Anonymous"
        });
      });
      setComments(fetchedComments);
      setLoadingProgress(100);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [alertId, showComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !userData) {
      toast({
        title: "Error",
        description: "Please log in and enter a comment",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Add comment to Firestore
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
          <motion.form 
            onSubmit={handleSubmitComment} 
            className="flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Textarea
              placeholder={userData ? "Add a comment..." : "Please log in to comment"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-20"
              disabled={!userData}
            />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
              type="submit" 
              size="icon"
              disabled={!newComment.trim() || isSubmitting || !userData}
              className="self-end"
              >
              <Send className="h-4 w-4" />
              {isSubmitting && <span className="sr-only">Submitting...</span>}
              </Button>
            </motion.div>
          </motion.form>

          <div className="space-y-4 mt-4">
            {loading ? (
              <motion.div 
                className="space-y-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <div className="w-full">
                  <Progress value={loadingProgress} className="h-1 mb-2" />
                  <p className="text-xs text-muted-foreground">Loading comments...</p>
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3 p-3 border rounded-lg bg-gray-50">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </motion.div>
            ) : comments.length > 0 ? (
              <AnimatePresence>
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
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
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <motion.p 
                className="text-sm text-center text-muted-foreground py-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                No comments yet. Be the first to comment!
              </motion.p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AlertComments;
