import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StepCardProps {
  step: number;
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  children: React.ReactNode;
}

export function StepCard({
  step,
  title,
  description,
  isActive,
  isCompleted,
  children,
}: StepCardProps) {
  return (
    <Card
      className={`p-6 transition-all ${
        isActive ? "border-primary shadow-md" : isCompleted ? "opacity-75" : ""
      }`}
      data-testid={`card-step-${step}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge
              variant={isCompleted ? "default" : isActive ? "outline" : "secondary"}
              data-testid={`badge-step-${step}`}
            >
              Step {step}
            </Badge>
            <h2 className="text-lg font-semibold" data-testid={`title-step-${step}`}>
              {title}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground" data-testid={`desc-step-${step}`}>
            {description}
          </p>
        </div>
      </div>
      <div className={isActive || isCompleted ? "block" : "hidden"}>
        {children}
      </div>
    </Card>
  );
}
