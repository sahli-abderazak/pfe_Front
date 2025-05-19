"use client"

import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useRef, useState, useEffect } from "react"

export default function AdminDashboardPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)

  // Fonction pour manipuler l'iframe et supprimer les espaces vides
  useEffect(() => {
    const iframe = iframeRef.current
    if (iframe) {
      iframe.onload = () => {
        try {
          // Tentative d'accès au contenu de l'iframe pour manipuler le CSS
          // Note: Cela peut ne pas fonctionner si l'iframe est sur un domaine différent (restrictions CORS)
          const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document
          if (iframeDocument) {
            // Injecter du CSS pour supprimer les espaces
            const style = iframeDocument.createElement("style")
            style.textContent = `
              .visualHeader, .logoBar, .titleContainer {
                display: none !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .visualContainerHost {
                padding-top: 0 !important;
                margin-top: 0 !important;
              }
            `
            iframeDocument.head.appendChild(style)
          }
        } catch (e) {
          console.log("Impossible d'accéder au contenu de l'iframe en raison des restrictions CORS")
        }
      }
    }
  }, [])

  const handlePrint = () => {
    setIsPrinting(true)

    // Petit délai pour s'assurer que l'iframe est complètement chargée
    setTimeout(() => {
      window.print()
      setTimeout(() => setIsPrinting(false), 1000)
    }, 500)
  }

  // URL modifiée avec des paramètres pour contrôler l'affichage
  const powerBIUrl =
    "https://app.powerbi.com/view?r=eyJrIjoiZDI1ZmQ2NDMtNjJiNS00NzRlLWJiOWYtZTJjYzAxMGU3OGE3IiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9&pageName=ReportSection&navContentPaneEnabled=false&filterPaneEnabled=false"

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Styles d'impression intégrés */}
      <style jsx global>{`
        @media print {
          /* Masquer les éléments qui ne doivent pas être imprimés */
          .no-print, header, nav, button, .dashboard-sidebar {
            display: none !important;
          }
          
          /* Styles pour le contenu à imprimer */
          body, html {
            width: 1200 !important;
            height: 600 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          
          .print-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .print-content {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Éliminer les espaces en haut et en bas de l'iframe */
          iframe {
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            overflow: hidden !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
          
          /* Éliminer les marges et bordures du conteneur d'iframe */
          .iframe-container {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            position: relative !important;
            height: 100vh !important;
          }
          
          /* Masquer le titre pour l'impression - nous utiliserons celui du rapport */
          .print-title {
            display: none !important;
          }
          
          /* Assurer que les couleurs et images s'impriment correctement */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Forcer l'orientation paysage pour l'impression */
          @page {
            size: landscape;
            margin: 0;
          }
        }
        
        .print-title {
          display: none;
        }
        
        /* Style pour le conteneur d'iframe en mode normal */
        .iframe-container {
          position: relative;
          width: 100%;
          height: 1300px;
        }
      `}</style>

      <div className="no-print">
        <DashboardHeader />
      </div>

      <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-6 print-container">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Sidebar - visible on desktop, hidden on mobile and when printing */}
          <div className="hidden md:block md:col-span-1 lg:col-span-1 no-print dashboard-sidebar">
            <div className="sticky top-20">
              <DashboardSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-5 lg:col-span-5 space-y-6 print-content">
            <div className="flex items-center justify-between no-print">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Rapport Annuel de Talent Match</h1>
                <p className="text-muted-foreground">Consulter les statistiques anuelle de votre platforme</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isPrinting}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {isPrinting ? "Impression..." : "Imprimer"}
                </Button>
              </div>
            </div>

            {/* Titre pour l'impression uniquement - masqué dans cette version */}
            <div className="print-title">
              <h1 className="text-3xl font-bold">Rapport annuelle de Talent Match</h1>
              <p>Consulter les statistiques anuelle de votre platforme</p>
            </div>

            <div className="rounded-xl overflow-hidden border shadow-sm iframe-container">
              <iframe
                ref={iframeRef}
                title="powerbiPFE"
                width="100%"
                height="100%"
                src={powerBIUrl}
                frameBorder="0"
                allowFullScreen={true}
                className="w-full h-full"
                style={{ display: "block" }}
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}