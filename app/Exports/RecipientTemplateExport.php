<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithHeadings;

class RecipientTemplateExport implements WithHeadings
{
    public function headings(): array
    {
        return [
            'name',
            'email',
        ];
    }
}
