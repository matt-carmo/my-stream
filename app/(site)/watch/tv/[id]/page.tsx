import { notFound } from "next/navigation";
import Link from "next/link";
import { getTVDetails, getTVSeason, getImageUrl } from "@/lib/tmdb";
import { VideoPlayer } from "@/components/video-player";
import { TrackTVWatch } from "@/components/track-watch";
import { Badge, buttonVariants } from "@/components/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01FreeIcons,
  ArrowLeft01Icon,
  ArrowRight01FreeIcons,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { SeasonEpisodeLoader } from "@/components/season-episode-loader";
import { cn } from "@/lib/utils";
import Image from "next/image";

type WatchTVPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string; episode?: string }>;
};

export default async function WatchTVPage({
  params,
  searchParams,
}: WatchTVPageProps) {
  const { id } = await params;
  const { season, episode } = await searchParams;

  const tvId = Number(id);
  if (isNaN(tvId)) notFound();

  const tv = await getTVDetails(tvId).catch(() => null);
  if (!tv) notFound();

  const seasonNum = Number(season) || 1;
  const episodeNum = Number(episode) || 1;

  const seasonDetail = await getTVSeason(tvId, seasonNum).catch(() => null);
  if (!seasonDetail) notFound();

  const currentEpisode = seasonDetail?.episodes.find(
    (e) => e.episode_number === episodeNum,
  );
  if (!currentEpisode) notFound();

  const posterUrl = getImageUrl(tv.poster_path, "w342");
  const firstSeason = tv.seasons?.find((s) => s.season_number > 0);
  const validSeasons = (tv.seasons ?? [])
    .filter((s) => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number);

  const currentEpisodeIndex = seasonDetail.episodes.findIndex(
    (e) => e.episode_number === episodeNum,
  );

  let previousEpisodeHref: string | null = null;
  let nextEpisodeHref: string | null = null;
  let previousEpisodeMeta: {
    season: number;
    episode: number;
    name: string;
  } | null = null;
  let nextEpisodeMeta: {
    season: number;
    episode: number;
    name: string;
  } | null = null;

  if (currentEpisodeIndex > 0) {
    const prevEpisode = seasonDetail.episodes[currentEpisodeIndex - 1];
    previousEpisodeHref = `/watch/tv/${tvId}?season=${seasonNum}&episode=${prevEpisode.episode_number}`;
    previousEpisodeMeta = {
      season: seasonNum,
      episode: prevEpisode.episode_number,
      name: prevEpisode.name,
    };
  } else {
    const previousSeason = [...validSeasons]
      .reverse()
      .find((s) => s.season_number < seasonNum && s.episode_count > 0);

    if (previousSeason) {
      const previousSeasonDetail = await getTVSeason(
        tvId,
        previousSeason.season_number,
      ).catch(() => null);
      const previousSeasonEpisodes = previousSeasonDetail?.episodes ?? [];
      const previousSeasonLastEpisode =
        previousSeasonEpisodes.length > 0
          ? previousSeasonEpisodes[previousSeasonEpisodes.length - 1]
          : null;

      if (previousSeasonLastEpisode) {
        previousEpisodeHref = `/watch/tv/${tvId}?season=${previousSeason.season_number}&episode=${previousSeasonLastEpisode.episode_number}`;
        previousEpisodeMeta = {
          season: previousSeason.season_number,
          episode: previousSeasonLastEpisode.episode_number,
          name: previousSeasonLastEpisode.name,
        };
      }
    }
  }

  if (
    currentEpisodeIndex >= 0 &&
    currentEpisodeIndex < seasonDetail.episodes.length - 1
  ) {
    const nextEpisode = seasonDetail.episodes[currentEpisodeIndex + 1];
    nextEpisodeHref = `/watch/tv/${tvId}?season=${seasonNum}&episode=${nextEpisode.episode_number}`;
    nextEpisodeMeta = {
      season: seasonNum,
      episode: nextEpisode.episode_number,
      name: nextEpisode.name,
    };
  } else {
    const nextSeason = validSeasons.find(
      (s) => s.season_number > seasonNum && s.episode_count > 0,
    );

    if (nextSeason) {
      const nextSeasonDetail = await getTVSeason(
        tvId,
        nextSeason.season_number,
      ).catch(() => null);
      const nextSeasonFirstEpisode = nextSeasonDetail?.episodes?.[0];

      if (nextSeasonFirstEpisode) {
        nextEpisodeHref = `/watch/tv/${tvId}?season=${nextSeason.season_number}&episode=${nextSeasonFirstEpisode.episode_number}`;
        nextEpisodeMeta = {
          season: nextSeason.season_number,
          episode: nextSeasonFirstEpisode.episode_number,
          name: nextSeasonFirstEpisode.name,
        };
      }
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/tv/${tv.id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5",
          )}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={1.5}
            className="size-4"
          />
          Back
        </Link>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold truncate">{tv.name}</h1>
          {currentEpisode && (
            <span className="text-xs text-muted-foreground">
              S{seasonNum} E{episodeNum} — {currentEpisode.name}
            </span>
          )}
        </div>
      </div>

      <VideoPlayer
        type="tv"
        id={tvId}
        season={seasonNum}
        episode={episodeNum}
      />
      <TrackTVWatch
        id={tv.id}
        name={tv.name}
        poster_path={tv.poster_path}
        backdrop_path={tv.backdrop_path}
        season={seasonNum}
        episode={episodeNum}
        episodeName={currentEpisode?.name}
      />

      <div className="flex flex-wrap items-center gap-2">
        {previousEpisodeHref && (
          <Link
            href={previousEpisodeHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            aria-disabled={!previousEpisodeHref}
            tabIndex={previousEpisodeHref ? undefined : -1}
          >
            <HugeiconsIcon
              icon={ArrowLeft01FreeIcons}
              strokeWidth={1.5}
              className="size-4"
            />{" "}
            S{previousEpisodeMeta?.season}E{previousEpisodeMeta?.episode}
          </Link>
        )}
        {nextEpisodeHref && (
          <Link
            href={nextEpisodeHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            aria-disabled={!nextEpisodeHref}
            tabIndex={nextEpisodeHref ? undefined : -1}
          >
            S{nextEpisodeMeta?.season}E{nextEpisodeMeta?.episode}{" "}
            <HugeiconsIcon
              icon={ArrowRight01FreeIcons}
              strokeWidth={1.5}
              className="size-4"
            />
          </Link>
        )}
      </div>

      {currentEpisode && (
        <div className="flex gap-4 flex-col sm:flex-row">
          {posterUrl && (
            <div className="relative w-24 shrink-0">
              <Image
                src={posterUrl}
                alt={tv.name}
                width={96}
                height={144}
                className="w-full rounded-md"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">{tv.name}</h2>
            <p className="text-sm font-medium">
              S{seasonNum}E{episodeNum} — {currentEpisode.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {tv.genres?.map((g) => (
                <Badge key={g.id} variant="secondary" className="text-xs">
                  {g.name}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <HugeiconsIcon
                icon={StarIcon}
                className="size-4 text-yellow-500"
                strokeWidth={1.5}
              />
              <span className="font-semibold">
                {currentEpisode.vote_average.toFixed(1)}
              </span>
              {currentEpisode.runtime && (
                <span className="text-muted-foreground ml-2">
                  {currentEpisode.runtime} min
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {currentEpisode.overview || tv.overview}
            </p>
          </div>
        </div>
      )}

      {tv.seasons && tv.seasons.length > 0 && (
        <div className="border-t border-border pt-6">
          <SeasonEpisodeLoader
            tvId={tvId}
            seasons={tv.seasons}
            initialSeasonNumber={seasonNum || firstSeason?.season_number || 1}
            initialEpisodes={seasonDetail?.episodes ?? []}
          />
        </div>
      )}
    </main>
  );
}
