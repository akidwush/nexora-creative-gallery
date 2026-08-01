import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isGalleryWorkId } from "@/lib/gallery";
import {
  getPublishedWork,
  getRelatedPublishedWorks,
} from "@/lib/supabase-public";
import WorkDetailClient from "./work-detail-client";

type WorkDetailPageProps = {
  params: Promise<{ id: string }>;
};

function getMetadataDescription(description: string, creatorName: string) {
  const fallback = `Karya pemenang oleh ${creatorName} di Nexora Creative Gallery.`;
  const value = description.trim() || fallback;

  if (value.length <= 160) return value;
  return `${value.slice(0, 157).trimEnd()}…`;
}

export async function generateMetadata({
  params,
}: WorkDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  if (!isGalleryWorkId(id)) {
    return {
      title: "Karya tidak ditemukan",
    };
  }

  const work = await getPublishedWork(id);

  if (!work) {
    return {
      title: "Karya tidak ditemukan",
    };
  }

  const description = getMetadataDescription(
    work.description,
    work.creator_name,
  );

  return {
    title: work.title,
    description,
    openGraph: {
      type: "article",
      locale: "id_ID",
      siteName: "Nexora Creative Gallery",
      title: work.title,
      description,
      publishedTime: work.created_at,
      modifiedTime: work.updated_at,
      images: [{ url: work.image_url, alt: work.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: work.title,
      description,
      images: [work.image_url],
    },
  };
}

export default async function WorkDetailPage({
  params,
}: WorkDetailPageProps) {
  const { id } = await params;

  if (!isGalleryWorkId(id)) notFound();

  const work = await getPublishedWork(id);
  if (!work) notFound();

  const relatedWorks = await getRelatedPublishedWorks(work);

  return <WorkDetailClient work={work} relatedWorks={relatedWorks} />;
}
