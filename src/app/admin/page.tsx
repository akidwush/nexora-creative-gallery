"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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

const emptyStats: DashboardStats = {
  works: 0,
  creators: 0,
  categories: 0,
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          router.replace("/admin/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("display_name, role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!active) return;

        // Do not silently sign out and bounce back to the login screen. This
        // makes RLS/profile problems visible while keeping the authenticated
        // session available for the user to fix.
        if (profileError || !profileData) {
          setProfile({
            display_name: session.user.email ?? "Nexora Admin",
            role: "admin",
          });
          setErrorMessage(
            profileError
              ? `Sesi aktif, tetapi profil admin belum terbaca: ${profileError.message}`
              : "Sesi aktif, tetapi baris profil admin belum ditemukan.",
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

        const [worksResult, creatorsResult, categoriesResult] =
          await Promise.all([
            supabase.from("works").select("*", { count: "exact", head: true }),
            supabase
              .from("creators")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("categories")
              .select("*", { count: "exact", head: true }),
          ]);

        if (!active) return;

        if (
          worksResult.error ||
          creatorsResult.error ||
          categoriesResult.error
        ) {
          setErrorMessage((current) =>
            current ||
            "Dashboard terhubung, tetapi statistik belum dapat dimuat.",
          );
        }

        setStats({
          works: worksResult.count ?? 0,
          creators: creatorsResult.count ?? 0,
          categories: categoriesResult.count ?? 0,
        });
        setIsLoading(false);
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error instanceof Error
            ? `Dashboard gagal dimuat: ${error.message}`
            : "Dashboard gagal dimuat. Coba muat ulang halaman.",
        );
        setIsLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

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
          <h1>Selamat datang.</h1>
          <span>
            Kelola seluruh isi Nexora Creative Gallery dari halaman ini.
          </span>
        </div>

        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

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

        <div className={styles.nextPanel}>
          <div>
            <p>TAHAP BERIKUTNYA</p>
            <h2>Upload karya pertama</h2>
            <span>
              Form upload gambar, informasi kreator, sosial media, dan WhatsApp
              akan ditambahkan setelah login ini terverifikasi.
            </span>
          </div>
          <button disabled type="button">
            Segera tersedia
          </button>
        </div>
      </section>
    </main>
  );
}
