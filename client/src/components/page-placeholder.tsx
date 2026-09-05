import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader title={title} />
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {description}
        </CardContent>
      </Card>
    </div>
  );
}