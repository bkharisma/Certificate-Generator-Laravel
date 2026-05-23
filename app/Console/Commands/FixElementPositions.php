<?php

namespace App\Console\Commands;

use App\Models\TemplateElement;
use Illuminate\Console\Command;

class FixElementPositions extends Command
{
    protected $signature = 'elements:fix-positions';
    protected $description = 'Fix corrupted x coordinates in template elements saved with old position logic';

    public function handle(): int
    {
        $textTypes = ['title', 'recipient_name', 'date', 'certificate_number'];

        $centerFixed = 0;
        $rightFixed = 0;

        $elements = TemplateElement::whereIn('type', $textTypes)
            ->whereIn('text_align', ['center', 'right'])
            ->get();

        foreach ($elements as $element) {
            $oldX = (float) $element->x;
            $width = (float) $element->width;

            if ($element->text_align === 'center') {
                $element->x = $oldX - ($width / 2);
                $centerFixed++;
            } elseif ($element->text_align === 'right') {
                $element->x = $oldX - $width;
                $rightFixed++;
            }

            $element->save();
        }

        $this->info("Fixed {$centerFixed} center-aligned and {$rightFixed} right-aligned element(s).");

        return Command::SUCCESS;
    }
}
