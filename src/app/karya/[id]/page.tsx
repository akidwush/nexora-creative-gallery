import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedWork,
  getRelatedPublishedWorks,
} from "@/lib/supabase-public";
import WorkDetailClient from "./work-detail-client";

type WorkDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: WorkDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const work = id ? await getPublishedWork(id) : null;

  if (!work) {
    return {
      title: "Karya tidak ditemukan | Nexora Creative Gallery",
      robots: { index: false, follow: false },
    };
  }

  const description = `${work.title} karya ${work.creator_name}. ${work.description}`
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  return {
    title: `${work.title} | Nexora Creative Gallery`,
    description,
    openGraph: {
      type: "article",
      title: work.title,
      description,
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
  if (!id) notFound();

  const work = await getPublishedWork(id);
  if (!work) notFound();

  const relatedWorks = await getRelatedPublishedWorks(work);

  return <WorkDetailClient work={work} relatedWorks={relatedWorks} />;
}
