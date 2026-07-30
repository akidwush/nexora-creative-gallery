"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./login.module.css";

type LoginApiResponse = {
  access_token?: string;
  refresh_token?: string;
  error?: string;
};

export default function AdminLoginPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkExistingSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (active) {
          setHasSession(Boolean(session));
        }
      } catch {
        // The form remains usable even if a stale browser session cannot be read.
      }
    }

    void checkExistingSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setErrorMessage("Email dan password wajib diisi.");
      setIsLoading(false);
      return;
    }

    let loginAccepted = false;

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15000);
      let response: Response;
      let payload: LoginApiResponse;

      try {
        response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          cache: "no-store",
          signal: controller.signal,
        });
        payload = (await response.json().catch(() => ({}))) as LoginApiResponse;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error(
            "Permintaan login terlalu lama. Periksa koneksi lalu coba lagi.",
          );
        }
        throw error;
      } finally {
        window.clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const message = payload.error ?? `Login gagal (HTTP ${response.status}).`;
        const isInvalidCredential = message
          .toLowerCase()
          .includes("invalid login credentials");

        setErrorMessage(
          isInvalidCredential
            ? "Email atau password salah. Silakan periksa kembali."
            : message,
        );
        return;
      }

      if (!payload.access_token || !payload.refresh_token) {
        setErrorMessage("Sesi login tidak diterima dari server.");
        return;
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.setSession({
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
        });

      if (sessionError || !sessionData.session) {
        setErrorMessage(
          sessionError?.message ??
            "Sesi login gagal disimpan di browser. Coba ulangi.",
        );
        return;
      }

      loginAccepted = true;
      setHasSession(true);
      setSuccessMessage(
        "Login berhasil. Membuka dashboard… Jika belum berpindah, tekan tautan di bawah.",
      );

      // A full navigation avoids stale Next.js client state on a phone browser.
      window.location.assign("/admin");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghubungi Supabase.",
      );
    } finally {
      // Keep the success state visible while the browser navigates.
      if (!loginAccepted) {
        setIsLoading(false);
      }
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.glowOne} />
      <div className={styles.glowTwo} />

      <Link className={styles.backLink} href="/">
        ← Kembali ke galeri
      </Link>

      <section className={styles.card}>
        <div className={styles.brandMark}>N</div>
        <p className={styles.eyebrow}>NEXORA CREATIVE GALLERY</p>
        <h1>Masuk ke dashboard.</h1>
        <p className={styles.description}>
          Kelola karya, kreator, kategori, dan informasi galeri dari satu
          tempat.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            <span>Email admin</span>
            <input
              autoComplete="email"
              inputMode="email"
              name="email"
              placeholder="admin@nexora.id"
              required
              type="email"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              placeholder="Masukkan password"
              required
              type="password"
            />
          </label>

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

          <button disabled={isLoading} type="submit">
            {isLoading ? "Memeriksa akun..." : "Masuk ke dashboard"}
            <span>↗</span>
          </button>

          {successMessage && (
            <Link className={styles.fallbackLink} href="/admin">
              Buka dashboard sekarang →
            </Link>
          )}
        </form>

        {hasSession && !successMessage && (
          <p className={styles.sessionNote}>
            Sesi sebelumnya masih aktif.{" "}
            <Link href="/admin">Buka dashboard →</Link>
          </p>
        )}

        <p className={styles.securityNote}>
          Akses hanya tersedia untuk akun admin dan editor Nexora.
        </p>
      </section>
    </main>
  );
}
