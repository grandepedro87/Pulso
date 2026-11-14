import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Heart, LineChart, MessageCircle, SquarePlus, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { SPORT_LIST } from "@/lib/sports";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-athletes.jpg";
import community from "@/assets/community-run.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulso — Treine, compartilhe e evolua em comunidade" },
      { name: "description", content: "A comunidade esportiva para registrar treinos, compartilhar atividades e acompanhar sua evolução ao lado de outros praticantes." },
      { property: "og:title", content: "Pulso — Comunidade esportiva" },
      { property: "og:description", content: "Registre treinos, compartilhe atividades e evolua junto com outros atletas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const benefits = [
  { icon: Users, title: "Feed da comunidade", text: "Veja o que outros atletas estão treinando, curta e comente." },
  { icon: SquarePlus, title: "Registro sob medida", text: "Campos que se adaptam à modalidade: distância, séries, repetições." },
  { icon: LineChart, title: "Evolução visível", text: "Histórico e resumo semanal para acompanhar seu progresso." },
  { icon: Heart, title: "Motivação real", text: "Siga quem te inspira e receba apoio a cada treino." },
];

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate({ to: "/inicio", replace: true }); }, [user, navigate]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button>
            <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Criar conta</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[92vh] items-end pb-20 pt-32">
        <img src={hero} alt="Atletas treinando à noite" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-fade-left" />
        <div className="absolute inset-0 bg-fade-bottom" />
        <div className="relative mx-auto w-full max-w-6xl px-5">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent/70 px-3 py-1 text-xs font-semibold text-accent-foreground backdrop-blur">
              <span className="size-1.5 animate-pulse-ring rounded-full bg-primary" /> Comunidade esportiva
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-6xl">
              Treine. Compartilhe.<br /><span className="text-gradient-lime">Evolua junto.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Registre suas atividades, acompanhe sua evolução e conecte-se com quem pratica esporte como você.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl"><Link to="/auth" search={{ mode: "signup" }}>Começar agora <ArrowRight /></Link></Button>
              <Button asChild variant="glass" size="xl"><Link to="/auth">Já tenho conta</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card py-5">
        <div className="flex w-max animate-marquee gap-10">
          {[...SPORT_LIST, ...SPORT_LIST].map((s, i) => (
            <span key={i} className="flex items-center gap-2.5 font-display text-sm font-semibold text-muted-foreground">
              <s.icon className="size-5 text-primary" /> {s.label}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="max-w-xl text-3xl font-bold sm:text-4xl">Tudo que você precisa para manter o ritmo</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-gradient-card p-6 transition hover:border-primary/40">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><b.icon className="size-5" /></span>
              <h3 className="mt-5 text-base font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 lg:grid-cols-2">
        <img src={community} alt="Amigos comemorando após uma corrida" width={1200} height={912} loading="lazy" className="rounded-3xl border border-border object-cover" />
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">A comunidade no centro</h2>
          <p className="mt-4 text-muted-foreground">Cada treino vira uma conversa. Publique sua corrida, seu treino de força ou a pelada do fim de semana e receba o apoio de quem entende.</p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-3"><Heart className="size-4 text-primary" /> Curtidas e comentários em cada atividade</li>
            <li className="flex items-center gap-3"><Users className="size-4 text-primary" /> Siga atletas de várias modalidades</li>
            <li className="flex items-center gap-3"><MessageCircle className="size-4 text-primary" /> Troque dicas e motivação</li>
          </ul>
          <Button asChild variant="hero" size="lg" className="mt-8"><Link to="/auth" search={{ mode: "signup" }}>Entrar para a comunidade</Link></Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-muted-foreground">
          <Logo />
          <span>© {new Date().getFullYear()} Pulso. Feito para quem se move.</span>
        </div>
      </footer>
    </div>
  );
}
