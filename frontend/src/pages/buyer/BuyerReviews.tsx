import { Star, MessageSquare, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBuyerReviewApi, getBuyerReviewsApi, markBuyerReviewHelpfulApi } from "@/lib/buyer-api";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EMPTY_REVIEW_FORM = {
  product: "",
  rating: "5",
  comment: "",
};

const Stars = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-4 h-4 ${s <= count ? "text-accent fill-accent" : "text-muted"}`} />
    ))}
  </div>
);

const BuyerReviews = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_REVIEW_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["buyer-reviews"],
    queryFn: () => getBuyerReviewsApi(token ?? ""),
    enabled: !!token,
  });

  const reviews = data?.reviews ?? [];
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Authentication required.");
      return createBuyerReviewApi(token, {
        product: form.product.trim(),
        rating: Number(form.rating),
        comment: form.comment.trim(),
      });
    },
    onSuccess: () => {
      toast.success("Review submitted successfully.");
      setIsWriteOpen(false);
      setForm(EMPTY_REVIEW_FORM);
      void queryClient.invalidateQueries({ queryKey: ["buyer-reviews"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to submit review.";
      toast.error(message);
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!token) throw new Error("Authentication required.");
      return markBuyerReviewHelpfulApi(token, reviewId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["buyer-reviews"] });
    },
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Reviews</h1>
          <p className="text-muted-foreground">Product ratings and your feedback</p>
        </div>
        <Button className="gap-2" onClick={() => setIsWriteOpen(true)}><MessageSquare className="w-4 h-4" /> Write Review</Button>
      </div>

      <div className="stat-card">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="text-center">
            <p className="text-5xl font-bold font-display">{averageRating.toFixed(1)}</p>
            <Stars count={Math.round(averageRating)} />
            <p className="text-sm text-muted-foreground mt-1">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = (count / reviews.length) * 100;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs w-3">{star}</span>
                  <Star className="w-3 h-3 text-accent fill-accent" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="stat-card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{review.buyer.charAt(0)}</div>
                <div><p className="text-sm font-semibold">{review.buyer}</p><p className="text-xs text-muted-foreground">{review.product}</p></div>
              </div>
              <Stars count={review.rating} />
            </div>
            <p className="text-sm mt-3 text-muted-foreground">{review.comment}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">{review.date}</span>
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => helpfulMutation.mutate(review.id)}
                disabled={helpfulMutation.isPending}
              >
                <ThumbsUp className="w-3 h-3" /> {review.helpful} helpful
              </button>
            </div>
          </div>
        ))}
        {isLoading && <p className="text-sm text-muted-foreground">Loading reviews...</p>}
        {!isLoading && reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
      </div>

      <Dialog open={isWriteOpen} onOpenChange={setIsWriteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write Review</DialogTitle>
            <DialogDescription>Share your feedback for a product.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review-product">Product</Label>
              <Input id="review-product" value={form.product} onChange={(e) => setForm((prev) => ({ ...prev, product: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-rating">Rating (1-5)</Label>
              <Input id="review-rating" type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-comment">Comment</Label>
              <Input id="review-comment" value={form.comment} onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsWriteOpen(false)} disabled={createReviewMutation.isPending}>Cancel</Button>
              <Button type="button" onClick={() => createReviewMutation.mutate()} disabled={createReviewMutation.isPending}>{createReviewMutation.isPending ? "Submitting..." : "Submit"}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerReviews;
