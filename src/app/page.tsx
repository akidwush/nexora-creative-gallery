"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import ProtectedImage from "@/components/protected-image";
import { getWhatsAppUrl } from "@/lib/gallery";
import type { GalleryCategory, GalleryWork } from "@/lib/gallery";
import { supabase } from "@/lib/supabase";
import { getNexoraWhatsAppUrl } from "@/lib/site";

type Work = {
  id: string;
  title: string;
  creator: string;
  category: string;
  year: string;
  description: string;
  label: string;
  background: string;
  ratio: number;
  imageUrl?: string;
  whatsapp?: string | null;
  instagramUrl?: string | null;
  portfolioUrl?: string | null;
  isFeatured?: boolean;
  isProtected?: boolean;
};

const fallbackWorks: Work[] = [
  {
    id: "sample-1",
    title: "Afterglow",
    creator: "Nexora Studio",
    category: "Poster",
    year: "2026",
    description:
      "Eksplorasi warna, cahaya, dan tipografi untuk poster visual bertema malam.",
    label: "AFTER\nGLOW",
    background:
      "radial-gradient(circle at 72% 18%, #f8c7ff 0 4%, transparent 20%), linear-gradient(145deg, #161329 0%, #6e39b7 45%, #f47b62 100%)",
    ratio: 4 / 5,
    isFeatured: true,
  },
  {
    id: "sample-2",
    title: "Nusa Coffee",
    creator: "Alvin V.",
    category: "Branding",
    year: "2026",
    description:
      "Konsep identitas visual minimal untuk kedai kopi lokal dengan karakter hangat.",
    label: "NUSA\nCOFFEE",
    background:
      "linear-gradient(135deg, #f4dfc1 0%, #c8865a 44%, #542f2d 100%)",
    ratio: 1,
  },
  {
    id: "sample-3",
    title: "Orbit 01",
    creator: "Cyrvo Visuals",
    category: "Illustration",
    year: "2026",
    description:
      "Ilustrasi eksperimental tentang perjalanan manusia melewati ruang yang tidak dikenal.",
    label: "ORBIT\n01",
    background:
      "radial-gradient(circle at 50% 38%, #f7dd90 0 5%, transparent 6%), radial-gradient(circle at 50% 38%, transparent 0 24%, #ee9b5b 25% 26%, transparent 27%), linear-gradient(160deg, #12252b 0%, #195f64 48%, #0c171e 100%)",
    ratio: 3 / 4,
  },
  {
    id: "sample-4",
    title: "Nexora Dashboard",
    creator: "Frantz Design",
    category: "UI/UX",
    year: "2026",
    description:
      "Eksplorasi dashboard komunitas dengan fokus pada hierarki informasi dan akses cepat.",
    label: "NEXORA\nDASHBOARD",
    background:
      "linear-gradient(155deg, #101b3c 0%, #324ea3 44%, #7ba7ff 100%)",
    ratio: 16 / 10,
  },
  {
    id: "sample-5",
    title: "Pulse",
    creator: "Vien Motion",
    category: "Motion",
    year: "2026",
    description:
      "Frame konsep untuk identitas motion graphic yang dinamis dan berani.",
    label: "PULSE",
    background:
      "radial-gradient(ellipse at 25% 80%, #ffd45b 0 7%, transparent 8%), linear-gradient(125deg, #f0443c 0%, #f07c3d 42%, #f7c950 100%)",
    ratio: 4 / 5,
  },
  {
    id: "sample-6",
    title: "Quiet Type",
    creator: "Seyu Studio",
    category: "Poster",
    year: "2026",
    description:
      "Komposisi editorial yang menempatkan tipografi sebagai elemen utama.",
    label: "QUIET\nTYPE",
    background:
      "linear-gradient(135deg, #dfe3e8 0%, #a6b0bd 52%, #424b5a 100%)",
    ratio: 3 / 4,
  },
];

function mapDatabaseWork(work: GalleryWork): Work {
  return {
    id: work.id,
    title: work.title,
    creator: work.creator_name,
    category: work.category,
    year: String(work.year),
    description: work.description,
    label: work.title.toUpperCase().replace(/\s+/g, "\n"),
    background: "linear-gradient(145deg, #19142c, #7358df, #f47968)",
    ratio: 4 / 5,
    imageUrl: work.image_url,
    whatsapp: work.creator_whatsapp,
    instagramUrl: work.creator_instagram_url,
    portfolioUrl: work.creator_portfolio_url,
    isFeatured: work.is_featured,
    isProtected: work.is_protected ?? false,
  };
}

export default function Home() {
  const router = useRouter();
  const [introVisible, setIntroVisible] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [query, setQuery] = useState("");
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [works, setWorks] = useState<Work[]>(fallbackWorks);
  const [categories, setCategories] = useState<string[]>([
    "Semua",
    "Poster",
    "Branding",
    "Illustration",
    "Motion",
    "UI/UX",
  ]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);
  const [showLongPressHint, setShowLongPressHint] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const hasVisited = window.sessionStorage.getItem("nexora-gallery-intro");
    if (hasVisited) setIntroVisible(false);

    const hintSeen = window.localStorage.getItem(
      "nexora-work-longpress-hint-seen",
    );
    setShowLongPressHint(!hintSeen);
  }, []);

  useEffect(() => {
    if (!selectedWork) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedWork(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedWork]);

  useEffect(() => {
    let active = true;

    async function loadGallery() {
      const [worksResult, categoriesResult] = await Promise.all([
        supabase
          .from("gallery_works")
          .select("*")
          .eq("is_published", true)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("gallery_categories")
          .select("*")
          .order("sort_order", { ascending: true }),
      ]);

      if (!active) return;

      if (!worksResult.error && worksResult.data) {
        const databaseWorks = (worksResult.data as GalleryWork[]).map(
          mapDatabaseWork,
        );
        setWorks(databaseWorks);
      }

      if (!categoriesResult.error && categoriesResult.data) {
        const databaseCategories = (
          categoriesResult.data as GalleryCategory[]
        ).map((category) => category.name);
        setCategories(["Semua", ...databaseCategories]);
      }

      setIsGalleryLoading(false);
    }

    void loadGallery();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      activeCategory !== "Semua" &&
      !categories.includes(activeCategory)
    ) {
      setActiveCategory("Semua");
    }
  }, [activeCategory, categories]);

  const enterGallery = () => {
    window.sessionStorage.setItem("nexora-gallery-intro", "seen");
    setIntroVisible(false);
  };

  const dismissLongPressHint = () => {
    window.localStorage.setItem("nexora-work-longpress-hint-seen", "true");
    setShowLongPressHint(false);
  };

  const openWork = (work: Work) => {
    if (work.id.startsWith("sample-")) {
      setSelectedWork(work);
      return;
    }

    router.push(`/karya/${encodeURIComponent(work.id)}`);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const beginLongPress = (
    work: Work,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    clearLongPressTimer();
    longPressTriggeredRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      pointerStartRef.current = null;
      setSelectedWork(work);
      dismissLongPressHint();
      navigator.vibrate?.(35);
    }, 600);
  };

  const moveLongPress = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = pointerStartRef.current;
    if (!start) return;

    const distance = Math.hypot(
      event.clientX - start.x,
      event.clientY - start.y,
    );

    if (distance > 12) {
      clearLongPressTimer();
      pointerStartRef.current = null;
      longPressTriggeredRef.current = false;
    }
  };

  const endLongPress = () => {
    const wasTriggered = longPressTriggeredRef.current;
    clearLongPressTimer();
    pointerStartRef.current = null;

    if (wasTriggered) {
      window.setTimeout(() => {
        longPressTriggeredRef.current = false;
      }, 0);
    }
  };

  const cancelLongPress = () => {
    clearLongPressTimer();
    pointerStartRef.current = null;
    longPressTriggeredRef.current = false;
  };

  const handleWorkClick = (
    work: Work,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    if (longPressTriggeredRef.current) {
      event.preventDefault();
      event.stopPropagation();
      longPressTriggeredRef.current = false;
      return;
    }

    openWork(work);
  };

  const filteredWorks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return works.filter((work) => {
      const matchesCategory =
        activeCategory === "Semua" || work.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${work.title} ${work.creator} ${work.category}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, works]);

  const featuredWork =
    works.find((work) => work.isFeatured) ?? works[0] ?? fallbackWorks[0];
  const selectedWhatsAppUrl = selectedWork
    ? getWhatsAppUrl(selectedWork.whatsapp, selectedWork.title)
    : null;
  const nexoraWhatsAppUrl = getNexoraWhatsAppUrl();

  return (
    <main className="nexora-shell">
      {introVisible && (
        <div className="intro-screen" role="dialog" aria-label="Nexora intro">
          <div className="intro-glow intro-glow-one" />
          <div className="intro-glow intro-glow-two" />
          <div className="intro-mark" aria-hidden="true">
            N
          </div>
          <p className="eyebrow intro-eyebrow">NEXORA WINNER GALLERY</p>
          <h1>
            Terpilih.
            <br />
            Menang.
            <br />
            Diabadikan.
          </h1>
          <p className="intro-copy">
            Galeri resmi karya pemenang event dan challenge Nexora.
          </p>
          <button className="intro-button" type="button" onClick={enterGallery}>
            Lihat karya pemenang <span>↗</span>
          </button>
          <button className="skip-button" type="button" onClick={enterGallery}>
            Lewati intro
          </button>
        </div>
      )}

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Nexora Creative Gallery">
          <span className="brand-symbol">N</span>
          <span>
            <strong>NEXORA</strong>
            <small>CREATIVE GALLERY</small>
          </span>
        </a>
        <nav className="main-nav" aria-label="Navigasi utama">
          <a className="active" href="#top">
            Beranda
          </a>
          <a href="#gallery">Galeri</a>
          <a href="#about">Tentang</a>
        </nav>
        <a className="submit-link" href="#submit">
          Konfirmasi karya <span>↗</span>
        </a>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow">GALERI PEMENANG NEXORA</p>
          <h2>
            Karya terbaik.
            <br />
            <em>Diabadikan.</em>
          </h2>
          <p className="hero-description">
            Galeri resmi untuk menampilkan dan mengarsipkan karya para
            pemenang event serta challenge Nexora, lengkap dengan identitas
            kreatornya.
          </p>
          <a className="primary-button" href="#gallery">
            Lihat koleksi pemenang <span>↓</span>
          </a>
        </div>

        <button
          className={`hero-art ${featuredWork.imageUrl ? "has-featured-image" : ""}`}
          aria-label={`Buka karya unggulan ${featuredWork.title}`}
          type="button"
          onClick={(event) => handleWorkClick(featuredWork, event)}
          onPointerDown={(event) => beginLongPress(featuredWork, event)}
          onPointerMove={moveLongPress}
          onPointerUp={endLongPress}
          onPointerCancel={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onContextMenu={(event) => event.preventDefault()}
        >
          {featuredWork.imageUrl &&
            (featuredWork.isProtected ? (
              <ProtectedImage
                fill
                imageClassName="hero-featured-image"
                src={featuredWork.imageUrl}
                alt={featuredWork.title}
              />
            ) : (
              <img
                className="hero-featured-image"
                src={featuredWork.imageUrl}
                alt={featuredWork.title}
              />
            ))}
          {!featuredWork.imageUrl && (
            <>
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="hero-sun" />
              <div className="hero-word">NEXORA</div>
            </>
          )}
          <div className="hero-caption">
            <span>01 / FEATURED WINNER</span>
            <strong>{featuredWork.title}</strong>
            <small>
              {featuredWork.category} · {featuredWork.creator}
            </small>
          </div>
          <span className="hero-number">01</span>
        </button>
      </section>

      <section className="gallery-section" id="gallery">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WINNER COLLECTION</p>
            <h2>Karya pemenang</h2>
          </div>
          <p className="section-note">
            Koleksi resmi karya terpilih dari pemenang
            <br className="desktop-break" /> event dan challenge Nexora.
          </p>
        </div>

        <div className="gallery-toolbar">
          <div className="category-list" aria-label="Filter kategori">
            {categories.map((category) => (
              <button
                className={activeCategory === category ? "selected" : ""}
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari karya..."
              aria-label="Cari karya"
            />
          </label>
        </div>

        {isGalleryLoading && (
          <p className="gallery-loading">Memuat koleksi terbaru...</p>
        )}

        {showLongPressHint && (
          <div className="long-press-hint" role="status">
            <span aria-hidden="true">◎</span>
            <p>
              Tahan kartu karya selama <strong>0,6 detik</strong> untuk melihat
              ringkasan tanpa meninggalkan galeri.
            </p>
            <button
              type="button"
              aria-label="Tutup petunjuk"
              onClick={dismissLongPressHint}
            >
              ×
            </button>
          </div>
        )}

        <div className="work-grid">
          {filteredWorks.map((work, index) => (
            <button
              className="work-card"
              key={work.id}
              type="button"
              style={{ animationDelay: `${index * 70}ms` }}
              onClick={(event) => handleWorkClick(work, event)}
              onPointerDown={(event) => beginLongPress(work, event)}
              onPointerMove={moveLongPress}
              onPointerUp={endLongPress}
              onPointerCancel={cancelLongPress}
              onPointerLeave={cancelLongPress}
              onContextMenu={(event) => event.preventDefault()}
            >
              <div
                className={`work-art ${work.imageUrl ? "has-image" : ""}`}
                style={
                  work.imageUrl
                    ? undefined
                    : {
                        aspectRatio: work.ratio,
                        background: work.background,
                      }
                }
              >
                <span className="art-category">{work.category}</span>
                {work.imageUrl &&
                  (work.isProtected ? (
                    <ProtectedImage
                      imageClassName="work-image"
                      src={work.imageUrl}
                      alt={work.title}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <img
                      className="work-image"
                      src={work.imageUrl}
                      alt={work.title}
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                {!work.imageUrl && (
                  <span className="art-label">
                    {work.label.split("\n").map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                )}
                <span className="art-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <span className="work-meta">
                <span>
                  <strong>{work.title}</strong>
                  <small>{work.creator}</small>
                </span>
                <span className="work-arrow">↗</span>
              </span>
            </button>
          ))}
        </div>

        {filteredWorks.length === 0 && (
          <div className="empty-state">
            <p>Belum ada karya yang cocok.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("Semua");
              }}
            >
              Reset pencarian
            </button>
          </div>
        )}
      </section>

      <section className="about-section" id="about">
        <div>
          <p className="eyebrow">TENTANG GALERI</p>
          <h2>Setiap kemenangan layak diingat.</h2>
        </div>
        <p>
          Nexora Creative Gallery adalah arsip resmi karya pemenang.
          Galeri ini hanya menampilkan karya yang telah terpilih dalam event
          atau challenge Nexora agar pencapaian kreator tetap tercatat dan
          mudah dikenali.
        </p>
      </section>

      <section className="submit-section" id="submit">
        <p className="eyebrow">PEMENANG NEXORA?</p>
        <h2>Konfirmasi karyamu.</h2>
        <p className="submit-description">
          Hubungi admin Nexora untuk mengirim file final dan data kreator.
        </p>
        <a
          className="primary-button"
          href={nexoraWhatsAppUrl}
          rel="noreferrer"
          target="_blank"
        >
          Hubungi Nexora via WhatsApp <span>↗</span>
        </a>
      </section>

      <footer className="site-footer">
        <span>© 2026 NEXORA CREATIVE GALLERY</span>
        <span>Terpilih · Menang · Diabadikan</span>
      </footer>

      {selectedWork && (
        <div
          className="work-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedWork(null)}
        >
          <article
            className="work-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-work-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              aria-label="Tutup ringkasan karya"
              onClick={() => setSelectedWork(null)}
            >
              ×
            </button>

            <div
              className={`modal-art ${selectedWork.imageUrl ? "has-image" : ""}`}
              style={
                selectedWork.imageUrl
                  ? undefined
                  : {
                      aspectRatio: selectedWork.ratio,
                      background: selectedWork.background,
                    }
              }
            >
              {selectedWork.imageUrl &&
                (selectedWork.isProtected ? (
                  <ProtectedImage
                    imageClassName="work-image"
                    src={selectedWork.imageUrl}
                    alt={selectedWork.title}
                  />
                ) : (
                  <img
                    className="work-image"
                    src={selectedWork.imageUrl}
                    alt={selectedWork.title}
                    draggable={false}
                  />
                ))}
              {!selectedWork.imageUrl && (
                <span className="art-label">
                  {selectedWork.label.split("\n").map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              )}
              <span className="quick-preview-label">PREVIEW 0,6 DETIK</span>
            </div>

            <div className="modal-content">
              <div className="modal-tags" aria-label="Informasi karya">
                <span>{selectedWork.category}</span>
                <span>{selectedWork.year}</span>
                {selectedWork.isFeatured && <span>Unggulan</span>}
                {selectedWork.isProtected && <span>Dilindungi</span>}
              </div>

              <h2 id="quick-work-title">{selectedWork.title}</h2>
              <p className="modal-creator">
                Karya pemenang oleh <strong>{selectedWork.creator}</strong>
              </p>
              <p className="modal-description">
                {selectedWork.description || "Deskripsi karya belum ditambahkan."}
              </p>

              <div className="modal-actions">
                {!selectedWork.id.startsWith("sample-") && (
                  <button
                    className="modal-detail-button"
                    type="button"
                    onClick={() => {
                      setSelectedWork(null);
                      router.push(
                        `/karya/${encodeURIComponent(selectedWork.id)}`,
                      );
                    }}
                  >
                    Lihat detail lengkap <span>↗</span>
                  </button>
                )}

                <div className="creator-contact-list">
                  {selectedWhatsAppUrl && (
                    <a
                      className="secondary-button modal-contact-button"
                      href={selectedWhatsAppUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      WhatsApp ↗
                    </a>
                  )}
                  {selectedWork.instagramUrl && (
                    <a
                      className="secondary-button modal-contact-button"
                      href={selectedWork.instagramUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Instagram ↗
                    </a>
                  )}
                  {selectedWork.portfolioUrl && (
                    <a
                      className="secondary-button modal-contact-button"
                      href={selectedWork.portfolioUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Portofolio ↗
                    </a>
                  )}
                </div>
              </div>

              {!selectedWhatsAppUrl &&
                !selectedWork.instagramUrl &&
                !selectedWork.portfolioUrl && (
                  <p className="contact-unavailable">
                    Kontak kreator belum tersedia.
                  </p>
                )}
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
