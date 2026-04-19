import { Star, ThumbsUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getReviewsApi } from "@/lib/admin-api";

const Stars = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-4 h-4 ${s <= count ? "text-accent fill-accent" : "text-muted"}`} />
    ))}
  </div>
);

const AdminReviews = () => {
  const { token } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: () => getReviewsApi(token ?? ""),
    enabled: !!token,
  });

  const reviews = data?.reviews ?? [];
  const avgRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Reviews</h1>
        <p className="text-muted-foreground">Moderate product ratings and buyer feedback</p>
      </div>

      <div className="stat-card">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="text-center">
            <p className="text-5xl font-bold font-display">{avgRating.toFixed(1)}</p>
            <Stars count={Math.round(avgRating)} />
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
              <div className="flex items-center gap-2">
                <Stars count={review.rating} />
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${review.status === "approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{review.status}</span>
              </div>
            </div>
            <p className="text-sm mt-3 text-muted-foreground">{review.comment}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">{review.date}</span>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"><ThumbsUp className="w-3 h-3" /> {review.helpful} helpful</button>
            </div>
          </div>
        ))}
        {!isLoading && reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews found.</p>}
      </div>
    </div>
  );
};

export default AdminReviews;
