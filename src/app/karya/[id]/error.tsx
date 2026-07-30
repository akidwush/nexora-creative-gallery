"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./detail.module.css";

export default function WorkDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.statePage}>
      <span className={styles.stateCode}>!</span>
      <h1>Detail karya gagal dimuat.</h1>
      <p>Periksa koneksi atau konfigurasi Supabase, lalu coba kembali.</p>
      <div className={styles.stateActions}>
        <button type="button" onClick={reset}>
          Coba lagi
        </button>
        <Link className={styles.stateLink} href="/#gallery">
          Kembali ke galeri
        </Link>
      </div>
    </main>
  );
}
