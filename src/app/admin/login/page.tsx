"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import NexoraLogoMark from "@/components/nexora-logo-mark";
import { supabase } from "@/lib/supabase";
import styles from "./login.module.css";

function getFriendlyAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Email atau password salah. Silakan periksa kembali.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Email akun belum dikonfirmasi di Supabase Auth.";
  }

  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network")
  ) {
    return "Supabase tidak dapat dijangkau. Periksa koneksi lalu coba lagi.";
  }

  return message;
}

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
    let timeoutId: number | null = null;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(
            new Error(
              "Permintaan login terlalu lama. Periksa koneksi lalu coba lagi.",
            ),
          );
        }, 20000);
      });

      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeoutPromise,
      ]);

      if (error) {
        setErrorMessage(getFriendlyAuthError(error.message));
        return;
      }

      if (!data.session) {
        setErrorMessage(
          "Login diterima, tetapi Supabase tidak membuat sesi browser.",
        );
        return;
      }

      loginAccepted = true;
      setHasSession(true);
      setSuccessMessage(
        "Login berhasil. Membuka dashboard… Jika belum berpindah, tekan tautan di bawah.",
      );

      // A full replacement avoids stale router state on Android browsers.
      window.location.replace("/admin");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? getFriendlyAuthError(error.message)
          : "Terjadi kesalahan saat menghubungi Supabase.",
      );
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

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
        <NexoraLogoMark className={styles.brandMark} />
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
