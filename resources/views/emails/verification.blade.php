<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #8B2A2A;
            color: #ffffff;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
            margin: -30px -30px 30px -30px;
        }
        .code-container {
            background-color: #f8f9fa;
            border: 2px dashed #8B2A2A;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .verification-code {
            font-size: 36px;
            font-weight: bold;
            color: #8B2A2A;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EMS Connect</h1>
            <p>Email Verification</p>
        </div>

        <h2>Hello {{ $name }},</h2>
        
        <p>Thank you for registering with EMS Connect. To complete your registration, please verify your email address using the verification code below:</p>

        <div class="code-container">
            <p style="margin: 0 0 10px 0; color: #666;">Your verification code:</p>
            <div class="verification-code">{{ $code }}</div>
        </div>

        <div class="warning">
            <strong>⚠️ Important:</strong> This code will expire in 10 minutes. Please use it as soon as possible.
        </div>

        <p>If you did not create an account with EMS Connect, please ignore this email.</p>

        <div class="footer">
            <p>© {{ date('Y') }} EMS Connect. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>

