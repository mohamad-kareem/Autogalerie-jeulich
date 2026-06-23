"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Pause, Play, Volume2, VolumeX, Car } from "lucide-react";

export default function AdvertisementVideo() {
  const videoRef = useRef(null);

  const { ref, inView } = useInView({
    threshold: 0.45,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const startVideo = async () => {
      if (!inView) {
        video.pause();
        setIsPlaying(false);
        return;
      }

      try {
        // Try to start with sound
        video.muted = false;
        setIsMuted(false);

        await video.play();
        setIsPlaying(true);
      } catch (error) {
        // Browser blocked autoplay with sound
        try {
          video.muted = true;
          setIsMuted(true);

          await video.play();
          setIsPlaying(true);
        } catch (playError) {
          console.error("Video autoplay failed:", playError);
          setIsPlaying(false);
        }
      }
    };

    startVideo();
  }, [inView]);

  const togglePlayback = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Video playback failed:", error);
    }
  };

  const toggleSound = async () => {
    const video = videoRef.current;

    if (!video) return;

    const nextMutedState = !video.muted;

    video.muted = nextMutedState;
    setIsMuted(nextMutedState);

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Video playback failed:", error);
      }
    }
  };

  const restartVideo = async () => {
    const video = videoRef.current;

    if (!video) return;

    video.currentTime = 0;

    try {
      await video.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Video restart failed:", error);
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
        className="mx-auto w-full max-w-[1180px] px-4  sm:px-6 lg:px-8"
      >
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-xl shadow-black/20 sm:rounded-[24px]">
          <video
            ref={videoRef}
            className="block aspect-video h-auto w-full object-cover"
            playsInline
            preload="auto"
            muted={isMuted}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={restartVideo}
          >
            <source src="/video1.mp4" type="video/mp4" />
            Ihr Browser unterstützt dieses Video nicht.
          </video>

          {/* Soft bottom gradient */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          {/* Covers the watermark at the bottom-left */}
          <div className="absolute bottom-0 left-0 z-20">
            <div className="relative min-w-[190px] overflow-hidden rounded-tr-2xl bg-black px-4 py-3 shadow-lg sm:min-w-[220px] sm:px-5 sm:py-4">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-[#07140b] to-[#0f5724]/90" />

              <div className="relative flex items-center gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/60 sm:text-[10px]">
                    Autogalerie
                  </p>

                  <p className="text-sm font-black leading-none text-white sm:text-base">
                    Jülich
                  </p>
                </div>
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
