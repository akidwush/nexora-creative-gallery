"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedImage from "@/components/protected-image";
import type { GalleryWork } from "@/lib/gallery";
import { getWhatsAppUrl } from "@/lib/gallery";
import { supabase } from "@/lib/supabase";
import styles from "./detail.module.css";

type ShareState = "idle" | "copied" | "error";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function WorkDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [work, setWork] = useState<GalleryWork | null>(null);
  const [relatedWorks, setRelatedWorks] = useState<GalleryWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [shareState, setShareState] = useState<ShareState>("idle");

  useEffect(() => {
    let active = true;

    async function loadWork() {
      setIsLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("gallery_works")
        .select("*")
        .eq("id", workId)
        .eq("is_published", true)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        setErrorMessage(
          error?.message || "Karya tidak ditemukan atau belum dipublikasikan.",
        );
        setIsLoading(false);
        return;
      }

      const selectedWork = data as GalleryWork;
      setWork(selectedWork);

      const relatedResult = await supabase
        .from("gallery_works")
        .select("*")
        .eq("is_published", true)
        .eq("category", selectedWork.category)
        .neq("id", selectedWork.id)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);

      if (!active) return;

      if (!relatedResult.error && relatedResult.data) {
        setRelatedWorks(relatedResult.data as GalleryWork[]);
      }

      setIsLoading(false);
    }

    if (workId) {
      void loadWork();
    } else {
      setErrorMessage("ID karya tidak valid.");
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [workId]);

  const whatsappUrl = useMemo(
    () => getWhatsAppUrl(work?.creator_whatsapp, work?.title),
    [work],
  );

  const handleShare = async () => {
    if (!work) return;

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
      window.setTimeout(() => setShareState("idle"), 2400);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareState("error");
      window.setTimeout(() => setShareState("idle"), 2400);
    }
  };

  if (isLoading) {
    return (
      <main className={styles.statePage}>
        <span className={styles.loader} aria-hidden="true" />
        <p>Memuat detail karya...</p>
      </main>
    );
  }

  if (!work || errorMessage) {
    return (
      <main className={styles.statePage}>
        <span className={styles.stateCode}>404</span>
        <h1>Karya tidak ditemukan.</h1>
        <p>{errorMessage}</p>
        <button type="button" onClick={() => router.push("/#gallery")}> 
          Kembali ke galeri
        </button>
      </main>
    );
  }

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

        <a className={styles.brand} href="/" aria-label="Nexora Creative Gallery">
          <span className={styles.brandMark}>N</span>
          <span>
            <strong>NEXORA</strong>
            <small>CREATIVE GALLERY</small>
          </span>
        </a>

        <button className={styles.shareButton} type="button" onClick={handleShare}>
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
              Karya ini dilindungi. Unduhan biasa, long-press, tarik gambar, dan
              menu salin gambar dinonaktifkan.
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
              <dd>{work.is_featured ? "Pemenang unggulan" : "Koleksi pemenang"}</dd>
            </div>
          </dl>

          <section className={styles.creatorCard} aria-label="Profil kreator">
            <div className={styles.avatar} aria-hidden="true">
              {getInitials(work.creator_name) || "N"}
            </div>
            <div className={styles.creatorInfo}>
              <span>KREATOR PEMENANG</span>
              <h2>{work.creator_name}</h2>
              <p>Identitas kreator pemilik karya pemenang ini.</p>
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
              <h2>Karya pemenang lainnya.</h2>
            </div>
            <a href="/#gallery">Lihat semua karya →</a>
          </div>

          <div className={styles.relatedGrid}>
            {relatedWorks.map((relatedWork) => (
              <a
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
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <span>© 2026 NEXORA CREATIVE GALLERY</span>
        <a href="/#gallery">Kembali ke koleksi</a>
      </footer>
    </main>
  );
}
