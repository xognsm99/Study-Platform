import PlayClient from "./PlayClient";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ seed?: string }>;
};

export default async function PlayHomePage({ searchParams }: Props) {
  const params = await searchParams;
  const seed = params.seed;

  return <PlayClient key={seed ?? "today"} seed={seed} />;
}