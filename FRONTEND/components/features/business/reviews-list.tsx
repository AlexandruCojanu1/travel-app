"use client"

import { useState, useEffect } from "react"
import { Star, User as UserIcon } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { Textarea } from "@/components/shared/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { getBusinessReviews, createReview, type Review } from "@/actions/reviews"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ReviewsListProps {
    businessId: string
}

export function ReviewsList({ businessId }: ReviewsListProps) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)

    // New review state
    const [rating, setRating] = useState(0)
    const [content, setContent] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [hoveredStar, setHoveredStar] = useState(0)

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data }) => setUser(data.user))
        loadReviews()
    }, [businessId])

    async function loadReviews() {
        setLoading(true)
        try {
            const data = await getBusinessReviews(businessId)
            setReviews(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit() {
        if (!user) {
            toast.error("Trebuie să fii autentificat pentru a lăsa o recenzie")
            return
        }
        if (rating === 0) {
            toast.error("Te rugăm să selectezi o notă")
            return
        }

        setSubmitting(true)
        try {
            await createReview({
                business_id: businessId,
                user_id: user.id,
                rating,
                content
            })
            toast.success("Recenzia a fost adăugată!")
            setContent("")
            setRating(0)
            loadReviews()
        } catch (error: any) {
            console.error(error)
            if (error.code === '23505') {
                toast.error("Ai adăugat deja o recenzie pentru această locație")
            } else {
                toast.error("Nu s-a putut adăuga recenzia")
            }
        } finally {
            setSubmitting(false)
        }
    }

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
        : null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Recenzii ({reviews.length})</h3>
                {averageRating && (
                    <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-yellow-700">{averageRating}</span>
                    </div>
                )}
            </div>

            {/* Add Review Form */}
            {user && (
                <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">Adaugă o recenzie</h4>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(0)}
                                className="focus:outline-none"
                            >
                                <Star
                                    className={cn(
                                        "w-6 h-6 transition-colors",
                                        star <= (hoveredStar || rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <Textarea
                        placeholder="Cum a fost experiența ta?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="bg-white"
                    />
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={submitting || rating === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {submitting ? "Se trimite..." : "Postează"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10 border">
                                <AvatarImage src={review.user?.avatar_url} />
                                <AvatarFallback><UserIcon className="w-5 h-5 text-gray-400" /></AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <span className="font-medium text-sm">{review.user?.name}</span>
                                    <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString('ro-RO')}</span>
                                </div>
                                <div className="flex gap-0.5 mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn("w-3 h-3", i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200")}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {!loading && reviews.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                        Nu sunt încă recenzii. Fii primul care scrie una!
                    </div>
                )}
            </div>
        </div>
    )
}
