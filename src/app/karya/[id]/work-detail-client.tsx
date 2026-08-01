"use client";

/* Dynamic Supabase images preserve their original proportions. */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NexoraLogoMark from "@/components/nexora-logo-mark";
import ProtectedImage from "@/components/protected-image";
import type { GalleryWork } from "@/lib/gallery";
import { getWhatsAppUrl } from "@/lib/gallery";
import styles from "./detail.module.css";

type ShareState = "idle" | "copied" | "error";

type WorkDetailClientProps = {
  work: GalleryWork;
  relatedWorks: GalleryWork[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function WorkDetailClient({
  work,
  relatedWorks,
}: WorkDetailClientProps) {
  const router = useRouter();
  const [shareState, setShareState] = useState<ShareState>("idle");
  const shareResetTimerRef = useRef<number | null>(null);

  const whatsappUrl = useMemo(
    () => getWhatsAppUrl(work.creator_whatsapp, work.title),
    [work.creator_whatsapp, work.title],
  );

  useEffect(
    () => () => {
      if (shareResetTimerRef.current !== null) {
        window.clearTimeout(shareResetTimerRef.current);
      }
    },
    [],
  );

  const resetShareStateLater = () => {
    if (shareResetTimerRef.current !== null) {
      window.clearTimeout(shareResetTimerRef.current);
    }

    shareResetTimerRef.current = window.setTimeout(() => {
      setShareState("idle");
    }, 2400);
  };

  const handleShare = async () => {
    const shareData = {
      title: `${work.title} — Nexora Creative Gallery`,
      text: `Lihat karya ${work.title} oleh ${work.creator_name} di Nexora Creative Gallery.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareState("idle");
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setShareState("copied");
      resetShareStateLater();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareState("error");
      resetShareStateLater();
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.backButton}
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/#gallery");
          }}
        >
          <span aria-hidden="true">←</span> Kembali
        </button>

        <Link
          className={styles.brand}
          href="/"
          aria-label="Nexora Creative Gallery"
        >
          <NexoraLogoMark className={styles.brandMark} />
          <span>
            <strong>NEXORA</strong>
            <small>CREATIVE GALLERY</small>
          </span>
        </Link>

        <button
          className={styles.shareButton}
          type="button"
          onClick={handleShare}
        >
          {shareState === "copied"
            ? "Tautan disalin"
            : shareState === "error"
              ? "Gagal menyalin"
              : "Bagikan"}
          <span aria-hidden="true">↗</span>
        </button>
      </header>

      <section className={styles.hero}>
        <div className={styles.imagePanel}>
          <div className={styles.imageFrame}>
            {work.is_protected ? (
              <ProtectedImage
                containerClassName={styles.protectedImage}
                imageClassName={styles.detailImage}
                src={work.image_url}
                alt={work.title}
                decoding="async"
              />
            ) : (
              <img
                className={styles.detailImage}
                src={work.image_url}
                alt={work.title}
                decoding="async"
              />
            )}
          </div>
          {work.is_protected ? (
            <p className={styles.protectionNotice}>
              Karya diberi watermark. Long-press, tarik gambar, dan menu salin
              gambar biasa dinonaktifkan.
            </p>
          ) : (
            <a
              className={styles.fullImageLink}
              href={work.image_url}
              target="_blank"
              rel="noreferrer"
            >
              Buka gambar resolusi penuh <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        <article className={styles.contentPanel}>
          <p className={styles.eyebrow}>
            {work.category} · {work.year}
          </p>
          <h1>{work.title}</h1>
          <p className={styles.creatorLine}>
            Karya oleh <strong>{work.creator_name}</strong>
          </p>
          <p className={styles.description}>
            {work.description || "Deskripsi karya belum ditambahkan."}
          </p>

          <dl className={styles.metaGrid}>
            <div>
              <dt>Kategori</dt>
              <dd>{work.category}</dd>
            </div>
            <div>
              <dt>Tahun</dt>
              <dd>{work.year}</dd>
            </div>
            <div>
              <dt>Dipublikasikan</dt>
              <dd>{formatDate(work.created_at)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{work.is_featured ? "Karya unggulan" : "Koleksi galeri"}</dd>
            </div>
          </dl>

          <section className={styles.creatorCard} aria-label="Profil kreator">
            <div className={styles.avatar} aria-hidden="true">
              {getInitials(work.creator_name) || "N"}
            </div>
            <div className={styles.creatorInfo}>
              <span>KREATOR</span>
              <h2>{work.creator_name}</h2>
              <p>Identitas kreator pemilik karya ini.</p>
            </div>
          </section>

          <div className={styles.contactActions}>
            {whatsappUrl && (
              <a
                className={styles.primaryAction}
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                Hubungi via WhatsApp <span aria-hidden="true">↗</span>
              </a>
            )}
            {work.creator_instagram_url && (
              <a
                className={styles.secondaryAction}
                href={work.creator_instagram_url}
                target="_blank"
                rel="noreferrer"
              >
                Instagram <span aria-hidden="true">↗</span>
              </a>
            )}
            {work.creator_portfolio_url && (
              <a
                className={styles.secondaryAction}
                href={work.creator_portfolio_url}
                target="_blank"
                rel="noreferrer"
              >
                Portofolio <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>

          {!whatsappUrl &&
            !work.creator_instagram_url &&
            !work.creator_portfolio_url && (
              <p className={styles.noContact}>Kontak kreator belum tersedia.</p>
            )}
        </article>
      </section>

      {relatedWorks.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedHeading}>
            <div>
              <p className={styles.eyebrow}>KARYA LAIN</p>
              <h2>Koleksi terkait.</h2>
            </div>
            <Link href="/#gallery">Lihat semua karya →</Link>
          </div>

          <div className={styles.relatedGrid}>
            {relatedWorks.map((relatedWork) => (
              <Link
                className={styles.relatedCard}
                href={`/karya/${encodeURIComponent(relatedWork.id)}`}
                key={relatedWork.id}
              >
                <div className={styles.relatedImage}>
                  {relatedWork.is_protected ? (
                    <ProtectedImage
                      imageClassName={styles.relatedArtwork}
                      src={relatedWork.image_url}
                      alt={relatedWork.title}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <img
                      className={styles.relatedArtwork}
                      src={relatedWork.image_url}
                      alt={relatedWork.title}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <span>{relatedWork.category}</span>
                </div>
                <div>
                  <strong>{relatedWork.title}</strong>
                  <small>{relatedWork.creator_name}</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <span>© 2026 NEXORA CREATIVE GALLERY</span>
        <Link href="/#gallery">Kembali ke koleksi</Link>
      </footer>
    </main>
  );
}
