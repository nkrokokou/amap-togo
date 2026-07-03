// Page individuelle d'un article
// Affiche le contenu complet d'un article

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getActualiteBySlug } from '@/lib/actions/actualites'
import { Calendar, Tag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ActualitePageProps {
    params: { slug: string }
}

export async function generateMetadata({ params }: ActualitePageProps): Promise<Metadata> {
    const article = await getActualiteBySlug(params.slug)

    if (!article) {
        return {
            title: 'Article non trouvé - AMAP TOGO'
        }
    }

    return {
        title: `${article.titre} - AMAP TOGO`,
        description: article.extrait || article.contenu.substring(0, 160),
    }
}

export default async function ActualitePage({ params }: ActualitePageProps) {
    const article = await getActualiteBySlug(params.slug)

    if (!article) {
        notFound()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a1f12] to-[#0f2818] py-12 sm:py-16">
            <article className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-4xl">
                {/* Back Button */}
                <Link
                    href="/actualites"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour aux actualités
                </Link>

                {/* Header */}
                <header className="mb-8 sm:mb-10">
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDate(article.date_publication)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Tag className="w-4 h-4" />
                            {article.categorie}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                        {article.titre}
                    </h1>

                    {/* Excerpt */}
                    {article.extrait && (
                        <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                            {article.extrait}
                        </p>
                    )}
                </header>

                {/* Featured Image */}
                {article.image_url && (
                    <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden mb-8 sm:mb-10">
                        <img
                            src={article.image_url}
                            alt={article.titre}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Content */}
                <div
                    className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-green-400 prose-a:no-underline hover:prose-a:text-green-300
            prose-strong:text-white
            prose-ul:text-gray-300 prose-ol:text-gray-300
            prose-img:rounded-xl prose-img:shadow-2xl
            text-gray-300 leading-relaxed
            [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white 
            [&_p]:text-gray-300 [&_a]:text-green-400 hover:[&_a]:text-green-300 
            [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
          "
                    dangerouslySetInnerHTML={{ __html: article.contenu.replace(/\n/g, '<br />') }}
                />
            </article>
        </div>
    )
}
