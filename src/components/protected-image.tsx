"use client";

/* This wrapper requires a native image element for drag/context protection. */
/* eslint-disable @next/next/no-img-element */

import type { ImgHTMLAttributes, SyntheticEvent } from "react";
import styles from "./protected-image.module.css";

type ProtectedImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "draggable" | "onContextMenu" | "onDragStart"
> & {
  containerClassName?: string;
  imageClassName?: string;
  fill?: boolean;
  watermarkText?: string;
};

function preventArtworkAction(event: SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export default function ProtectedImage({
  containerClassName = "",
  imageClassName = "",
  fill = false,
  watermarkText = "NEXORA · KARYA PEMENANG",
  alt,
  ...imageProps
}: ProtectedImageProps) {
  return (
    <span
      className={`${styles.container} ${fill ? styles.fill : ""} ${containerClassName}`.trim()}
      data-protected-artwork="true"
      onContextMenu={preventArtworkAction}
      onDragStart={preventArtworkAction}
      onCopy={preventArtworkAction}
      aria-label={`${alt ?? "Karya"}. Gambar diberi watermark dan pembatas interaksi biasa.`}
    >
      <img
        {...imageProps}
        alt={alt ?? "Karya Nexora"}
        className={`${styles.image} ${imageClassName}`.trim()}
        draggable={false}
        onContextMenu={preventArtworkAction}
        onDragStart={preventArtworkAction}
        referrerPolicy="no-referrer"
      />
      <span className={styles.protectionLayer} aria-hidden="true">
        <span className={styles.watermark}>{watermarkText}</span>
        <span className={styles.badge}>KARYA DILINDUNGI</span>
      </span>
    </span>
  );
}
