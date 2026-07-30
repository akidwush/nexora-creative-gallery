"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import {
  createSafeFileName,
  EMPTY_WORK_FORM,
  GALLERY_BUCKET,
  normalizeOptionalUrl,
  normalizeWhatsAppNumber,
  slugify,
} from "@/lib/gallery";
import type {
  GalleryCategory,
  GalleryCreator,
  GalleryWork,
  GalleryWorkForm,
} from "@/lib/gallery";
import styles from "./admin.module.css";

type StaffProfile = {
  display_name: string | null;
  role: "admin" | "editor";
};

type DashboardStats = {
  works: number;
  creators: number;
  categories: number;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export default function AdminDashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [sessionUserId, setSessionUserId] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    works: 0,
    creators: 0,
    categories: 0,
  });
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [creators, setCreators] = useState<GalleryCreator[]>([]);
  const [works, setWorks] = useState<GalleryWork[]>([]);
  const [form, setForm] = useState<GalleryWorkForm>(EMPTY_WORK_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const creatorSuggestions = useMemo(
    () => creators.map((creator) => creator.name),
    [creators],
  );

  const loadGalleryData = useCallback(async () => {
    const [worksResult, creatorsResult, categoriesResult] = await Promise.all([
      supabase
        .from("gallery_works")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("gallery_creators")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .from("gallery_categories")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

    const firstError =
      worksResult.error ?? creatorsResult.error ?? categoriesResult.error;

    if (firstError) {
      throw new Error(
        `Database galeri belum siap: ${firstError.message}. Jalankan file SQL yang disertakan di Supabase SQL Editor.`,
      );
    }

    const nextWorks = (worksResult.data ?? []) as GalleryWork[];
    const nextCreators = (creatorsResult.data ?? []) as GalleryCreator[];
    const nextCategories = (categoriesResult.data ?? []) as GalleryCategory[];

    setWorks(nextWorks);
    setCreators(nextCreators);
    setCategories(nextCategories);
    setStats({
      works: nextWorks.length,
      creators: nextCreators.length,
      categories: nextCategories.length,
    });

    if (nextCategories.length > 0) {
      setForm((current) => ({
        ...current,
        category:
          nextCategories.some((item) => item.name === current.category)
            ? current.category
            : nextCategories[0].name,
      }));
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          router.replace("/admin/login");
          return;
        }

        if (!active) return;
        setSessionUserId(session.user.id);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("display_name, role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!active) return;

        if (profileError || !profileData) {
          setProfile({
            display_name: session.user.email ?? "Nexora Admin",
            role: "admin",
          });
          setErrorMessage(
            profileError
              ? `Sesi aktif, tetapi profil admin belum terbaca: ${profileError.message}`
              : "Sesi aktif, tetapi baris profil admin belum ditemukan. Upload akan ditolak sampai profil dibuat.",
          );
        } else if (
          profileData.role !== "admin" &&
          profileData.role !== "editor"
        ) {
          await supabase.auth.signOut();
          router.replace("/admin/login");
          return;
        } else {
          setProfile(profileData as StaffProfile);
        }

        await loadGalleryData();
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Dashboard gagal dimuat. Coba muat ulang halaman.",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [loadGalleryData, router]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  function updateForm<Key extends keyof GalleryWorkForm>(
    key: Key,
    value: GalleryWorkForm[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm({
      ...EMPTY_WORK_FORM,
      category: categories[0]?.name ?? EMPTY_WORK_FORM.category,
    });
    setSelectedFile(null);
    setEditingWorkId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function fillCreatorDetails(name: string) {
    updateForm("creatorName", name);
    const creator = creators.find(
      (item) => item.name.toLowerCase() === name.trim().toLowerCase(),
    );

    if (!creator) return;

    setForm((current) => ({
      ...current,
      creatorName: creator.name,
      creatorWhatsapp: creator.whatsapp ?? "",
      creatorInstagramUrl: creator.instagram_url ?? "",
      creatorPortfolioUrl: creator.portfolio_url ?? "",
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const title = form.title.trim();
    const creatorName = form.creatorName.trim();
    const description = form.description.trim();
    const year = Number(form.year);

    if (!title || !creatorName || !form.category || !description) {
      setErrorMessage(
        "Judul, kategori, nama kreator, dan deskripsi wajib diisi.",
      );
      return;
    }

    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      setErrorMessage("Tahun karya tidak valid.");
      return;
    }

    const existingWork = editingWorkId
      ? works.find((work) => work.id === editingWorkId)
      : null;

    if (!existingWork && !selectedFile) {
      setErrorMessage("Pilih gambar karya terlebih dahulu.");
      return;
    }

    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setErrorMessage("File harus berupa gambar JPG, PNG, WEBP, atau GIF.");
        return;
      }

      if (selectedFile.size > MAX_IMAGE_BYTES) {
        setErrorMessage("Ukuran gambar maksimal 10 MB.");
        return;
      }
    }

    if (!sessionUserId) {
      setErrorMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    setIsSubmitting(true);
    let uploadedPath = "";
    let uploadCommitted = false;

    try {
      let imagePath = existingWork?.image_path ?? "";
      let imageUrl = existingWork?.image_url ?? "";

      if (selectedFile) {
        uploadedPath = `${sessionUserId}/${Date.now()}-${createSafeFileName(
          selectedFile.name,
        )}`;

        const { error: uploadError } = await supabase.storage
          .from(GALLERY_BUCKET)
          .upload(uploadedPath, selectedFile, {
            cacheControl: "3600",
            contentType: selectedFile.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(GALLERY_BUCKET)
          .getPublicUrl(uploadedPath);

        imagePath = uploadedPath;
        imageUrl = publicUrlData.publicUrl;
      }

      const creatorPayload = {
        name: creatorName,
        slug: slugify(creatorName) || `creator-${Date.now()}`,
        whatsapp: normalizeWhatsAppNumber(form.creatorWhatsapp) || null,
        instagram_url: normalizeOptionalUrl(form.creatorInstagramUrl),
        portfolio_url: normalizeOptionalUrl(form.creatorPortfolioUrl),
      };

      const { error: creatorError } = await supabase
        .from("gallery_creators")
        .upsert(creatorPayload, { onConflict: "slug" });

      if (creatorError) throw creatorError;

      const workPayload = {
        title,
        description,
        category: form.category,
        creator_name: creatorPayload.name,
        creator_whatsapp: creatorPayload.whatsapp,
        creator_instagram_url: creatorPayload.instagram_url,
        creator_portfolio_url: creatorPayload.portfolio_url,
        image_url: imageUrl,
        image_path: imagePath,
        year,
        is_featured: form.isFeatured,
        is_published: form.isPublished,
        created_by: sessionUserId,
        updated_at: new Date().toISOString(),
      };

      if (existingWork) {
        const { error: updateError } = await supabase
          .from("gallery_works")
          .update(workPayload)
          .eq("id", existingWork.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("gallery_works")
          .insert(workPayload);

        if (insertError) throw insertError;
      }

      uploadCommitted = true;

      if (
        selectedFile &&
        existingWork?.image_path &&
        existingWork.image_path !== uploadedPath
      ) {
        await supabase.storage
          .from(GALLERY_BUCKET)
          .remove([existingWork.image_path]);
      }

      await loadGalleryData();
      resetForm();
      setSuccessMessage(
        existingWork
          ? "Karya berhasil diperbarui."
          : "Karya berhasil diunggah dan langsung masuk ke galeri.",
      );
    } catch (error) {
      if (uploadedPath && !uploadCommitted) {
        await supabase.storage.from(GALLERY_BUCKET).remove([uploadedPath]);
      }

      setErrorMessage(
        error instanceof Error
          ? `Gagal menyimpan karya: ${error.message}`
          : "Gagal menyimpan karya.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(work: GalleryWork) {
    setEditingWorkId(work.id);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setForm({
      title: work.title,
      description: work.description,
      category: work.category,
      creatorName: work.creator_name,
      creatorWhatsapp: work.creator_whatsapp ?? "",
      creatorInstagramUrl: work.creator_instagram_url ?? "",
      creatorPortfolioUrl: work.creator_portfolio_url ?? "",
      year: String(work.year),
      isFeatured: work.is_featured,
      isPublished: work.is_published,
    });
    setSuccessMessage("");
    setErrorMessage("");
    document.getElementById("work-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function handleDelete(work: GalleryWork) {
    const confirmed = window.confirm(
      `Hapus karya \"${work.title}\"? Tindakan ini tidak dapat dibatalkan.`,
    );
    if (!confirmed) return;

    setDeletingId(work.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error: deleteError } = await supabase
        .from("gallery_works")
        .delete()
        .eq("id", work.id);

      if (deleteError) throw deleteError;

      if (work.image_path) {
        const { error: storageError } = await supabase.storage
          .from(GALLERY_BUCKET)
          .remove([work.image_path]);

        if (storageError) {
          setErrorMessage(
            `Data karya terhapus, tetapi file gambar gagal dibersihkan: ${storageError.message}`,
          );
        }
      }

      if (editingWorkId === work.id) resetForm();
      await loadGalleryData();
      setSuccessMessage("Karya berhasil dihapus.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Gagal menghapus karya: ${error.message}`
          : "Gagal menghapus karya.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  if (isLoading) {
    return (
      <main className={styles.loadingPage}>
        <span className={styles.loadingMark}>N</span>
        <p>Menyiapkan dashboard...</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span>N</span>
          <div>
            <strong>NEXORA</strong>
            <small>ADMIN GALLERY</small>
          </div>
        </Link>

        <div className={styles.account}>
          <span>
            <strong>{profile?.display_name || "Nexora Admin"}</strong>
            <small>{profile?.role}</small>
          </span>
          <button type="button" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </header>

      <section className={styles.content}>
        <div className={styles.welcome}>
          <p>DASHBOARD OVERVIEW</p>
          <h1>Kelola galeri.</h1>
          <span>
            Unggah karya, simpan kontak kreator, atur publikasi, dan kelola
            koleksi Nexora dari satu halaman.
          </span>
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

        <div className={styles.statsGrid}>
          <article>
            <span>01</span>
            <strong>{stats.works}</strong>
            <p>Total karya</p>
          </article>
          <article>
            <span>02</span>
            <strong>{stats.creators}</strong>
            <p>Kreator</p>
          </article>
          <article>
            <span>03</span>
            <strong>{stats.categories}</strong>
            <p>Kategori</p>
          </article>
        </div>

        <section className={styles.workspace}>
          <form
            className={styles.formPanel}
            id="work-form"
            onSubmit={handleSubmit}
          >
            <div className={styles.panelHeading}>
              <div>
                <p>{editingWorkId ? "EDIT KARYA" : "UPLOAD KARYA"}</p>
                <h2>
                  {editingWorkId ? "Perbarui karya" : "Tambah karya baru"}
                </h2>
              </div>
              {editingWorkId && (
                <button
                  className={styles.cancelButton}
                  type="button"
                  onClick={resetForm}
                >
                  Batal edit
                </button>
              )}
            </div>

            <div className={styles.imageField}>
              <label htmlFor="work-image">
                <span>Gambar karya</span>
                <strong>
                  {selectedFile
                    ? selectedFile.name
                    : editingWorkId
                      ? "Pilih gambar baru untuk mengganti"
                      : "Tekan untuk memilih gambar"}
                </strong>
                <small>JPG, PNG, WEBP, atau GIF · maksimal 10 MB</small>
              </label>
              <input
                accept="image/jpeg,image/png,image/webp,image/gif"
                id="work-image"
                ref={fileInputRef}
                type="file"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
              />
              {(previewUrl ||
                (editingWorkId &&
                  works.find((work) => work.id === editingWorkId)?.image_url)) && (
                <img
                  alt="Pratinjau karya"
                  className={styles.imagePreview}
                  src={
                    previewUrl ||
                    works.find((work) => work.id === editingWorkId)
                      ?.image_url
                  }
                />
              )}
            </div>

            <div className={styles.formGrid}>
              <label className={styles.fullWidth}>
                <span>Judul karya</span>
                <input
                  maxLength={120}
                  placeholder="Contoh: Afterglow"
                  required
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                />
              </label>

              <label>
                <span>Kategori</span>
                <select
                  required
                  value={form.category}
                  onChange={(event) =>
                    updateForm("category", event.target.value)
                  }
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Tahun</span>
                <input
                  inputMode="numeric"
                  max="2200"
                  min="1900"
                  required
                  type="number"
                  value={form.year}
                  onChange={(event) => updateForm("year", event.target.value)}
                />
              </label>

              <label className={styles.fullWidth}>
                <span>Deskripsi</span>
                <textarea
                  maxLength={1000}
                  placeholder="Ceritakan konsep, proses, atau tujuan karya."
                  required
                  rows={5}
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                />
              </label>
            </div>

            <div className={styles.subheading}>
              <p>INFORMASI KREATOR</p>
              <span>Kontak ini akan muncul pada detail karya.</span>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.fullWidth}>
                <span>Nama kreator</span>
                <input
                  list="creator-suggestions"
                  maxLength={100}
                  placeholder="Nama atau studio"
                  required
                  value={form.creatorName}
                  onChange={(event) => fillCreatorDetails(event.target.value)}
                />
                <datalist id="creator-suggestions">
                  {creatorSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </label>

              <label>
                <span>WhatsApp</span>
                <input
                  inputMode="tel"
                  placeholder="08xxxxxxxxxx"
                  value={form.creatorWhatsapp}
                  onChange={(event) =>
                    updateForm("creatorWhatsapp", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Instagram</span>
                <input
                  inputMode="url"
                  placeholder="instagram.com/nama"
                  value={form.creatorInstagramUrl}
                  onChange={(event) =>
                    updateForm("creatorInstagramUrl", event.target.value)
                  }
                />
              </label>

              <label className={styles.fullWidth}>
                <span>Portfolio atau sosial media lain</span>
                <input
                  inputMode="url"
                  placeholder="behance.net/nama atau situs pribadi"
                  value={form.creatorPortfolioUrl}
                  onChange={(event) =>
                    updateForm("creatorPortfolioUrl", event.target.value)
                  }
                />
              </label>
            </div>

            <div className={styles.switchGrid}>
              <label>
                <input
                  checked={form.isPublished}
                  type="checkbox"
                  onChange={(event) =>
                    updateForm("isPublished", event.target.checked)
                  }
                />
                <span>
                  <strong>Publikasikan</strong>
                  <small>Tampilkan karya di halaman utama.</small>
                </span>
              </label>
              <label>
                <input
                  checked={form.isFeatured}
                  type="checkbox"
                  onChange={(event) =>
                    updateForm("isFeatured", event.target.checked)
                  }
                />
                <span>
                  <strong>Karya unggulan</strong>
                  <small>Prioritaskan karya pada area hero.</small>
                </span>
              </label>
            </div>

            <button
              className={styles.submitButton}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? "Menyimpan karya..."
                : editingWorkId
                  ? "Simpan perubahan"
                  : "Upload karya"}
              <span>↗</span>
            </button>
          </form>

          <section className={styles.listPanel}>
            <div className={styles.panelHeading}>
              <div>
                <p>KOLEKSI</p>
                <h2>Daftar karya</h2>
              </div>
              <span className={styles.itemCount}>{works.length} karya</span>
            </div>

            {works.length === 0 ? (
              <div className={styles.emptyList}>
                <strong>Belum ada karya.</strong>
                <span>Isi form di samping untuk mengunggah karya pertama.</span>
              </div>
            ) : (
              <div className={styles.workList}>
                {works.map((work) => (
                  <article className={styles.workItem} key={work.id}>
                    <img alt={work.title} src={work.image_url} />
                    <div className={styles.workInfo}>
                      <div>
                        <span>
                          {work.category} · {work.year}
                        </span>
                        <h3>{work.title}</h3>
                        <p>{work.creator_name}</p>
                      </div>
                      <div className={styles.badges}>
                        <small
                          className={
                            work.is_published
                              ? styles.published
                              : styles.draft
                          }
                        >
                          {work.is_published ? "Publik" : "Draft"}
                        </small>
                        {work.is_featured && <small>Unggulan</small>}
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button type="button" onClick={() => handleEdit(work)}>
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        disabled={deletingId === work.id}
                        type="button"
                        onClick={() => void handleDelete(work)}
                      >
                        {deletingId === work.id ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}
