import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Toast, ToastDescription, ToastTitle } from "@/components/ui/toast";
import { CodeBlock } from "@/components/susu/CodeBlock";
import { ReceiptCard } from "@/components/susu/ReceiptCard";
import { Banner } from "@/components/susu/Banner";
import { FieldError } from "@/components/susu/FieldError";
import { MemberAvatar } from "@/components/susu/MemberAvatar";
import { CurveVisualizer } from "@/components/susu/CurveVisualizer";
import { RotationCard } from "@/components/susu/RotationCard";

/**
 * Dev component preview — renders every Story 7.4 primitive in both skins.
 *
 * Gated behind `NEXT_PUBLIC_DEV_PAGES=true`. When unset/false the route
 * 404s so production builds never expose internal scaffolding (UX-DR24 AC5).
 *
 * The page renders two `data-skin` regions inline so reviewers can eyeball
 * cross-skin token coverage without toggling the global skin selector.
 */
function DevSection({ skin, title }: { skin: "neutral" | "diaspora"; title: string }) {
  return (
    <section
      data-skin={skin}
      className="rounded-xl border border-border bg-bg p-6 shadow-1"
      aria-label={`${title} preview`}
    >
      <h2 className="mb-4 text-h3 font-semibold text-text">{title}</h2>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="link">Link</Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button size="sm">sm</Button>
        <Button size="md">md</Button>
        <Button size="lg">lg</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Card description in muted token colour.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${skin}-input`}>Email</Label>
            <Input id={`${skin}-input`} placeholder="you@susu.dev" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${skin}-textarea`}>Message</Label>
            <Textarea id={`${skin}-textarea`} placeholder="Your message" />
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge>default</Badge>
        <Badge variant="signal">signal</Badge>
        <Badge variant="warn">warn</Badge>
        <Badge variant="danger">danger</Badge>
        <Badge variant="outline">outline</Badge>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch id={`${skin}-switch`} />
          <Label htmlFor={`${skin}-switch`}>Switch</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id={`${skin}-check`} />
          <Label htmlFor={`${skin}-check`}>Checkbox</Label>
        </div>
        <RadioGroup defaultValue="a">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="a" id={`${skin}-radio-a`} />
            <Label htmlFor={`${skin}-radio-a`}>Option A</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="b" id={`${skin}-radio-b`} />
            <Label htmlFor={`${skin}-radio-b`}>Option B</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Avatar>
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
        <Progress value={42} className="max-w-xs" />
      </div>

      <Separator className="my-4" />

      <Skeleton className="mb-2 h-4 w-2/3" />
      <Skeleton className="mb-6 h-4 w-1/3" />

      <Toast variant="signal">
        <div>
          <ToastTitle>Toast title</ToastTitle>
          <ToastDescription>Token-driven status surface.</ToastDescription>
        </div>
      </Toast>

      <Separator className="my-4" />

      <h3 className="mb-3 text-h3 font-semibold text-text">Susu components</h3>

      <div className="mb-4">
        <CodeBlock
          filename="example.ts"
          language="typescript"
          code={`import { ReceiptCard } from "@/components/susu/ReceiptCard";\n\nexport const receipt = <ReceiptCard signature="..." />;`}
        />
      </div>

      <div className="mb-4">
        <ReceiptCard
          signature="5x9k2vYj4Q...preview"
          amount="100.00 USDC"
          timestamp="2026-05-09T12:00:00Z"
          status="confirmed"
        />
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <Banner variant="info">Devnet preview — balances are simulated.</Banner>
        <Banner variant="warn">RPC fallback in use; performance may be degraded.</Banner>
        <Banner variant="danger" dismissible onDismiss={() => {}}>
          Audit pending — production use is restricted.
        </Banner>
        <Banner variant="success">Transaction confirmed.</Banner>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <Label htmlFor={`${skin}-amount`}>Amount</Label>
        <Input id={`${skin}-amount`} aria-describedby={`${skin}-amount-error`} />
        <FieldError id={`${skin}-amount-error`}>Amount must be positive.</FieldError>
      </div>

      <Separator className="my-4" />

      <h3 className="mb-3 text-h3 font-semibold text-text">Story 7.11 — Rotation surfaces</h3>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MemberAvatar pubkey="9xQeWvG816bUx9EPjHmaT23z5e35aPm" size="sm" />
        <MemberAvatar pubkey="DRiP7Bx3w7t1G1zHkGz5PqkV3wMmRn" size="md" />
        <MemberAvatar
          pubkey="So11111111111111111111111111111111111111112"
          size="lg"
          highlighted
        />
      </div>

      <div className="mb-4">
        <CurveVisualizer n={8} contribution={100} highlight={[2]} locale="en" size="md" />
      </div>

      <div className="mb-4">
        <RotationCard
          locale="en"
          rotation={{
            i: 3,
            n: 8,
            recipient: "DRiP7Bx3w7t1G1zHkGz5PqkV3wMmRn",
            state: "active",
            contributionsReceived: 5,
            contributionsRequired: 8,
            claimDeadlineUnix: 1_762_988_400,
          }}
        />
      </div>
    </section>
  );
}

export default function DevComponentsPage() {
  // NEXT_PUBLIC_DEV_PAGES gates this preview surface (UX-DR24 AC5). When the
  // flag is unset/false the route 404s so production builds never expose
  // internal scaffolding. The env value is parsed by `lib/env.ts` (the
  // single `process.env` reader allowed by `scripts/check-patterns.sh`).
  if (!env.NEXT_PUBLIC_DEV_PAGES) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 py-12 md:p-8 md:py-16">
      <header>
        {/* Story 7.17: drop `text-h1` (40px) to `text-h2` (32px) at 360px to
            stay within the mobile floor; restore at md+. */}
        <h1 className="text-h2 font-bold tracking-tight text-text md:text-h1">Component preview</h1>
        <p className="text-body text-muted">
          Story 7.4 — every shadcn primitive rendered against both skin tokens.
        </p>
      </header>
      {/* Story 7.17: stack columns vertically below md (single column),
          two-up at lg+. */}
      <div className="grid gap-8 lg:grid-cols-2">
        <DevSection skin="neutral" title="Fintech skin" />
        <DevSection skin="diaspora" title="Community skin" />
      </div>
    </main>
  );
}
