import Link from "next/link";
import styles from "./detail.module.css";

export default function WorkNotFound() {
  return (
    <main className={styles.statePage}>
      <span className={styles.stateCode}>404</span>
      <h1>Karya tidak ditemukan.</h1>
      <p>Karya mungkin belum dipublikasikan atau sudah dihapus.</p>
      <Link className={styles.stateLink} href="/#gallery">
        Kembali ke galeri
      </Link>
    </main>
  );
}
