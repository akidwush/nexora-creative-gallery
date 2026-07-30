"use client";

/* Dynamic Supabase images keep their intrinsic ratio in the masonry layout. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
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

const BRAND_TAGLINE = "Create. Inspire. Connect.";

function readLocalPreference(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalPreference(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The gallery remains functional when browser storage is unavailable.
  }
}

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
  const [introLeaving, setIntroLeaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);
  const [galleryLoadError, setGalleryLoadError] = useState("");
  const [showLongPressHint, setShowLongPressHint] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const modalCloseRef = useRef<HTMLButtonElement | null>(null);
  const introAutoTimerRef = useRef<number | null>(null);
  const introExitTimerRef = useRef<number | null>(null);
  const workGridRef = useRef<HTMLDivElement | null>(null);
  const filterAnimationRef = useRef<Animation | null>(null);
  const filterRequestRef = useRef(0);
  const revealObserverRef = useRef<IntersectionObserver | null>(null);
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = motionQuery.matches;

    const initializationFrame = window.requestAnimationFrame(() => {
      const hasVisited = readLocalPreference("hasSeenIntro");
      if (hasVisited || motionQuery.matches) {
        setIntroVisible(false);
      } else {
        introAutoTimerRef.current = window.setTimeout(() => {
          writeLocalPreference("hasSeenIntro", "true");
          setIntroLeaving(true);
          introExitTimerRef.current = window.setTimeout(() => {
            setIntroVisible(false);
          }, 360);
        }, 1350);
      }

      const hintSeen = readLocalPreference(
        "nexora-work-longpress-hint-seen",
      );
      setShowLongPressHint(!hintSeen);
    });

    const handleMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = event.matches;
    };
    motionQuery.addEventListener?.("change", handleMotionChange);

    return () => {
      window.cancelAnimationFrame(initializationFrame);
      if (introAutoTimerRef.current !== null) {
        window.clearTimeout(introAutoTimerRef.current);
      }
      if (introExitTimerRef.current !== null) {
        window.clearTimeout(introExitTimerRef.current);
      }
      filterRequestRef.current += 1;
      filterAnimationRef.current?.cancel();
      filterAnimationRef.current = null;
      motionQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    if (!selectedWork) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      modalCloseRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedWork(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedWork]);

  useEffect(() => {
    let active = true;
    let requestSequence = 0;

    async function loadGallery(silent = false) {
      const requestId = ++requestSequence;

      if (!silent) {
        setIsGalleryLoading(true);
      }

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

      if (!active || requestId !== requestSequence) return;

      const firstError = worksResult.error ?? categoriesResult.error;
      if (firstError) {
        setGalleryLoadError(
          `Koleksi terbaru gagal dimuat: ${firstError.message}`,
        );
        setIsGalleryLoading(false);
        return;
      }

      const databaseWorks = ((worksResult.data ?? []) as GalleryWork[]).map(
        mapDatabaseWork,
      );
      const databaseCategories = (
        (categoriesResult.data ?? []) as GalleryCategory[]
      ).map((category) => category.name);

      setWorks(databaseWorks);
      setCategories(["Semua", ...databaseCategories]);
      setGalleryLoadError("");
      setIsGalleryLoading(false);
    }

    const refreshGallery = () => {
      void loadGallery(true);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshGallery();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "nexora-gallery-updated-at") refreshGallery();
    };

    void loadGallery();

    window.addEventListener("focus", refreshGallery);
    window.addEventListener("pageshow", refreshGallery);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("nexora-gallery-updated", refreshGallery);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const realtimeChannel = supabase
      .channel("nexora-public-gallery-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery_works" },
        refreshGallery,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery_categories" },
        refreshGallery,
      )
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener("focus", refreshGallery);
      window.removeEventListener("pageshow", refreshGallery);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("nexora-gallery-updated", refreshGallery);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(realtimeChannel);
    };
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    works.forEach((work) => {
      counts.set(work.category, (counts.get(work.category) ?? 0) + 1);
    });

    return counts;
  }, [works]);

  const visibleCategories = useMemo(() => {
    const orderedCategories = categories.filter(
      (category) =>
        category !== "Semua" && (categoryCounts.get(category) ?? 0) > 0,
    );
    const missingCategories = Array.from(categoryCounts.keys()).filter(
      (category) => !orderedCategories.includes(category),
    );

    return ["Semua", ...orderedCategories, ...missingCategories];
  }, [categories, categoryCounts]);

  const resolvedActiveCategory =
    activeCategory === "Semua" || visibleCategories.includes(activeCategory)
      ? activeCategory
      : "Semua";

  const enterGallery = (instant = false) => {
    writeLocalPreference("hasSeenIntro", "true");

    if (introAutoTimerRef.current !== null) {
      window.clearTimeout(introAutoTimerRef.current);
      introAutoTimerRef.current = null;
    }
    if (introExitTimerRef.current !== null) {
      window.clearTimeout(introExitTimerRef.current);
      introExitTimerRef.current = null;
    }

    if (instant || prefersReducedMotionRef.current) {
      setIntroLeaving(false);
      setIntroVisible(false);
      return;
    }

    setIntroLeaving(true);
    introExitTimerRef.current = window.setTimeout(() => {
      setIntroVisible(false);
    }, 360);
  };

  const changeCategory = (category: string) => {
    if (category === resolvedActiveCategory && pendingCategory === null) return;
    if (category === pendingCategory) return;

    const requestId = ++filterRequestRef.current;
    const grid = workGridRef.current;

    filterAnimationRef.current?.cancel();
    filterAnimationRef.current = null;
    setPendingCategory(category);

    if (
      prefersReducedMotionRef.current ||
      !grid ||
      typeof grid.animate !== "function"
    ) {
      setActiveCategory(category);
      setPendingCategory(null);
      return;
    }

    // Animate the grid as one compositor layer. The previous timer-based card
    // sequence could leave cards at opacity: 0 when Android delayed or cancelled
    // a timer. Web Animations always gets cancelled/reset before the next filter.
    const exitAnimation = grid.animate(
      [
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
        { opacity: 0, transform: "translate3d(0, 5px, 0) scale(0.985)" },
      ],
      {
        duration: 120,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
        fill: "forwards",
      },
    );

    filterAnimationRef.current = exitAnimation;

    void exitAnimation.finished
      .then(() => {
        if (requestId !== filterRequestRef.current) return;

        setActiveCategory(category);

        // Wait until React has painted the newly filtered cards before fading in.
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (requestId !== filterRequestRef.current) return;

            exitAnimation.cancel();

            const enterAnimation = grid.animate(
              [
                {
                  opacity: 0,
                  transform: "translate3d(0, 7px, 0) scale(0.985)",
                },
                {
                  opacity: 1,
                  transform: "translate3d(0, 0, 0) scale(1)",
                },
              ],
              {
                duration: 220,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              },
            );

            filterAnimationRef.current = enterAnimation;

            void enterAnimation.finished
              .catch(() => undefined)
              .finally(() => {
                if (requestId !== filterRequestRef.current) return;
                enterAnimation.cancel();
                filterAnimationRef.current = null;
                setPendingCategory(null);
              });
          });
        });
      })
      .catch(() => {
        if (requestId !== filterRequestRef.current) return;
        exitAnimation.cancel();
        filterAnimationRef.current = null;
        setActiveCategory(category);
        setPendingCategory(null);
      });
  };

  const dismissLongPressHint = () => {
    writeLocalPreference("nexora-work-longpress-hint-seen", "true");
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

  useEffect(() => {
    if (introVisible) return;

    const frame = window.requestAnimationFrame(() => {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>("[data-reveal]"),
      );

      if (
        prefersReducedMotionRef.current ||
        !("IntersectionObserver" in window)
      ) {
        elements.forEach((element) => element.classList.add("is-revealed"));
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -7% 0px" },
      );

      elements.forEach((element) => {
        if (!element.classList.contains("is-revealed")) {
          observer.observe(element);
        }
      });

      revealObserverRef.current?.disconnect();
      revealObserverRef.current = observer;
    });

    return () => {
      window.cancelAnimationFrame(frame);
      revealObserverRef.current?.disconnect();
    };
  }, [introVisible, activeCategory, query, works, showLongPressHint]);

  const filteredWorks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return works.filter((work) => {
      const matchesCategory =
        resolvedActiveCategory === "Semua" ||
        work.category === resolvedActiveCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${work.title} ${work.creator} ${work.category}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [query, resolvedActiveCategory, works]);

  const selectedCategory = pendingCategory ?? resolvedActiveCategory;

  const featuredWork = works.find((work) => work.isFeatured) ?? null;
  const selectedWhatsAppUrl = selectedWork
    ? getWhatsAppUrl(selectedWork.whatsapp, selectedWork.title)
    : null;
  const nexoraWhatsAppUrl = getNexoraWhatsAppUrl();

  return (
    <main className="nexora-shell">
      {introVisible && (
        <div
          className={`intro-screen ${introLeaving ? "is-leaving" : ""}`}
          role="dialog"
          aria-label="Nexora intro"
        >
          <div className="intro-glow intro-glow-one" />
          <div className="intro-glow intro-glow-two" />
          <div className="intro-mark" aria-hidden="true">
            N
          </div>
          <p className="eyebrow intro-eyebrow">NEXORA CREATIVE GALLERY</p>
          <h1>{BRAND_TAGLINE}</h1>
          <p className="intro-copy">Galeri resmi karya pemenang Nexora.</p>
          <button
            className="skip-button"
            type="button"
            onClick={() => enterGallery(true)}
          >
            Lewati intro
          </button>
        </div>
      )}

      <header className="site-header reveal-item reveal-fast" data-reveal>
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
          Panduan submit <span>↗</span>
        </a>
      </header>

      <section
        className={`hero-section ${featuredWork ? "" : "hero-section-no-featured"}`}
        id="top"
      >
        <div className="hero-copy reveal-item" data-reveal>
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
          <p className="brand-tagline">{BRAND_TAGLINE}</p>
          <a className="primary-button" href="#gallery">
            Lihat koleksi pemenang <span>↓</span>
          </a>
        </div>

        {featuredWork && (
          <button
            className={`hero-art reveal-item ${featuredWork.imageUrl ? "has-featured-image" : ""}`}
            data-reveal
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
                <div className="hero-word" aria-hidden="true">NEXORA</div>
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
        )}
      </section>

      <section className="gallery-section" id="gallery">
        <div className="section-heading reveal-item" data-reveal>
          <div>
            <p className="eyebrow">WINNER COLLECTION</p>
            <h2>Karya pemenang</h2>
          </div>
          <p className="section-note">
            Koleksi resmi karya terpilih dari pemenang
            <br className="desktop-break" /> event dan challenge Nexora.
          </p>
        </div>

        <div className="gallery-toolbar reveal-item" data-reveal>
          <div className="category-list" aria-label="Filter kategori">
            {visibleCategories.map((category) => {
              const count =
                category === "Semua"
                  ? works.length
                  : (categoryCounts.get(category) ?? 0);

              return (
                <button
                  className={selectedCategory === category ? "selected" : ""}
                  key={category}
                  type="button"
                  aria-label={`${category}, ${count} karya`}
                  aria-pressed={selectedCategory === category}
                  onClick={() => changeCategory(category)}
                >
                  <span>{category}</span>
                  <span className="category-count" aria-hidden="true">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <label className="search-box">
            <span className="sr-only">Cari karya</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari judul atau nama kreator..."
              aria-label="Cari karya"
              autoComplete="off"
            />
          </label>
        </div>

        {isGalleryLoading && (
          <p className="gallery-loading reveal-item" data-reveal>
            Memuat koleksi terbaru...
          </p>
        )}

        {galleryLoadError && (
          <div className="gallery-load-error" role="alert">
            <p>{galleryLoadError}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Muat ulang
            </button>
          </div>
        )}

        {showLongPressHint && works.length > 0 && (
          <div
            className="long-press-hint reveal-item"
            role="status"
            data-reveal
          >
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

        <div
          ref={workGridRef}
          className="work-grid reveal-grid"
          data-reveal
          aria-busy={pendingCategory !== null}
        >
          {filteredWorks.map((work, index) => (
            <button
              className="work-card"
              key={work.id}
              type="button"
              aria-label={`Buka karya ${work.title} oleh ${work.creator}`}
              style={
                {
                  "--reveal-delay": `${Math.min(index, 9) * 55}ms`,
                  "--filter-delay": `${Math.min(index, 6) * 18}ms`,
                } as CSSProperties
              }
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
                  <span className="art-label" aria-hidden="true">
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

        {!isGalleryLoading && !galleryLoadError && filteredWorks.length === 0 && (
          <div className="empty-state reveal-item" data-reveal>
            <p>
              {works.length === 0
                ? "Belum ada karya yang dipublikasikan."
                : "Belum ada karya yang cocok."}
            </p>
            {works.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  changeCategory("Semua");
                }}
              >
                Reset pencarian
              </button>
            )}
          </div>
        )}
      </section>

      <section className="about-section" id="about">
        <div className="reveal-item" data-reveal>
          <p className="eyebrow">TENTANG GALERI</p>
          <h2>Setiap kemenangan layak diingat.</h2>
        </div>
        <p className="reveal-item" data-reveal>
          Nexora Creative Gallery adalah arsip resmi karya pemenang.
          Galeri ini hanya menampilkan karya yang telah terpilih dalam event
          atau challenge Nexora agar pencapaian kreator tetap tercatat dan
          mudah dikenali.
        </p>
      </section>

      <section className="submit-section reveal-item" id="submit" data-reveal>
        <p className="eyebrow">PANDUAN KONFIRMASI KARYA</p>
        <h2>Kirim tanpa menebak-nebak.</h2>
        <p className="submit-description">
          Siapkan data berikut sebelum menghubungi admin agar karya dapat
          diverifikasi dan dipublikasikan tanpa bolak-balik revisi.
        </p>

        <ol className="submit-guide" aria-label="Syarat konfirmasi karya pemenang">
          <li>
            <span>01</span>
            <div>
              <strong>Pastikan karya terpilih</strong>
              <p>Khusus pemenang event atau challenge resmi Nexora.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Lengkapi identitas karya</strong>
              <p>Judul, kategori, deskripsi singkat, nama kreator, tahun, dan kontak.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Kirim file final</strong>
              <p>JPG, PNG, WEBP, atau GIF dengan ukuran maksimal 50 MB.</p>
            </div>
          </li>
        </ol>

        <a
          className="primary-button"
          href={nexoraWhatsAppUrl}
          rel="noreferrer"
          target="_blank"
        >
          Lanjut ke WhatsApp <span>↗</span>
        </a>
      </section>

      <footer className="site-footer reveal-item" data-reveal>
        <span>© 2026 NEXORA CREATIVE GALLERY</span>
        <span>{BRAND_TAGLINE}</span>
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
            aria-describedby="quick-work-description"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={modalCloseRef}
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
                <span className="art-label" aria-hidden="true">
                  {selectedWork.label.split("\n").map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              )}
              <span className="quick-preview-label">
                <span aria-hidden="true" />
                Ringkasan 0,6 detik
              </span>
            </div>

            <div className="modal-content">
              <div className="modal-content-head">
                <p className="eyebrow modal-eyebrow">RINGKASAN KARYA</p>
                <div className="modal-tags" aria-label="Informasi karya">
                  <span>{selectedWork.category}</span>
                  <span>{selectedWork.year}</span>
                  {selectedWork.isFeatured && <span>Unggulan</span>}
                  {selectedWork.isProtected && <span>Dilindungi</span>}
                </div>
              </div>

              <h2 id="quick-work-title">{selectedWork.title}</h2>
              <p className="modal-creator">
                Karya pemenang oleh <strong>{selectedWork.creator}</strong>
              </p>
              <p className="modal-description" id="quick-work-description">
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
