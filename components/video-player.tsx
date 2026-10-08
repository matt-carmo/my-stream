"use client"

type VideoPlayerProps =
  | { type: "movie"; id: number; season?: never; episode?: never }
  | { type: "tv"; id: number; season: number; episode: number }

export function VideoPlayer({ type, id, season, episode }: VideoPlayerProps) {
  let src: string

  // if (type === "movie") {
  //   src = `https://vidlink.pro/movie/${id}`
  // } else {
  //   src = `https://vidlink.pro/tv/${id}/${season}/${episode}`
  // }
  if (type === "movie") {
    src = `https://vsembed.ru//embed/movie/${id}`
  } else {
    src = `https://vsembed.ru//embed/tv/${id}/${season}/${episode}`
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ paddingBottom: "56.25%" }}>
      {/* No referrer hides this site's domain from the third-party player. It can't
          be sandboxed: vsembed refuses to play inside <iframe sandbox>. */}
      <iframe
        src={src}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        referrerPolicy="no-referrer"
        title="Video Player"
      />
    </div>
  )
}
