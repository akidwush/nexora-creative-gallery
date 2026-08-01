"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSocialPlatformMeta,
  getSocialUrlHostname,
} from "@/lib/social-links";
import type { NexoraSocialLink } from "@/lib/social-links";
import { NEXORA_SOCIAL_LINKS_TABLE } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import styles from "./nexora-social-links.module.css";

const SOCIAL_LINKS_UPDATED_KEY = "nexora-social-links-updated-at";

export default function NexoraSocialLinks() {
  const [links, setLinks] = useState<NexoraSocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const loadLinks = useCallback(async () => {
    const { data, error } = await supabase
      .from(NEXORA_SOCIAL_LINKS_TABLE)
      .select("id,platform,label,url,sort_order,is_active,created_at,updated_at")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      setLinks([]);
      setHasLoadError(true);
      setIsLoading(false);
      return;
    }

    setLinks((data ?? []) as NexoraSocialLink[]);
    setHasLoadError(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const refreshLinks = () => {
      void loadLinks();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SOCIAL_LINKS_UPDATED_KEY) refreshLinks();
    };

    const loadFrame = window.requestAnimationFrame(() => {
      void loadLinks();
    });
    window.addEventListener("focus", refreshLinks);
    window.addEventListener("pageshow", refreshLinks);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("nexora-social-links-updated", refreshLinks);

    const realtimeChannel = supabase
      .channel("nexora-public-social-links-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nexora_social_links" },
        refreshLinks,
      )
      .subscribe();

    return () => {
      window.cancelAnimationFrame(loadFrame);
      window.removeEventListener("focus", refreshLinks);
      window.removeEventListener("pageshow", refreshLinks);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("nexora-social-links-updated", refreshLinks);
      void supabase.removeChannel(realtimeChannel);
    };
  }, [loadLinks]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      closeRef.current?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <button
        aria-controls="nexora-social-links-dialog"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`primary-button ${styles.trigger}`}
        disabled={isLoading}
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
      >
        {isLoading ? "Memuat sosial media..." : "Semua sosial media Nexora"}
        <span aria-hidden="true">↗</span>
      </button>

      {isOpen && (
        <div
          className={styles.backdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setIsOpen(false);
          }}
        >
          <section
            aria-describedby="nexora-social-links-description"
            aria-labelledby="nexora-social-links-title"
            aria-modal="true"
            className={styles.dialog}
            id="nexora-social-links-dialog"
            role="dialog"
          >
            <header className={styles.header}>
              <div>
                <p>TERHUBUNG DENGAN NEXORA</p>
                <h2 id="nexora-social-links-title">Temukan kami di mana saja.</h2>
              </div>
              <button
                aria-label="Tutup daftar sosial media"
                className={styles.closeButton}
                ref={closeRef}
                type="button"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </header>

            <p
              className={styles.description}
              id="nexora-social-links-description"
            >
              Pilih kanal resmi Nexora yang ingin kamu kunjungi.
            </p>

            {links.length > 0 ? (
              <div className={styles.linkGrid}>
                {links.map((link) => {
                  const platform = getSocialPlatformMeta(link.platform);

                  return (
                    <a
                      className={styles.socialLink}
                      href={link.url}
                      key={link.id}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span className={styles.platformMark} aria-hidden="true">
                        {platform.mark}
                      </span>
                      <span className={styles.linkText}>
                        <strong>{link.label}</strong>
                        <small>{getSocialUrlHostname(link.url)}</small>
                      </span>
                      <span className={styles.linkArrow} aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState} role="status">
                <strong>
                  {hasLoadError
                    ? "Daftar sosial media belum siap."
                    : "Belum ada tautan yang aktif."}
                </strong>
                <span>
                  Admin dapat menambah dan mengaktifkannya melalui dashboard.
                </span>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
