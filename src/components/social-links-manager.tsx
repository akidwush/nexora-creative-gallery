"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  EMPTY_SOCIAL_LINK_FORM,
  getSocialPlatformMeta,
  getSocialUrlHostname,
  isSocialPlatform,
  normalizeSocialLabel,
  normalizeSocialUrl,
  SOCIAL_PLATFORM_OPTIONS,
} from "@/lib/social-links";
import type {
  NexoraSocialLink,
  SocialLinkForm,
  SocialPlatform,
} from "@/lib/social-links";
import { NEXORA_SOCIAL_LINKS_TABLE } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import styles from "./social-links-manager.module.css";

const SOCIAL_LINKS_UPDATED_KEY = "nexora-social-links-updated-at";

function getDatabaseErrorMessage(error: { code?: string; message: string }) {
  const message = error.message.toLowerCase();

  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("nexora_social_links") && message.includes("schema cache"))
  ) {
    return "Tabel sosial media belum tersedia. Jalankan supabase/add_nexora_social_links.sql di Supabase SQL Editor.";
  }

  if (error.code === "42501" || message.includes("row-level security")) {
    return "Akun ini tidak memiliki izin untuk mengubah sosial media Nexora.";
  }

  return `Sosial media gagal diproses: ${error.message}`;
}

function notifySocialLinksUpdated() {
  const timestamp = String(Date.now());
  try {
    window.localStorage.setItem(SOCIAL_LINKS_UPDATED_KEY, timestamp);
  } catch {
    // Realtime dan event lokal tetap menyinkronkan UI bila storage diblokir.
  }
  window.dispatchEvent(new Event("nexora-social-links-updated"));
}

export default function SocialLinksManager() {
  const [links, setLinks] = useState<NexoraSocialLink[]>([]);
  const [form, setForm] = useState<SocialLinkForm>(EMPTY_SOCIAL_LINK_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadLinks = useCallback(async () => {
    const { data, error } = await supabase
      .from(NEXORA_SOCIAL_LINKS_TABLE)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      setLinks([]);
      setErrorMessage(getDatabaseErrorMessage(error));
      setIsLoading(false);
      return;
    }

    setLinks((data ?? []) as NexoraSocialLink[]);
    setErrorMessage("");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const loadFrame = window.requestAnimationFrame(() => {
      void loadLinks();
    });

    const realtimeChannel = supabase
      .channel("nexora-admin-social-links-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nexora_social_links" },
        () => void loadLinks(),
      )
      .subscribe();

    return () => {
      window.cancelAnimationFrame(loadFrame);
      void supabase.removeChannel(realtimeChannel);
    };
  }, [loadLinks]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_SOCIAL_LINK_FORM);
  };

  const updateForm = <Key extends keyof SocialLinkForm>(
    key: Key,
    value: SocialLinkForm[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handlePlatformChange = (value: string) => {
    if (!isSocialPlatform(value)) return;

    const previousDefaultLabel = getSocialPlatformMeta(form.platform).label;
    const nextDefaultLabel = getSocialPlatformMeta(value).label;
    setForm((current) => ({
      ...current,
      platform: value,
      label:
        !current.label.trim() || current.label === previousDefaultLabel
          ? nextDefaultLabel
          : current.label,
    }));
  };

  const startEditing = (link: NexoraSocialLink) => {
    const platform: SocialPlatform = isSocialPlatform(link.platform)
      ? link.platform
      : "other";

    setEditingId(link.id);
    setForm({
      platform,
      label: link.label,
      url: link.url,
      isActive: link.is_active,
    });
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        platform: form.platform,
        label: normalizeSocialLabel(form.label),
        url: normalizeSocialUrl(form.url),
        is_active: form.isActive,
      };

      if (editingId) {
        const { error } = await supabase
          .from(NEXORA_SOCIAL_LINKS_TABLE)
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        setSuccessMessage("Tautan sosial berhasil diperbarui.");
      } else {
        const nextSortOrder =
          links.reduce(
            (highest, link) => Math.max(highest, link.sort_order),
            0,
          ) + 10;
        const { error } = await supabase
          .from(NEXORA_SOCIAL_LINKS_TABLE)
          .insert({ ...payload, sort_order: nextSortOrder });

        if (error) throw error;
        setSuccessMessage("Tautan sosial berhasil ditambahkan.");
      }

      resetForm();
      await loadLinks();
      notifySocialLinksUpdated();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        setErrorMessage(
          getDatabaseErrorMessage({
            code:
              "code" in error && typeof error.code === "string"
                ? error.code
                : undefined,
            message: error.message,
          }),
        );
      } else {
        setErrorMessage("Tautan sosial gagal disimpan.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLink = async (link: NexoraSocialLink) => {
    setBusyId(link.id);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from(NEXORA_SOCIAL_LINKS_TABLE)
      .update({ is_active: !link.is_active })
      .eq("id", link.id);

    if (error) {
      setErrorMessage(getDatabaseErrorMessage(error));
    } else {
      setSuccessMessage(
        link.is_active
          ? `${link.label} dinonaktifkan dari halaman publik.`
          : `${link.label} diaktifkan di halaman publik.`,
      );
      await loadLinks();
      notifySocialLinksUpdated();
    }

    setBusyId(null);
  };

  const moveLink = async (linkId: string, direction: -1 | 1) => {
    const currentIndex = links.findIndex((link) => link.id === linkId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= links.length) {
      return;
    }

    const reordered = [...links];
    const [movedLink] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedLink);
    setBusyId(linkId);
    setErrorMessage("");
    setSuccessMessage("");

    const results = await Promise.all(
      reordered.map((link, index) =>
        supabase
          .from(NEXORA_SOCIAL_LINKS_TABLE)
          .update({ sort_order: (index + 1) * 10 })
          .eq("id", link.id),
      ),
    );
    const firstError = results.find((result) => result.error)?.error;

    if (firstError) {
      setErrorMessage(getDatabaseErrorMessage(firstError));
    } else {
      setSuccessMessage("Urutan sosial media berhasil diperbarui.");
      await loadLinks();
      notifySocialLinksUpdated();
    }

    setBusyId(null);
  };

  const deleteLink = async (link: NexoraSocialLink) => {
    if (!window.confirm(`Hapus tautan ${link.label}?`)) return;

    setBusyId(link.id);
    setErrorMessage("");
    setSuccessMessage("");
    const { error } = await supabase
      .from(NEXORA_SOCIAL_LINKS_TABLE)
      .delete()
      .eq("id", link.id);

    if (error) {
      setErrorMessage(getDatabaseErrorMessage(error));
    } else {
      if (editingId === link.id) resetForm();
      setSuccessMessage(`${link.label} berhasil dihapus.`);
      await loadLinks();
      notifySocialLinksUpdated();
    }

    setBusyId(null);
  };

  return (
    <section className={styles.manager} aria-labelledby="social-manager-title">
      <div className={styles.heading}>
        <div>
          <p>SOSIAL MEDIA NEXORA</p>
          <h2 id="social-manager-title">Kelola semua tautan.</h2>
          <span>
            Perubahan aktif langsung muncul pada tombol sosial media di halaman
            publik.
          </span>
        </div>
        <span className={styles.count}>{links.length} tautan</span>
      </div>

      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p className={styles.success} role="status">
          {successMessage}
        </p>
      )}

      <div className={styles.layout}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formHeading}>
            <strong>{editingId ? "Edit tautan" : "Tambah tautan"}</strong>
            {editingId && (
              <button type="button" onClick={resetForm}>
                Batal
              </button>
            )}
          </div>

          <label>
            <span>Platform</span>
            <select
              value={form.platform}
              onChange={(event) => handlePlatformChange(event.target.value)}
            >
              {SOCIAL_PLATFORM_OPTIONS.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Nama yang tampil</span>
            <input
              maxLength={50}
              placeholder="Contoh: Instagram Nexora"
              required
              value={form.label}
              onChange={(event) => updateForm("label", event.target.value)}
            />
          </label>

          <label>
            <span>URL tujuan</span>
            <input
              inputMode="url"
              maxLength={2048}
              placeholder="instagram.com/nexora"
              required
              value={form.url}
              onChange={(event) => updateForm("url", event.target.value)}
            />
          </label>

          <label className={styles.activeToggle}>
            <input
              checked={form.isActive}
              type="checkbox"
              onChange={(event) =>
                updateForm("isActive", event.target.checked)
              }
            />
            <span>
              <strong>Aktifkan di halaman publik</strong>
              <small>Bisa dinonaktifkan tanpa menghapus URL.</small>
            </span>
          </label>

          <button
            className={styles.saveButton}
            disabled={isSaving}
            type="submit"
          >
            {isSaving
              ? "Menyimpan..."
              : editingId
                ? "Simpan perubahan"
                : "Tambah sosial media"}
            <span aria-hidden="true">↗</span>
          </button>
        </form>

        <div className={styles.list} aria-live="polite">
          {isLoading ? (
            <div className={styles.emptyState}>Memuat sosial media...</div>
          ) : links.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>Belum ada tautan.</strong>
              <span>Tambahkan akun pertama melalui form di samping.</span>
            </div>
          ) : (
            links.map((link, index) => {
              const platform = getSocialPlatformMeta(link.platform);
              const isBusy = busyId === link.id;

              return (
                <article className={styles.item} key={link.id}>
                  <span className={styles.mark} aria-hidden="true">
                    {platform.mark}
                  </span>
                  <div className={styles.itemInfo}>
                    <div>
                      <strong>{link.label}</strong>
                      <small>{getSocialUrlHostname(link.url)}</small>
                    </div>
                    <span
                      className={
                        link.is_active ? styles.active : styles.inactive
                      }
                    >
                      {link.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      aria-label={`Naikkan urutan ${link.label}`}
                      disabled={isBusy || index === 0}
                      type="button"
                      onClick={() => void moveLink(link.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`Turunkan urutan ${link.label}`}
                      disabled={isBusy || index === links.length - 1}
                      type="button"
                      onClick={() => void moveLink(link.id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      disabled={isBusy}
                      type="button"
                      onClick={() => startEditing(link)}
                    >
                      Edit
                    </button>
                    <button
                      disabled={isBusy}
                      type="button"
                      onClick={() => void toggleLink(link)}
                    >
                      {link.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <a
                      href={link.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Coba ↗
                    </a>
                    <button
                      className={styles.deleteButton}
                      disabled={isBusy}
                      type="button"
                      onClick={() => void deleteLink(link)}
                    >
                      Hapus
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
