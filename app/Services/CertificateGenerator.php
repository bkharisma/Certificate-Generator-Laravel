<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Recipient;
use App\Models\Setting;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;

class CertificateGenerator
{
    public function generate(Project $project, Recipient $recipient): string
    {
        $pdfContent = $this->buildPdf($project, $recipient);

        $certDir = "certificates/{$project->id}";
        Storage::disk('public')->makeDirectory($certDir);

        $fileName = str_replace('/', '_', $recipient->certificate_number) . '.pdf';
        $filePath = "{$certDir}/{$fileName}";
        Storage::disk('public')->put($filePath, $pdfContent);

        return $filePath;
    }

    public function generatePreview(Project $project): string
    {
        $pdfContent = $this->buildPdf($project, null);

        $previewDir = "previews/{$project->id}";
        Storage::disk('public')->makeDirectory($previewDir);

        $filePath = "{$previewDir}/preview.pdf";
        Storage::disk('public')->put($filePath, $pdfContent);

        return $filePath;
    }

    private function buildPdf(Project $project, ?Recipient $recipient): string
    {
        $project->load([
            'template',
            'template.elements',
            'signatures',
            'logos',
            'trainingMaterial',
        ]);

        $template = $project->template;
        $elements = $template->elements;

        $orientation = $template->orientation === 'landscape' ? 'L' : 'P';
        $pageWidth = (float) $template->page_width;
        $pageHeight = (float) $template->page_height;

        $pdf = new \FPDF($orientation, 'mm', [$pageWidth, $pageHeight]);
        $pdf->SetAutoPageBreak(false, 0);
        $pdf->AddPage();

        if ($template->background_image && Storage::disk('public')->exists($template->background_image)) {
            $bgPath = Storage::disk('public')->path($template->background_image);
            $pdf->Image($bgPath, 0, 0, $pageWidth, $pageHeight);
        }

        $appUrl = Setting::get('app_url', config('app.url'));
        $certNumber = $recipient?->certificate_number ?? 'SAMPLE-001';
        $qrValue = "{$appUrl}/cert/{$certNumber}";

        $qrTempPath = null;
        if ($elements->where('type', 'qr_code')->isNotEmpty()) {
            $qrTempPath = tempnam(sys_get_temp_dir(), 'qr_') . '.png';
            $qrImage = QrCode::format('png')->size(200)->margin(1)->generate($qrValue);
            file_put_contents($qrTempPath, $qrImage);
        }

        $recipientName = $recipient?->name ?? 'Sample Recipient Name';

        $sortedElements = $elements->sortBy('sort_order');

        foreach ($sortedElements as $element) {
            $x = (float) $element->x;
            $y = (float) $element->y;
            $w = (float) $element->width;
            $h = (float) $element->height;

            switch ($element->type) {
                case 'title':
                    $this->renderText($pdf, $element, $project->title_text ?? 'Certificate');
                    break;

                case 'recipient_name':
                    $this->renderText($pdf, $element, $recipientName);
                    break;

                case 'date':
                    $date = $project->certificate_date
                        ? \Carbon\Carbon::parse($project->certificate_date)->locale('id')->isoFormat('D MMMM YYYY')
                        : now()->locale('id')->isoFormat('D MMMM YYYY');
                    $this->renderText($pdf, $element, $date);
                    break;

                case 'certificate_number':
                    $this->renderText($pdf, $element, $certNumber);
                    break;

                case 'qr_code':
                    if ($qrTempPath && file_exists($qrTempPath)) {
                        $pdf->Image($qrTempPath, $x, $y, $w, $h);
                    }
                    break;

                case 'signature':
                    $signature = $project->signatures
                        ->where('template_element_id', $element->id)
                        ->first();
                    if ($signature && $signature->signature_image) {
                        $sigPath = Storage::disk('public')->path($signature->signature_image);
                        if (file_exists($sigPath)) {
                            $imgH = $h * 0.6;
                            $pdf->Image($sigPath, $x, $y, $w, $imgH);

                            $nameY = $y + $imgH + 1;
                            $pdf->SetFont('Helvetica', '', 8);
                            $pdf->SetTextColor(0, 0, 0);
                            $pdf->SetXY($x, $nameY);
                            $pdf->Cell($w, 4, $signature->signer_name, 0, 0, 'C');
                            $pdf->SetXY($x, $nameY + 4);
                            $pdf->SetFont('Helvetica', '', 6);
                            $pdf->Cell($w, 3, $signature->signer_title, 0, 0, 'C');
                        }
                    }
                    break;

                case 'logo':
                    $logo = $project->logos
                        ->where('template_element_id', $element->id)
                        ->first();
                    if ($logo && $logo->logo_image) {
                        $logoPath = Storage::disk('public')->path($logo->logo_image);
                        if (file_exists($logoPath)) {
                            $pdf->Image($logoPath, $x, $y, $w, $h);
                        }
                    }
                    break;
            }
        }

        $this->renderTrainingMaterial($pdf, $project, $pageWidth, $pageHeight, $orientation);

        if ($qrTempPath && file_exists($qrTempPath)) {
            unlink($qrTempPath);
        }

        return $pdf->Output('S');
    }

    private function renderTrainingMaterial(\FPDF $pdf, Project $project, float $pageWidth, float $pageHeight, string $orientation): void
    {
        $trainingMaterial = $project->trainingMaterial;
        if (!$trainingMaterial || empty($trainingMaterial->columns)) {
            return;
        }

        $pdf->AddPage($orientation, [$pageWidth, $pageHeight]);

        if ($trainingMaterial->background_image && Storage::disk('public')->exists($trainingMaterial->background_image)) {
            $bgPath = Storage::disk('public')->path($trainingMaterial->background_image);
            $pdf->Image($bgPath, 0, 0, $pageWidth, $pageHeight);
        }

        $pdf->SetFont('Helvetica', 'B', 16);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->SetXY(20, 20);
        $pdf->Cell($pageWidth - 40, 10, $trainingMaterial->title, 0, 1, 'C');

        if ($trainingMaterial->description) {
            $pdf->SetFont('Helvetica', '', 11);
            $pdf->SetXY(20, 32);
            $pdf->MultiCell($pageWidth - 40, 6, $trainingMaterial->description, 0, 'L');
        }

        $columns = $trainingMaterial->columns;
        $rows = $trainingMaterial->rows ?? [];

        if (empty($columns)) return;

        $tableStartY = $trainingMaterial->description ? 50 : 40;
        $colWidth = ($pageWidth - 40) / count($columns);
        $rowHeight = 8;

        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->SetFillColor(200, 200, 200);
        $xPos = 20;
        $pdf->SetXY($xPos, $tableStartY);
        foreach ($columns as $col) {
            $pdf->Cell($colWidth, $rowHeight, $col, 1, 0, 'C', true);
        }

        $pdf->SetFont('Helvetica', '', 9);
        $currentY = $tableStartY + $rowHeight;
        foreach ($rows as $index => $row) {
            if ($currentY > $pageHeight - 20) {
                $pdf->AddPage($orientation, [$pageWidth, $pageHeight]);

                if ($trainingMaterial->background_image && Storage::disk('public')->exists($trainingMaterial->background_image)) {
                    $bgPath = Storage::disk('public')->path($trainingMaterial->background_image);
                    $pdf->Image($bgPath, 0, 0, $pageWidth, $pageHeight);
                }

                $currentY = 20;
                $pdf->SetFont('Helvetica', 'B', 10);
                $pdf->SetFillColor(200, 200, 200);
                $xPos = 20;
                $pdf->SetXY($xPos, $currentY);
                foreach ($columns as $col) {
                    $pdf->Cell($colWidth, $rowHeight, $col, 1, 0, 'C', true);
                }
                $currentY += $rowHeight;
                $pdf->SetFont('Helvetica', '', 9);
            }

            $fill = $index % 2 === 0;
            if ($fill) {
                $pdf->SetFillColor(240, 240, 240);
            }
            $xPos = 20;
            $pdf->SetXY($xPos, $currentY);
            foreach ($columns as $col) {
                $value = $row[$col] ?? '';
                $pdf->Cell($colWidth, $rowHeight, $value, 1, 0, 'C', $fill);
            }
            $currentY += $rowHeight;
        }
    }

    private function renderText(\FPDF $pdf, $element, string $text): void
    {
        $fontFamily = $this->mapFont($element->font_family ?? 'Helvetica');
        $fontStyle = $this->mapStyle($element->font_style ?? 'normal');
        $fontSize = (int) ($element->font_size ?? 12);
        $textAlign = $element->text_align ?? 'center';
        $fontColor = $element->font_color ?? '#000000';

        $rgb = $this->hexToRgb($fontColor);

        $pdf->SetFont($fontFamily, $fontStyle, $fontSize);
        $pdf->SetTextColor($rgb[0], $rgb[1], $rgb[2]);

        $textWidth = $pdf->GetStringWidth($text);
        $elementWidth = (float) $element->width;
        $elementHeight = (float) $element->height;

        // Stage 1: shrink to min 12pt
        while ($textWidth > $elementWidth && $fontSize > 12) {
            $fontSize--;
            $pdf->SetFont($fontFamily, $fontStyle, $fontSize);
            $textWidth = $pdf->GetStringWidth($text);
        }

        $pdf->SetXY((float) $element->x, (float) $element->y);

        $alignMap = ['left' => 'L', 'center' => 'C', 'right' => 'R'];
        $align = $alignMap[$textAlign] ?? 'C';

        // Stage 2: if still too wide, wrap with MultiCell
        if ($textWidth > $elementWidth) {
            $lineHeight = $fontSize * 0.45;
            $pdf->MultiCell($elementWidth, $lineHeight, $text, 0, $align);
        } else {
            $pdf->Cell($elementWidth, $elementHeight, $text, 0, 0, $align);
        }
    }

    private function mapFont(?string $font): string
    {
        $map = [
            'Arial' => 'Helvetica',
            'Times New Roman' => 'Times',
            'Courier New' => 'Courier',
            'Helvetica' => 'Helvetica',
            'Times' => 'Times',
            'Courier' => 'Courier',
        ];
        return $map[$font] ?? 'Helvetica';
    }

    private function mapStyle(?string $style): string
    {
        $map = [
            'normal' => '',
            'bold' => 'B',
            'italic' => 'I',
        ];
        return $map[$style] ?? '';
    }

    private function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');
        if (strlen($hex) === 3) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }
        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2)),
        ];
    }
}
