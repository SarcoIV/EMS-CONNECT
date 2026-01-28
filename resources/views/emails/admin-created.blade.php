<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Account Created</title>
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
            background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
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
            background-color: #8B5CF6;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin: 20px 0;
        }
        .credentials-box {
            background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
            border: 2px solid #1F2937;
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
            border-left: 4px solid #1F2937;
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
            background: linear-gradient(135deg, #1F2937 0%, #374151 100%);
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
            box-shadow: 0 4px 12px rgba(31, 41, 55, 0.3);
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
            <div class="badge">ADMINISTRATOR ACCESS GRANTED</div>
        </div>

        <h2>Welcome, {{ $adminName }}!</h2>

        <p>Your administrator account has been successfully created for the EMS Connect system. You now have full access to manage the emergency response platform.</p>

        <div class="credentials-box">
            <h3 style="margin-top: 0; color: #1F2937;">🔐 Your Login Credentials</h3>

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
                🚀 Login to Dashboard
            </a>
        </div>

        <div class="divider"></div>

        <div class="info-box">
            <strong>🎯 Getting Started:</strong>
            <ul class="feature-list">
                <li>Login to the admin dashboard using the credentials above</li>
                <li>Update your profile and change your password</li>
                <li>Familiarize yourself with the dashboard layout</li>
                <li>Review system settings and configurations</li>
            </ul>
        </div>

        <h3>Administrator Capabilities:</h3>
        <ul class="feature-list">
            <li>Monitor real-time emergency incidents and dispatches</li>
            <li>Manage responder assignments and coordination</li>
            <li>Track responders on live map with GPS monitoring</li>
            <li>View comprehensive incident reports and analytics</li>
            <li>Manage user accounts (responders, admins, community members)</li>
            <li>Handle emergency voice calls and communications</li>
            <li>Access archived records and historical data</li>
            <li>Configure system settings and permissions</li>
        </ul>

        <div class="info-box">
            <strong>🔒 Security Best Practices:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Change your password to a strong, unique combination</li>
                <li>Never share your admin credentials with anyone</li>
                <li>Always log out when finished using the system</li>
                <li>Report any suspicious activity immediately</li>
            </ul>
        </div>

        <p style="margin-top: 30px;">
            Thank you for joining the EMS Connect administration team. Your role is crucial in coordinating emergency responses and saving lives.
        </p>

        <p style="color: #666; font-style: italic;">
            Welcome to the team!
        </p>

        <div class="footer">
            <p><strong>© {{ date('Y') }} EMS Connect. All rights reserved.</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p style="margin-top: 10px; color: #999;">
                Emergency Management System • Administrative Portal
            </p>
        </div>
    </div>
</body>
</html>
