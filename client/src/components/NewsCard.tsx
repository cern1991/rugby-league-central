import { NewsItem } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Clock, ArrowRight } from "lucide-react";

interface NewsCardProps {
  news: NewsItem;
  featured?: boolean;
}

export function NewsCard({ news, featured = false }: NewsCardProps) {
  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card hover:bg-card/80 transition-colors cursor-pointer",
      featured ? "md:col-span-2 md:flex-row" : ""
    )}>
      <div className={cn("relative overflow-hidden", featured ? "md:w-2/5 h-48 md:h-auto" : "h-48 w-full")}>
        <img 
          src={news.imageUrl} 
          alt={news.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
        <div className="absolute top-2 left-2">
            <span className="px-2 py-1 rounded-md bg-background/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                {news.category}
            </span>
        </div>
      </div>
      
      <div className="flex flex-col justify-between p-5 space-y-4 flex-1">
        <div className="space-y-2">
          <div className="hidden md:block">
             {featured && (
                <span className="px-2 py-1 rounded-md bg-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary mb-2 inline-block">
                    {news.category}
                </span>
             )}
          </div>
          <h3 className={cn("font-display font-bold leading-tight group-hover:text-primary transition-colors", featured ? "text-3xl" : "text-xl")}>
            {news.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {news.summary}
          </p>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{news.timestamp}</span>
          </div>
          <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1 text-foreground font-medium">
            Read More <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
