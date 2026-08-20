const TUTORIAL_VIDEO_ID = '2xUmseaj7XQ'

export const TUTORIAL_EMBED_URL = `https://www.youtube-nocookie.com/embed/${TUTORIAL_VIDEO_ID}?rel=0&modestbranding=1`

export function TutorialVideoFrame() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video">
      <iframe
        src={TUTORIAL_EMBED_URL}
        title="Tutorial de uso da Plural Plataforma"
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}
