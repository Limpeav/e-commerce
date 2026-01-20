import React from 'react';
import { Star } from 'lucide-react';

const ReviewList = ({ reviews }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-black text-text-main font-display tracking-tight">Latest Entries</h2>
        {reviews && reviews.length > 0 &&
          <span className="text-[10px] font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">Verified History</span>
        }
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="grid gap-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-stone-50 border border-stone-100 rounded-[1.25rem] flex items-center justify-center text-primary font-black text-xl">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-text-main text-lg font-display tracking-tight">{review.name}</div>
                    <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-secondary/5 px-4 py-1.5 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                  <span className="text-xs font-black text-secondary">{review.rating}</span>
                </div>
              </div>
              <div className="bg-stone-50/50 p-6 rounded-3xl border border-stone-100/50">
                <p className="text-text-muted leading-relaxed font-bold italic">"{review.comment}"</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] p-20 text-center border-2 border-dashed border-stone-100">
          <div className="text-stone-100 mb-8">
            <Star className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-text-main font-black text-2xl font-display mb-3 tracking-tight">Blank Canvas</p>
          <p className="text-text-muted font-bold text-lg">Be the pioneer to review this masterpiece.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
