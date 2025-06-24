import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Thread {
  id: string;
  title: string;
  pinned: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

interface Comment {
  id: string;
  threadId: string;
  text: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

interface DiscussionForumProps {
  moduleId: string;
}

const DiscussionForum: React.FC<DiscussionForumProps> = ({ moduleId }) => {
  const { userData } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newComment, setNewComment] = useState("");

  // Fetch threads in real-time
  useEffect(() => {
    const q = query(
      collection(db, "modules", moduleId, "threads"),
      orderBy("pinned", "desc"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setThreads(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Thread[]
      );
    });
    return () => unsub();
  }, [moduleId]);

  // Fetch comments for active thread
  useEffect(() => {
    if (!activeThread) return setComments([]);
    const q = query(
      collection(db, "modules", moduleId, "threads", activeThread, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setComments(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Comment[]
      );
    });
    return () => unsub();
  }, [moduleId, activeThread]);

  // Create a new thread
  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !userData) return;
    await addDoc(collection(db, "modules", moduleId, "threads"), {
      title: newThreadTitle,
      pinned: false,
      createdBy: userData.uid,
      createdByName: userData.displayName,
      createdAt: new Date(),
    });
    setNewThreadTitle("");
  };

  // Add a comment to a thread
  const handleAddComment = async () => {
    if (!newComment.trim() || !userData || !activeThread) return;
    await addDoc(collection(db, "modules", moduleId, "threads", activeThread, "comments"), {
      text: newComment,
      createdBy: userData.uid,
      createdByName: userData.displayName,
      createdAt: new Date(),
    });
    setNewComment("");
  };

  // Pin/unpin a thread
  const handlePinThread = async (threadId: string, pinned: boolean) => {
    await updateDoc(doc(db, "modules", moduleId, "threads", threadId), { pinned: !pinned });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Discussion Forum</h2>
      <div className="mb-6">
        <Input
          placeholder="Start a new thread..."
          value={newThreadTitle}
          onChange={(e) => setNewThreadTitle(e.target.value)}
          className="mb-2"
        />
        <Button onClick={handleCreateThread} disabled={!newThreadTitle.trim()}>
          Create Thread
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Threads</h3>
          <ul className="space-y-2">
            {threads.map((thread) => (
              <li
                key={thread.id}
                className={`p-3 rounded border cursor-pointer ${activeThread === thread.id ? "bg-indigo-50" : "bg-white"}`}
                onClick={() => setActiveThread(thread.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{thread.title}</span>
                  <Button
                    size="sm"
                    variant={thread.pinned ? "secondary" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePinThread(thread.id, thread.pinned);
                    }}
                  >
                    {thread.pinned ? "Unpin" : "Pin"}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  by {thread.createdByName} • {thread.createdAt.toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Comments</h3>
          {activeThread ? (
            <>
              <ul className="space-y-2 mb-4">
                {comments.map((comment) => (
                  <li key={comment.id} className="p-2 rounded border bg-white">
                    <div className="text-sm">{comment.text}</div>
                    <div className="text-xs text-muted-foreground">
                      by {comment.createdByName} • {comment.createdAt.toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="mb-2"
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Post Comment
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">Select a thread to view or add comments.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionForum;
