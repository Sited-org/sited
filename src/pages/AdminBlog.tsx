import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost, BlogPost, BlogPostInsert } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Eye, Calendar, Clock, ExternalLink, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const emptyForm: BlogPostInsert = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  author_id: "",
  author_name: "",
  status: "draft",
  published_at: null,
  scheduled_at: null,
  tags: [],
  meta_title: "",
  meta_description: "",
  reading_time_minutes: 1,
};

export default function AdminBlog() {
  const { user, adminProfile } = useAuth();
  const { data: posts, isLoading } = useAdminBlogPosts();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogPostInsert>(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync editor content when dialog opens or form.content changes externally (e.g. image insert)
  const lastSyncedContent = useRef<string>("");
  const syncEditorContent = useCallback((content: string) => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
      lastSyncedContent.current = content;
    }
  }, []);

  // When dialog opens with content (edit mode), populate the editor
  useEffect(() => {
    if (dialogOpen) {
      // Small delay to ensure the DOM element is mounted
      setTimeout(() => syncEditorContent(form.content), 50);
    }
  }, [dialogOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastSyncedContent.current = html;
      setForm((p) => ({ ...p, content: html }));
    }
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      author_id: user?.id || "",
      author_name: adminProfile?.display_name || user?.email?.split("@")[0] || "Admin",
    });
    setTagInput("");
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      cover_image_url: post.cover_image_url || "",
      author_id: post.author_id,
      author_name: post.author_name,
      status: post.status,
      published_at: post.published_at,
      scheduled_at: post.scheduled_at,
      tags: post.tags || [],
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      reading_time_minutes: post.reading_time_minutes,
    });
    setTagInput("");
    setDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: editingId ? prev.slug : generateSlug(title),
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(path);
      setForm((prev) => ({ ...prev, cover_image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const insertImageInContent = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const ext = file.name.split(".").pop();
    const path = `inline/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(path);
      const imgTag = `<img src="${urlData.publicUrl}" alt="Blog image" class="rounded-xl my-4 max-w-full" />`;
      if (editorRef.current) {
        editorRef.current.innerHTML += imgTag;
        handleEditorInput();
      }
    }
    setImageUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };

    // Auto-set published_at when publishing
    if (payload.status === "published" && !payload.published_at) {
      payload.published_at = new Date().toISOString();
    }

    // Calculate reading time (~200 words per minute)
    const wordCount = payload.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    payload.reading_time_minutes = Math.max(1, Math.round(wordCount / 200));

    if (editingId) {
      await updatePost.mutateAsync({ id: editingId, ...payload });
    } else {
      await createPost.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "published": return "default";
      case "draft": return "secondary";
      case "scheduled": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground">Create and manage blog posts</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Post
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-muted-foreground">Loading posts...</div>
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {post.cover_image_url && (
                  <img src={post.cover_image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    <Badge variant={statusColor(post.status) as any} className="capitalize flex-shrink-0">
                      {post.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{post.excerpt || "No excerpt"}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{post.author_name}</span>
                    <span>·</span>
                    <span>{format(new Date(post.created_at), "dd MMM yyyy")}</span>
                    {post.status === "scheduled" && post.scheduled_at && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Scheduled: {format(new Date(post.scheduled_at), "dd MMM yyyy HH:mm")}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span>/{post.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {post.status === "published" && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    </a>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post</AlertDialogTitle>
                        <AlertDialogDescription>Delete "{post.title}"? This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePost.mutate(post.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-4">No blog posts yet</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Create Your First Post
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Post" : "New Blog Post"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Your blog post title" required />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label>URL Slug *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/blog/</span>
                <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="your-post-slug" required />
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea value={form.excerpt || ""} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} rows={2} placeholder="Brief summary for the feed..." />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Cover"}
                    </span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploading} />
                </label>
                {form.cover_image_url && (
                  <img src={form.cover_image_url} alt="Cover" className="h-12 w-20 object-cover rounded-lg" />
                )}
              </div>
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label>Content *</Label>
              {/* Formatting Toolbar */}
              <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-t-lg border border-b-0 border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("bold")} className="h-8 px-2 font-bold">B</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("italic")} className="h-8 px-2 italic">I</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("underline")} className="h-8 px-2 underline">U</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("strikeThrough")} className="h-8 px-2 line-through">S</Button>
                <div className="w-px bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("hiliteColor", "hsl(var(--gold))")} className="h-8 px-2">
                  <span className="bg-accent px-1 rounded text-xs">HL</span>
                </Button>
                <div className="w-px bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "h1")} className="h-8 px-2 text-xs font-bold">H1</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "h2")} className="h-8 px-2 text-xs font-bold">H2</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "h3")} className="h-8 px-2 text-xs font-bold">H3</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "p")} className="h-8 px-2 text-xs">P</Button>
                <div className="w-px bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("insertUnorderedList")} className="h-8 px-2 text-xs">• List</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("insertOrderedList")} className="h-8 px-2 text-xs">1. List</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "blockquote")} className="h-8 px-2 text-xs">" Quote</Button>
                <div className="w-px bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => {
                  const url = prompt("Enter link URL:");
                  if (url) execCommand("createLink", url);
                }} className="h-8 px-2 text-xs">🔗 Link</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("unlink")} className="h-8 px-2 text-xs">Unlink</Button>
                <div className="w-px bg-border mx-1" />
                <label className="cursor-pointer">
                  <Button type="button" variant="ghost" size="sm" asChild className="h-8 px-2">
                    <span className="text-xs">{imageUploading ? "..." : "📷 Image"}</span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={insertImageInContent} disabled={imageUploading} />
                </label>
                <div className="w-px bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("justifyLeft")} className="h-8 px-2 text-xs" title="Align Left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("justifyCenter")} className="h-8 px-2 text-xs" title="Align Center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("justifyRight")} className="h-8 px-2 text-xs" title="Align Right">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
                </Button>
                <div className="w-px bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("removeFormat")} className="h-8 px-2 text-xs">Clear</Button>
              </div>

              <div
                ref={editorRef}
                contentEditable
                dir="ltr"
                className="min-h-[300px] w-full rounded-b-lg border border-border bg-background p-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-auto text-left
                  [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline
                  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2
                  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2
                  [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2
                  [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2
                  [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3
                  [&_a]:text-sited-blue [&_a]:underline
                  [&_img]:rounded-xl [&_img]:my-3 [&_img]:max-w-full
                  [&_p]:my-1
                  [&_mark]:bg-accent/60 [&_mark]:px-1 [&_mark]:rounded
                "
                onInput={handleEditorInput}
                suppressContentEditableWarning
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add a tag..."
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Status & Scheduling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Publish Now</SelectItem>
                    <SelectItem value="scheduled">Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.status === "scheduled" && (
                <div className="space-y-2">
                  <Label>Schedule Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_at ? format(new Date(form.scheduled_at), "yyyy-MM-dd'T'HH:mm") : ""}
                    onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                  />
                </div>
              )}
            </div>

            {/* SEO */}
            <details className="border border-border rounded-lg p-4">
              <summary className="font-semibold cursor-pointer text-sm">SEO Settings</summary>
              <div className="space-y-3 mt-4">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input value={form.meta_title || ""} onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))} placeholder="Override page title for SEO" />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea value={form.meta_description || ""} onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))} rows={2} placeholder="Override page description for SEO" />
                </div>
              </div>
            </details>

            {/* Author */}
            <div className="space-y-2">
              <Label>Author Name</Label>
              <Input value={form.author_name} onChange={(e) => setForm((p) => ({ ...p, author_name: e.target.value }))} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
                {editingId ? "Update Post" : form.status === "published" ? "Publish" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
