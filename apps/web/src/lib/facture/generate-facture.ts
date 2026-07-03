// Generateur de facture PDF
// Cree et telecharge une facture pour une commande

import { jsPDF } from 'jspdf'
import { COMPANY, CONTACT } from '@amap-togo/utils'

// Fonction locale pour formater les prix (evite les problemes d'encodage)
function formatPricePDF(amount: number): string {
  const formatted = amount.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')
  return `${formatted} FCFA`
}

export interface FactureItem {
  nom: string
  quantite: number
  prixUnitaire: number
  prixTotal: number
}

export interface FactureData {
  numeroCommande: string
  dateCommande: Date
  client: {
    nom: string
    telephone: string
    quartier: string
    adresse?: string
  }
  items: FactureItem[]
  total: number
  methodePaiement: string
}

// Constantes de mise en page
const MARGIN_LEFT = 20
const MARGIN_RIGHT = 190
const LINE_HEIGHT = 7

/**
 * Genere et telecharge une facture PDF
 */
export function generateFacture(data: FactureData): void {
  const doc = new jsPDF()
  let yPos = 20

  // En-tete entreprise
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(45, 90, 39) // Vert AMAP
  doc.text(COMPANY.name, MARGIN_LEFT, yPos)

  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(COMPANY.description, MARGIN_LEFT, yPos)

  yPos += 5
  doc.text(CONTACT.address, MARGIN_LEFT, yPos)
  yPos += 5
  doc.text(`Tel: ${CONTACT.primaryPhone}`, MARGIN_LEFT, yPos)

  // Titre FACTURE
  yPos += 15
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('FACTURE', MARGIN_RIGHT, yPos - 10, { align: 'right' })

  // Numero et date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`N: ${data.numeroCommande}`, MARGIN_RIGHT, yPos - 3, { align: 'right' })
  doc.text(`Date: ${formatDate(data.dateCommande)}`, MARGIN_RIGHT, yPos + 4, { align: 'right' })

  // Ligne separatrice
  yPos += 10
  doc.setDrawColor(200, 200, 200)
  doc.line(MARGIN_LEFT, yPos, MARGIN_RIGHT, yPos)

  // Informations client
  yPos += 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Client:', MARGIN_LEFT, yPos)

  yPos += LINE_HEIGHT
  doc.setFont('helvetica', 'normal')
  doc.text(data.client.nom, MARGIN_LEFT, yPos)

  yPos += LINE_HEIGHT
  doc.text(`Tel: ${data.client.telephone}`, MARGIN_LEFT, yPos)

  yPos += LINE_HEIGHT
  doc.text(`Quartier: ${data.client.quartier}`, MARGIN_LEFT, yPos)

  if (data.client.adresse) {
    yPos += LINE_HEIGHT
    doc.text(`Adresse: ${data.client.adresse}`, MARGIN_LEFT, yPos)
  }

  // Tableau des articles
  yPos += 15
  drawTableHeader(doc, yPos)

  yPos += 10
  data.items.forEach((item) => {
    yPos = drawTableRow(doc, item, yPos)
  })

  // Ligne separatrice
  yPos += 5
  doc.line(MARGIN_LEFT, yPos, MARGIN_RIGHT, yPos)

  // Total
  yPos += 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', 130, yPos)
  doc.setTextColor(45, 90, 39)
  doc.text(formatPricePDF(data.total), MARGIN_RIGHT, yPos, { align: 'right' })

  // Methode de paiement
  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Mode de paiement: ${formatMethodePaiement(data.methodePaiement)}`, MARGIN_LEFT, yPos)

  // Pied de page
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text('Merci pour votre commande!', 105, pageHeight - 20, { align: 'center' })
  doc.text('AMAP TOGO - Agriculture durable pour tous', 105, pageHeight - 15, { align: 'center' })

  // Telecharger le PDF (compatible mobile)
  const filename = `facture_${data.numeroCommande}_${formatDateFilename(data.dateCommande)}.pdf`

  try {
    // Methode 1: Blob + lien cliquable (meilleure compatibilite mobile)
    const pdfBlob = doc.output('blob')
    const blobUrl = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()

    // Nettoyage apres un delai
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    }, 100)
  } catch {
    // Fallback: methode classique jsPDF
    doc.save(filename)
  }
}

function drawTableHeader(doc: jsPDF, yPos: number): void {
  doc.setFillColor(245, 245, 245)
  doc.rect(MARGIN_LEFT, yPos - 5, 170, 10, 'F')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)

  doc.text('Article', MARGIN_LEFT + 2, yPos)
  doc.text('Qte', 120, yPos)
  doc.text('P.U.', 145, yPos)
  doc.text('Total', MARGIN_RIGHT, yPos, { align: 'right' })
}

function drawTableRow(doc: jsPDF, item: FactureItem, yPos: number): number {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  // Tronquer le nom si trop long
  const nomTronque = item.nom.length > 40 ? item.nom.substring(0, 40) + '...' : item.nom
  doc.text(nomTronque, MARGIN_LEFT + 2, yPos)
  doc.text(String(item.quantite), 120, yPos)
  doc.text(formatPricePDF(item.prixUnitaire), 145, yPos)
  doc.text(formatPricePDF(item.prixTotal), MARGIN_RIGHT, yPos, { align: 'right' })

  return yPos + LINE_HEIGHT
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateFilename(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '')
}

function formatMethodePaiement(methode: string): string {
  const labels: Record<string, string> = {
    especes: 'Especes a la livraison',
    tmoney: 'T-Money',
    flooz: 'Flooz',
    credit: 'Credit AMAP',
  }
  return labels[methode] || methode
}
