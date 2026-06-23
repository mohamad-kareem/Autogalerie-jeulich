"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

export default function AdvertisementVideo() {
  const videoRef = useRef(null);
  const isRestartingRef = useRef(false);

  const { ref, inView } = useInView({
    threshold: 0.45,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const playVideo = useCallback(async () => {
    const video = videoRef.current;

    if (!video) return false;

    try {
      await video.play();
      setIsPlaying(true);
      return true;
    } catch (error) {
      console.error("Video playback failed:", error);
      setIsPlaying(false);
      return false;
    }
  }, []);

  const restartVideo = useCallback(async () => {
    const video = videoRef.current;

    if (!video || isRestartingRef.current) return;

    isRestartingRef.current = true;

    try {
      video.pause();
      video.currentTime = 0;

      await video.play();

      setIsPlaying(true);
    } catch (error) {
      console.error("Video restart failed:", error);
      setIsPlaying(false);
    } finally {
      window.setTimeout(() => {
        isRestartingRef.current = false;
      }, 300);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleViewportPlayback = async () => {
      if (!inView) {
        video.pause();
        setIsPlaying(false);
        return;
      }

      /*
       * First try playing with sound.
       * Most browsers block automatic playback with sound.
       */
      video.muted = false;
      setIsMuted(false);

      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        /*
         * Fall back to muted autoplay if sound autoplay
         * is blocked by the browser.
         */
        video.muted = true;
        setIsMuted(true);

        try {
          await video.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Video autoplay failed:", error);
          setIsPlaying(false);
        }
      }
    };

    handleViewportPlayback();
  }, [inView]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;

    if (
      !video ||
      isRestartingRef.current ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    ) {
      return;
    }

    const remainingTime = video.duration - video.currentTime;

    /*
     * Restart shortly before the last frame.
     * This prevents the final black frame from remaining visible.
     */
    if (remainingTime <= 0.15) {
      restartVideo();
    }
  }, [restartVideo]);

  const togglePlayback = async () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused) {
      await playVideo();
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleSound = async () => {
    const video = videoRef.current;

    if (!video) return;

    const nextMutedState = !video.muted;

    video.muted = nextMutedState;
    setIsMuted(nextMutedState);

    if (video.paused) {
      await playVideo();
    }
  };

  return (
    <section className="w-full bg-[#f5f5f2] py-8 sm:py-12 lg:py-14">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 25 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: 0.7,
          ease: "easeOut",
        }}
        className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8"
      >
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-xl shadow-black/20 sm:rounded-[24px]">
          <video
            ref={videoRef}
            className="block aspect-video h-auto w-full bg-black object-cover"
            playsInline
            preload="auto"
            muted={isMuted}
            loop
            onTimeUpdate={handleTimeUpdate}
            onEnded={restartVideo}
            onPlay={() => setIsPlaying(true)}
            onPause={() => {
              if (!isRestartingRef.current) {
                setIsPlaying(false);
              }
            }}
            onLoadedMetadata={(event) => {
              event.currentTarget.currentTime = 0;
            }}
            onError={(event) => {
              console.error("Video loading error:", {
                code: event.currentTarget.error?.code,
                message: event.currentTarget.error?.message,
                source: event.currentTarget.currentSrc,
              });
            }}
          >
            <source src="/video2.mp4" type="video/mp4" />
            Ihr Browser unterstützt dieses Video nicht.
          </video>

          {/* Bottom gradient */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          {/* Watermark cover */}
          <div className="absolute bottom-0 left-0 z-20">
            <div className="relative min-w-[190px] overflow-hidden rounded-tr-2xl bg-black px-4 py-3 shadow-lg sm:min-w-[220px] sm:px-5 sm:py-4">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-[#07140b] to-[#0f5724]/90" />

              <div className="relative">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/60 sm:text-[10px]">
                  Autogalerie
                </p>

                <p className="text-sm font-black leading-none text-white sm:text-base">
                  Jülich
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 sm:bottom-4 sm:right-4">
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={isPlaying ? "Video pausieren" : "Video abspielen"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-md backdrop-blur-md transition hover:scale-105 hover:bg-[#146c2e] sm:h-11 sm:w-11"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleSound}
              aria-label={isMuted ? "Ton einschalten" : "Ton ausschalten"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-md backdrop-blur-md transition hover:scale-105 hover:bg-[#146c2e] sm:h-11 sm:w-11"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
