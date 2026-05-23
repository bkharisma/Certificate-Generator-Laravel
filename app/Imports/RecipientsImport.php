<?php

namespace App\Imports;

use App\Models\Project;
use App\Models\Recipient;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class RecipientsImport implements ToCollection, WithHeadingRow
{
    protected Project $project;

    protected array $errors = [];

    protected int $imported = 0;

    public function __construct(Project $project)
    {
        $this->project = $project;
    }

    public function collection(Collection $rows): void
    {
        DB::transaction(function () use ($rows) {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2;

                $validator = Validator::make($row->toArray(), [
                    'name' => ['required', 'string', 'max:255'],
                    'email' => ['required', 'email', 'max:255'],
                ]);

                if ($validator->fails()) {
                    $this->errors[] = "Row {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    continue;
                }

                $email = trim($row['email']);
                $name = trim($row['name']);

                $exists = $this->project->recipients()
                    ->where('email', $email)
                    ->exists();

                if ($exists) {
                    $this->errors[] = "Row {$rowNumber}: Email '{$email}' already exists in this project.";
                    continue;
                }

                $nextNumber = $this->project->certificate_next_number;
                $certificateNumber = $this->project->certificate_prefix . '/' .
                    str_pad((string) $nextNumber, $this->project->certificate_digit_count, '0', STR_PAD_LEFT);

                if (Recipient::where('certificate_number', $certificateNumber)->exists()) {
                    $this->errors[] = "Row {$rowNumber}: Certificate number collision, skipping.";
                    continue;
                }

                $this->project->recipients()->create([
                    'name' => $name,
                    'email' => $email,
                    'certificate_number' => $certificateNumber,
                    'status' => 'pending',
                    'email_status' => 'pending',
                ]);

                $this->project->increment('certificate_next_number');
                $this->imported++;
            }
        });
    }

    public function getImportedCount(): int
    {
        return $this->imported;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
