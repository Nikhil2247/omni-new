// ============================================================================
// QR CODE GENERATOR - Event Memory QR Code Display & Download
// ============================================================================
// Generates QR code for guest photo uploads with download/print options
// ============================================================================

'use client'

import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Download, Printer, Copy, Check, QrCode } from 'lucide-react'
import { toast } from 'sonner'

interface QRCodeGeneratorProps {
  eventCode: string
  eventName: string
  eventDate?: string
}

export function QRCodeGenerator({ eventCode, eventName, eventDate }: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const uploadUrl = `${window.location.origin}/guest/${eventCode}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(uploadUrl)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const downloadQRCode = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    // Create canvas to convert to PNG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)

      // Download PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${eventCode}-qr-code.png`
          link.click()
          URL.revokeObjectURL(url)
          toast.success('QR Code downloaded')
        }
      })

      URL.revokeObjectURL(svgUrl)
    }

    img.src = svgUrl
  }

  const printQRCode = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    const svgString = new XMLSerializer().serializeToString(svg)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${eventName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 2rem;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container {
              text-align: center;
              max-width: 600px;
            }
            h1 {
              font-size: 2rem;
              font-weight: bold;
              margin-bottom: 0.5rem;
            }
            p {
              color: #666;
              margin-bottom: 2rem;
            }
            .qr-wrapper {
              display: inline-block;
              padding: 2rem;
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 1rem;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .url {
              margin-top: 2rem;
              padding: 1rem;
              background: #f9fafb;
              border-radius: 0.5rem;
              font-size: 0.875rem;
              word-break: break-all;
            }
            .instructions {
              margin-top: 2rem;
              padding: 1rem;
              background: #fef3c7;
              border-radius: 0.5rem;
              text-align: left;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${eventName}</h1>
            ${eventDate ? `<p>${new Date(eventDate).toLocaleDateString()}</p>` : ''}
            <p>Scan to Upload Your Photos & Videos</p>
            <div class="qr-wrapper">
              ${svgString}
            </div>
            <div class="url">${uploadUrl}</div>
            <div class="instructions">
              <strong>Instructions for Guests:</strong>
              <ol>
                <li>Scan this QR code with your phone camera</li>
                <li>Or visit the URL shown above</li>
                <li>Upload your favorite photos and videos</li>
                <li>No app installation required!</li>
              </ol>
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <CardTitle>Guest Upload QR Code</CardTitle>
        </div>
        <CardDescription>
          Share this QR code with guests to let them upload photos and videos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex flex-col items-center gap-4">
          <div 
            ref={qrRef}
            className="p-6 bg-white rounded-xl border-2 border-border shadow-sm"
          >
            <QRCodeSVG
              value={uploadUrl}
              size={256}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            Event Code: {eventCode}
          </Badge>
        </div>

        {/* Upload URL */}
        <div className="space-y-2">
          <Label>Guest Upload URL</Label>
          <div className="flex gap-2">
            <Input 
              value={uploadUrl} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={copyToClipboard}
              title="Copy URL"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={downloadQRCode} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
          <Button onClick={printQRCode} variant="outline" className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print Poster
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">How to use:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Download the QR code and print it</li>
            <li>Display it at your event venue</li>
            <li>Guests can scan and upload photos instantly</li>
            <li>No app download or login required</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
