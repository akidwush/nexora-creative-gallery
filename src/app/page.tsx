'use client';

import { useEffect, useMemo, useState } from 'react';

type Category =
  | 'Semua'
  | 'Poster'
  | 'Branding'
  | 'Illustration'
  | 'Motion'
  | 'UI/UX';

type Work = {
  id: number;
  title: string;
  creator: string;
  category: Exclude<Category, 'Semua'>;
  year: string;
  description: string;
  label: string;
  background: string;
  ratio: number;
  imageUrl?: string;
};

const categories: Category[] = [
  'Semua',
  'Poster',
  'Branding',
  'Illustration',
  'Motion',
  'UI/UX',
];

const works: Work[] = [
  {
    id: 1,
    title: 'Afterglow',
    creator: 'Nexora Studio',
    category: 'Poster',
    year: '2026',
    description:
      'Eksplorasi warna, cahaya, dan tipografi untuk poster visual bertema malam.',
    label: 'AFTER\nGLOW',
    background:
      'radial-gradient(circle at 72% 18%, #f8c7ff 0 4%, transparent 20%), linear-gradient(145deg, #161329 0%, #6e39b7 45%, #f47b62 100%)',
    ratio: 4 / 5,
  },
  {
    id: 2,
    title: 'Nusa Coffee',
    creator: 'Alvin V.',
    category: 'Branding',
    year: '2026',
    description:
      'Konsep identitas visual minimal untuk kedai kopi lokal dengan karakter hangat.',
    label: 'NUSA\nCOFFEE',
    background:
      'linear-gradient(135deg, #f4dfc1 0%, #c8865a 44%, #542f2d 100%)',
    ratio: 1,
  },
  {
    id: 3,
    title: 'Orbit 01',
    creator: 'Cyrvo Visuals',
    category: 'Illustration',
    year: '2026',
    description:
      'Ilustrasi eksperimental tentang perjalanan manusia melewati ruang yang tidak dikenal.',
    label: 'ORBIT\n01',
    background:
      'radial-gradient(circle at 50% 38%, #f7dd90 0 5%, transparent 6%), radial-gradient(circle at 50% 38%, transparent 0 24%, #ee9b5b 25% 26%, transparent 27%), linear-gradient(160deg, #12252b 0%, #195f64 48%, #0c171e 100%)',
    ratio: 3 / 4,
  },
  {
    id: 4,
    title: 'Nexora Dashboard',
    creator: 'Frantz Design',
    category: 'UI/UX',
    year: '2026',
    description:
      'Eksplorasi dashboard komunitas dengan fokus pada hierarki informasi dan akses cepat.',
    label: 'NEXORA\nDASHBOARD',
    background:
      'linear-gradient(155deg, #101b3c 0%, #324ea3 44%, #7ba7ff 100%)',
    ratio: 16 / 10,
  },
  {
    id: 5,
    title: 'Pulse',
    creator: 'Vien Motion',
    category: 'Motion',
    year: '2026',
    description:
      'Frame konsep untuk identitas motion graphic yang dinamis dan berani.',
    label: 'PULSE',
    background:
      'radial-gradient(ellipse at 25% 80%, #ffd45b 0 7%, transparent 8%), linear-gradient(125deg, #f0443c 0%, #f07c3d 42%, #f7c950 100%)',
    ratio: 4 / 5,
  },
  {
    id: 6,
    title: 'Quiet Type',
    creator: 'Seyu Studio',
    category: 'Poster',
    year: '2026',
    description:
      'Komposisi editorial yang menempatkan tipografi sebagai elemen utama.',
    label: 'QUIET\nTYPE',
    background:
      'linear-gradient(135deg, #dfe3e8 0%, #a6b0bd 52%, #424b5a 100%)',
    ratio: 3 / 4,
  },
];

export default function Home() {
  const [introVisible, setIntroVisible] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('Semua');
  const [query, setQuery] = useState('');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);

  useEffect(() => {
    const hasVisited = window.sessionStorage.getItem('nexora-gallery-intro');
    if (hasVisited) {
      setIntroVisible(false);
    }
  }, []);

  const enterGallery = () => {
    window.sessionStorage.setItem('nexora-gallery-intro', 'seen');
    setIntroVisible(false);
  };

  const filteredWorks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return works.filter((work) => {
      const matchesCategory =
        activeCategory === 'Semua' || work.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${work.title} ${work.creator} ${work.category}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <main className="nexora-shell">
      {introVisible && (
        <div className="intro-screen" role="dialog" aria-label="Nexora intro">
          <div className="intro-glow intro-glow-one" />
          <div className="intro-glow intro-glow-two" />
          <div className="intro-mark" aria-hidden="true">
            N
          </div>
          <p className="eyebrow intro-eyebrow">NEXORA CREATIVE GALLERY</p>
          <h1>
            Create.
            <br />
            Inspire.
            <br />
            Connect.
          </h1>
          <p className="intro-copy">
            Sebuah ruang untuk karya, cerita, dan orang-orang kreatif.
          </p>
          <button className="intro-button" type="button" onClick={enterGallery}>
            Masuk ke galeri <span>↗</span>
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
          Kirim karya <span>↗</span>
        </a>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow">RUANG KARYA DIGITAL</p>
          <h2>
            Ide yang
            <br />
            <em>menjadi nyata.</em>
          </h2>
          <p className="hero-description">
            Temukan karya visual dari kreator Nexora. Jelajahi proses,
            kenali pembuatnya, dan hubungi mereka untuk berkolaborasi.
          </p>
          <a className="primary-button" href="#gallery">
            Jelajahi karya <span>↓</span>
          </a>
        </div>

        <div className="hero-art" aria-label="Karya unggulan Afterglow">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-sun" />
          <div className="hero-word">NEXORA</div>
          <div className="hero-caption">
            <span>01 / FEATURED WORK</span>
            <strong>Afterglow</strong>
            <small>Poster · Nexora Studio</small>
          </div>
          <span className="hero-number">01</span>
        </div>
      </section>

      <section className="gallery-section" id="gallery">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CURATED COLLECTION</p>
            <h2>Karya pilihan</h2>
          </div>
          <p className="section-note">
            Koleksi visual yang dibuat oleh kreator
            <br className="desktop-break" /> di dalam ekosistem Nexora.
          </p>
        </div>

        <div className="gallery-toolbar">
          <div className="category-list" aria-label="Filter kategori">
            {categories.map((category) => (
              <button
                className={activeCategory === category ? 'selected' : ''}
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

        <div className="work-grid">
          {filteredWorks.map((work, index) => (
            <button
              className="work-card"
              key={work.id}
              type="button"
              style={{ animationDelay: `${index * 70}ms` }}
              onClick={() => setSelectedWork(work)}
            >
              <div
                className={`work-art ${work.imageUrl ? 'has-image' : ''}`}
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
                {work.imageUrl && (
                  <img
                    className="work-image"
                    src={work.imageUrl}
                    alt={work.title}
                    loading="lazy"
                  />
                )}
                {!work.imageUrl && (
                  <span className="art-label">
                    {work.label.split('\n').map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                )}
                <span className="art-index">0{work.id}</span>
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
            <p>Tidak ada karya yang cocok.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setActiveCategory('Semua');
              }}
            >
              Reset pencarian
            </button>
          </div>
        )}
      </section>

      <section className="about-section" id="about">
        <div>
          <p className="eyebrow">WHY NEXORA</p>
          <h2>Karya punya cerita.</h2>
        </div>
        <p>
          Nexora Creative Gallery dibuat untuk mempertemukan karya visual
          dengan orang yang membuatnya. Setiap karya memiliki proses, sudut
          pandang, dan kontak yang bisa kamu kenali lebih dekat.
        </p>
      </section>

      <section className="submit-section" id="submit">
        <p className="eyebrow">PUNYA KARYA?</p>
        <h2>Tunjukkan ke dunia.</h2>
        <a
          className="primary-button"
          href="https://wa.me/"
          rel="noreferrer"
          target="_blank"
        >
          Hubungi Nexora <span>↗</span>
        </a>
      </section>

      <footer className="site-footer">
        <span>© 2026 NEXORA CREATIVE GALLERY</span>
        <span>Learn · Create · Connect · Grow</span>
      </footer>

      {selectedWork && (
        <div
          className="work-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedWork(null)}
        >
          <div
            className="work-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedWork.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`modal-art ${selectedWork.imageUrl ? 'has-image' : ''}`}
              style={
                selectedWork.imageUrl
                  ? undefined
                  : {
                      aspectRatio: selectedWork.ratio,
                      background: selectedWork.background,
                    }
              }
            >
              <span className="art-category">{selectedWork.category}</span>
              {selectedWork.imageUrl && (
                <img
                  className="work-image"
                  src={selectedWork.imageUrl}
                  alt={selectedWork.title}
                />
              )}
              {!selectedWork.imageUrl && (
                <span className="art-label">
                  {selectedWork.label.split('\n').map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              )}
            </div>
            <div className="modal-content">
              <button
                className="modal-close"
                type="button"
                aria-label="Tutup detail"
                onClick={() => setSelectedWork(null)}
              >
                ×
              </button>
              <p className="eyebrow">{selectedWork.category} · {selectedWork.year}</p>
              <h2>{selectedWork.title}</h2>
              <p className="modal-creator">Dibuat oleh {selectedWork.creator}</p>
              <p className="modal-description">{selectedWork.description}</p>
              <a
                className="primary-button"
                href="https://wa.me/"
                rel="noreferrer"
                target="_blank"
              >
                Hubungi kreator <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
