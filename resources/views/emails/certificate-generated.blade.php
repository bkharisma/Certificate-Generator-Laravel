<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate Generated</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #374151;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 32px;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 24px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 24px;
        }
        .header h1 {
            font-size: 20px;
            color: #111827;
            margin: 0;
        }
        .header .org {
            font-size: 14px;
            color: #6b7280;
            margin-top: 4px;
        }
        .body-content {
            font-size: 15px;
            line-height: 1.7;
        }
        .btn {
            display: inline-block;
            margin: 24px 0;
            padding: 12px 24px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-size: 15px;
            font-weight: 600;
        }
        .btn:hover {
            background-color: #1d4ed8;
        }
        .info {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
            font-size: 14px;
        }
        .info strong {
            color: #111827;
        }
        .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Certificate Generated</h1>
            <div class="org">{{ $orgName }}</div>
        </div>

        <div class="body-content">
            {!! nl2br($body) !!}
        </div>

        <div style="text-align: center;">
            <a href="{{ $certUrl }}" class="btn">View Digital Certificate</a>
        </div>

        <div class="info">
            <strong>Recipient:</strong> {{ $recipientName }}<br>
            <strong>Certificate No:</strong> {{ $certificateNumber }}<br>
            <strong>Project:</strong> {{ $projectName }}
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} {{ $orgName }}. All rights reserved.
        </div>
    </div>
</body>
</html>
