"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const VITAMIN_INTERVAL_SECONDS = 0.4;
const VITAMINS = [
  { name: "Vitamina B5", benefit: "Auxilia no metabolismo energético." },
  {
    name: "Vitamina B6",
    benefit: "Auxilia no metabolismo energético e no funcionamento do sistema imune.",
  },
  {
    name: "Vitamina B9",
    benefit: "Auxilia no funcionamento do sistema imune e no processo de divisão celular.",
  },
  {
    name: "Vitamina C",
    benefit: "Auxilia no funcionamento do sistema imune, na formação do colágeno e na absorção de ferro.",
  },
];

const subscribeToClient = () => () => {};
const subscribeToReducedMotion = (callback: () => void) => {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;

export default function AcquaScrollExperience() {
  // Keep extensions from modifying the video before React hydrates this section.
  const isHydrated = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    () => false
  );

  return (
    <section
      id="acqua"
      aria-labelledby="acqua-story-title"
      className="acqua-story"
    >
      <div className="acqua-story__viewport">
        {isHydrated ? (
          <video
            poster="/images/acqua-poster-definitiva.jpg"
            autoPlay={!prefersReducedMotion}
            loop
            muted
            playsInline
            preload={prefersReducedMotion ? "none" : "metadata"}
            aria-hidden="true"
            className="acqua-story__video"
          >
            <source src="/videos/acqua-animacao-definitiva.mp4" type="video/mp4" />
          </video>
        ) : (
          <Image
            src="/images/acqua-poster-definitiva.jpg"
            alt=""
            width={1280}
            height={720}
            unoptimized
            preload
            aria-hidden="true"
            className="acqua-story__video"
          />
        )}
        <div className="acqua-story__shade" aria-hidden="true" />

        <div className="acqua-story__benefits" aria-hidden="true">
          {VITAMINS.map((vitamin, index) => (
            <div
              key={vitamin.name}
              className="acqua-story__benefit"
              style={{ animationDelay: index * VITAMIN_INTERVAL_SECONDS + "s" }}
            >
              <p className="acqua-story__vitamin">{vitamin.name}</p>
              <p className="acqua-story__description">{vitamin.benefit}</p>
            </div>
          ))}
        </div>

        <div className="sr-only">
          <h1 id="acqua-story-title">Acqua Naturabem · sabor limão</h1>
          <ul>
            {VITAMINS.map((vitamin) => (
              <li key={vitamin.name}>
                {vitamin.name}: {vitamin.benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
