<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responder Account Created</title>
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
            background: linear-gradient(135deg, #8B2A2A 0%, #DC2626 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
            margin: -30px -30px 30px -30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
        }
        .badge {
            display: inline-block;
            background-color: #10B981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin: 20px 0;
        }
        .credentials-box {
            background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
            border: 2px solid #8B2A2A;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
        }
        .credential-row {
            display: flex;
            align-items: center;
            margin: 15px 0;
            padding: 15px;
            background-color: white;
            border-radius: 8px;
            border-left: 4px solid #8B2A2A;
        }
        .credential-label {
            font-weight: bold;
            color: #6B7280;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .credential-value {
            font-size: 16px;
            color: #1F2937;
            font-family: 'Courier New', monospace;
            word-break: break-all;
        }
        .password-value {
            background-color: #FEF3C7;
            padding: 10px;
            border-radius: 5px;
            border: 1px dashed #F59E0B;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #8B2A2A 0%, #DC2626 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 42, 42, 0.3);
        }
        .info-box {
            background-color: #EFF6FF;
            border-left: 4px solid #3B82F6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .info-box strong {
            color: #1E40AF;
        }
        .warning-box {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .warning-box strong {
            color: #B45309;
        }
        .feature-list {
            list-style: none;
            padding: 0;
            margin: 20px 0;
        }
        .feature-list li {
            padding: 10px 0 10px 30px;
            position: relative;
        }
        .feature-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10B981;
            font-weight: bold;
            font-size: 18px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #E5E7EB, transparent);
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚑 EMS Connect</h1>
            <p>Emergency Management System</p>
        </div>

        <div style="text-align: center;">
            <div class="badge">RESPONDER ACCOUNT ACTIVATED</div>
        </div>

        <h2>Welcome, {{ $responderName }}!</h2>

        <p>Your responder account has been successfully created by the EMS Connect administration team. You are now part of our emergency response network.</p>

        <div class="credentials-box">
            <h3 style="margin-top: 0; color: #8B2A2A;">🔐 Your Login Credentials</h3>

            <div class="credential-row">
                <div style="flex: 1;">
                    <div class="credential-label">Email Address</div>
                    <div class="credential-value">{{ $email }}</div>
                </div>
            </div>

            <div class="credential-row">
                <div style="flex: 1;">
                    <div class="credential-label">Temporary Password</div>
                    <div class="credential-value password-value">
                        <strong>{{ $password }}</strong>
                    </div>
                </div>
            </div>
        </div>

        <div class="warning-box">
            <strong>⚠️ Security Notice:</strong> Please change your password immediately after your first login to ensure your account security.
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $loginUrl }}" class="button">
                🚀 Login to Mobile App
            </a>
        </div>

        <div class="divider"></div>

        <div class="info-box">
            <strong>📱 Getting Started:</strong>
            <ul class="feature-list">
                <li>Download the EMS Connect mobile app on your device</li>
                <li>Login using the credentials provided above</li>
                <li>Update your profile and change your password</li>
                <li>Enable location services for dispatch coordination</li>
                <li>Set your duty status to receive emergency assignments</li>
            </ul>
        </div>

        <h3>What You Can Do:</h3>
        <ul class="feature-list">
            <li>Receive real-time emergency dispatch notifications</li>
            <li>View incident details and location on the map</li>
            <li>Update your response status (en route, arrived, completed)</li>
            <li>Submit pre-arrival patient information</li>
            <li>Communicate with the dispatch center via voice calls</li>
            <li>Track your route history and response times</li>
        </ul>

        <div class="info-box">
            <strong>📞 Need Help?</strong><br>
            If you have any questions or need assistance, please contact the EMS Connect administration team.
        </div>

        <p style="margin-top: 30px;">
            Thank you for being part of our emergency response team. Your dedication helps save lives.
        </p>

        <p style="color: #666; font-style: italic;">
            Stay safe and ready to respond!
        </p>

        <div class="footer">
            <p><strong>© {{ date('Y') }} EMS Connect. All rights reserved.</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p style="margin-top: 10px; color: #999;">
                Emergency Management System • Professional Response Network
            </p>
        </div>
    </div>
</body>
</html>
